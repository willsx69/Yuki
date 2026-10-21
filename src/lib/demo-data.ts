/**
 * DADOS DE DEMONSTRAÇÃO — ETAPA 1 E 2
 *
 * Todos os valores, transações, contas, metas e notificações deste arquivo
 * são fictícios e existem apenas para ilustrar a interface.
 * Eles não representam dados de um usuário real e não são persistidos em
 * lugar nenhum.
 *
 * Os lançamentos fictícios (demoTransactions) ficam totalmente isolados dos
 * lançamentos reais do usuário: nunca são misturados aos cálculos do
 * cadastro feito na página de Transações. O dashboard oferece um alternador
 * entre "Dados de exemplo" e "Meus lançamentos".
 */

import type { Transaction } from "./transactions/types";

export type TransactionType = "income" | "expense";

export type DemoSummary = {
  saldoTotal: number;
  receitasMes: number;
  despesasMes: number;
  contasPendentes: {
    quantidade: number;
    valorTotal: number;
  };
  variacaoReceitas: string;
  variacaoDespesas: string;
};

export type DemoMonthlyPoint = {
  mes: string;
  receitas: number;
  despesas: number;
};

export type DemoCategoryExpense = {
  nome: string;
  valor: number;
};

export type DemoTransaction = {
  id: string;
  descricao: string;
  categoria: string;
  conta: string;
  data: string;
  valor: number;
  tipo: TransactionType;
};

export type DemoBill = {
  id: string;
  descricao: string;
  categoria: string;
  vencimento: string;
  valor: number;
  status: "agendada" | "pendente";
};

export type DemoGoal = {
  nome: string;
  descricao: string;
  valorAtual: number;
  valorObjetivo: number;
  prazo: string;
};

export type DemoNotification = {
  id: string;
  titulo: string;
  detalhe: string;
  data: string;
};

export const demoSummary: DemoSummary = {
  saldoTotal: 12480.55,
  receitasMes: 8450,
  despesasMes: 6120.3,
  contasPendentes: {
    quantidade: 7,
    valorTotal: 1890.4,
  },
  variacaoReceitas: "+8% vs. mês anterior",
  variacaoDespesas: "-3% vs. mês anterior",
};

export const demoMonthlyFlow: DemoMonthlyPoint[] = [
  { mes: "Mai", receitas: 7120, despesas: 5980.4 },
  { mes: "Jun", receitas: 7840.5, despesas: 6410.2 },
  { mes: "Jul", receitas: 6980, despesas: 7120.8 },
  { mes: "Ago", receitas: 8210.3, despesas: 5840.1 },
  { mes: "Set", receitas: 7824, despesas: 6309.6 },
  { mes: "Out", receitas: 8450, despesas: 6120.3 },
];

export const demoCategoryExpenses: DemoCategoryExpense[] = [
  { nome: "Moradia", valor: 2100 },
  { nome: "Alimentação", valor: 1240.5 },
  { nome: "Transporte", valor: 680 },
  { nome: "Saúde", valor: 629.8 },
  { nome: "Lazer", valor: 520 },
  { nome: "Outros", valor: 950 },
];

export const demoRecentTransactions: DemoTransaction[] = [
  {
    id: "t-1",
    descricao: "Salário mensal",
    categoria: "Renda",
    conta: "Conta principal",
    data: "2026-10-05",
    valor: 6800,
    tipo: "income",
  },
  {
    id: "t-2",
    descricao: "Aluguel",
    categoria: "Moradia",
    conta: "Conta principal",
    data: "2026-10-07",
    valor: 2100,
    tipo: "expense",
  },
  {
    id: "t-3",
    descricao: "Feira do sábado",
    categoria: "Alimentação",
    conta: "Carteira digital",
    data: "2026-10-12",
    valor: 248.7,
    tipo: "expense",
  },
  {
    id: "t-4",
    descricao: "Freela de design",
    categoria: "Renda extra",
    conta: "Conta principal",
    data: "2026-10-14",
    valor: 1650,
    tipo: "income",
  },
  {
    id: "t-5",
    descricao: "Combustível",
    categoria: "Transporte",
    conta: "Cartão de crédito",
    data: "2026-10-16",
    valor: 320,
    tipo: "expense",
  },
  {
    id: "t-6",
    descricao: "Plano de saúde",
    categoria: "Saúde",
    conta: "Conta principal",
    data: "2026-10-18",
    valor: 429.8,
    tipo: "expense",
  },
];

