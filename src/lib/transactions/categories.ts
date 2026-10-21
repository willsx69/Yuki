import type { Category, TransactionType } from "./types";

/**
 * Categorias iniciais por tipo de movimentação.
 * A estrutura (`Category` com flag `isCustom`) já suporta categorias
 * personalizadas criadas pelo usuário no futuro: basta concatenar as
 * categorias próprias às padrão em `categoriesForType`.
 */
export const incomeCategories: Category[] = [
  { id: "salary", label: "Salário", type: "income" },
  { id: "freelance", label: "Freelance", type: "income" },
  { id: "sales", label: "Vendas", type: "income" },
  { id: "investments", label: "Rendimentos", type: "income" },
  { id: "other-income", label: "Outros", type: "income" },
];

export const expenseCategories: Category[] = [
  { id: "food", label: "Alimentação", type: "expense" },
  { id: "housing", label: "Moradia", type: "expense" },
  { id: "transport", label: "Transporte", type: "expense" },
  { id: "health", label: "Saúde", type: "expense" },
  { id: "education", label: "Educação", type: "expense" },
  { id: "leisure", label: "Lazer", type: "expense" },
  { id: "subscriptions", label: "Assinaturas", type: "expense" },
  { id: "shopping", label: "Compras", type: "expense" },
  { id: "other-expense", label: "Outros", type: "expense" },
];

export const defaultCategories: Category[] = [...incomeCategories, ...expenseCategories];

export function categoriesForType(
  type: TransactionType,
  extra: Category[] = [],
): Category[] {
  return [...defaultCategories, ...extra].filter((category) => category.type === type);
}

export function findCategory(
  categoryId: string,
  all: Category[] = defaultCategories,
): Category | undefined {
  return all.find((category) => category.id === categoryId);
}

export function categoryLabel(
  categoryId: string,
  all: Category[] = defaultCategories,
): string {
  return findCategory(categoryId, all)?.label ?? "Sem categoria";
}
