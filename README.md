# Yuki — Controle de gastos

Aplicação web de controle financeiro pessoal em desenvolvimento, inspirada em apps como o
Mobills, com identidade visual própria (roxo como cor principal).

> **Etapa atual: multiusuário (Supabase Auth + PostgreSQL + RLS).**
> Cada pessoa tem a sua conta, perfil e dados financeiros privados. As páginas
> **Contas a pagar**, **Contas a receber** e **Dívidas** (Etapa 3 do produto)
> continuam funcionando e agora persistem no banco quando o Supabase está
> configurado. Sem Supabase configurado, o Yuki roda no modo local provisório
> (localStorage, um único usuário neste navegador) — veja "Persistência dos
> dados". Cartões, faturas, metas e orçamentos virão nas próximas etapas.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **TypeScript**
- **Tailwind CSS v4** com variáveis de tema
- **shadcn/ui** (preset `radix-nova`, Radix UI)
- **Lucide React** (ícones)
- **Recharts** (gráficos do dashboard)
- **next-themes** (tema claro/escuro)
- **Supabase**: Auth (contas e sessão), PostgreSQL (dados financeiros) e
  Row Level Security (isolamento por usuário) via `@supabase/supabase-js` +
  `@supabase/ssr`

## Como executar

```bash
npm install
cp .env.example .env.local   # e preencha com as chaves do seu projeto Supabase
npm run dev      # desenvolvimento em http://localhost:3000
npm run build    # build de produção
npm run start    # executa o build de produção
npm run lint     # eslint
npm run icons    # regera os ícones PNG a partir de public/yuki-logo.svg
```

> Sem `.env.local` preenchido o app roda no modo local provisório (localStorage, sem login).

## Estrutura