export const demoUpcomingBills: DemoBill[] = [
  {
    id: "b-1",
    descricao: "Conta de luz",
    categoria: "Moradia",
    vencimento: "2026-10-24",
    valor: 187.45,
    status: "pendente",
  },
  {
    id: "b-2",
    descricao: "Internet residencial",
    categoria: "Moradia",
    vencimento: "2026-10-28",
    valor: 129.9,
    status: "agendada",
  },
  {
    id: "b-3",
    descricao: "Fatura do cartão",
    categoria: "Cartão de crédito",
    vencimento: "2026-11-02",
    valor: 842.15,
    status: "pendente",
  },
  {
    id: "b-4",
    descricao: "Curso online",
    categoria: "Educação",
    vencimento: "2026-11-05",
    valor: 199,
    status: "agendada",
  },
  {
    id: "b-5",
    descricao: "Seguro do carro",
    categoria: "Transporte",
    vencimento: "2026-11-10",
    valor: 531.9,
    status: "pendente",
  },
];

export const demoGoal: DemoGoal = {
  nome: "Reserva de emergência",
  descricao: "Valor guardado para imprevistos do dia a dia",
  valorAtual: 12400,
  valorObjetivo: 20000,
  prazo: "dezembro de 2026",
};

export const demoNotifications: DemoNotification[] = [
  {
    id: "n-1",
    titulo: "Conta de luz vence em breve",
    detalhe: "Vencimento em 24/10 · R$ 187,45",
    data: "2026-10-21",
  },
  {
    id: "n-2",
    titulo: "Meta 62% concluída",
    detalhe: "Reserva de emergência está quase na meta",
    data: "2026-10-20",
  },
  {
    id: "n-3",
    titulo: "Orçamento de lazer próximo do limite",
    detalhe: "84% do valor mensal utilizado",
    data: "2026-10-19",
  },
];

export const demoTransactionCategories = [
  "Moradia",
  "Alimentação",
  "Transporte",
  "Saúde",
  "Lazer",
  "Educação",
  "Renda",
  "Renda extra",
  "Outros",
];

export const demoAccounts = ["Conta principal", "Carteira digital", "Cartão de crédito"];

/**
 * CONJUNTO DE DEMONSTRAÇÃO TRANSACIONAL (Etapa 2).
 *
 * Lançamentos fictícios de maio a outubro de 2026, estruturados exatamente
 * como os lançamentos reais (mesmas categorias e contas padrão) para que o
 * dashboard possa demonstrar os cálculos reais sem misturar os dois mundos.
 * As somas de cada mês reproduzem demoMonthlyFlow/demoSummary.
 */
