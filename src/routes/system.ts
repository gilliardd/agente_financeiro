import { Router, Request, Response } from 'express';
import { query } from '../config/database';

const router = Router();

// Reset all data (dangerous operation)
router.delete('/reset', async (req: Request, res: Response) => {
  try {
    // Get user from token to verify it's an admin
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Token nao fornecido',
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId] = decoded.split(':');

    // Check if user is admin
    const users = await query<any[]>(
      'SELECT role FROM users WHERE id = ? AND is_active = true',
      [parseInt(userId)]
    );

    if (!users[0] || users[0].role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Apenas administradores podem resetar os dados',
      });
      return;
    }

    // Delete all data from tables (order matters due to foreign keys)
    await query('SET FOREIGN_KEY_CHECKS = 0');

    // Clear asset movements
    await query('TRUNCATE TABLE asset_movements');

    // Clear assets
    await query('TRUNCATE TABLE assets');

    // Clear transactions
    await query('TRUNCATE TABLE transactions');

    // Clear bills
    await query('TRUNCATE TABLE bills');

    // Clear savings boxes
    await query('TRUNCATE TABLE savings_boxes');

    // Clear categories
    await query('TRUNCATE TABLE categories');

    await query('SET FOREIGN_KEY_CHECKS = 1');

    console.log(`[RESET] All data reset by user ${userId}`);

    res.json({
      success: true,
      message: 'Todos os dados foram apagados com sucesso',
    });
  } catch (error) {
    console.error('Reset data error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao resetar dados',
    });
  }
});

export default router;
