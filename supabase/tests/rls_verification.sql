-- ============================================================================
-- Yuki — verificação das políticas de RLS (ETAPA 3 — multiusuário)
--
-- COMO USAR (SQL Editor do Supabase, depois de criar DUAS contas pelo app):
--   1. Substitua <uuid-da-ana> e <uuid-da-bia> pelos UUIDs das duas contas
--      (Authentication → Users, ou `select id, email from auth.users`);
--   2. Execute o script inteiro. Ele roda em UMA transação (fim com ROLLBACK,
--      nada é persistido) e imprime um NOTICE por seção com o resultado
--      esperado. Qualquer "FALHA" indica problema de isolamento.
--
-- O SQL Editor roda sem RLS (service_role/postgres), por isso as seções
-- assumem o papel `authenticated` e injetam o JWT do usuário para que as
-- políticas valham de verdade.
-- ============================================================================

begin;

create or replace function public.test_current_uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')::uuid
$$;

-- ----------------------------------------------------------------------------
-- 1. LEITURA: cada usuário vê apenas as próprias linhas
-- ----------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"<uuid-da-ana>"}';

do $$
declare
  proprias bigint;
  de_outros bigint;
begin
  select count(*) filter (where user_id = public.test_current_uid()),
         count(*) filter (where user_id is distinct from public.test_current_uid())
    into proprias, de_outros
    from public.transactions;

  if de_outros > 0 then
    raise exception 'FALHA: Ana enxergou % transações de outro usuário', de_outros;
  end if;
  raise notice '1. OK — Ana enxerga % transações próprias e nenhuma alheia', proprias;
end $$;

-- Repita para a Bia trocando o JWT acima e rodando o mesmo bloco.
-- Também vale para bills, debts e profiles (mesma política).

-- ----------------------------------------------------------------------------
-- 2. INSERT: não é possível gravar com user_id de outra pessoa
-- ----------------------------------------------------------------------------
-- O trigger `set_row_user_id` preenche user_id com auth.uid() e rejeita
-- qualquer tentativa de usar o ID de outra conta.

do $$
begin
  insert into public.transactions
    (user_id, type, amount_cents, description, category_id, date)
  values
    ('<uuid-da-bia>', 'expense', 100, 'Tentativa de invasao', 'food', current_date);

  raise exception 'FALHA: conseguiu gravar com user_id de outra pessoa';
exception
  when others then
    if sqlerrm like 'FALHA:%' then raise; end if;
    raise notice '2. OK — insert com user_id alheio bloqueado: %', sqlerrm;
end $$;

-- ----------------------------------------------------------------------------
-- 3. UPDATE/DELETE: registros de outra pessoa são invisíveis e inalteráveis
-- ----------------------------------------------------------------------------

do $$
begin
  update public.transactions set amount_cents = 1
  where user_id is distinct from public.test_current_uid();
  if found then
    raise exception 'FALHA: UPDATE atingiu linhas de outro usuário';
  end if;

  delete from public.transactions
  where user_id is distinct from public.test_current_uid();
  if found then
    raise exception 'FALHA: DELETE atingiu linhas de outro usuário';
  end if;

  raise notice '3. OK — UPDATE/DELETE não alcançam dados de outros usuários';
end $$;

-- ----------------------------------------------------------------------------
-- 4. TROCA DE PROPRIETÁRIO: bloqueada mesmo pelo dono do registro
-- ----------------------------------------------------------------------------

do $$
declare minha uuid;
begin
  select id into minha from public.transactions
  where user_id = public.test_current_uid() limit 1;

  if minha is null then
    raise notice '4. pulado — Ana ainda não tem transações para testar';
    return;
  end if;

  begin
    update public.transactions set user_id = '<uuid-da-bia>' where id = minha;
    raise exception 'FALHA: conseguiu trocar o dono do registro';
  exception
    when others then
      if sqlerrm like 'FALHA:%' then raise; end if;
      raise notice '4. OK — troca de proprietário bloqueada: %', sqlerrm;
  end;
end $$;

-- Repita o bloco 4 logado como Bia apontando para um registro da Ana.

-- ----------------------------------------------------------------------------
-- 5. SEM SESSÃO: nenhuma linha privada é retornada
-- ----------------------------------------------------------------------------
reset role;
set local request.jwt.claims to '';
set local role anon;

do $$
declare
  t bigint; c bigint; d bigint; p bigint;
begin
  select count(*) into t from public.transactions;
  select count(*) into c from public.bills;
  select count(*) into d from public.debts;
  select count(*) into p from public.profiles;

  if t + c + d + p > 0 then
    raise exception 'FALHA: sem sessão, a consulta retornou linhas privadas (t=%, c=%, d=%, p=%)', t, c, d, p;
  end if;
  raise notice '5. OK — sem sessão nenhuma linha privada é visível';
end $$;

rollback;
