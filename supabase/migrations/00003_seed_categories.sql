-- ============================================================================
-- Yuki — migração 00003: categorias padrão (ETAPA 3)
--
-- Os IDs precisam bater EXATAMENTE com os usados pelo frontend
-- (src/lib/transactions/categories.ts), porque `transactions.category_id` e
-- `bills.category_id` referenciam esta tabela.
--
-- Categorias padrão ficam com user_id = null (visíveis para todos via RLS);
-- categorias personalizadas serão criadas pelo usuário com user_id próprio.
-- ============================================================================

insert into public.categories (id, label, type, is_custom, user_id) values
  ('salary',         'Salário',      'income',  false, null),
  ('freelance',      'Freelance',    'income',  false, null),
  ('sales',          'Vendas',       'income',  false, null),
  ('investments',    'Rendimentos',  'income',  false, null),
  ('other-income',   'Outros',       'income',  false, null),
  ('food',           'Alimentação',  'expense', false, null),
  ('housing',        'Moradia',      'expense', false, null),
  ('transport',      'Transporte',   'expense', false, null),
  ('health',         'Saúde',        'expense', false, null),
  ('education',      'Educação',     'expense', false, null),
  ('leisure',        'Lazer',        'expense', false, null),
  ('subscriptions',  'Assinaturas',  'expense', false, null),
  ('shopping',       'Compras',      'expense', false, null),
  ('other-expense',  'Outros',       'expense', false, null)
on conflict (id) do update
  set label = excluded.label,
      type = excluded.type;
