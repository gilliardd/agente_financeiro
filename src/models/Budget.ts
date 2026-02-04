import { query } from '../config/database';
import { ResultSetHeader } from 'mysql2';

// Tipos de regras de orcamento
export type BudgetRule = '50-30-20' | '60-20-20' | '40-30-30' | 'custom';

// Categorias de orcamento
export type BudgetCategory = 'necessidades' | 'estilo_vida' | 'futuro';

export interface Budget {
  id: number;
  year: number;
  month: number;
  rule: BudgetRule;
  expected_income: number;
  custom_necessidades: number | null;
  custom_estilo_vida: number | null;
  custom_futuro: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface BudgetItem {
  id: number;
  budget_id: number;
  category: BudgetCategory;
  name: string;
  planned_amount: number;
  created_at: Date;
  updated_at: Date;
}

export interface BudgetWithItems extends Budget {
  items: BudgetItem[];
}

// Percentuais por regra
export const BUDGET_RULES: Record<Exclude<BudgetRule, 'custom'>, { necessidades: number; estilo_vida: number; futuro: number }> = {
  '50-30-20': { necessidades: 50, estilo_vida: 30, futuro: 20 },
  '60-20-20': { necessidades: 60, estilo_vida: 20, futuro: 20 },
  '40-30-30': { necessidades: 40, estilo_vida: 30, futuro: 30 },
};

// Funcao helper para obter percentuais de um orcamento
export function getBudgetPercentages(budget: Budget): { necessidades: number; estilo_vida: number; futuro: number } {
  if (budget.rule === 'custom') {
    return {
      necessidades: budget.custom_necessidades || 0,
      estilo_vida: budget.custom_estilo_vida || 0,
      futuro: budget.custom_futuro || 0,
    };
  }
  return BUDGET_RULES[budget.rule];
}

// Buscar orcamento por mes/ano
export async function getBudgetByMonth(year: number, month: number): Promise<BudgetWithItems | null> {
  const budgets = await query<Budget[]>(
    'SELECT * FROM monthly_budgets WHERE year = ? AND month = ?',
    [year, month]
  );

  if (budgets.length === 0) {
    return null;
  }

  const budget = budgets[0];
  const items = await query<BudgetItem[]>(
    'SELECT * FROM monthly_budget_items WHERE budget_id = ? ORDER BY category, name',
    [budget.id]
  );

  return { ...budget, items };
}

// Buscar todos os orcamentos
export async function getAllBudgets(): Promise<Budget[]> {
  return query<Budget[]>(
    'SELECT * FROM monthly_budgets ORDER BY year DESC, month DESC'
  );
}

// Criar orcamento
export async function createBudget(data: {
  year: number;
  month: number;
  rule: BudgetRule;
  expected_income: number;
  custom_necessidades?: number;
  custom_estilo_vida?: number;
  custom_futuro?: number;
}): Promise<number> {
  const result = await query<ResultSetHeader>(
    `INSERT INTO monthly_budgets (year, month, rule, expected_income, custom_necessidades, custom_estilo_vida, custom_futuro)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.year,
      data.month,
      data.rule,
      data.expected_income,
      data.rule === 'custom' ? data.custom_necessidades : null,
      data.rule === 'custom' ? data.custom_estilo_vida : null,
      data.rule === 'custom' ? data.custom_futuro : null,
    ]
  );
  return result.insertId;
}

// Atualizar orcamento
export async function updateBudget(
  id: number,
  data: {
    rule?: BudgetRule;
    expected_income?: number;
    custom_necessidades?: number;
    custom_estilo_vida?: number;
    custom_futuro?: number;
  }
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.rule !== undefined) {
    fields.push('rule = ?');
    values.push(data.rule);

    // Se mudou para custom, atualiza os percentuais
    if (data.rule === 'custom') {
      fields.push('custom_necessidades = ?');
      values.push(data.custom_necessidades || 0);
      fields.push('custom_estilo_vida = ?');
      values.push(data.custom_estilo_vida || 0);
      fields.push('custom_futuro = ?');
      values.push(data.custom_futuro || 0);
    } else {
      // Se mudou para regra fixa, limpa os percentuais customizados
      fields.push('custom_necessidades = NULL');
      fields.push('custom_estilo_vida = NULL');
      fields.push('custom_futuro = NULL');
    }
  }
  if (data.expected_income !== undefined) {
    fields.push('expected_income = ?');
    values.push(data.expected_income);
  }

  if (fields.length === 0) return;

  values.push(id);
  await query(`UPDATE monthly_budgets SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
}

// Deletar orcamento
export async function deleteBudget(id: number): Promise<void> {
  await query('DELETE FROM monthly_budget_items WHERE budget_id = ?', [id]);
  await query('DELETE FROM monthly_budgets WHERE id = ?', [id]);
}

// Criar item de orcamento
export async function createBudgetItem(data: {
  budget_id: number;
  category: BudgetCategory;
  name: string;
  planned_amount: number;
}): Promise<number> {
  const result = await query<ResultSetHeader>(
    `INSERT INTO monthly_budget_items (budget_id, category, name, planned_amount)
     VALUES (?, ?, ?, ?)`,
    [data.budget_id, data.category, data.name, data.planned_amount]
  );
  return result.insertId;
}

// Atualizar item de orcamento
export async function updateBudgetItem(
  id: number,
  data: {
    category?: BudgetCategory;
    name?: string;
    planned_amount?: number;
  }
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.category !== undefined) {
    fields.push('category = ?');
    values.push(data.category);
  }
  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.planned_amount !== undefined) {
    fields.push('planned_amount = ?');
    values.push(data.planned_amount);
  }

