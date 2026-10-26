-- ============================================================================
-- Yuki — migração 00001: tabelas financeiras + Row Level Security (ETAPA 3)
--
-- Aplicável no SQL Editor do Supabase ou via CLI (`supabase db push`).
-- Idempotente: pode ser reexecutada com segurança.
--
-- Decisões de modelagem (herdadas de supabase/schema.sql):
--   * Valores em centavos (integer) — sem ponto flutuante em dinheiro;
--   * `type` limitado a 'income' | 'expense' (transações) e
--     'payable' | 'receivable' (contas);
--   * `date`/`due_date` são DATE; "vencida" é derivado na aplicação;
--   * Dívidas parceladas: o contrato vive em `debts`; as parcelas pendentes
--     são linhas de `bills` com `debt_id` (fonte única de cronograma);
--   * `bills.linked_transaction_id` guarda o lançamento criado na baixa.
--
-- Segurança:
--   * RLS habilitado em todas as tabelas privadas;
--   * `user_id` NUNCA vem do frontend: trigger preenche com auth.uid() e
--     bloqueia alteração de proprietário em UPDATE;
--   * Políticas explícitas para SELECT/INSERT/UPDATE/DELETE.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Funções auxiliares (proprietário e updated_at)
-- ----------------------------------------------------------------------------

create or replace function public.set_row_user_id()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;

  if tg_op = 'UPDATE' and new.user_id is distinct from old.user_id then
    raise exception 'O proprietário de um registro não pode ser alterado';
  end if;

  if new.user_id is distinct from auth.uid() then
    raise exception 'Não é permitido gravar dados de outro usuário';
  end if;

  return new;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Categorias (padrão sem dono + personalizadas do usuário)
-- ----------------------------------------------------------------------------

