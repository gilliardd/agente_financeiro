import { Request, Response } from 'express';
import { getDateRangeSummary, getRecentTransactionsByDateRange } from '../models/Transaction';
import { query } from '../config/database';
import { getAllSavingsBoxes, getTotalSaved } from '../models/SavingsBox';

export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    const { startDate: queryStartDate, endDate: queryEndDate } = req.query;

    let startDate: string;
    let endDate: string;

    if (queryStartDate && queryEndDate) {
      // Usa as datas fornecidas
      startDate = queryStartDate as string;
      endDate = queryEndDate as string;
    } else {
      // Usa o mes atual como padrao
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      endDate = new Date(year, month, 0).toISOString().split('T')[0];
    }

    // Resumo do periodo
    const summary = await getDateRangeSummary(startDate, endDate);

    // Ultimas transacoes do periodo
    const recentTransactions = await getRecentTransactionsByDateRange(startDate, endDate, 10);

    // Gastos por categoria do periodo
    const expensesByCategory = await query<{ category: string; total: number; color: string }[]>(
      `SELECT c.name as category, c.color, COALESCE(SUM(t.amount), 0) as total
       FROM categories c
       LEFT JOIN transactions t ON t.category_id = c.id AND t.type = 'expense' AND t.date BETWEEN ? AND ?
       WHERE c.type = 'expense' AND c.is_active = true
       GROUP BY c.id, c.name, c.color
       HAVING total > 0
       ORDER BY total DESC`,
      [startDate, endDate]
    );

    // Caixinhas (savings boxes)
    const savingsBoxes = await getAllSavingsBoxes();
    const totalSaved = await getTotalSaved();

    res.json({
      success: true,
      data: {
        summary,
        recentTransactions,
        expensesByCategory,
        savingsBoxes: {
          count: savingsBoxes.length,
          totalSaved,
          boxes: savingsBoxes.map((box) => ({
            id: box.id,
            name: box.name,
            currentAmount: Number(box.current_amount),
            goalAmount: Number(box.goal_amount),
            icon: box.icon,
            color: box.color,
            progress: box.goal_amount > 0 ? Math.min(100, (Number(box.current_amount) / Number(box.goal_amount)) * 100) : 0,
          })),
        },
        period: { startDate, endDate },
      },
    });
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar dashboard' });
  }
}
