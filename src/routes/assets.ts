import { Router } from 'express';
import {
  listAssets,
  getAsset,
  getByTicker,
  create,
  update,
  remove,
  updatePrice,
  getSummary,
} from '../controllers/assetsController';

const router = Router();

// GET /api/assets - Lista todos os ativos
router.get('/', listAssets);

// GET /api/assets/summary - Resumo dos investimentos
router.get('/summary', getSummary);

// GET /api/assets/ticker/:ticker - Busca por ticker
router.get('/ticker/:ticker', getByTicker);

// GET /api/assets/:id - Busca por ID
router.get('/:id', getAsset);

// POST /api/assets - Cria novo ativo
router.post('/', create);

// PUT /api/assets/:id - Atualiza ativo
router.put('/:id', update);

// PATCH /api/assets/:id/price - Atualiza apenas o preco
router.patch('/:id/price', updatePrice);

// DELETE /api/assets/:id - Remove ativo
router.delete('/:id', remove);

export default router;
