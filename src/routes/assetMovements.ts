import { Router } from 'express';
import {
  listMovements,
  getMovement,
  create,
  update,
  remove,
  updateCurrentPrice,
  getSummary,
  getAnalytics,
} from '../controllers/assetMovementsController';

const router = Router();

// GET /api/asset-movements - Lista todos os movimentos
router.get('/', listMovements);

// GET /api/asset-movements/summary - Resumo dos movimentos
router.get('/summary', getSummary);

// GET /api/asset-movements/analytics - Analytics completo
router.get('/analytics', getAnalytics);

// GET /api/asset-movements/:id - Busca por ID
router.get('/:id', getMovement);

// POST /api/asset-movements - Cria novo movimento
router.post('/', create);

// PUT /api/asset-movements/:id - Atualiza movimento
router.put('/:id', update);

// PATCH /api/asset-movements/asset/:assetId/price - Atualiza preco atual de todos movimentos de um ativo
router.patch('/asset/:assetId/price', updateCurrentPrice);

// DELETE /api/asset-movements/:id - Remove movimento
router.delete('/:id', remove);

export default router;