```
src/
  proxy.ts                     # guarda de sessão (renova cookies + redireciona)
  app/
    layout.tsx                 # layout raiz: fontes, tema, tooltip provider
    page.tsx                   # redireciona / para /dashboard
    (auth)/                    # páginas públicas de autenticação
      layout.tsx               # área pública (login, cadastro, recuperação...)
      actions.ts               # server actions: cadastro, login, recuperação...
      login/ cadastro/ recuperar-senha/ redefinir-senha/ confirmacao/
    auth/
      callback/route.ts        # troca o code do e-mail por sessão (cookies)
    (app)/                     # área privada (somente com sessão válida)
      layout.tsx               # valida a sessão no servidor + Providers
      dashboard/               # painel calculado a partir das transações e contas
      transacoes/              # CRUD de receitas e despesas com filtros
      contas-a-pagar/          # CRUD de contas a pagar (vencimento/parcelas/baixa)
      contas-a-receber/        # CRUD de contas a receber (mesmo módulo, outro tipo)
      dividas/                 # dívidas parceladas com progresso e quitação
      primeiro-acesso/         # configuração inicial (nome, moeda, idioma)
      cartoes/
      orcamentos/
      metas/
      relatorios/
      contas-e-carteiras/
      configuracoes/           # perfil, preferências e importação local
  components/
    layout/                    # Sidebar, Header, menus, busca, toggle de tema
    auth/                      # AuthShell, formulários de login/cadastro etc.
    settings/                  # Formulários de perfil, onboarding e importação
    dashboard/                 # Cards resumo, gráficos, listas, visão do dashboard
    transactions/              # Página, formulário, lista, detalhes e exclusão
    bills/                     # Página, formulário, lista, baixa e exclusão de contas
    debts/                     # Página, lista, formulário, detalhes e encerramento de dívidas
    shared/                    # Componentes de apoio (ComingSoon, DemoBadge)
    ui/                        # Componentes shadcn/ui
    providers/                 # Theme, Auth (sessão/perfil), Transactions, Bills, Debts
  hooks/                       # useSidebarCollapsed, useHydrated, useTransactions, useBills, useDebts
  lib/
    nav.ts                     # itens de navegação e títulos de página
    format.ts                  # formatação em reais (BRL) e datas
    persistence.ts             # modo de persistência (remoto x local)
    demo-data.ts               # DADOS FICTÍCIOS de demonstração (isolados)
    supabase/
      config.ts                # leitura das variáveis + isSupabaseConfigured()
      client.ts                # cliente de navegador (sessão em cookies)
      server.ts                # cliente de servidor + getUser() + rotas seguras
      errors.ts                # erros do PostgREST em mensagens amigáveis
    auth/validation.ts         # política de senha/e-mail/nome (cliente + servidor)
    profile/                   # tipos, leitura e formulário de perfil
    migration/local-import.ts  # importação EXPLÍCITA do localStorage antigo
    transactions/
      types.ts                 # modelo de domínio (valores em centavos)
      categories.ts            # categorias iniciais (prontas p/ personalizadas)
      accounts.ts              # contas e formas de pagamento padrão
      finance.ts               # regras de cálculo usadas em todas as telas
      money.ts                 # formatação de centavos -> reais
      repository.ts            # contrato de persistência (+ fábrica)
      supabase-repository.ts   # implementação remota (RLS)
      local-repository.ts      # modo local provisório (localStorage)
    bills/
      types.ts                 # modelo de contas a pagar/receber
      finance.ts               # vencimento, parcelas, status derivado, filtros
      repository.ts            # contrato de persistência (+ fábrica)
      supabase-repository.ts   # implementação remota (RLS)
      local-repository.ts      # modo local provisório (localStorage)
    debts/
      types.ts                 # modelo de dívida parcelada (contrato)
      finance.ts               # progresso, saldo, quitação prevista, prévia
      repository.ts            # contrato de persistência (+ fábrica)
      supabase-repository.ts   # implementação remota (RLS)
      local-repository.ts      # modo local provisório (localStorage)
supabase/
  migrations/                  # migrações versionadas (fonte da verdade)
    00001_financial_tables.sql # transações, contas, dívidas + RLS + triggers
    00002_profiles.sql         # perfis + trigger de cadastro + RLS
    00003_seed_categories.sql  # categorias padrão (IDs iguais aos do frontend)
  schema.sql                   # referência do modelo (documentação)
.env.example                   # nomes das variáveis de ambiente (sem valores)
```

## Persistência dos dados

O Yuki tem **dois modos de persistência**, escolhidos pelas variáveis de ambiente:

