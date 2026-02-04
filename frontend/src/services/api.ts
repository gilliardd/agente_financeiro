import axios from 'axios';
import type { Transaction, Category, DashboardData, ApiResponse, SavingsBox, SavingsBoxTransaction } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para debug
api.interceptors.response.use(
  (response) => {
    console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error) => {
    console.log(`[API ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url} - Status: ${error.response?.status || 'N/A'}`);
    console.log('[API ERROR] Response data:', error.response?.data);
    return Promise.reject(error);
  }
);

export async function getDashboard(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<DashboardData> {
  const response = await api.get<ApiResponse<DashboardData>>('/dashboard', { params });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao carregar dashboard');
  }
  return response.data.data;
}

export async function getTransactions(params?: {
  type?: 'income' | 'expense';
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<Transaction[]> {
  const response = await api.get<ApiResponse<Transaction[]>>('/transactions', { params });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao carregar transacoes');
  }
  return response.data.data;
}

export async function getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
  const response = await api.get<ApiResponse<Transaction[]>>('/transactions/recent', {
    params: { limit },
  });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao carregar transacoes');
  }
  return response.data.data;
}

export async function createTransaction(data: {
  type: 'income' | 'expense';
  amount: number;
  description?: string;
  category_id: number;
  date: string;
  notes?: string;
}): Promise<{ id: number }> {
  const response = await api.post<ApiResponse<{ id: number }>>('/transactions', data);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao criar transacao');
  }
  return response.data.data;
}

export async function getCategories(type?: 'income' | 'expense' | 'investment'): Promise<Category[]> {
  const response = await api.get<ApiResponse<Category[]>>('/categories', {
    params: type ? { type } : undefined,
  });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao carregar categorias');
  }
  return response.data.data;
}

export async function createCategory(data: {
  name: string;
  type: 'income' | 'expense' | 'investment';
  icon?: string;
  color?: string;
}): Promise<{ id: number }> {
  const response = await api.post<ApiResponse<{ id: number }>>('/categories', data);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao criar categoria');
  }
  return response.data.data;
}

export async function deleteCategory(id: number): Promise<void> {
  const response = await api.delete<ApiResponse<void>>(`/categories/${id}`);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Erro ao excluir categoria');
  }
}

export async function getSummary(year?: number, month?: number): Promise<{
  income: number;
  expense: number;
  balance: number;
}> {
  const response = await api.get<ApiResponse<{ income: number; expense: number; balance: number }>>(
    '/transactions/summary',
    { params: { year, month } }
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao carregar resumo');
  }
  return response.data.data;
}

// Savings Boxes (Caixinhas)
export async function getSavingsBoxes(): Promise<{ boxes: SavingsBox[]; total: number }> {
  const response = await api.get<ApiResponse<{ boxes: SavingsBox[]; total: number }>>('/savings-boxes');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao carregar caixinhas');
  }
  return response.data.data;
}

