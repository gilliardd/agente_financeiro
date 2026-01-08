export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  description: string | null;
  category_id: number;
  category_name?: string;
  date: string;
  notes: string | null;
  source: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense' | 'investment';
  icon: string;
  color: string;
  is_active: boolean;
}

export interface DashboardSummary {
  income: number;
  expense: number;
  balance: number;
}

export interface DashboardSavingsBox {
  id: number;
  name: string;
  currentAmount: number;
  goalAmount: number;
  icon: string;
  color: string;
  progress: number;
}

export interface DashboardSavingsBoxes {
  count: number;
  totalSaved: number;
  boxes: DashboardSavingsBox[];
}

export interface DashboardData {
  summary: DashboardSummary;
  recentTransactions: Transaction[];
  expensesByCategory: {
    category: string;
    total: number;
    color: string;
  }[];
  savingsBoxes: DashboardSavingsBoxes;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SavingsBox {
  id: number;
  name: string;
  description: string | null;
  goal_amount: number;
  current_amount: number;
  icon: string | null;
  color: string | null;
  created_at: string;
}

export interface SavingsBoxTransaction {
  id: number;
  savings_box_id: number;
  type: 'deposit' | 'withdraw';
  amount: number;
  description: string | null;
  created_at: string;
}
