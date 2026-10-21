import {
  ArrowRightLeft,
  Calculator,
  ChartColumn,
  CreditCard,
  HandCoins,
  LayoutDashboard,
  ReceiptText,
  Scale,
  Settings,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Subtítulo exibido no cabeçalho junto ao título da página. */
  description: string;
  /** Termos auxiliares para a busca do cabeçalho. */
  keywords: string[];
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    title: "Geral",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        description: "Visão geral das suas finanças",
        keywords: ["inicio", "resumo", "painel", "home"],
      },
      {
        label: "Transações",
        href: "/transacoes",
        icon: ArrowRightLeft,
        description: "Receitas e despesas registradas",
        keywords: ["lancamentos", "movimentacoes", "extrato"],
      },
    ],
  },
  {
    title: "Contas",
    items: [
      {
        label: "Contas a pagar",
        href: "/contas-a-pagar",
        icon: ReceiptText,
        description: "Vencimentos e pagamentos pendentes",
        keywords: ["boletos", "debidos", "saidas"],
      },
      {
        label: "Contas a receber",
        href: "/contas-a-receber",
        icon: HandCoins,
        description: "Recebimentos previstos",
        keywords: ["entradas", "recebimentos", "creditos"],
      },
      {
        label: "Dívidas",
        href: "/dividas",
        icon: Scale,
        description: "Dívidas parceladas e quitadas",
        keywords: ["emprestimo", "financiamento", "parcelado", "divida"],
      },
      {
        label: "Cartões",
        href: "/cartoes",
        icon: CreditCard,
        description: "Faturas e limites dos cartões",
        keywords: ["fatura", "credito", "limite"],
      },
    ],
  },
  {
    title: "Planejamento",
    items: [
      {
        label: "Orçamentos",
        href: "/orcamentos",
        icon: Calculator,
        description: "Limites mensais por categoria",
        keywords: ["budget", "limites", "gastos"],
      },
      {
        label: "Metas",
        href: "/metas",
        icon: Target,
        description: "Objetivos financeiros e progresso",
        keywords: ["objetivos", "sonhos", "poupanca"],
      },
    ],
  },
  {
    title: "Análise",
    items: [
      {
        label: "Relatórios",
        href: "/relatorios",
        icon: ChartColumn,
        description: "Gráficos e análises detalhadas",
        keywords: ["graficos", "analise", "evolucao"],
      },
      {
        label: "Contas e carteiras",
        href: "/contas-e-carteiras",
        icon: Wallet,
        description: "Bancos, carteiras e saldos",
        keywords: ["bancos", "contas", "carteiras", "saldo"],
      },
    ],
  },
  {
    title: "Sistema",
    items: [
      {
        label: "Configurações",
        href: "/configuracoes",
        icon: Settings,
        description: "Preferências do aplicativo",
        keywords: ["ajustes", "preferencias", "perfil"],
      },
    ],
  },
];

export const navItems: NavItem[] = navSections.flatMap((section) => section.items);

export function findNavItem(pathname: string): NavItem {
  const exact = navItems.find((item) => item.href === pathname);
  if (exact) return exact;

  const nested = navItems.find(
    (item) => item.href !== "/" && pathname.startsWith(`${item.href}/`),
  );
  return nested ?? navItems[0];
}
