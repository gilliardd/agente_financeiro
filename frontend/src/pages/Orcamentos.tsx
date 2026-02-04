import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import {
  getBudgetByMonth,
  getBudgetRules,
  createBudget,
  updateBudget,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  copyBudgetFromPrevious,
  type Budget,
  type BudgetItem,
  type BudgetRule,
  type BudgetCategory,
  type BudgetRuleInfo,
} from '../services/api';
import { formatCurrency } from '../utils/formatters';
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Home,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Check,
  X,
  Copy,
  Edit2,
} from 'lucide-react';

const CATEGORY_INFO: Record<BudgetCategory, { label: string; icon: typeof Home; color: string; bgColor: string; description: string }> = {
  necessidades: {
    label: 'Necessidades',
    icon: Home,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Moradia, alimentacao, transporte, contas, saude, educacao',
  },
  estilo_vida: {
    label: 'Estilo de Vida',
    icon: Sparkles,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: 'Lazer, viagens, restaurantes, streaming, compras',
  },
  futuro: {
    label: 'Futuro Financeiro',
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: 'Reserva de emergencia, investimentos, previdencia',
  },
};

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function Orcamentos() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rules, setRules] = useState<BudgetRuleInfo[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);

  // Mes/Ano selecionado (proximo mes por padrao)
  const today = new Date();
  const nextMonth = today.getMonth() + 2 > 12 ? 1 : today.getMonth() + 2;
  const nextYear = today.getMonth() + 2 > 12 ? today.getFullYear() + 1 : today.getFullYear();
  const [selectedYear, setSelectedYear] = useState(nextYear);
  const [selectedMonth, setSelectedMonth] = useState(nextMonth);

  // Modal de criacao
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createRule, setCreateRule] = useState<BudgetRule>('50-30-20');
  const [createIncome, setCreateIncome] = useState('');
  const [createCustomNecessidades, setCreateCustomNecessidades] = useState('50');
  const [createCustomEstiloVida, setCreateCustomEstiloVida] = useState('30');
  const [createCustomFuturo, setCreateCustomFuturo] = useState('20');

  // Modal de edicao de regra
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRule, setEditRule] = useState<BudgetRule>('50-30-20');
  const [editIncome, setEditIncome] = useState('');
  const [editCustomNecessidades, setEditCustomNecessidades] = useState('50');
  const [editCustomEstiloVida, setEditCustomEstiloVida] = useState('30');
  const [editCustomFuturo, setEditCustomFuturo] = useState('20');

  // Modal de adicionar item
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [addItemCategory, setAddItemCategory] = useState<BudgetCategory>('necessidades');
  const [addItemName, setAddItemName] = useState('');
  const [addItemAmount, setAddItemAmount] = useState('');

  // Edicao inline de item
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingItemName, setEditingItemName] = useState('');
  const [editingItemAmount, setEditingItemAmount] = useState('');

  useEffect(() => {
    loadRules();
  }, []);

  useEffect(() => {
    loadBudget();
  }, [selectedYear, selectedMonth]);

  async function loadRules() {
    try {
      const rulesData = await getBudgetRules();
      setRules(rulesData);
    } catch (err: any) {
      console.error('Erro ao carregar regras:', err);
      setError('Erro ao carregar regras de orcamento');
    }
  }

  async function loadBudget() {
    try {
      setLoading(true);
      setError(null);
      const budgetData = await getBudgetByMonth(selectedYear, selectedMonth);
      setBudget(budgetData); // Pode ser Budget ou null
    } catch (err: any) {
      console.error('Erro ao carregar orcamento:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar orcamento');
    } finally {
      setLoading(false);
    }
  }

  function goToPreviousMonth() {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  }

  function goToNextMonth() {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  }

  async function handleCreateBudget(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createBudget({
        year: selectedYear,
        month: selectedMonth,
        rule: createRule,
        expected_income: parseFloat(createIncome),
        ...(createRule === 'custom' && {
          custom_necessidades: parseInt(createCustomNecessidades),
          custom_estilo_vida: parseInt(createCustomEstiloVida),
          custom_futuro: parseInt(createCustomFuturo),
        }),
      });
      setShowCreateModal(false);
      setCreateIncome('');
      setCreateRule('50-30-20');
      setCreateCustomNecessidades('50');
      setCreateCustomEstiloVida('30');
      setCreateCustomFuturo('20');
      loadBudget();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar orcamento');
    }
  }

  async function handleCopyFromPrevious() {
    try {
      await copyBudgetFromPrevious(selectedYear, selectedMonth);
      loadBudget();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao copiar orcamento');
    }
  }

  async function handleUpdateBudget(e: React.FormEvent) {
    e.preventDefault();
    if (!budget) return;
    try {
      await updateBudget(selectedYear, selectedMonth, {
        rule: editRule,
        expected_income: parseFloat(editIncome),
        ...(editRule === 'custom' && {
          custom_necessidades: parseInt(editCustomNecessidades),
          custom_estilo_vida: parseInt(editCustomEstiloVida),
          custom_futuro: parseInt(editCustomFuturo),
        }),
      });
      setShowEditModal(false);
      loadBudget();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar orcamento');
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    try {
      await addBudgetItem(selectedYear, selectedMonth, {
        category: addItemCategory,
        name: addItemName,
        planned_amount: parseFloat(addItemAmount),
      });
      setShowAddItemModal(false);
      setAddItemName('');
      setAddItemAmount('');
      loadBudget();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar item');
    }
  }

  async function handleUpdateItem(itemId: number) {
    try {
      await updateBudgetItem(itemId, {
        name: editingItemName,
        planned_amount: parseFloat(editingItemAmount),
      });
      setEditingItemId(null);
      loadBudget();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar item');
    }
  }

  async function handleDeleteItem(itemId: number) {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    try {
      await deleteBudgetItem(itemId);
      loadBudget();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir item');
    }
  }

  function startEditItem(item: BudgetItem) {
    setEditingItemId(item.id);
    setEditingItemName(item.name);
    setEditingItemAmount(String(item.planned_amount));
  }

  function cancelEditItem() {
    setEditingItemId(null);
    setEditingItemName('');
    setEditingItemAmount('');
  }

  function openEditModal() {
    if (!budget) return;
    setEditRule(budget.rule);
    setEditIncome(String(budget.expected_income));
    if (budget.rule === 'custom') {
      setEditCustomNecessidades(String(budget.custom_necessidades || 50));
      setEditCustomEstiloVida(String(budget.custom_estilo_vida || 30));
      setEditCustomFuturo(String(budget.custom_futuro || 20));
    } else {
      setEditCustomNecessidades('50');
      setEditCustomEstiloVida('30');
      setEditCustomFuturo('20');
    }
    setShowEditModal(true);
  }

  function openAddItemModal(category: BudgetCategory) {
    setAddItemCategory(category);
    setShowAddItemModal(true);
  }

  // Calculos
  const currentRule = rules.find(r => r.id === budget?.rule);
  const items = budget?.items || [];

  function getCategoryTotal(category: BudgetCategory): number {
    return items
      .filter(item => item.category === category)
      .reduce((sum, item) => sum + Number(item.planned_amount), 0);
  }

  function getCategoryLimit(category: BudgetCategory): number {
    if (!budget) return 0;

    let percentage: number;
    if (budget.rule === 'custom') {
      // Usar percentuais customizados
      const customPercentages: Record<BudgetCategory, number | null> = {
        necessidades: budget.custom_necessidades,
        estilo_vida: budget.custom_estilo_vida,
        futuro: budget.custom_futuro,
      };
      percentage = customPercentages[category] || 0;
    } else if (currentRule) {
      percentage = currentRule[category];
    } else {
      return 0;
    }

    return (budget.expected_income * percentage) / 100;
  }

  function getCategoryPercentage(category: BudgetCategory): number {
    const limit = getCategoryLimit(category);
    if (limit === 0) return 0;
    return (getCategoryTotal(category) / limit) * 100;
  }

  const totalPlanned = ['necessidades', 'estilo_vida', 'futuro'].reduce(
    (sum, cat) => sum + getCategoryTotal(cat as BudgetCategory),
    0
  );
  const remaining = budget ? budget.expected_income - totalPlanned : 0;

  return (
    <Layout title="Orcamentos">
      <div className="space-y-6">
        {/* Navegacao de mes */}
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </h2>
            <p className="text-sm text-gray-500">
              {selectedYear === nextYear && selectedMonth === nextMonth
                ? 'Proximo mes'
                : selectedYear === today.getFullYear() && selectedMonth === today.getMonth() + 1
                ? 'Mes atual'
                : ''}
            </p>
          </div>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : !budget ? (
          /* Sem orcamento - tela de criacao */
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <PiggyBank className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum orcamento para {MONTH_NAMES[selectedMonth - 1]}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Crie um orcamento para planejar suas despesas e manter suas financas sob controle.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Criar Novo Orcamento
              </button>
              <button
                onClick={handleCopyFromPrevious}
                className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Copy className="w-5 h-5" />
                Copiar do Mes Anterior
              </button>
            </div>
          </div>
        ) : (
          /* Com orcamento - exibicao */
          <>
            {/* Resumo */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Resumo do Orcamento</h3>
                  <p className="text-sm text-gray-500">
                    Regra: <span className="font-medium">
                      {budget.rule === 'custom'
                        ? `Personalizado (${budget.custom_necessidades}/${budget.custom_estilo_vida}/${budget.custom_futuro})`
                        : budget.rule.replace(/-/g, ' / ')}
                    </span>
                  </p>
                </div>
                <button
                  onClick={openEditModal}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Renda Prevista</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(budget.expected_income)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Total Planejado</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalPlanned)}</p>
                </div>
                <div className={`rounded-lg p-4 ${remaining >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="text-sm text-gray-500">Saldo Disponivel</p>
                  <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(remaining)}
                  </p>
                </div>
              </div>

              {/* Barras de progresso por categoria */}
              <div className="space-y-4">
                {(['necessidades', 'estilo_vida', 'futuro'] as BudgetCategory[]).map((category) => {
                  const info = CATEGORY_INFO[category];
                  const total = getCategoryTotal(category);
                  const limit = getCategoryLimit(category);
                  const percentage = getCategoryPercentage(category);
                  const isOver = percentage > 100;

                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <info.icon className={`w-4 h-4 ${info.color}`} />
                          <span className="text-sm font-medium text-gray-700">{info.label}</span>
                          <span className="text-xs text-gray-400">
                            ({budget?.rule === 'custom'
                              ? (category === 'necessidades' ? budget.custom_necessidades : category === 'estilo_vida' ? budget.custom_estilo_vida : budget.custom_futuro)
                              : currentRule?.[category]}%)
                          </span>
                        </div>
                        <span className={`text-sm font-medium ${isOver ? 'text-red-600' : 'text-gray-600'}`}>
                          {formatCurrency(total)} / {formatCurrency(limit)}
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOver ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : info.color.replace('text-', 'bg-')
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      {isOver && (
                        <p className="text-xs text-red-500 mt-1">
                          Excedeu o limite em {formatCurrency(total - limit)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Categorias com itens */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {(['necessidades', 'estilo_vida', 'futuro'] as BudgetCategory[]).map((category) => {
                const info = CATEGORY_INFO[category];
                const categoryItems = items.filter((item) => item.category === category);
                const Icon = info.icon;

                return (
                  <div
                    key={category}
                    className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden`}
                  >
                    <div className={`${info.bgColor} p-4 border-b border-gray-100`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-5 h-5 ${info.color}`} />
                          <h4 className="font-semibold text-gray-900">{info.label}</h4>
                        </div>
                        <button
                          onClick={() => openAddItemModal(category)}
                          className={`p-1.5 rounded-lg ${info.color} hover:bg-white/50 transition-colors`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{info.description}</p>
                    </div>

                    <div className="p-4">
                      {categoryItems.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">
                          Nenhum item cadastrado
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {categoryItems.map((item) => (
                            <li
                              key={item.id}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 group"
                            >
                              {editingItemId === item.id ? (
                                <div className="flex-1 flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={editingItemName}
                                    onChange={(e) => setEditingItemName(e.target.value)}
                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                  />
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editingItemAmount}
                                    onChange={(e) => setEditingItemAmount(e.target.value)}
                                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                                  />
                                  <button
                                    onClick={() => handleUpdateItem(item.id)}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={cancelEditItem}
                                    className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-sm text-gray-700">{item.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900">
                                      {formatCurrency(Number(item.planned_amount))}
                                    </span>
                                    <button
                                      onClick={() => startEditItem(item)}
                                      className="p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteItem(item.id)}
                                      className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Total</span>
                          <span className={`font-semibold ${info.color}`}>
                            {formatCurrency(getCategoryTotal(category))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal de Criar Orcamento */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Criar Orcamento - {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreateBudget} className="p-4 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Escolha a regra de orcamento
                </label>
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <label
                      key={rule.id}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        createRule === rule.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="rule"
                        value={rule.id}
                        checked={createRule === rule.id}
                        onChange={(e) => setCreateRule(e.target.value as BudgetRule)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold text-gray-900">{rule.name}</span>
                          {rule.id === '50-30-20' && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              Recomendado
                            </span>
                          )}
                        </div>
                        {rule.id === 'custom' ? (
                          <p className="text-sm text-gray-500 mt-1">Defina os percentuais manualmente</p>
                        ) : (
                          <div className="flex gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Home className="w-3.5 h-3.5 text-blue-500" />
                              {rule.necessidades}% Necessidades
                            </span>
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                              {rule.estilo_vida}% Estilo
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                              {rule.futuro}% Futuro
                            </span>
                          </div>
                        )}
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          createRule === rule.id ? 'border-blue-500' : 'border-gray-300'
                        }`}
                      >
                        {createRule === rule.id && (
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                {/* Campos de percentuais customizados */}
                {createRule === 'custom' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Defina os percentuais (devem somar 100%)</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Necessidades</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={createCustomNecessidades}
                            onChange={(e) => setCreateCustomNecessidades(e.target.value)}
                            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Estilo de Vida</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={createCustomEstiloVida}
                            onChange={(e) => setCreateCustomEstiloVida(e.target.value)}
                            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Futuro</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={createCustomFuturo}
                            onChange={(e) => setCreateCustomFuturo(e.target.value)}
                            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                        </div>
                      </div>
                    </div>
                    <p className={`text-xs ${
                      parseInt(createCustomNecessidades || '0') + parseInt(createCustomEstiloVida || '0') + parseInt(createCustomFuturo || '0') === 100
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      Total: {parseInt(createCustomNecessidades || '0') + parseInt(createCustomEstiloVida || '0') + parseInt(createCustomFuturo || '0')}%
                      {parseInt(createCustomNecessidades || '0') + parseInt(createCustomEstiloVida || '0') + parseInt(createCustomFuturo || '0') !== 100 && ' (deve ser 100%)'}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Renda prevista para o mes *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={createIncome}
                    onChange={(e) => setCreateIncome(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Criar Orcamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Editar Orcamento */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Editar Orcamento</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleUpdateBudget} className="p-4 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Regra de orcamento
                </label>
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <label
                      key={rule.id}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        editRule === rule.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="editRule"
                        value={rule.id}
                        checked={editRule === rule.id}
                        onChange={(e) => setEditRule(e.target.value as BudgetRule)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <span className="text-lg font-bold text-gray-900">{rule.name}</span>
                        {rule.id === 'custom' ? (
                          <p className="text-sm text-gray-500 mt-1">Defina os percentuais manualmente</p>
                        ) : (
                          <div className="flex gap-4 mt-1 text-sm text-gray-500">
                            <span>{rule.necessidades}% Necessidades</span>
                            <span>{rule.estilo_vida}% Estilo</span>
                            <span>{rule.futuro}% Futuro</span>
                          </div>
                        )}
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          editRule === rule.id ? 'border-blue-500' : 'border-gray-300'
                        }`}
                      >
                        {editRule === rule.id && (
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                {/* Campos de percentuais customizados para edição */}
                {editRule === 'custom' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Defina os percentuais (devem somar 100%)</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Necessidades</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editCustomNecessidades}
                            onChange={(e) => setEditCustomNecessidades(e.target.value)}
                            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Estilo de Vida</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editCustomEstiloVida}
                            onChange={(e) => setEditCustomEstiloVida(e.target.value)}
                            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Futuro</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editCustomFuturo}
                            onChange={(e) => setEditCustomFuturo(e.target.value)}
                            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                        </div>
                      </div>
                    </div>
                    <p className={`text-xs ${
                      parseInt(editCustomNecessidades || '0') + parseInt(editCustomEstiloVida || '0') + parseInt(editCustomFuturo || '0') === 100
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      Total: {parseInt(editCustomNecessidades || '0') + parseInt(editCustomEstiloVida || '0') + parseInt(editCustomFuturo || '0')}%
                      {parseInt(editCustomNecessidades || '0') + parseInt(editCustomEstiloVida || '0') + parseInt(editCustomFuturo || '0') !== 100 && ' (deve ser 100%)'}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Renda prevista *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={editIncome}
                    onChange={(e) => setEditIncome(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Adicionar Item */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Adicionar em {CATEGORY_INFO[addItemCategory].label}
              </h2>
              <button
                onClick={() => {
                  setShowAddItemModal(false);
                  setAddItemName('');
                  setAddItemAmount('');
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da despesa *
                </label>
                <input
                  type="text"
                  value={addItemName}
                  onChange={(e) => setAddItemName(e.target.value)}
                  placeholder="Ex: Aluguel, Internet, Academia..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor planejado *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={addItemAmount}
                    onChange={(e) => setAddItemAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddItemModal(false);
                    setAddItemName('');
                    setAddItemAmount('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