| Modo | Quando | Onde ficam os dados |
| --- | --- | --- |
| **Multiusuário (Supabase)** | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` definidas | PostgreSQL do Supabase, isolado por usuário (RLS) |
| **Local provisório** | variáveis ausentes | `localStorage` deste navegador, **sem autenticação** |

No modo local:

- Transações: chave `finora:transactions:v1` (`src/lib/transactions/local-repository.ts`);
- Contas a pagar/receber: chave `finora:bills:v1` (`src/lib/bills/local-repository.ts`);
- Dívidas: chave `finora:debts:v1` (`src/lib/debts/local-repository.ts`) — as parcelas ficam
  em `finora:bills:v1`, vinculadas por `debtId` (fonte única).

As fábricas `createTransactionRepository()`, `createBillRepository()` e
`createDebtRepository()` escolhem a implementação; a UI continua consumindo os mesmos
contratos (`TransactionRepository`, `BillRepository`, `DebtRepository`).

Pontos importantes (valem nos dois modos):

- **Valores em centavos (inteiros)** — nenhum cálculo monetário usa ponto flutuante; a
  conversão para reais acontece só na exibição;
- **Fonte única de dados** — dashboard, Transações e Contas usam as mesmas funções de
  `finance.ts` de cada módulo (nada de totais duplicados);
- **Baixa de conta gera lançamento** — marcar uma conta como paga/recebida cria uma transação
  real (despesa para pagar, receita para receber) e guarda o vínculo; "Desfazer baixa" remove o
  lançamento e devolve a conta a pendente;
- **Modo local é provisório** — sem Supabase não há login nem isolamento entre pessoas: os
  dados pertencem ao navegador. Se o armazenamento estiver indisponível (ex.: modo privado),
  as páginas exibem um aviso de que os dados serão perdidos.

## Autenticação e área privada (multiusuário)

- **Públicas**: `/login`, `/cadastro`, `/recuperar-senha`, `/redefinir-senha`,
  `/confirmacao` e o callback `/auth/callback`;
- **Privadas**: dashboard, transações, contas a pagar/receber, dívidas, cartões,
  orçamentos, metas, relatórios, contas e carteiras, configurações e primeiro acesso;
- `src/proxy.ts` renova a sessão (cookies do `@supabase/ssr`) e redireciona otimistamente
  (sem sessão → `/login?next=...`; com sessão em página pública → `/dashboard`);
- `src/app/(app)/layout.tsx` faz a verificação **autorizativa** no servidor com
  `auth.getUser()` (token validado com o Supabase) antes de renderizar qualquer dado;
- As validações de cadastro/login/senha são server actions
  (`src/app/(auth)/actions.ts`) — o cliente só antecipa o feedback;
- Senhas são gerenciadas pelo Supabase Auth (hash no banco; nunca texto puro) e a
  política do Yuki exige 8+ caracteres com letra e número;
- O perfil (`public.profiles`) guarda apenas exibição/preferências; e-mail e senha são
  alterados pelos recursos do próprio Supabase Auth;
- O dashboard de uma conta nova começa em "Meus lançamentos", **vazio**, com estado
  amigável — os dados de exemplo continuam isolados e identificados.

## Como configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com);
2. No **SQL Editor**, execute na ordem os arquivos de `supabase/migrations/`:
   `00001_financial_tables.sql`, `00002_profiles.sql` e `00003_seed_categories.sql`
   (todos idempotentes);
3. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Settings → API). **Nunca** use a chave
   `service_role` no frontend — o isolamento é feito pelo RLS com a chave `anon`;
4. No painel: **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (ou a URL publicada);
   - Redirect URLs: `http://localhost:3000/auth/callback` (e o equivalente em produção);
5. (Opcional) Authentication → Providers: por padrão e-mail/senha já vem ativo; a
   **confirmação de e-mail** pode ser ligada/desligada em Authentication → Emails;
6. Reinicie o `npm run dev`.

Sem as variáveis, o app continua no modo local (com aviso nas páginas de login).

## Primeiro usuário

1. Acesse `/cadastro` (ou `/login` → "Criar conta");
2. Preencha nome, e-mail, senha, confirmação e aceite os termos;
3. Se a confirmação de e-mail estiver ativa no projeto, abra o link recebido
   (o callback `/auth/callback` cria a sessão e leva ao primeiro acesso);
4. Na tela **Primeiro acesso**, confirme o nome e escolha moeda (BRL por padrão) e idioma;
5. O dashboard abre vazio: cadastre a primeira conta financeira ou movimentação.

## Como testar o isolamento entre dois usuários

O isolamento é garantido pelo banco (RLS), não por esconder itens na interface:

1. Crie as contas **A** (`ana@exemplo.com`) e **B** (`bia@exemplo.com`);
2. Logado como A, cadastre uma transação, uma conta a pagar e uma dívida;
3. Deslogue (menu do usuário → Sair) e entre como B: o dashboard, Transações,
   Contas e Dívidas devem aparecer **vazios**;
4. Cadastre um lançamento como B e volte para A: os dados de B não aparecem;
5. Prova no banco (SQL Editor), com os UUIDs reais das duas contas:

```sql
-- A não deve conseguir ler nada que não seja dela:
set request.jwt.claims to '{"sub":"<uuid-da-ana>"}';   -- ou use a API com a sessão
select count(*) from public.transactions;              -- só linhas da Ana

-- Tentativa de assumir o registro de outra pessoa é bloqueada:
update public.transactions set user_id = '<uuid-da-bia>' where user_id = '<uuid-da-ana>';
-- -> erro: "O proprietário de um registro não pode ser alterado" (trigger)
```

