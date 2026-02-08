import { query } from '../config/database';
import { ResultSetHeader } from 'mysql2';

export interface Bill {
  id: number;
  name: string;
  description: string | null;
  amount: number;
  due_day: number;
  category_id: number | null;
  is_recurring: boolean;
  repeat_months: number | null;
  reminder_days_before: number;
  is_active: boolean;
  last_reminder_date: string | null;
  last_paid_date: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface BillWithCategory extends Bill {
  category_name?: string;
  category_color?: string;
}

export async function getAllBills(): Promise<BillWithCategory[]> {
  return query<BillWithCategory[]>(
    `SELECT b.*, c.name as category_name, c.color as category_color
     FROM bills b
     LEFT JOIN categories c ON b.category_id = c.id
     WHERE b.is_active = true
       AND (b.repeat_months IS NULL OR DATE_ADD(b.created_at, INTERVAL b.repeat_months MONTH) >= CURDATE())
     ORDER BY b.due_day`
  );
}

export async function getBillById(id: number): Promise<BillWithCategory | null> {
  const rows = await query<BillWithCategory[]>(
    `SELECT b.*, c.name as category_name, c.color as category_color
     FROM bills b
     LEFT JOIN categories c ON b.category_id = c.id
     WHERE b.id = ? AND b.is_active = true`,
    [id]
  );
  return rows[0] || null;
}

export async function getBillByName(name: string): Promise<Bill | null> {
  const rows = await query<Bill[]>(
    'SELECT * FROM bills WHERE UPPER(name) LIKE UPPER(?) AND is_active = true',
    [`%${name}%`]
  );
  return rows[0] || null;
}

export async function createBill(data: {
  name: string;
  description?: string;
  amount: number;
  due_day: number;
  category_id?: number;
  is_recurring?: boolean;
  repeat_months?: number | null;
  reminder_days_before?: number;
}): Promise<number> {
  const result = await query<ResultSetHeader>(
    `INSERT INTO bills (name, description, amount, due_day, category_id, is_recurring, repeat_months, reminder_days_before)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.description || null,
      data.amount,
      data.due_day,
      data.category_id || null,
      data.is_recurring ?? true,
      data.repeat_months ?? null,
      data.reminder_days_before ?? 1,
    ]
  );
  return result.insertId;
}

export async function updateBill(
  id: number,
  data: {
    name?: string;
    description?: string;
    amount?: number;
    due_day?: number;
    category_id?: number;
    is_recurring?: boolean;
    repeat_months?: number | null;
    reminder_days_before?: number;
  }
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }
  if (data.amount !== undefined) {
    fields.push('amount = ?');
    values.push(data.amount);
  }
  if (data.due_day !== undefined) {
    fields.push('due_day = ?');
    values.push(data.due_day);
  }
  if (data.category_id !== undefined) {
    fields.push('category_id = ?');
    values.push(data.category_id);
  }
  if (data.is_recurring !== undefined) {
    fields.push('is_recurring = ?');
    values.push(data.is_recurring);
  }
  if (data.repeat_months !== undefined) {
    fields.push('repeat_months = ?');
    values.push(data.repeat_months);
  }
  if (data.reminder_days_before !== undefined) {
    fields.push('reminder_days_before = ?');
    values.push(data.reminder_days_before);
  }

  if (fields.length === 0) return;

  values.push(id);
  await query(`UPDATE bills SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteBill(id: number): Promise<void> {
  await query('UPDATE bills SET is_active = false WHERE id = ?', [id]);
}

export async function markBillAsPaid(id: number, date?: string): Promise<void> {
  const paidDate = date || new Date().toISOString().split('T')[0];
  await query('UPDATE bills SET last_paid_date = ? WHERE id = ?', [paidDate, id]);
}

export async function updateLastReminderDate(id: number, date: string): Promise<void> {
  await query('UPDATE bills SET last_reminder_date = ? WHERE id = ?', [date, id]);
}

// Busca contas que precisam de lembrete hoje
export async function getBillsToRemind(): Promise<BillWithCategory[]> {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  // Calcula o ultimo dia do mes
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();

  return query<BillWithCategory[]>(
    `SELECT b.*, c.name as category_name, c.color as category_color
     FROM bills b
     LEFT JOIN categories c ON b.category_id = c.id
     WHERE b.is_active = true
       AND (
         -- Dia de vencimento menos dias de antecedencia = hoje
         (b.due_day - b.reminder_days_before = ?)
         -- OU para contas que vencem nos primeiros dias do mes, verifica se hoje é fim do mes anterior
         OR (b.due_day <= b.reminder_days_before AND ? >= ? - b.reminder_days_before + b.due_day)
       )
       AND (b.last_reminder_date IS NULL OR b.last_reminder_date < ?)`,
    [currentDay, currentDay, lastDayOfMonth, todayStr]
  );
}

// Busca contas que vencem hoje
export async function getBillsDueToday(): Promise<BillWithCategory[]> {
  const today = new Date();
  const currentDay = today.getDate();
  const todayStr = today.toISOString().split('T')[0];

  return query<BillWithCategory[]>(
    `SELECT b.*, c.name as category_name, c.color as category_color
     FROM bills b
     LEFT JOIN categories c ON b.category_id = c.id
     WHERE b.is_active = true
       AND b.due_day = ?
       AND (b.last_paid_date IS NULL OR b.last_paid_date < ?)`,
    [currentDay, todayStr]
  );
}

// Busca contas que vencem nos proximos X dias
export async function getUpcomingBills(days: number = 7): Promise<BillWithCategory[]> {
  const today = new Date();
  const currentDay = today.getDate();
  const todayStr = today.toISOString().split('T')[0];

  return query<BillWithCategory[]>(
    `SELECT b.*, c.name as category_name, c.color as category_color
     FROM bills b
     LEFT JOIN categories c ON b.category_id = c.id
     WHERE b.is_active = true
       AND b.due_day BETWEEN ? AND ?
       AND (b.last_paid_date IS NULL OR b.last_paid_date < ?)
     ORDER BY b.due_day`,
    [currentDay, currentDay + days, todayStr]
  );
}

// Retorna o total de contas a pagar no mes
export async function getMonthlyBillsTotal(): Promise<number> {
  const result = await query<{ total: number }[]>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM bills WHERE is_active = true'
  );
  return Number(result[0]?.total || 0);
}
