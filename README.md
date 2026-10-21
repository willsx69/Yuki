# Yuki — Controle de gastos

Aplicação web de controle financeiro pessoal em desenvolvimento, inspirada em apps como o
Mobills, com identidade visual própria (roxo como cor principal).

> **Etapa atual: 3 — Contas a pagar/receber e Dívidas parceladas.**
> As páginas **Contas a pagar** e **Contas a receber** permitem cadastrar compromissos com
> vencimento (à vista ou parcelados), marcar baixa (que gera um lançamento real em Transações),
> desfazer a baixa, editar, excluir e filtrar. A página **Dívidas** cadastra contratos
> parcelados (financiamentos, empréstimos, compras no cartão) com data de término: as parcelas
> pendentes viram contas a pagar automaticamente e o progresso/saldo devedor é acompanhado na
> própria tela. O dashboard exibe as contas reais em aberto no modo "Meus lançamentos".
> Cartões, faturas, metas e orçamentos virão nas próximas etapas.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **TypeScript**
- **Tailwind CSS v4** com variáveis de tema
- **shadcn/ui** (preset `radix-nova`, Radix UI)
- **Lucide React** (ícones)
- **Recharts** (gráficos do dashboard)
- **next-themes** (tema claro/escuro)

## Como executar

```bash
npm install
npm run dev      # desenvolvimento em http://localhost:3000
npm run build    # build de produção
npm run start    # executa o build de produção
npm run lint     # eslint
npm run icons    # regera os ícones PNG a partir de public/yuki-logo.svg
```

## Estrutura

```
src/
  app/
    layout.tsx                 # layout raiz: fontes, tema, tooltip provider
    page.tsx                   # redireciona / para /dashboard
      (app)/                     # área autenticada (futuramente)
      layout.tsx               # shell: sidebar + Providers (Transactions, Bills, Debts)
      dashboard/               # painel calculado a partir das transações e contas
      transacoes/              # CRUD de receitas e despesas com filtros
      contas-a-pagar/          # CRUD de contas a pagar (vencimento/parcelas/baixa)
      contas-a-receber/        # CRUD de contas a receber (mesmo módulo, outro tipo)
      dividas/                 # dívidas parceladas com progresso e quitação
      cartoes/
      orcamentos/
      metas/
      relatorios/
      contas-e-carteiras/
      configuracoes/
  components/
    layout/                    # Sidebar, Header, menus, busca, toggle de tema
    dashboard/                 # Cards resumo, gráficos, listas, visão do dashboard
    transactions/              # Página, formulário, lista, detalhes e exclusão
    bills/                     # Página, formulário, lista, baixa e exclusão de contas
    debts/                     # Página, lista, formulário, detalhes e encerramento de dívidas
    shared/                    # Componentes de apoio (ComingSoon, DemoBadge)
    ui/                        # Componentes shadcn/ui
    providers/                 # ThemeProvider, TransactionsProvider, BillsProvider e DebtsProvider
  hooks/                       # useSidebarCollapsed, useHydrated, useTransactions, useBills, useDebts
  lib/
    nav.ts                     # itens de navegação e títulos de página
    format.ts                  # formatação em reais (BRL) e datas
    demo-data.ts               # DADOS FICTÍCIOS de demonstração (isolados)
    transactions/
      types.ts                 # modelo de domínio (valores em centavos)
      categories.ts            # categorias iniciais (prontas p/ personalizadas)
      accounts.ts              # contas e formas de pagamento padrão
      finance.ts               # regras de cálculo usadas em todas as telas
      money.ts                 # formatação de centavos -> reais
      repository.ts            # contrato de persistência (+ fábrica)
      local-repository.ts      # IMPLEMENTAÇÃO PROVISÓRIA (localStorage)
    bills/
      types.ts                 # modelo de contas a pagar/receber
      finance.ts               # vencimento, parcelas, status derivado, filtros
      repository.ts            # contrato de persistência (+ fábrica)
      local-repository.ts      # IMPLEMENTAÇÃO PROVISÓRIA (localStorage)
    debts/
      types.ts                 # modelo de dívida parcelada (contrato)
      finance.ts               # progresso, saldo, quitação prevista, prévia
      repository.ts            # contrato de persistência (+ fábrica)
      local-repository.ts      # IMPLEMENTAÇÃO PROVISÓRIA (localStorage)
supabase/
  schema.sql                   # proposta de schema PostgreSQL/Supabase
.env.example                   # nomes das variáveis futuras (sem valores)
```

## Persistência dos dados

**Ainda não há banco de dados configurado.** Enquanto não existirem as variáveis
`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`, os dados do usuário são salvos no
**localStorage** do navegador:

- Transações: chave `finora:transactions:v1` (`src/lib/transactions/local-repository.ts`);
- Contas a pagar/receber: chave `finora:bills:v1` (`src/lib/bills/local-repository.ts`);
- Dívidas: chave `finora:debts:v1` (`src/lib/debts/local-repository.ts`) — as parcelas ficam
  em `finora:bills:v1`, vinculadas por `debtId` (fonte única).

Diferente de um array em memória, os dados sobrevivem à troca de páginas e ao recarregamento.

Pontos importantes:

- **Valores em centavos (inteiros)** — nenhum cálculo monetário usa ponto flutuante; a
  conversão para reais acontece só na exibição;
- **Fonte única de dados** — dashboard, Transações e Contas usam as mesmas funções de
  `finance.ts` de cada módulo (nada de totais duplicados);
- **Baixa de conta gera lançamento** — marcar uma conta como paga/recebida cria uma transação
  real (despesa para pagar, receita para receber) e guarda o vínculo; "Desfazer baixa" remove o
  lançamento e devolve a conta a pendente;
- **Migração prevista** — os contratos `TransactionRepository`, `BillRepository` e
  `DebtRepository` definem o que a futura implementação Supabase deverá cumprir, e
  `supabase/schema.sql` traz o schema proposto (tabelas `transactions`, `bills` e `debts`,
  índices e RLS). A UI não será alterada;
- Se o armazenamento do navegador estiver indisponível (ex.: modo privado), as páginas exibem
  um aviso de que os dados serão perdidos.

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