Também vale para UPDATE/DELETE: as políticas usam `auth.uid() = user_id` nas quatro
operações, e consultas sem sessão não retornam linhas privadas.

## Migração de dados locais (Etapa 2 → conta)

Dados criados no modo local (localStorage) **não migram sozinhos**. Depois de logado,
abra **Configurações → Dados deste navegador**: se houver lançamentos locais, um botão
permite importá-los **manualmente** para a conta autenticada (IDs e vínculos
parcela↔dívida/baixa↔transação são remapeados). Os dados locais não são apagados.

## Contas a pagar / a receber (Etapa 3)

- Cadastrar à vista ou **parcelado** (até 24x, valores em centavos distribuídos sem sobra e
  vencimentos mensais com ajuste de fim de mês);
- **Baixa** com forma de pagamento → cria lançamento vinculado em Transações;
- **Desfazer baixa** e **exclusão** (excluir conta quitada também remove o lançamento);
- Filtros por pesquisa, status (pendentes/vencidas/quitadas), categoria e mês de vencimento;
- Resumo: total em aberto, vencidas e quitadas do filtro;
- Status "vencida" é **derivado** do vencimento (não é salvo);
- O dashboard, no modo "Meus lançamentos", mostra "Contas pendentes" real e o card
  "Próximas contas" com vencimentos em aberto dos próximos dias.

## Dívidas parceladas (Etapa 3)

- Cadastrar o contrato **uma vez** (nome, credor, valor da parcela, total de parcelas, parcelas
  já pagas, primeiro vencimento pendente, categoria e conta): as parcelas pendentes viram
  **contas a pagar** automaticamente (vinculadas por `debtId`), sem duplicar estado;
- Parcelas **já pagas antes do cadastro** (contrato em andamento) atualizam o progresso **sem
  gerar transações fictícias**;
- Vencimentos **mensais** com ajuste de fim de mês (ex.: 31/01 → 28/02 → 31/03) e limite de
  120 parcelas (longo prazo);
- **Baixa de parcela** usa o mesmo fluxo das Contas a pagar: cria lançamento de despesa
  vinculado e é idempotente (segunda baixa é rejeitada);
- **Editar dívida**: parcelas pagas são preservadas; apenas as pendentes são reprogramadas,
  com o impacto explicado antes de confirmar;
- **Quitação antecipada**: encerra antes da última parcela **sem** criar pagamentos fictícios
  para as pendentes descartadas; **cancelamento** preserva o histórico;
- Status "vencida" é **derivado** do vencimento (nunca marca pagamento sozinho);
- Resumo: saldo devedor total, parcelas em aberto/vencidas e próximo vencimento.

## Dados de demonstração

Os lançamentos fictícios ficam em `src/lib/demo-data.ts` (`demoTransactions`, maio–outubro
de 2026) e **nunca são misturados** aos lançamentos reais:

- O dashboard tem um alternador **"Meus lançamentos" / "Dados de exemplo"**;
- Ao criar a primeira transação, o dashboard passa automaticamente para "Meus lançamentos";
- A página de Transações e as páginas de Contas mostram apenas dados reais;
- A escolha fica salva em `finora:data-mode`;
- As seções "Próximas contas" (modo exemplo) e "Meta financeira" são fictícias e estão
  identificadas como tal.

## Como testar manualmente

### Transações (Etapa 2)

1. **Cadastrar receita**: Transações → "Nova transação" → tipo Receita → preencher valor,
   descrição, categoria, data, conta e forma de pagamento → Salvar. O total de receitas e o
   saldo do período atualizam na hora.
2. **Cadastrar despesa**: repita o passo 1 escolhendo Despesa; o cartão "Despesas do
   período" e o saldo diminuem.
