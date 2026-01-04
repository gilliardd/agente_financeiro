import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import {
  getAssetMovements,
  createAssetMovement,
  updateAssetMovement,
  deleteAssetMovement,
  getAssets,
  type AssetMovement,
  type Asset,
} from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

const assetTypeLabels: Record<string, string> = {
  stocks: 'Acao',
  fixed_income: 'Renda Fixa',
  funds: 'Fundo Imobiliario',
  crypto: 'Criptomoedas',
  real_estate: 'FIIs',
  savings: 'Poupanca',
  other: 'Outros',
  variable_income: 'Renda Variavel',
  dividend: 'Dividendo',
};

const initialFormData = {
  asset_id: '',
  date: new Date().toISOString().split('T')[0],
  movement_type: 'entry' as 'entry' | 'exit' | 'dividend',
  quantity: '',
  price: '',
  fee_rate: '1',
  current_price: '',
  notes: '',
};

export default function Movimento() {
  const [movements, setMovements] = useState<AssetMovement[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [movementsData, assetsData] = await Promise.all([
        getAssetMovements(),
        getAssets(),
      ]);
      setMovements(movementsData);
      setAssets(assetsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function openNewForm() {
    setFormData(initialFormData);
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(movement: AssetMovement) {
    setFormData({
      asset_id: movement.asset_id.toString(),
      date: movement.date.split('T')[0],
      movement_type: movement.movement_type,
      quantity: movement.quantity.toString(),
      price: movement.price.toString(),
      fee_rate: movement.fee_rate.toString(),
      current_price: movement.current_price?.toString() || '',
      notes: movement.notes || '',
    });
    setEditingId(movement.id);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        asset_id: parseInt(formData.asset_id),
        date: formData.date,
        movement_type: formData.movement_type,
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
        fee_rate: formData.fee_rate ? parseFloat(formData.fee_rate) : undefined,
        current_price: formData.current_price ? parseFloat(formData.current_price) : undefined,
        notes: formData.notes || undefined,
      };

      if (editingId) {
        await updateAssetMovement(editingId, data);
      } else {
        await createAssetMovement(data);
      }

      closeForm();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar movimento');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Tem certeza que deseja excluir este movimento?')) return;

    try {
      await deleteAssetMovement(id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir movimento');
    }
  }

  function getAssetTypeLabel(type: string | undefined) {
    if (!type) return '-';
    return assetTypeLabels[type] || type;
  }

  // Calculate totals for preview
  const total = formData.quantity && formData.price
    ? parseFloat(formData.quantity) * parseFloat(formData.price)
    : 0;
  const feeAmount = total * (parseFloat(formData.fee_rate || '0') / 100);
  const totalAfterFee = formData.movement_type === 'entry'
    ? total + feeAmount
    : total - feeAmount;

  return (
    <Layout title="Movimento de Investimentos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <p className="text-gray-600">Registre entradas e saidas dos seus investimentos</p>
          <button
            onClick={openNewForm}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Movimento
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button onClick={() => setError(null)} className="float-right">x</button>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">
                  {editingId ? 'Editar Movimento' : 'Novo Movimento'}
                </h3>
                <button onClick={closeForm} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ativo */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ativo *
                    </label>
                    <select
                      name="asset_id"
                      value={formData.asset_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecione um ativo</option>
                      {assets.map(asset => (
                        <option key={asset.id} value={asset.id}>
                          {asset.ticker ? `${asset.ticker} - ` : ''}{asset.name} ({getAssetTypeLabel(asset.type)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Data */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Tipo de Movimento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo *
                    </label>
                    <select
                      name="movement_type"
                      value={formData.movement_type}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="entry">ENTRADA (Compra)</option>
                      <option value="exit">SAIDA (Venda)</option>
                      <option value="dividend">DIVIDENDO</option>
                    </select>
                  </div>

                  {/* Quantidade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantidade *
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      required
                      step="1"
                      min="1"
                      placeholder="Ex: 10"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Preco */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preco Unitario (R$) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      step="0.01"
                      min="0"
                      placeholder="Ex: 35.50"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Taxa */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Taxa (%)
                    </label>
                    <input
                      type="number"
                      name="fee_rate"
                      value={formData.fee_rate}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="Ex: 1"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Preco Atual */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preco Atual (R$)
                    </label>
                    <input
                      type="number"
                      name="current_price"
                      value={formData.current_price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      placeholder="Ex: 50.00"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Preview dos calculos */}
                  {total > 0 && (
                    <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-2">Resumo</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Total:</span>
                          <p className="font-medium">{formatCurrency(total)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Taxa ({formData.fee_rate || 0}%):</span>
                          <p className="font-medium">{formatCurrency(feeAmount)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Final:</span>
                          <p className="font-medium">{formatCurrency(totalAfterFee)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Observacoes */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observacoes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={2}
                      placeholder="Anotacoes sobre o movimento..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Botoes */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabela de Movimentos */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : movements.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <p className="text-gray-500 mb-4">Nenhum movimento registrado</p>
            <button
              onClick={openNewForm}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Registrar primeiro movimento
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase">Data</th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase">Tipo</th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase">Codigo</th>
                    <th className="px-3 py-3 text-right text-xs font-medium uppercase">Qtd</th>
                    <th className="px-3 py-3 text-right text-xs font-medium uppercase">Preco</th>
                    <th className="px-3 py-3 text-right text-xs font-medium uppercase">Total</th>
                    <th className="px-3 py-3 text-center text-xs font-medium uppercase">E/S</th>
                    <th className="px-3 py-3 text-right text-xs font-medium uppercase">Taxa</th>
                    <th className="px-3 py-3 text-right text-xs font-medium uppercase">Total Final</th>
                    <th className="px-3 py-3 text-right text-xs font-medium uppercase">Preco Atual</th>
                    <th className="px-3 py-3 text-right text-xs font-medium uppercase">Lucro</th>
                    <th className="px-3 py-3 text-center text-xs font-medium uppercase">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {movements.map(movement => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-sm text-gray-900">
                        {formatDate(movement.date)}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900">
                        {getAssetTypeLabel(movement.asset_type)}
                      </td>
                      <td className="px-3 py-3 text-sm font-mono text-gray-900">
                        {movement.asset_ticker || movement.asset_name}
                      </td>
                      <td className="px-3 py-3 text-sm text-right text-gray-900">
                        {Number(movement.quantity).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-3 py-3 text-sm text-right text-gray-900">
                        {formatCurrency(movement.price)}
                      </td>
                      <td className="px-3 py-3 text-sm text-right text-gray-900">
                        {formatCurrency(movement.total)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-bold rounded ${
                          movement.movement_type === 'entry'
                            ? 'bg-green-100 text-green-800'
                            : movement.movement_type === 'exit'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {movement.movement_type === 'entry' ? 'ENTRADA' : movement.movement_type === 'exit' ? 'SAIDA' : 'DIVIDENDO'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-right text-gray-900">
                        {movement.fee_rate}%
                      </td>
                      <td className="px-3 py-3 text-sm text-right text-gray-900 font-medium">
                        {formatCurrency(movement.total_after_fee)}
                      </td>
                      <td className="px-3 py-3 text-sm text-right text-gray-900">
                        {movement.current_price ? formatCurrency(movement.current_price) : '-'}
                      </td>
                      <td className={`px-3 py-3 text-sm text-right font-medium ${
                        movement.profit !== null
                          ? movement.profit >= 0
                            ? 'text-green-600 bg-green-50'
                            : 'text-red-600 bg-red-50'
                          : 'text-gray-500'
                      }`}>
                        {movement.profit !== null ? (
                          <>
                            {movement.profit < 0 ? '-' : ''}
                            {formatCurrency(Math.abs(movement.profit))}
                          </>
                        ) : '-'}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditForm(movement)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(movement.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