export async function getSavingsBox(id: number): Promise<{ box: SavingsBox; transactions: SavingsBoxTransaction[] }> {
  const response = await api.get<ApiResponse<{ box: SavingsBox; transactions: SavingsBoxTransaction[] }>>(`/savings-boxes/${id}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao carregar caixinha');
  }
  return response.data.data;
}

export async function createSavingsBox(data: {
  name: string;
  description?: string;
  goal_amount?: number;
  icon?: string;
  color?: string;
}): Promise<{ id: number }> {
  const response = await api.post<ApiResponse<{ id: number }>>('/savings-boxes', data);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao criar caixinha');
  }
  return response.data.data;
}

export async function depositToSavingsBox(id: number, amount: number, description?: string): Promise<SavingsBox> {
  const response = await api.post<ApiResponse<SavingsBox>>(`/savings-boxes/${id}/deposit`, { amount, description });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao depositar');
  }
  return response.data.data;
}

export async function withdrawFromSavingsBox(id: number, amount: number, description?: string): Promise<SavingsBox> {
  const response = await api.post<ApiResponse<SavingsBox>>(`/savings-boxes/${id}/withdraw`, { amount, description });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao retirar');
  }
  return response.data.data;
}

export async function deleteSavingsBox(id: number): Promise<void> {
  const response = await api.delete<ApiResponse<void>>(`/savings-boxes/${id}`);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Erro ao excluir caixinha');
  }
}

// Reports (Relatorios)
export interface CategoryReport {
  category_id: number;
  category: string;
  type: string;
  color: string;
  icon: string;
  total: number;
  count: number;
  percentage: number;
}

export interface PeriodReport {
  period: string;
  income: number;
  expense: number;
  balance: number;
}

export interface ReportsSummary {
  income: {
    total: number;
    count: number;
    average: number;
    biggest: {
      amount: number;
      description: string;
      category_name: string;
      date: string;
    } | null;
  };
  expense: {
    total: number;
    count: number;
    average: number;
    biggest: {
      amount: number;
      description: string;
      category_name: string;
      date: string;
    } | null;
    topCategory: {
      category: string;
      color: string;
      total: number;
    } | null;
  };
  balance: number;
  transactionCount: number;
  daysInPeriod: number;
}

export async function getReportsByCategory(params: {
  startDate: string;
  endDate: string;
  type?: 'income' | 'expense';
}): Promise<{ categories: CategoryReport[]; totals: { income: number; expense: number } }> {
  const response = await api.get<ApiResponse<{ categories: CategoryReport[]; totals: { income: number; expense: number } }>>(
    '/reports/by-category',
    { params }
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao carregar relatorio');
  }
  return response.data.data;
}

export async function getReportsByPeriod(params: {
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month' | 'year';
}): Promise<PeriodReport[]> {
  const response = await api.get<ApiResponse<PeriodReport[]>>('/reports/by-period', { params });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao carregar relatorio');
  }
  return response.data.data;
}

export async function getReportsTransactions(params: {
  startDate: string;
  endDate: string;
  type?: 'income' | 'expense';
  category_id?: number;
  limit?: number;
  offset?: number;
}): Promise<{
  transactions: {
    id: number;
    type: string;
    amount: number;
    description: string;
    date: string;
    category_id: number;
    category_name: string;
    category_color: string;
  }[];
  total: number;
  limit: number;
  offset: number;
}> {
  const response = await api.get<ApiResponse<{
    transactions: any[];
    total: number;
    limit: number;
    offset: number;
  }>>('/reports/transactions', { params });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao carregar transacoes');
  }
  return response.data.data;
}

export async function getReportsSummary(params: {
  startDate: string;
  endDate: string;
}): Promise<ReportsSummary> {
  const response = await api.get<ApiResponse<ReportsSummary>>('/reports/summary', { params });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao carregar resumo');
  }
  return response.data.data;
}

// Bills (Contas a Pagar)
export interface Bill {
  id: number;
  name: string;
  description: string | null;
  amount: number;
  due_day: number;
  category_id: number | null;
  category_name?: string;
  category_color?: string;
  is_recurring: boolean;
  reminder_days_before: number;
  is_active: boolean;
  last_reminder_date: string | null;
  last_paid_date: string | null;
  created_at: string;
}

export async function getBills(): Promise<{ bills: Bill[]; total: number }> {
  const response = await api.get<ApiResponse<{ bills: Bill[]; total: number }>>('/bills');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao carregar contas');
  }
  return response.data.data;
}

export async function getBillById(id: number): Promise<Bill> {
  const response = await api.get<ApiResponse<Bill>>(`/bills/${id}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao carregar conta');
  }
  return response.data.data;
}

export async function createBill(data: {
  name: string;
  description?: string;
  amount: number;
  due_day: number;
  category_id?: number;
  is_recurring?: boolean;
  reminder_days_before?: number;
}): Promise<{ id: number }> {
  const response = await api.post<ApiResponse<{ id: number }>>('/bills', data);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao criar conta');
  }
  return response.data.data;
}

export async function updateBill(id: number, data: {
  name?: string;
  description?: string;
  amount?: number;
  due_day?: number;
  category_id?: number;
  is_recurring?: boolean;
  reminder_days_before?: number;
}): Promise<void> {
  const response = await api.put<ApiResponse<void>>(`/bills/${id}`, data);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Erro ao atualizar conta');
  }
}

export async function deleteBill(id: number): Promise<void> {
  const response = await api.delete<ApiResponse<void>>(`/bills/${id}`);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Erro ao excluir conta');
  }
}

export async function markBillAsPaid(id: number, date?: string): Promise<void> {
  const response = await api.post<ApiResponse<void>>(`/bills/${id}/pay`, { date });
  if (!response.data.success) {
    throw new Error(response.data.error || 'Erro ao marcar conta como paga');
  }
}

export async function getUpcomingBills(days: number = 7): Promise<Bill[]> {
  const response = await api.get<ApiResponse<Bill[]>>('/bills/upcoming', { params: { days } });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao carregar contas proximas');
  }
  return response.data.data;
}

