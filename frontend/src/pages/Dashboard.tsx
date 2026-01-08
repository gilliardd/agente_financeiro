import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import BalanceCard from '../components/dashboard/BalanceCard';
import CategoryPieChart from '../components/dashboard/CategoryPieChart';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import IncomeExpenseChart from '../components/dashboard/IncomeExpenseChart';
import SavingsBoxesSummary from '../components/dashboard/SavingsBoxesSummary';
import { getDashboard, getReportsByPeriod, type PeriodReport } from '../services/api';
import { formatDate } from '../utils/formatters';
import type { DashboardData } from '../types';
import { RefreshCw, Calendar, ChevronDown } from 'lucide-react';

type DatePreset = 'thisMonth' | 'lastMonth' | 'last7Days' | 'last30Days' | 'last90Days' | 'thisYear' | 'custom';

function getPresetDates(preset: DatePreset): { startDate: string; endDate: string } {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  switch (preset) {
    case 'thisMonth': {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    }
    case 'lastMonth': {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    }
    case 'last7Days': {
      const end = new Date(today);
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    }
    case 'last30Days': {
      const end = new Date(today);
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    }
    case 'last90Days': {
      const end = new Date(today);
      const start = new Date(today);
      start.setDate(start.getDate() - 89);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    }
    case 'thisYear': {
      const start = new Date(year, 0, 1);
      const end = new Date(today);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    }
    default:
      return getPresetDates('thisMonth');
  }
}

const presetLabels: Record<DatePreset, string> = {
  thisMonth: 'Este mes',
  lastMonth: 'Mes passado',
  last7Days: 'Ultimos 7 dias',
  last30Days: 'Ultimos 30 dias',
  last90Days: 'Ultimos 90 dias',
  thisYear: 'Este ano',
  custom: 'Personalizado',
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [periodData, setPeriodData] = useState<PeriodReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<DatePreset>('thisMonth');
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [dateRange, setDateRange] = useState(() => getPresetDates('thisMonth'));

  const fetchData = async (startDate: string, endDate: string) => {
    try {
      setLoading(true);
      setError(null);
      const [result, periodResult] = await Promise.all([
        getDashboard({ startDate, endDate }),
        getReportsByPeriod({ startDate, endDate, groupBy: 'day' }),
      ]);
      setData(result);
      setPeriodData(periodResult);
    } catch (err) {
      setError('Erro ao carregar dados. Verifique se o servidor esta rodando.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(dateRange.startDate, dateRange.endDate);
  }, [dateRange]);

  const handlePresetChange = (newPreset: DatePreset) => {
    setPreset(newPreset);
    setShowPresetMenu(false);

    if (newPreset === 'custom') {
      setShowCustomRange(true);
      // Inicializa com as datas atuais
      setCustomStartDate(dateRange.startDate);
      setCustomEndDate(dateRange.endDate);
    } else {
      setShowCustomRange(false);
      setDateRange(getPresetDates(newPreset));
    }
  };

  const handleApplyCustomRange = () => {
    if (customStartDate && customEndDate) {
      setDateRange({
        startDate: customStartDate,
        endDate: customEndDate,
      });
      setShowCustomRange(false);
    }
  };

  if (loading && !data) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-green-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Dashboard">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
          <button
            onClick={() => fetchData(dateRange.startDate, dateRange.endDate)}
            className="ml-4 underline hover:no-underline"
          >
            Tentar novamente
          </button>
        </div>
      </Layout>
    );
  }

  if (!data) return null;

  return (
    <Layout title="Dashboard">
      {/* Filtro de data */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowPresetMenu(!showPresetMenu)}
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Calendar className="w-4 h-4" />
            {presetLabels[preset]}
            <ChevronDown className="w-4 h-4" />
          </button>

          {showPresetMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]">
              {(Object.keys(presetLabels) as DatePreset[]).map((key) => (
                <button
                  key={key}
                  onClick={() => handlePresetChange(key)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                    preset === key ? 'bg-green-50 text-green-700' : 'text-gray-700'
                  }`}
                >
                  {presetLabels[key]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Range de datas customizado */}
        {showCustomRange && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <span className="text-gray-500">ate</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={handleApplyCustomRange}
              className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600"
            >
              Aplicar
            </button>
          </div>
        )}

        {/* Periodo selecionado */}
        <div className="text-sm text-gray-500">
          {formatDate(data.period.startDate)} - {formatDate(data.period.endDate)}
        </div>

        {loading && <RefreshCw className="w-4 h-4 text-green-500 animate-spin" />}
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <BalanceCard
          title="Receitas"
          value={data.summary.income}
          type="income"
          subtitle="No periodo"
        />
        <BalanceCard
          title="Despesas"
          value={data.summary.expense}
          type="expense"
          subtitle="No periodo"
        />
        <BalanceCard
          title="Saldo"
          value={data.summary.balance}
          type="balance"
          subtitle="Receitas - Despesas"
        />
      </div>

      {/* Grafico de colunas por dia */}
      {periodData.length > 0 && (
        <div className="mb-6">
          <IncomeExpenseChart data={periodData} />
        </div>
      )}

      {/* Graficos, transacoes e caixinhas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CategoryPieChart
          data={data.expensesByCategory}
          title="Despesas por Categoria"
        />
        <RecentTransactions transactions={data.recentTransactions} />
        <SavingsBoxesSummary data={data.savingsBoxes} />
      </div>
    </Layout>
  );
}