create table if not exists public.categories (
  id text primary key,
  label text not null check (btrim(label) <> ''),
  type text not null check (type in ('income', 'expense')),
  is_custom boolean not null default false,
  user_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

drop policy if exists "Usuário lê categorias próprias e padrão" on public.categories;
create policy "Usuário lê categorias próprias e padrão"
  on public.categories for select
  using (user_id is null or auth.uid() = user_id);

drop policy if exists "Usuário cria categorias próprias" on public.categories;
create policy "Usuário cria categorias próprias"
  on public.categories for insert
  with check (auth.uid() = user_id and is_custom);

drop policy if exists "Usuário atualiza categorias próprias" on public.categories;
create policy "Usuário atualiza categorias próprias"
  on public.categories for update
  using (auth.uid() = user_id and is_custom)
  with check (auth.uid() = user_id and is_custom);

drop policy if exists "Usuário remove categorias próprias" on public.categories;
create policy "Usuário remove categorias próprias"
  on public.categories for delete
  using (auth.uid() = user_id and is_custom);

-- ----------------------------------------------------------------------------
-- Transações (receitas e despesas)
-- ----------------------------------------------------------------------------

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount_cents integer not null check (amount_cents > 0),
  description text not null check (btrim(description) <> ''),
  category_id text not null references public.categories (id),
  date date not null,
  account_id text not null check (btrim(account_id) <> ''),
  payment_method_id text not null check (btrim(payment_method_id) <> ''),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

drop trigger if exists transactions_set_user_id on public.transactions;
create trigger transactions_set_user_id
  before insert or update on public.transactions
  for each row execute function public.set_row_user_id();

drop trigger if exists transactions_touch_updated_at on public.transactions;
create trigger transactions_touch_updated_at
  before update on public.transactions
  for each row execute function public.touch_updated_at();

alter table public.transactions enable row level security;

drop policy if exists "Usuário lê as próprias transações" on public.transactions;
create policy "Usuário lê as próprias transações"
  on public.transactions for select
  using (auth.uid() = user_id);

drop policy if exists "Usuário insere as próprias transações" on public.transactions;
create policy "Usuário insere as próprias transações"
  on public.transactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Usuário atualiza as próprias transações" on public.transactions;
create policy "Usuário atualiza as próprias transações"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Usuário remove as próprias transações" on public.transactions;
create policy "Usuário remove as próprias transações"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Dívidas parceladas (contrato; parcelas ficam em bills com debt_id)
-- ----------------------------------------------------------------------------

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  creditor text not null check (btrim(creditor) <> ''),
  total_original_cents integer check (total_original_cents > 0),
  installment_cents integer not null check (installment_cents > 0),
  total_installments integer not null check (total_installments between 1 and 120),
  initial_paid_installments integer not null default 0
    check (initial_paid_installments >= 0 and initial_paid_installments < total_installments),
  first_pending_due_date date not null,
  periodicity text not null default 'monthly' check (periodicity = 'monthly'),
  category_id text not null references public.categories (id),
  account_id text not null check (btrim(account_id) <> ''),
  notes text,
  status text not null default 'active' check (status in ('active', 'settled', 'cancelled')),
  closed_at date,
  settled_early boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists debts_user_status_idx
  on public.debts (user_id, status);

create index if not exists debts_user_due_date_idx
  on public.debts (user_id, first_pending_due_date);

drop trigger if exists debts_set_user_id on public.debts;
create trigger debts_set_user_id
  before insert or update on public.debts
  for each row execute function public.set_row_user_id();

drop trigger if exists debts_touch_updated_at on public.debts;
create trigger debts_touch_updated_at
  before update on public.debts
  for each row execute function public.touch_updated_at();

alter table public.debts enable row level security;

drop policy if exists "Usuário lê as próprias dívidas" on public.debts;
create policy "Usuário lê as próprias dívidas"
  on public.debts for select
  using (auth.uid() = user_id);

drop policy if exists "Usuário insere as próprias dívidas" on public.debts;
create policy "Usuário insere as próprias dívidas"
  on public.debts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Usuário atualiza as próprias dívidas" on public.debts;
create policy "Usuário atualiza as próprias dívidas"
  on public.debts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Usuário remove as próprias dívidas" on public.debts;
create policy "Usuário remove as próprias dívidas"
  on public.debts for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Contas a pagar/receber (inclui parcelas de dívidas via debt_id)
-- ----------------------------------------------------------------------------

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('payable', 'receivable')),
  description text not null check (btrim(description) <> ''),
  amount_cents integer not null check (amount_cents > 0),
  category_id text not null references public.categories (id),
  account_id text not null check (btrim(account_id) <> ''),
  due_date date not null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  installment_number integer not null default 1 check (installment_number >= 1),
  total_installments integer not null default 1 check (total_installments >= 1),
  bill_group_id uuid,
  debt_id uuid references public.debts (id) on delete cascade,
  notes text,
  paid_at date,
  linked_transaction_id uuid references public.transactions (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bills_user_due_date_idx
  on public.bills (user_id, due_date);

create index if not exists bills_user_status_idx
  on public.bills (user_id, status);

create index if not exists bills_debt_id_idx
  on public.bills (debt_id);

drop trigger if exists bills_set_user_id on public.bills;
create trigger bills_set_user_id
  before insert or update on public.bills
  for each row execute function public.set_row_user_id();

drop trigger if exists bills_touch_updated_at on public.bills;
create trigger bills_touch_updated_at
  before update on public.bills
  for each row execute function public.touch_updated_at();

alter table public.bills enable row level security;

drop policy if exists "Usuário lê as próprias contas" on public.bills;
create policy "Usuário lê as próprias contas"
  on public.bills for select
  using (auth.uid() = user_id);

drop policy if exists "Usuário insere as próprias contas" on public.bills;
create policy "Usuário insere as próprias contas"
  on public.bills for insert
  with check (auth.uid() = user_id);

drop policy if exists "Usuário atualiza as próprias contas" on public.bills;
create policy "Usuário atualiza as próprias contas"
  on public.bills for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Usuário remove as próprias contas" on public.bills;
create policy "Usuário remove as próprias contas"
  on public.bills for delete
  using (auth.uid() = user_id);