3. **Editar**: ícone lápis na linha da transação → altere o valor → "Salvar alterações". O
   novo valor aparece na lista, no resumo e no dashboard.
4. **Excluir**: ícone lixeira → confirmar. A transação sai da lista e dos cálculos.
5. **Filtros**: combine pesquisa, tipo, categoria e período (inclusive "Período
   personalizado" com datas) — a lista e os três cartões de resumo mudam juntos.
6. **Persistência**: cadastre uma transação e recarregue a página (ou navegue para outra
   rota e volte) — os dados continuam lá.

### Contas a pagar/receber (Etapa 3)

7. **Cadastrar conta**: Contas a pagar → "Nova conta a pagar" → valor, vencimento, descrição,
   categoria e conta → Criar. A conta aparece em aberto no resumo e no dashboard.
8. **Parcelar**: no cadastro, informe 3 parcelas — três contas são criadas com vencimentos
   mensais ("1/3", "2/3"...); confira que a soma dos valores fecha com o total digitado.
9. **Baixa**: no ícone ✓ de uma conta pendente → escolha a forma de pagamento → confirmar.
   A conta fica "Quitada" e um lançamento correspondente aparece em Transações e no dashboard.
10. **Desfazer baixa**: ícone ↩ em conta quitada → confirmar. O lançamento é excluído e a
    conta volta a pendente.
11. **Editar/excluir**: apenas contas pendentes podem ser editadas; a exclusão pede
    confirmação (e avisa se houver lançamento vinculado).
12. **Filtros**: status "Vencidas" (mude a data do sistema ou cadastre com vencimento
    passado), categoria e mês de vencimento — os cartões de resumo recalculam junto.
13. **Persistência**: cadastre uma conta, recarregue a página — os dados continuam.

### Dívidas parceladas (Etapa 3)

17. **Cadastrar dívida**: Dívidas → "Nova dívida" → nome, credor, valor da parcela (ex.: R$
    250,00), 12 parcelas, 3 já pagas, primeiro vencimento pendente → a prévia mostra 9 parcelas
    e quitação prevista; criar. As 9 parcelas aparecem em Contas a pagar (vencimento mensal).
18. **Baixa de parcela**: nos Detalhes da dívida → ✓ na primeira parcela → confirmar. A
    parcela fica "Paga", o progresso sobe para 4/12 e um lançamento de despesa aparece em
    Transações. Tentar pagar de novo é rejeitado (sem duplicidade).
19. **Editar**: "Editar dívida" → mude o valor da parcela para R$ 200,00 → a prévia explica o
    impacto; salvar. A parcela paga mantém o valor original; as pendentes são recriadas com o
    novo valor e a numeração é preservada.
20. **Quitação antecipada**: Detalhes → "Encerrar (quitação antecipada)" → confira que o aviso
    lista quantas pendentes serão descartadas e quantas pagas serão preservadas → confirmar. A
    dívida fica "Quitada"; **nenhuma** transação fictícia é criada para as descartadas.
21. **Cancelar**: cadastre outra dívida, pague uma parcela e cancele — as pendentes somem, a
    paga e as transações ficam no histórico.
22. **Vencidas**: cadastre uma dívida com primeiro vencimento no passado — a parcela aparece
    como "Vencida" (não é marcada paga automaticamente) e o resumo mostra a contagem.
23. **Persistência**: cadastre, recarregue a página — dívida, parcelas e pagamentos continuam.

### Autenticação, sessão e isolamento (Etapa 4)

27. **Cadastro**: acesse `/cadastro`, preencha nome, e-mail, senha (8+ caracteres com
    letra e número) e aceite os termos → se a confirmação de e-mail estiver ativa, abra o
    link recebido; caso contrário cai direto no primeiro acesso.
28. **Proteção de rotas**: em uma aba anônima, abra `/dashboard`, `/transacoes`,
    `/configuracoes` — todas redirecionam para `/login?next=<rota>`; após o login, você
    volta para a rota original.
29. **Login/logout**: entre com credenciais válidas → header mostra o nome real da conta;
    menu do usuário → "Sair da conta" → `/dashboard` volta a redirecionar para `/login`
    (as páginas públicas `/login` e `/cadastro` redirecionam para `/dashboard` com sessão).
30. **Validações**: senha com menos de 8 caracteres, sem número/letra, senhas divergentes,
    e-mail inválido ou já cadastrado → mensagens claras; o envio é bloqueado enquanto
    processa e erros do servidor aparecem no `FormAlert`.
31. **Recuperação de senha**: `/recuperar-senha` → se o e-mail existir, aparece o mesmo
    aviso (sem vazamento) → abra o link recebido → `/redefinir-senha` exige nova senha
    válida → ao salvar, cai no login com a nova senha.
32. **Primeiro acesso**: conta nova não pode acessar o dashboard antes de confirmar
    nome/moeda/idioma; depois de concluir, as telas exigindo perfil passam a abrir
    normalmente e o preferencial de tema/moeda é aplicado.
33. **Isolamento**: com as duas contas criadas, cadastre dados na conta A, saia e entre
    na B → dashboard, Transações, Contas e Dívidas vazios; depois faça o teste de banco
    descrito em "Como testar o isolamento entre dois usuários".
34. **Banco (RLS)**: rode `supabase/tests/rls_verification.sql` no SQL Editor do Supabase
    (preenchendo os UUIDs das duas contas) — ele imprime um NOTICE por seção (leitura,
    escrita, edição/exclusão, troca de dono e "sem sessão") sem persistir nada.
35. **Modo local**: sem `.env.local`, `/login` mostra o aviso de "banco não configurado"
    e o app segue funcionando por localStorage (modo provisório).

### Dashboard e demais telas

24. **Dashboard**: abra /dashboard, alterne o mês e a fonte de dados; confira receitas,
    despesas, saldo, contas pendentes, lançamentos, gráficos e "Próximas contas".
25. **Validação**: tente salvar com valor vazio/zero, sem descrição, sem categoria, data
    vazia ou parcelas fora de 1–24 — mensagens de erro claras são exibidas e envios duplicados
    são bloqueados enquanto salva.
26. **Telas pequenas**: reduza a janela; as tabelas viram cartões e os formulários continuam
    utilizáveis em telas móveis.

## Identidade visual

| Uso | Cor |
| --- | --- |
| Roxo principal | `#6D28D9` |
| Roxo escuro | `#4C1D95` |
| Lilás | `#A78BFA` |
| Lilás claro (fundos secundários / item ativo) | `#EDE9FE` |
| Fundo geral | `#F8F7FC` |
| Card | `#FFFFFF` |
| Texto principal | `#211A2E` |
| Texto secundário | `#766D85` |

As variáveis estão centralizadas em `src/app/globals.css` (tema claro e escuro).

## Experiência mobile

- **Breakpoints**: os controles crescem abaixo de `lg` (1024px) — alvos de toque de
  40–44px em botões, campos, itens de menu e opções de seleção; a partir de `lg`
  volta a densidade original (28–32px).
- **Navegação**: abaixo de `lg` a barra lateral vira gaveta (`MobileSidebar`);
  o botão de tema sai do header e passa a ficar no rodapé da gaveta e no menu do usuário.
- **Diálogos**: abaixo de `sm` (640px) viram bottom sheet de largura total; o viewport
  usa `interactive-widget=resizes-content` para o teclado não cobrir os formulários.
- **Gráficos**: em telas < 640px a pizza usa raio menor e legenda embaixo, e o eixo Y
  do gráfico de barras fica mais estreito (`src/hooks/use-media-query.ts`).
- **Instalação**: `src/app/manifest.ts` + ícones PNG permitem "Adicionar à tela de
  início" (ícones gerados por `npm run icons`).
