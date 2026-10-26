-- ============================================================================
-- Yuki — migração 00002: perfis de usuário (ETAPA 3)
--
-- A tabela `profiles` guarda apenas PREFERÊNCIAS e dados de exibição.
-- Credenciais (e-mail, senha, confirmação, sessão) vivem exclusivamente em
-- auth.users, gerenciadas pelo Supabase Auth — nada de senha aqui.
--
-- O registro é criado automaticamente por trigger quando o usuário se
-- cadastra (auth.users), evitando dependência de uma chamada do frontend.
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Usuário'
    check (btrim(display_name) <> '' and char_length(display_name) <= 120),
  avatar_url text,
  currency text not null default 'BRL' check (char_length(currency) = 3),
  language text not null default 'pt-BR' check (char_length(language) <= 10),
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Usuário lê o próprio perfil" on public.profiles;
create policy "Usuário lê o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

-- Inserição permitida apenas do próprio registro (casos raros em que o
-- trigger de cadastro não criou a linha — ex.: contas anteriores à migração).
drop policy if exists "Usuário cria o próprio perfil" on public.profiles;
create policy "Usuário cria o próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Usuário atualiza o próprio perfil" on public.profiles;
create policy "Usuário atualiza o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ----------------------------------------------------------------------------
-- Criação automática do perfil no cadastro
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(
        coalesce(
          new.raw_user_meta_data ->> 'full_name',
          new.raw_user_meta_data ->> 'name',
          ''
        ),
        ''
      ),
      'Usuário'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
