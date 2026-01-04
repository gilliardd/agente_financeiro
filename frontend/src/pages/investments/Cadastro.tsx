import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { getAssets, createAsset, updateAsset, deleteAsset, type Asset } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

const assetTypes = [
  { value: 'stocks', label: 'Ações' },
  { value: 'fixed_income', label: 'Renda Fixa' },
  { value: 'funds', label: 'Fundos' },
  { value: 'crypto', label: 'Criptomoedas' },
  { value: 'real_estate', label: 'FIIs' },
  { value: 'savings', label: 'Poupança' },
  { value: 'other', label: 'Outros' },
];

const initialFormData = {
  name: '',
  type: 'stocks' as Asset['type'],
  ticker: '',
  institution: '',
  expected_return: '',
  notes: '',
};

export default function Cadastro() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAssets();
  }, []);

  async function loadAssets() {
    try {
      setLoading(true);
      const data = await getAssets();
      setAssets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar ativos');
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

  function openEditForm(asset: Asset) {
    setFormData({
      name: asset.name,
      type: asset.type,
      ticker: asset.ticker || '',
      institution: asset.institution || '',
      expected_return: asset.expected_return?.toString() || '',
      notes: asset.notes || '',
    });
    setEditingId(asset.id);
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
        name: formData.name,
        type: formData.type,
        ticker: formData.ticker || undefined,
        institution: formData.institution || undefined,
        total_invested: 0,
        purchase_date: new Date().toISOString().split('T')[0],
        expected_return: formData.expected_return ? parseFloat(formData.expected_return) : undefined,
        notes: formData.notes || undefined,
      };

      if (editingId) {
        await updateAsset(editingId, data);
      } else {
        await createAsset(data);
      }

      closeForm();
      loadAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar ativo');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Tem certeza que deseja excluir este ativo?')) return;

    try {
      await deleteAsset(id);
      loadAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir ativo');
    }
  }

  function getTypeLabel(type: string) {
    return assetTypes.find(t => t.value === type)?.label || type;
  }

  return (
    <Layout title="Cadastro de Ativos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <p className="text-gray-600">Gerencie seus ativos e investimentos</p>
          <button
            onClick={openNewForm}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Ativo
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button onClick={() => setError(null)} className="float-right">×</button>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">
                  {editingId ? 'Editar Ativo' : 'Novo Ativo'}
                </h3>
                <button onClick={closeForm} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nome */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Ex: Petrobras"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Tipo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {assetTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Código/Ticker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código (Ticker)
                    </label>
                    <input
                      type="text"
                      name="ticker"
                      value={formData.ticker}
                      onChange={handleInputChange}
                      placeholder="Ex: PETR4"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                    />
                  </div>

                  {/* Corretora/Instituição */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Corretora/Instituição
                    </label>
                    <input
                      type="text"
                      name="institution"
                      value={formData.institution}
                      onChange={handleInputChange}
                      placeholder="Ex: Clear, XP, Nubank"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Rentabilidade Esperada */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rentabilidade Esperada (% a.a.)
                    </label>
                    <input
                      type="number"
                      name="expected_return"
                      value={formData.expected_return}
                      onChange={handleInputChange}
                      step="0.01"
                      placeholder="Ex: 12.5"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Anotações sobre o investimento..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Botões */}
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

        {/* Lista de Ativos */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : assets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <p className="text-gray-500 mb-4">Nenhum ativo cadastrado</p>
            <button
              onClick={openNewForm}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Cadastrar primeiro ativo
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ativo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Corretora</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rent. Esperada</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cadastro</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assets.map(asset => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{asset.name}</p>
                        {asset.ticker && (
                          <p className="text-sm text-blue-600 font-mono">{asset.ticker}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {getTypeLabel(asset.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {asset.institution || '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {asset.expected_return ? `${Number(asset.expected_return).toLocaleString('pt-BR')}% a.a.` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600 text-sm">
                      {formatDate(asset.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditForm(asset)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
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
        )}
      </div>
    </Layout>
  );
}
