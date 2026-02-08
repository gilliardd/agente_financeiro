import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import {
  getBills,
  createBill,
  updateBill,
  deleteBill,
  markBillAsPaid,
  getCategories,
  type Bill,
} from '../services/api';
import type { Category } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Plus, Trash2, Check, Bell, Calendar, X, Pencil } from 'lucide-react';

export default function Bills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDueDay, setFormDueDay] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [formReminderDays, setFormReminderDays] = useState('1');
  const [formRepeatType, setFormRepeatType] = useState<'recurring' | 'fixed'>('recurring');
  const [formRepeatMonths, setFormRepeatMonths] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [billsData, categoriesData] = await Promise.all([
        getBills(),
        getCategories('expense'),
      ]);
      setBills(billsData.bills);
      setTotal(billsData.total);
      setCategories(categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createBill({
        name: formName,
        description: formDescription || undefined,
        amount: parseFloat(formAmount),
        due_day: parseInt(formDueDay, 10),
        category_id: formCategoryId ? parseInt(formCategoryId, 10) : undefined,
        is_recurring: true,
        repeat_months: formRepeatType === 'fixed' && formRepeatMonths ? parseInt(formRepeatMonths, 10) : null,
        reminder_days_before: parseInt(formReminderDays, 10),
      });
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
    try {
      await deleteBill(id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir conta');
    }
  }

  async function handleMarkPaid(id: number) {
    try {
      await markBillAsPaid(id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao marcar como paga');
    }
  }

  function handleEdit(bill: Bill) {
    setEditingBill(bill);
    setFormName(bill.name);
    setFormDescription(bill.description || '');
    setFormAmount(String(bill.amount));
    setFormDueDay(String(bill.due_day));
    setFormCategoryId(bill.category_id ? String(bill.category_id) : '');
    setFormReminderDays(String(bill.reminder_days_before));
    setFormRepeatType(bill.repeat_months ? 'fixed' : 'recurring');
    setFormRepeatMonths(bill.repeat_months ? String(bill.repeat_months) : '');
    setShowModal(true);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingBill) return;
    try {
      await updateBill(editingBill.id, {
        name: formName,
        description: formDescription || undefined,
        amount: parseFloat(formAmount),
        due_day: parseInt(formDueDay, 10),
        category_id: formCategoryId ? parseInt(formCategoryId, 10) : undefined,
        is_recurring: true,
        repeat_months: formRepeatType === 'fixed' && formRepeatMonths ? parseInt(formRepeatMonths, 10) : null,
        reminder_days_before: parseInt(formReminderDays, 10),
      });
      setShowModal(false);
      setEditingBill(null);
      resetForm();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar conta');
    }
  }

  function resetForm() {
    setFormName('');
    setFormDescription('');
    setFormAmount('');
    setFormDueDay('');
    setFormCategoryId('');
    setFormReminderDays('1');
    setFormRepeatType('recurring');
    setFormRepeatMonths('');
  }

  function getDaysUntilDue(dueDay: number): number {
    const today = new Date();
    const currentDay = today.getDate();
    if (dueDay >= currentDay) {
      return dueDay - currentDay;
    }
    // Proximo mes
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    return lastDay - currentDay + dueDay;
  }

  function getDueStatus(bill: Bill): { text: string; color: string } {
    const days = getDaysUntilDue(bill.due_day);
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Verifica se ja pagou este mes
    if (bill.last_paid_date) {
      const paidDate = new Date(bill.last_paid_date);
      if (paidDate.getMonth() + 1 === currentMonth && paidDate.getFullYear() === currentYear) {
        return { text: 'Pago', color: 'text-green-600 bg-green-100' };
      }
    }

    if (days === 0) {
      return { text: 'Vence hoje!', color: 'text-red-600 bg-red-100' };
    } else if (days === 1) {
      return { text: 'Vence amanha', color: 'text-orange-600 bg-orange-100' };
    } else if (days <= 7) {
      return { text: `Vence em ${days} dias`, color: 'text-yellow-600 bg-yellow-100' };
    }
    return { text: `Dia ${bill.due_day}`, color: 'text-gray-600 bg-gray-100' };
  }

  return (
    <Layout title="Contas a Pagar">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-gray-500">
              Total mensal: <span className="font-semibold text-gray-900">{formatCurrency(total)}</span>
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Conta
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : bills.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma conta cadastrada</h3>
            <p className="text-gray-500 mb-4">
              Cadastre suas contas fixas para receber lembretes automaticos
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Cadastrar Conta
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {bills.map((bill) => {
              const status = getDueStatus(bill);
              return (
                <div
                  key={bill.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{bill.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.color}`}>
                          {status.text}
                        </span>
                        {bill.repeat_months ? (
                          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                            {bill.repeat_months} {bill.repeat_months === 1 ? 'mes' : 'meses'}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Recorrente</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="font-semibold text-lg text-gray-900">
                          {formatCurrency(bill.amount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Dia {bill.due_day}
                        </span>
                        {bill.category_name && (
                          <span
                            className="px-2 py-0.5 rounded-full text-xs"
                            style={{
                              backgroundColor: `${bill.category_color}20`,
                              color: bill.category_color,
                            }}
                          >
                            {bill.category_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-gray-400">
                          <Bell className="w-4 h-4" />
                          {bill.reminder_days_before} dia(s) antes
                        </span>
                      </div>
                      {bill.description && (
                        <p className="text-sm text-gray-500 mt-1">{bill.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!status.text.includes('Pago') && (
                        <button
                          onClick={() => handleMarkPaid(bill.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Marcar como paga"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(bill)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(bill.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Nova Conta */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingBill ? 'Editar Conta a Pagar' : 'Nova Conta a Pagar'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingBill(null);
                  resetForm();
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={editingBill ? handleUpdate : handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da conta *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Internet, Luz, Aluguel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descricao (opcional)
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ex: Plano de 200 Mbps"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dia vencimento *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formDueDay}
                    onChange={(e) => setFormDueDay(e.target.value)}
                    placeholder="1-31"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lembrar antes
                  </label>
                  <select
                    value={formReminderDays}
                    onChange={(e) => setFormReminderDays(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="0">No dia</option>
                    <option value="1">1 dia antes</option>
                    <option value="2">2 dias antes</option>
                    <option value="3">3 dias antes</option>
                    <option value="5">5 dias antes</option>
                    <option value="7">7 dias antes</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repetição
                </label>
                <div className="flex gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => { setFormRepeatType('recurring'); setFormRepeatMonths(''); }}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                      formRepeatType === 'recurring'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Recorrente
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormRepeatType('fixed')}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                      formRepeatType === 'fixed'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Por periodo
                  </button>
                </div>
                {formRepeatType === 'fixed' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Repetir por</span>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={formRepeatMonths}
                      onChange={(e) => setFormRepeatMonths(e.target.value)}
                      placeholder="Ex: 12"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                      required
                    />
                    <span className="text-sm text-gray-600">meses</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBill(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingBill ? 'Salvar Alterações' : 'Criar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