export const demoTransactions: Transaction[] = [
  // --- Outubro de 2026 ---
  {
    id: "demo-t-01",
    type: "expense",
    description: "Supermercado",
    amountCents: 64180,
    categoryId: "food",
    date: "2026-10-01",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-02",
    type: "expense",
    description: "Cinema",
    amountCents: 18000,
    categoryId: "leisure",
    date: "2026-10-01",
    accountId: "acc-wallet",
    paymentMethodId: "pay-credito",
  },
  {
    id: "demo-t-03",
    type: "expense",
    description: "Diversos",
    amountCents: 70000,
    categoryId: "other-expense",
    date: "2026-10-02",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-04",
    type: "expense",
    description: "Aplicativo de transporte",
    amountCents: 36000,
    categoryId: "transport",
    date: "2026-10-02",
    accountId: "acc-wallet",
    paymentMethodId: "pay-credito",
  },
  {
    id: "demo-t-05",
    type: "expense",
    description: "Farmácia",
    amountCents: 20000,
    categoryId: "health",
    date: "2026-10-03",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-06",
    type: "expense",
    description: "Bar com amigos",
    amountCents: 34000,
    categoryId: "leisure",
    date: "2026-10-03",
    accountId: "acc-checking",
    paymentMethodId: "pay-credito",
  },
  {
    id: "demo-t-07",
    type: "expense",
    description: "Presente de aniversário",
    amountCents: 25000,
    categoryId: "other-expense",
    date: "2026-10-04",
    accountId: "acc-wallet",
    paymentMethodId: "pay-pix",
  },
  {
    id: "demo-t-08",
    type: "expense",
    description: "Restaurante",
    amountCents: 35000,
    categoryId: "food",
    date: "2026-10-04",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-09",
    type: "income",
    description: "Salário mensal",
    amountCents: 680000,
    categoryId: "salary",
    date: "2026-10-05",
    accountId: "acc-checking",
    paymentMethodId: "pay-transferencia",
  },
  {
    id: "demo-t-10",
    type: "expense",
    description: "Aluguel",
    amountCents: 210000,
    categoryId: "housing",
    date: "2026-10-07",
    accountId: "acc-checking",
    paymentMethodId: "pay-pix",
  },
  {
    id: "demo-t-11",
    type: "expense",
    description: "Feira do sábado",
    amountCents: 24870,
    categoryId: "food",
    date: "2026-10-12",
    accountId: "acc-cash",
    paymentMethodId: "pay-dinheiro",
  },
  {
    id: "demo-t-12",
    type: "income",
    description: "Freela de design",
    amountCents: 165000,
    categoryId: "freelance",
    date: "2026-10-14",
    accountId: "acc-checking",
    paymentMethodId: "pay-pix",
  },
  {
    id: "demo-t-13",
    type: "expense",
    description: "Combustível",
    amountCents: 32000,
    categoryId: "transport",
    date: "2026-10-16",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-14",
    type: "expense",
    description: "Plano de saúde",
    amountCents: 42980,
    categoryId: "health",
    date: "2026-10-18",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },

  // --- Setembro de 2026 ---
  {
    id: "demo-t-15",
    type: "income",
    description: "Salário mensal",
    amountCents: 680000,
    categoryId: "salary",
    date: "2026-09-05",
    accountId: "acc-checking",
    paymentMethodId: "pay-transferencia",
  },
  {
    id: "demo-t-16",
    type: "expense",
    description: "Aluguel",
    amountCents: 210000,
    categoryId: "housing",
    date: "2026-09-05",
    accountId: "acc-checking",
    paymentMethodId: "pay-pix",
  },
  {
    id: "demo-t-17",
    type: "expense",
    description: "Supermercado",
    amountCents: 76000,
    categoryId: "food",
    date: "2026-09-07",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-18",
    type: "expense",
    description: "Assinaturas de streaming",
    amountCents: 8990,
    categoryId: "subscriptions",
    date: "2026-09-10",
    accountId: "acc-checking",
    paymentMethodId: "pay-credito",
  },
  {
    id: "demo-t-19",
    type: "income",
    description: "Projeto de identidade visual",
    amountCents: 65000,
    categoryId: "freelance",
    date: "2026-09-14",
    accountId: "acc-checking",
    paymentMethodId: "pay-pix",
  },
  {
    id: "demo-t-20",
    type: "expense",
    description: "Feira",
    amountCents: 48560,
    categoryId: "food",
    date: "2026-09-14",
    accountId: "acc-cash",
    paymentMethodId: "pay-dinheiro",
  },
  {
    id: "demo-t-21",
    type: "expense",
    description: "Combustível",
    amountCents: 63200,
    categoryId: "transport",
    date: "2026-09-16",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-22",
    type: "expense",
    description: "Plano de saúde",
    amountCents: 42980,
    categoryId: "health",
    date: "2026-09-18",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-23",
    type: "expense",
    description: "Passeios no fim de semana",
    amountCents: 55230,
    categoryId: "leisure",
    date: "2026-09-21",
    accountId: "acc-wallet",
    paymentMethodId: "pay-credito",
  },
  {
    id: "demo-t-24",
    type: "expense",
    description: "Compra de roupas",
    amountCents: 66000,
    categoryId: "shopping",
    date: "2026-09-23",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-25",
    type: "expense",
    description: "Curso online",
    amountCents: 30000,
    categoryId: "education",
    date: "2026-09-25",
    accountId: "acc-checking",
    paymentMethodId: "pay-credito",
  },
  {
    id: "demo-t-26",
    type: "expense",
    description: "Diversos",
    amountCents: 30000,
    categoryId: "other-expense",
    date: "2026-09-27",
    accountId: "acc-cash",
    paymentMethodId: "pay-dinheiro",
  },
  {
    id: "demo-t-27",
    type: "income",
    description: "Rendimentos de investimentos",
    amountCents: 37400,
    categoryId: "investments",
    date: "2026-09-30",
    accountId: "acc-checking",
    paymentMethodId: "pay-transferencia",
  },

  // --- Agosto de 2026 ---
  {
    id: "demo-t-28",
    type: "income",
    description: "Salário mensal",
    amountCents: 680000,
    categoryId: "salary",
    date: "2026-08-05",
    accountId: "acc-checking",
    paymentMethodId: "pay-transferencia",
  },
  {
    id: "demo-t-29",
    type: "expense",
    description: "Aluguel",
    amountCents: 210000,
    categoryId: "housing",
    date: "2026-08-05",
    accountId: "acc-checking",
    paymentMethodId: "pay-pix",
  },
  {
    id: "demo-t-30",
    type: "expense",
    description: "Supermercado",
    amountCents: 70000,
    categoryId: "food",
    date: "2026-08-07",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-31",
    type: "expense",
    description: "Assinaturas de streaming",
    amountCents: 8990,
    categoryId: "subscriptions",
    date: "2026-08-10",
    accountId: "acc-checking",
    paymentMethodId: "pay-credito",
  },
  {
    id: "demo-t-32",
    type: "expense",
    description: "Feira",
    amountCents: 42040,
    categoryId: "food",
    date: "2026-08-12",
    accountId: "acc-cash",
    paymentMethodId: "pay-dinheiro",
  },
  {
    id: "demo-t-33",
    type: "income",
    description: "Landing page freelance",
    amountCents: 141030,
    categoryId: "freelance",
    date: "2026-08-14",
    accountId: "acc-checking",
    paymentMethodId: "pay-pix",
  },
  {
    id: "demo-t-34",
    type: "expense",
    description: "Combustível",
    amountCents: 54500,
    categoryId: "transport",
    date: "2026-08-16",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-35",
    type: "expense",
    description: "Plano de saúde",
    amountCents: 42980,
    categoryId: "health",
    date: "2026-08-18",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-36",
    type: "expense",
    description: "Show",
    amountCents: 43000,
    categoryId: "leisure",
    date: "2026-08-20",
    accountId: "acc-wallet",
    paymentMethodId: "pay-credito",
  },
  {
    id: "demo-t-37",
    type: "expense",
    description: "Eletrodoméstico",
    amountCents: 52500,
    categoryId: "shopping",
    date: "2026-08-22",
    accountId: "acc-checking",
    paymentMethodId: "pay-credito",
  },
  {
    id: "demo-t-38",
    type: "expense",
    description: "Material de estudo",
    amountCents: 30000,
    categoryId: "education",
    date: "2026-08-25",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-39",
    type: "expense",
    description: "Diversos",
    amountCents: 30000,
    categoryId: "other-expense",
    date: "2026-08-28",
    accountId: "acc-cash",
    paymentMethodId: "pay-dinheiro",
  },

  // --- Julho de 2026 ---
  {
    id: "demo-t-40",
    type: "income",
    description: "Salário mensal",
    amountCents: 680000,
    categoryId: "salary",
    date: "2026-07-05",
    accountId: "acc-checking",
    paymentMethodId: "pay-transferencia",
  },
  {
    id: "demo-t-41",
    type: "expense",
    description: "Aluguel",
    amountCents: 210000,
    categoryId: "housing",
    date: "2026-07-05",
    accountId: "acc-checking",
    paymentMethodId: "pay-pix",
  },
  {
    id: "demo-t-42",
    type: "income",
    description: "Venda de móvel usado",
    amountCents: 18000,
    categoryId: "sales",
    date: "2026-07-06",
    accountId: "acc-cash",
    paymentMethodId: "pay-dinheiro",
  },
  {
    id: "demo-t-43",
    type: "expense",
    description: "Supermercado",
    amountCents: 80000,
    categoryId: "food",
    date: "2026-07-08",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-44",
    type: "expense",
    description: "Assinaturas de streaming",
    amountCents: 8990,
    categoryId: "subscriptions",
    date: "2026-07-10",
    accountId: "acc-checking",
    paymentMethodId: "pay-credito",
  },
  {
    id: "demo-t-45",
    type: "expense",
    description: "Feira",
    amountCents: 59080,
    categoryId: "food",
    date: "2026-07-12",
    accountId: "acc-cash",
    paymentMethodId: "pay-dinheiro",
  },
  {
    id: "demo-t-46",
    type: "expense",
    description: "Combustível",
    amountCents: 70500,
    categoryId: "transport",
    date: "2026-07-15",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-47",
    type: "expense",
    description: "Plano de saúde",
    amountCents: 42980,
    categoryId: "health",
    date: "2026-07-18",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-48",
    type: "expense",
    description: "Viagem de fim de semana",
    amountCents: 81530,
    categoryId: "leisure",
    date: "2026-07-20",
    accountId: "acc-checking",
    paymentMethodId: "pay-credito",
  },
  {
    id: "demo-t-49",
    type: "expense",
    description: "Compra de calçados",
    amountCents: 99000,
    categoryId: "shopping",
    date: "2026-07-22",
    accountId: "acc-checking",
    paymentMethodId: "pay-credito",
  },
  {
    id: "demo-t-50",
    type: "expense",
    description: "Material de estudo",
    amountCents: 30000,
    categoryId: "education",
    date: "2026-07-25",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-51",
    type: "expense",
    description: "Diversos",
    amountCents: 30000,
    categoryId: "other-expense",
    date: "2026-07-28",
    accountId: "acc-cash",
    paymentMethodId: "pay-dinheiro",
  },

  // --- Junho de 2026 ---
  {
    id: "demo-t-52",
    type: "income",
    description: "Salário mensal",
    amountCents: 680000,
    categoryId: "salary",
    date: "2026-06-05",
    accountId: "acc-checking",
    paymentMethodId: "pay-transferencia",
  },
  {
    id: "demo-t-53",
    type: "expense",
    description: "Aluguel",
    amountCents: 210000,
    categoryId: "housing",
    date: "2026-06-05",
    accountId: "acc-checking",
    paymentMethodId: "pay-pix",
  },
  {
    id: "demo-t-54",
    type: "expense",
    description: "Supermercado",
    amountCents: 80000,
    categoryId: "food",
    date: "2026-06-08",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-55",
    type: "expense",
    description: "Assinaturas de streaming",
    amountCents: 8990,
    categoryId: "subscriptions",
    date: "2026-06-10",
    accountId: "acc-checking",
    paymentMethodId: "pay-credito",
  },
  {
    id: "demo-t-56",
    type: "income",
    description: "Consultoria pontual",
    amountCents: 104050,
    categoryId: "freelance",
    date: "2026-06-12",
    accountId: "acc-checking",
    paymentMethodId: "pay-pix",
  },
  {
    id: "demo-t-57",
    type: "expense",
    description: "Feira",
    amountCents: 48450,
    categoryId: "food",
    date: "2026-06-14",
    accountId: "acc-cash",
    paymentMethodId: "pay-dinheiro",
  },
  {
    id: "demo-t-58",
    type: "expense",
    description: "Combustível",
    amountCents: 62000,
    categoryId: "transport",
    date: "2026-06-16",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-59",
    type: "expense",
    description: "Plano de saúde",
    amountCents: 42980,
    categoryId: "health",
    date: "2026-06-18",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-60",
    type: "expense",
    description: "Jantar com amigos",
    amountCents: 54000,
    categoryId: "leisure",
    date: "2026-06-21",
    accountId: "acc-wallet",
    paymentMethodId: "pay-credito",
  },
  {
    id: "demo-t-61",
    type: "expense",
    description: "Presentes",
    amountCents: 74600,
    categoryId: "shopping",
    date: "2026-06-23",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-62",
    type: "expense",
    description: "Material de estudo",
    amountCents: 30000,
    categoryId: "education",
    date: "2026-06-25",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-63",
    type: "expense",
    description: "Diversos",
    amountCents: 30000,
    categoryId: "other-expense",
    date: "2026-06-28",
    accountId: "acc-cash",
    paymentMethodId: "pay-dinheiro",
  },

  // --- Maio de 2026 ---
  {
    id: "demo-t-64",
    type: "income",
    description: "Salário mensal",
    amountCents: 680000,
    categoryId: "salary",
    date: "2026-05-05",
    accountId: "acc-checking",
    paymentMethodId: "pay-transferencia",
  },
  {
    id: "demo-t-65",
    type: "expense",
    description: "Aluguel",
    amountCents: 210000,
    categoryId: "housing",
    date: "2026-05-05",
    accountId: "acc-checking",
    paymentMethodId: "pay-pix",
  },
  {
    id: "demo-t-66",
    type: "income",
    description: "Site para cliente",
    amountCents: 32000,
    categoryId: "freelance",
    date: "2026-05-07",
    accountId: "acc-checking",
    paymentMethodId: "pay-pix",
  },
  {
    id: "demo-t-67",
    type: "expense",
    description: "Supermercado",
    amountCents: 70000,
    categoryId: "food",
    date: "2026-05-08",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-68",
    type: "expense",
    description: "Assinaturas de streaming",
    amountCents: 8990,
    categoryId: "subscriptions",
    date: "2026-05-10",
    accountId: "acc-checking",
    paymentMethodId: "pay-credito",
  },
  {
    id: "demo-t-69",
    type: "expense",
    description: "Feira",
    amountCents: 45040,
    categoryId: "food",
    date: "2026-05-14",
    accountId: "acc-cash",
    paymentMethodId: "pay-dinheiro",
  },
  {
    id: "demo-t-70",
    type: "expense",
    description: "Combustível",
    amountCents: 56030,
    categoryId: "transport",
    date: "2026-05-16",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-71",
    type: "expense",
    description: "Plano de saúde",
    amountCents: 42980,
    categoryId: "health",
    date: "2026-05-18",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-72",
    type: "expense",
    description: "Parque de diversões",
    amountCents: 45000,
    categoryId: "leisure",
    date: "2026-05-20",
    accountId: "acc-wallet",
    paymentMethodId: "pay-credito",
  },
  {
    id: "demo-t-73",
    type: "expense",
    description: "Curso de culinária",
    amountCents: 49900,
    categoryId: "education",
    date: "2026-05-22",
    accountId: "acc-checking",
    paymentMethodId: "pay-credito",
  },
  {
    id: "demo-t-74",
    type: "expense",
    description: "Utensílios de cozinha",
    amountCents: 40100,
    categoryId: "shopping",
    date: "2026-05-24",
    accountId: "acc-checking",
    paymentMethodId: "pay-debito",
  },
  {
    id: "demo-t-75",
    type: "expense",
    description: "Diversos",
    amountCents: 30000,
    categoryId: "other-expense",
    date: "2026-05-28",
    accountId: "acc-cash",
    paymentMethodId: "pay-dinheiro",
  },
];
