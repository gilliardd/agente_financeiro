import { Router } from 'express';
import {
  list,
  getByMonth,
  create,
  update,
  remove,
  addItem,
  updateItem,
  removeItem,
  summary,
  copyFromPrevious,
  getRules,
} from '../controllers/budgetController';

const router = Router();

// Regras disponiveis
router.get('/rules', getRules);

// Listar todos os orcamentos
router.get('/', list);

// Items do orcamento (rotas especificas ANTES das rotas com parametros dinamicos)
router.put('/items/:itemId', updateItem);
router.delete('/items/:itemId', removeItem);

// Buscar orcamento por mes/ano
router.get('/:year/:month', getByMonth);

// Resumo do orcamento
router.get('/:year/:month/summary', summary);

// Criar orcamento
router.post('/', create);

// Copiar do mes anterior
router.post('/:year/:month/copy', copyFromPrevious);

// Adicionar item ao orcamento
router.post('/:year/:month/items', addItem);

// Atualizar orcamento
router.put('/:year/:month', update);

// Deletar orcamento
router.delete('/:year/:month', remove);

export default router;