// Assets (Ativos/Investimentos)
export interface Asset {
  id: number;
  name: string;
  type: 'stocks' | 'fixed_income' | 'funds' | 'crypto' | 'real_estate' | 'savings' | 'other';
  institution: string | null;
  ticker: string | null;
  quantity: number | null;
  purchase_price: number | null;
  current_price: number | null;
  total_invested: number;
  current_value: number | null;
  purchase_date: string;
  maturity_date: string | null;
  expected_return: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssetSummary {
  totalInvested: number;
  totalCurrentValue: number;
  profit: number;
  profitPercent: number;
  byType: {
    type: string;
    count: number;
    total_invested: number;
    current_value: number;
  }[];
}

export async function getAssets(type?: string): Promise<Asset[]> {
  const response = await api.get<Asset[]>('/assets', { params: type ? { type } : undefined });
  return response.data;
}

export async function getAssetById(id: number): Promise<Asset> {
  const response = await api.get<Asset>(`/assets/${id}`);
  return response.data;
}

export async function getAssetByTicker(ticker: string): Promise<Asset> {
  const response = await api.get<Asset>(`/assets/ticker/${ticker}`);
  return response.data;
}

export async function createAsset(data: {
  name: string;
  type: Asset['type'];
  institution?: string;
  ticker?: string;
  quantity?: number;
  purchase_price?: number;
  current_price?: number;
  total_invested: number;
  current_value?: number;
  purchase_date: string;
  maturity_date?: string;
  expected_return?: number;
  notes?: string;
}): Promise<Asset> {
  const response = await api.post<Asset>('/assets', data);
  return response.data;
}

export async function updateAsset(id: number, data: Partial<{
  name: string;
  type: Asset['type'];
  institution: string;
  ticker: string;
  quantity: number;
  purchase_price: number;
  current_price: number;
  total_invested: number;
  current_value: number;
  purchase_date: string;
  maturity_date: string;
  expected_return: number;
  notes: string;
  is_active: boolean;
}>): Promise<Asset> {
  const response = await api.put<Asset>(`/assets/${id}`, data);
  return response.data;
}

export async function deleteAsset(id: number): Promise<void> {
  await api.delete(`/assets/${id}`);
}

export async function updateAssetPrice(id: number, currentPrice: number): Promise<Asset> {
  const response = await api.patch<Asset>(`/assets/${id}/price`, { current_price: currentPrice });
  return response.data;
}

export async function getAssetsSummary(): Promise<AssetSummary> {
  const response = await api.get<AssetSummary>('/assets/summary');
  return response.data;
}

// Asset Movements (Movimentos de Investimentos)
export interface AssetMovement {
  id: number;
  asset_id: number;
  date: string;
  movement_type: 'entry' | 'exit' | 'dividend';
  quantity: number;
  price: number;
  total: number;
  fee_rate: number;
  total_after_fee: number;
  current_price: number | null;
  profit: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  asset_name?: string;
  asset_type?: string;
  asset_ticker?: string;
}

export async function getAssetMovements(params?: {
  asset_id?: number;
  start_date?: string;
  end_date?: string;
}): Promise<AssetMovement[]> {
  const response = await api.get<AssetMovement[]>('/asset-movements', { params });
  return response.data;
}

export async function getAssetMovementById(id: number): Promise<AssetMovement> {
  const response = await api.get<AssetMovement>(`/asset-movements/${id}`);
  return response.data;
}

export async function createAssetMovement(data: {
  asset_id: number;
  date: string;
  movement_type: 'entry' | 'exit' | 'dividend';
  quantity: number;
  price: number;
  fee_rate?: number;
  current_price?: number;
  notes?: string;
}): Promise<AssetMovement> {
  const response = await api.post<AssetMovement>('/asset-movements', data);
  return response.data;
}

export async function updateAssetMovement(id: number, data: Partial<{
  asset_id: number;
  date: string;
  movement_type: 'entry' | 'exit' | 'dividend';
  quantity: number;
  price: number;
  fee_rate: number;
  current_price: number;
  notes: string;
}>): Promise<AssetMovement> {
  const response = await api.put<AssetMovement>(`/asset-movements/${id}`, data);
  return response.data;
}

export async function deleteAssetMovement(id: number): Promise<void> {
  await api.delete(`/asset-movements/${id}`);
}

export async function updateAssetMovementsPrice(assetId: number, currentPrice: number): Promise<void> {
  await api.patch(`/asset-movements/asset/${assetId}/price`, { current_price: currentPrice });
}

export async function getAssetMovementsSummary(params?: {
  start_date?: string;
  end_date?: string;
}): Promise<{
  totalEntries: number;
  totalExits: number;
  totalInvested: number;
  totalProfit: number;
}> {
  const response = await api.get('/asset-movements/summary', { params });
  return response.data;
}

export interface AnalyticsData {
  summary: {
    totalEntries: number;
    totalExits: number;
    totalDividends: number;
    totalInvested: number;
    totalProfit: number;
  };
  byMonth: {
    month: string;
    entries: number;
    exits: number;
    dividends: number;
    profit: number;
  }[];
  byType: {
    type: string;
    entries: number;
    exits: number;
    dividends: number;
    profit: number;
    count: number;
  }[];
  byAsset: {
    asset_id: number;
    asset_name: string;
    asset_ticker: string | null;
    asset_type: string;
    entries: number;
    exits: number;
    dividends: number;
    profit: number;
    quantity: number;
  }[];
  purchasesByAsset: {
    asset_id: number;
    asset_name: string;
    asset_ticker: string | null;
    asset_type: string;
    total_purchased: number;
    quantity_purchased: number;
    avg_price: number;
  }[];
  purchasesByCategory: {
    type: string;
    total_purchased: number;
    quantity_purchased: number;
    asset_count: number;
  }[];
}

export async function getAssetMovementsAnalytics(params?: {
  start_date?: string;
  end_date?: string;
}): Promise<AnalyticsData> {
  const response = await api.get<AnalyticsData>('/asset-movements/analytics', { params });
  return response.data;
}

// Budgets (Orcamentos)
export type BudgetRule = '50-30-20' | '60-20-20' | '40-30-30' | 'custom';
export type BudgetCategory = 'necessidades' | 'estilo_vida' | 'futuro';

export interface BudgetItem {
  id: number;
  budget_id: number;
  category: BudgetCategory;
  name: string;
  planned_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: number;
  year: number;
  month: number;
  rule: BudgetRule;
  expected_income: number;
  custom_necessidades: number | null;
  custom_estilo_vida: number | null;
  custom_futuro: number | null;
  created_at: string;
  updated_at: string;
  items?: BudgetItem[];
}

export interface BudgetRuleInfo {
  id: BudgetRule;
  name: string;
  necessidades: number;
  estilo_vida: number;
  futuro: number;
}

export interface BudgetSummary {
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
}

export async function getBudgetRules(): Promise<BudgetRuleInfo[]> {
  const response = await api.get<ApiResponse<BudgetRuleInfo[]>>('/budgets/rules');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao carregar regras');
  }
  return response.data.data;
}

