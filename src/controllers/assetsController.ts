import { Request, Response } from 'express';
import {
  getAllAssets,
  getAssetById,
  getAssetByTicker,
  getAssetsByType,
  createAsset,
  updateAsset,
  deleteAsset,
  updateAssetPrice,
  getTotalInvested,
  getTotalCurrentValue,
  getAssetsSummaryByType,
  type CreateAssetData,
  type UpdateAssetData,
} from '../models/Asset';

export async function listAssets(req: Request, res: Response): Promise<void> {
  try {
    const { type } = req.query;

    let assets;
    if (type && typeof type === 'string') {
      assets = await getAssetsByType(type as any);
    } else {
      assets = await getAllAssets();
    }

    res.json(assets);
  } catch (error) {
    console.error('Erro ao listar ativos:', error);
    res.status(500).json({ error: 'Erro ao listar ativos' });
  }
}

export async function getAsset(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const asset = await getAssetById(Number(id));

    if (!asset) {
      res.status(404).json({ error: 'Ativo nao encontrado' });
      return;
    }

    res.json(asset);
  } catch (error) {
    console.error('Erro ao buscar ativo:', error);
    res.status(500).json({ error: 'Erro ao buscar ativo' });
  }
}

export async function getByTicker(req: Request, res: Response): Promise<void> {
  try {
    const { ticker } = req.params;
    const asset = await getAssetByTicker(ticker);

    if (!asset) {
      res.status(404).json({ error: 'Ativo nao encontrado' });
      return;
    }

    res.json(asset);
  } catch (error) {
    console.error('Erro ao buscar ativo por ticker:', error);
    res.status(500).json({ error: 'Erro ao buscar ativo' });
  }
}

export async function create(req: Request, res: Response): Promise<void> {
  try {
    const data: CreateAssetData = req.body;

    // Validacoes
    if (!data.name || !data.type || !data.purchase_date) {
      res.status(400).json({ error: 'Nome, tipo e data de compra sao obrigatorios' });
      return;
    }

    if (data.total_invested === undefined || data.total_invested < 0) {
      res.status(400).json({ error: 'Valor investido e obrigatorio' });
      return;
    }

    // Se tem ticker, verifica se ja existe
    if (data.ticker) {
      const existing = await getAssetByTicker(data.ticker);
      if (existing) {
        res.status(400).json({ error: 'Ja existe um ativo com esse codigo' });
        return;
      }
    }

    const asset = await createAsset(data);
    res.status(201).json(asset);
  } catch (error) {
    console.error('Erro ao criar ativo:', error);
    res.status(500).json({ error: 'Erro ao criar ativo' });
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const data: UpdateAssetData = req.body;

    const existing = await getAssetById(Number(id));
    if (!existing) {
      res.status(404).json({ error: 'Ativo nao encontrado' });
      return;
    }

    // Se esta mudando ticker, verifica se ja existe outro com o mesmo ticker
    if (data.ticker && data.ticker !== existing.ticker) {
      const withSameTicker = await getAssetByTicker(data.ticker);
      if (withSameTicker && withSameTicker.id !== Number(id)) {
        res.status(400).json({ error: 'Ja existe outro ativo com esse codigo' });
        return;
      }
    }

    const asset = await updateAsset(Number(id), data);
    res.json(asset);
  } catch (error) {
    console.error('Erro ao atualizar ativo:', error);
    res.status(500).json({ error: 'Erro ao atualizar ativo' });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await getAssetById(Number(id));
    if (!existing) {
      res.status(404).json({ error: 'Ativo nao encontrado' });
      return;
    }

    await deleteAsset(Number(id));
    res.json({ message: 'Ativo removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover ativo:', error);
    res.status(500).json({ error: 'Erro ao remover ativo' });
  }
}

export async function updatePrice(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { current_price } = req.body;

    if (current_price === undefined || current_price < 0) {
      res.status(400).json({ error: 'Preco atual e obrigatorio' });
      return;
    }

    const asset = await updateAssetPrice(Number(id), current_price);
    if (!asset) {
      res.status(404).json({ error: 'Ativo nao encontrado' });
      return;
    }

    res.json(asset);
  } catch (error) {
    console.error('Erro ao atualizar preco:', error);
    res.status(500).json({ error: 'Erro ao atualizar preco' });
  }
}

export async function getSummary(req: Request, res: Response): Promise<void> {
  try {
    const [totalInvested, totalCurrentValue, byType] = await Promise.all([
      getTotalInvested(),
      getTotalCurrentValue(),
      getAssetsSummaryByType(),
    ]);

    const profit = totalCurrentValue - totalInvested;
    const profitPercent = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

    res.json({
      totalInvested,
      totalCurrentValue,
      profit,
      profitPercent,
      byType,
    });
  } catch (error) {
    console.error('Erro ao buscar resumo:', error);
    res.status(500).json({ error: 'Erro ao buscar resumo' });
  }
}
