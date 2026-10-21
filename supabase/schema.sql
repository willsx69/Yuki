-- ============================================================================
-- Finora — proposta de schema PostgreSQL/Supabase (ETAPA 3)
--
-- ESTE ARQUIVO AINDA NÃO É APLICADO. Ele documenta o modelo definitivo para
-- quando as variáveis de ambiente do Supabase forem configuradas.
--
-- Passos da migração:
--   1. Executar este script no SQL editor do Supabase (ou via migração);
--   2. Definir no .env.local:
--        NEXT_PUBLIC_SUPABASE_URL=<url do projeto>
--        NEXT_PUBLIC_SUPABASE_ANON_KEY=<chave anon>
--   3. Implementar SupabaseTransactionRepository, SupabaseBillRepository e
--      SupabaseDebtRepository cumprindo os contratos de
--      src/lib/transactions/repository.ts, src/lib/bills/repository.ts e
--      src/lib/debts/repository.ts e trocar as fábricas;
--   4. Migrar os dados do localStorage (finora:transactions:v1,
--      finora:bills:v1 e finora:debts:v1) para as tabelas.
--
-- Observações de modelagem:
--   * Valores em centavos (integer), iguais aos usados na aplicação — evita
--     imprecisões de ponto flutuante;
--   * `type` limitado a 'income' | 'expense' (transações) e
--     'payable' | 'receivable' (contas);
--   * `date`/`due_date` são DATE (dia da transação/vencimento); os agregados
--     mensais são calculados por consulta, nunca somando meses diferentes;
--   * Em `bills`, o status persistido é 'pending' | 'paid' — "vencida" é
--     derivado do vencimento na aplicação;
--   * `bills.linked_transaction_id` guarda o lançamento criado na baixa,
--     permitindo desfazer a baixa;
--   * Dívidas parceladas (Etapa 3): o contrato vive em `debts`; as parcelas
--     pendentes são linhas de `bills` com `debt_id` — fonte única de parcelas,
--     sem duplicar estado. "Quitada" e "cancelada" são derivados de
--     `debts.status` + ausência de parcelas pendentes.
-- ============================================================================

create table if not exists public.categories (
  id text primary key,
  label text not null,
  type text not null check (type in ('income', 'expense')),
  is_custom boolean not null default false,
  user_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount_cents integer not null check (amount_cents > 0),
  description text not null check (btrim(description) <> ''),
  category_id text not null references public.categories (id),
  date date not null,
  account_id text not null,
  payment_method_id text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

-- Row Level Security: cada usuário só enxerga os próprios lançamentos.
alter table public.transactions enable row level security;
alter table public.categories enable row level security;

create policy "Usuário lê as próprias transações"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Usuário insere as próprias transações"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Usuário atualiza as próprias transações"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Usuário remove as próprias transações"
  on public.transactions for delete
  using (auth.uid() = user_id);

create policy "Usuário lê categorias próprias e padrão"
  on public.categories for select
  using (user_id is null or auth.uid() = user_id);

create policy "Usuário cria categorias próprias"
  on public.categories for insert
  with check (auth.uid() = user_id and is_custom);

-- ----------------------------------------------------------------------------
-- Dívidas parceladas (Etapa 3)
--
-- O contrato da dívida vive aqui; as parcelas pendentes são linhas de
-- `bills` com `debt_id` (fonte única — nunca duplicar o cronograma).
-- "Quitada"/"cancelada" também são derivados quando não restam parcelas.
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
  account_id text not null,
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

alter table public.debts enable row level security;

create policy "Usuário lê as próprias dívidas"
  on public.debts for select
  using (auth.uid() = user_id);

create policy "Usuário insere as próprias dívidas"
  on public.debts for insert
  with check (auth.uid() = user_id);

create policy "Usuário atualiza as próprias dívidas"
  on public.debts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Usuário remove as próprias dívidas"
  on public.debts for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Contas a pagar/receber (Etapa 3)
-- ----------------------------------------------------------------------------

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('payable', 'receivable')),
  description text not null check (btrim(description) <> ''),
  amount_cents integer not null check (amount_cents > 0),
  category_id text not null references public.categories (id),
  account_id text not null,
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

-- Row Level Security: cada usuário só enxerga as próprias contas.
alter table public.bills enable row level security;

create policy "Usuário lê as próprias contas"
  on public.bills for select
  using (auth.uid() = user_id);

create policy "Usuário insere as próprias contas"
  on public.bills for insert
  with check (auth.uid() = user_id);

create policy "Usuário atualiza as próprias contas"
  on public.bills for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Usuário remove as próprias contas"
  on public.bills for delete
  using (auth.uid() = user_id);