export async function getBudgets(): Promise<Budget[]> {
  const response = await api.get<ApiResponse<Budget[]>>('/budgets');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao carregar orcamentos');
  }
  return response.data.data;
}

export async function getBudgetByMonth(year: number, month: number): Promise<Budget | null> {
  try {
    const response = await api.get<ApiResponse<Budget>>(`/budgets/${year}/${month}`);
    if (!response.data.success || !response.data.data) {
      // Se não tem dados, retorna null (orçamento não existe)
      return null;
    }
    return response.data.data;
  } catch (error: any) {
    // Se for 404, retorna null (orçamento não existe)
    if (error.response?.status === 404) {
      return null;
    }
    // Outros erros, lança a exceção
    throw error;
  }
}

export async function getBudgetSummary(year: number, month: number): Promise<BudgetSummary> {
  const response = await api.get<ApiResponse<BudgetSummary>>(`/budgets/${year}/${month}/summary`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao carregar resumo');
  }
  return response.data.data;
}

export async function createBudget(data: {
  year: number;
  month: number;
  rule: BudgetRule;
  expected_income: number;
  custom_necessidades?: number;
  custom_estilo_vida?: number;
  custom_futuro?: number;
}): Promise<{ id: number }> {
  const response = await api.post<ApiResponse<{ id: number }>>('/budgets', data);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao criar orcamento');
  }
  return response.data.data;
}

export async function updateBudget(year: number, month: number, data: {
  rule?: BudgetRule;
  expected_income?: number;
  custom_necessidades?: number;
  custom_estilo_vida?: number;
  custom_futuro?: number;
}): Promise<void> {
  const response = await api.put<ApiResponse<void>>(`/budgets/${year}/${month}`, data);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Erro ao atualizar orcamento');
  }
}

export async function deleteBudget(year: number, month: number): Promise<void> {
  const response = await api.delete<ApiResponse<void>>(`/budgets/${year}/${month}`);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Erro ao excluir orcamento');
  }
}

export async function copyBudgetFromPrevious(year: number, month: number): Promise<{ id: number }> {
  const response = await api.post<ApiResponse<{ id: number }>>(`/budgets/${year}/${month}/copy`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao copiar orcamento');
  }
  return response.data.data;
}

export async function addBudgetItem(year: number, month: number, data: {
  category: BudgetCategory;
  name: string;
  planned_amount: number;
}): Promise<{ id: number }> {
  const response = await api.post<ApiResponse<{ id: number }>>(`/budgets/${year}/${month}/items`, data);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Erro ao adicionar item');
  }
  return response.data.data;
}

export async function updateBudgetItem(itemId: number, data: {
  category?: BudgetCategory;
  name?: string;
  planned_amount?: number;
}): Promise<void> {
  const response = await api.put<ApiResponse<void>>(`/budgets/items/${itemId}`, data);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Erro ao atualizar item');
  }
}

export async function deleteBudgetItem(itemId: number): Promise<void> {
  const response = await api.delete<ApiResponse<void>>(`/budgets/items/${itemId}`);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Erro ao excluir item');
  }
}

export default api;
