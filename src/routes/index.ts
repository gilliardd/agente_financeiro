import { Router } from 'express';
import transactionsRouter from './transactions';
import categoriesRouter from './categories';
import dashboardRouter from './dashboard';
import savingsBoxesRouter from './savingsBoxes';
import reportsRouter from './reports';
import billsRouter from './bills';
import budgetsRouter from './budgets';
import assetsRouter from './assets';
import assetMovementsRouter from './assetMovements';
import authRouter from './auth';
import systemRouter from './system';

const router = Router();

router.use('/auth', authRouter);
router.use('/system', systemRouter);
router.use('/transactions', transactionsRouter);
router.use('/categories', categoriesRouter);
router.use('/dashboard', dashboardRouter);
router.use('/savings-boxes', savingsBoxesRouter);
router.use('/reports', reportsRouter);
router.use('/bills', billsRouter);
router.use('/budgets', budgetsRouter);
router.use('/assets', assetsRouter);
router.use('/asset-movements', assetMovementsRouter);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