  if (fields.length === 0) return;

  values.push(id);
  await query(`UPDATE monthly_budget_items SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
}

// Deletar item de orcamento
export async function deleteBudgetItem(id: number): Promise<void> {
  await query('DELETE FROM monthly_budget_items WHERE id = ?', [id]);
}

// Calcular resumo do orcamento
export async function getBudgetSummary(budgetId: number): Promise<{
  budget: Budget;
  byCategory: {
    category: BudgetCategory;
    planned: number;
    limit: number;
    percentage: number;
  }[];
  totals: {
    totalPlanned: number;
    remaining: number;
  };
}> {
  const budgets = await query<Budget[]>('SELECT * FROM monthly_budgets WHERE id = ?', [budgetId]);
  if (budgets.length === 0) {
    throw new Error('Orcamento nao encontrado');
  }

  const budget = budgets[0];
  const items = await query<BudgetItem[]>(
    'SELECT * FROM monthly_budget_items WHERE budget_id = ?',
    [budgetId]
  );

  const ruleLimits = getBudgetPercentages(budget);
  const categories: BudgetCategory[] = ['necessidades', 'estilo_vida', 'futuro'];

  const byCategory = categories.map((cat) => {
    const catItems = items.filter((item) => item.category === cat);
    const planned = catItems.reduce((sum, item) => sum + Number(item.planned_amount), 0);
    const limit = (budget.expected_income * ruleLimits[cat]) / 100;
    const percentage = limit > 0 ? (planned / limit) * 100 : 0;

    return {
      category: cat,
      planned,
      limit,
      percentage,
    };
  });

  const totalPlanned = byCategory.reduce((sum, cat) => sum + cat.planned, 0);

  return {
    budget,
    byCategory,
    totals: {
      totalPlanned,
      remaining: budget.expected_income - totalPlanned,
    },
  };
}

// Copiar orcamento de um mes anterior
export async function copyBudgetFromPrevious(
  fromYear: number,
  fromMonth: number,
  toYear: number,
  toMonth: number
): Promise<number | null> {
  const existingBudget = await getBudgetByMonth(fromYear, fromMonth);
  if (!existingBudget) {
    return null;
  }

  const newBudgetId = await createBudget({
    year: toYear,
    month: toMonth,
    rule: existingBudget.rule,
    expected_income: existingBudget.expected_income,
    custom_necessidades: existingBudget.custom_necessidades || undefined,
    custom_estilo_vida: existingBudget.custom_estilo_vida || undefined,
    custom_futuro: existingBudget.custom_futuro || undefined,
  });

  for (const item of existingBudget.items) {
    await createBudgetItem({
      budget_id: newBudgetId,
      category: item.category,
      name: item.name,
      planned_amount: Number(item.planned_amount),
    });
  }

  return newBudgetId;
}
