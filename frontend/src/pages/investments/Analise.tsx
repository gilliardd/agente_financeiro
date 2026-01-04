import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { getAssetMovementsAnalytics, type AnalyticsData } from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  PieChart,
  BarChart3,
  Filter,
  DollarSign,
} from 'lucide-react';

const assetTypeLabels: Record<string, string> = {
  stocks: 'Acoes',
  fixed_income: 'Renda Fixa',
  funds: 'Fundos',
  crypto: 'Criptomoedas',
  real_estate: 'FIIs',
  savings: 'Poupanca',
  other: 'Outros',
};

const monthNames: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
};

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  return `${monthNames[month] || month}/${year}`;
}

function getTypeLabel(type: string): string {
  return assetTypeLabels[type] || type;
}

export default function Analise() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date filter - default to current year
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const result = await getAssetMovementsAnalytics({
        start_date: startDate,
        end_date: endDate,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  function handleFilter() {
    loadData();
  }

  // Calculate max values for bar charts
  const maxPurchaseByAsset = data?.purchasesByAsset
    ? Math.max(...data.purchasesByAsset.map(p => p.total_purchased), 1)
    : 1;

  const maxPurchaseByCategory = data?.purchasesByCategory
    ? Math.max(...data.purchasesByCategory.map(p => p.total_purchased), 1)
    : 1;

  return (
    <Layout title="Analise de Investimentos">
      <div className="space-y-6">
        {/* Filtro de Data */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-700">Filtrar por periodo:</span>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data Inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data Final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleFilter}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Aplicar Filtro
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button onClick={() => setError(null)} className="float-right">x</button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : data ? (
          <>
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Wallet className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Investido</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(data.summary.totalInvested)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <ArrowUpCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Compras</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(data.summary.totalEntries)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <ArrowDownCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Vendas</p>
                    <p className="text-xl font-bold text-orange-600">
                      {formatCurrency(data.summary.totalExits)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Dividendos</p>
                    <p className="text-xl font-bold text-cyan-600">
                      {formatCurrency(data.summary.totalDividends)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${data.summary.totalProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    {data.summary.totalProfit >= 0 ? (
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Lucro Final</p>
                    <p className={`text-xl font-bold ${data.summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.summary.totalProfit < 0 && '-'}
                      {formatCurrency(Math.abs(data.summary.totalProfit))}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Movimentacao por Mes */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold">Movimentacao por Mes</h3>
              </div>
              {data.byMonth.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum dado disponivel</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Compras</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Vendas</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Dividendos</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lucro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.byMonth.map((item) => (
                        <tr key={item.month} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{formatMonth(item.month)}</td>
                          <td className="px-4 py-3 text-right text-green-600">{formatCurrency(item.entries)}</td>
                          <td className="px-4 py-3 text-right text-orange-600">{formatCurrency(item.exits)}</td>
                          <td className="px-4 py-3 text-right text-cyan-600">{formatCurrency(item.dividends)}</td>
                          <td className={`px-4 py-3 text-right font-medium ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.profit < 0 && '-'}{formatCurrency(Math.abs(item.profit))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Resumo por Tipo de Ativo */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold">Resumo por Tipo de Ativo</h3>
              </div>
              {data.byType.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum dado disponivel</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Compras</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Vendas</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Dividendos</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lucro</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qtd Mov.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.byType.map((item) => (
                        <tr key={item.type} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                              {getTypeLabel(item.type)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-green-600">
                            {formatCurrency(item.entries)}
                          </td>
                          <td className="px-4 py-3 text-right text-orange-600">
                            {formatCurrency(item.exits)}
                          </td>
                          <td className="px-4 py-3 text-right text-cyan-600">
                            {formatCurrency(item.dividends)}
                          </td>
                          <td className={`px-4 py-3 text-right font-medium ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.profit < 0 && '-'}{formatCurrency(Math.abs(item.profit))}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">{item.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Resumo por Ativo */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold">Resumo por Ativo</h3>
              </div>
              {data.byAsset.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum dado disponivel</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ativo</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Compras</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Vendas</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Dividendos</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lucro</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qtd</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.byAsset.map((item) => (
                        <tr key={item.asset_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-blue-600">{item.asset_ticker || item.asset_name}</span>
                              <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-600">
                                {getTypeLabel(item.asset_type)}
                              </span>
                            </div>
                            {item.asset_ticker && (
                              <p className="text-xs text-gray-500">{item.asset_name}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-green-600">
                            {formatCurrency(item.entries)}
                          </td>
                          <td className="px-4 py-3 text-right text-orange-600">
                            {formatCurrency(item.exits)}
                          </td>
                          <td className="px-4 py-3 text-right text-cyan-600">
                            {formatCurrency(item.dividends)}
                          </td>
                          <td className={`px-4 py-3 text-right font-medium ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.profit < 0 && '-'}{formatCurrency(Math.abs(item.profit))}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {Number(item.quantity).toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Compras por Ativo */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <ArrowUpCircle className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold">Compras por Ativo</h3>
              </div>
              {data.purchasesByAsset.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum dado disponivel</p>
              ) : (
                <div className="space-y-3">
                  {data.purchasesByAsset.map((item) => (
                    <div key={item.asset_id} className="flex items-center gap-4">
                      <div className="w-40">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-600">{item.asset_ticker || item.asset_name}</span>
                          <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 text-gray-600">
                            {getTypeLabel(item.asset_type)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div
                          className="h-6 bg-blue-500 rounded"
                          style={{ width: `${(item.total_purchased / maxPurchaseByAsset) * 100}%`, minWidth: '4px' }}
                        />
                      </div>
                      <div className="w-32 text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(item.total_purchased)}</p>
                        <p className="text-xs text-gray-500">{Number(item.quantity_purchased).toLocaleString('pt-BR')} un.</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Compras por Categoria */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold">Compras por Categoria</h3>
              </div>
              {data.purchasesByCategory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum dado disponivel</p>
              ) : (
                <div className="space-y-3">
                  {data.purchasesByCategory.map((item) => (
                    <div key={item.type} className="flex items-center gap-4">
                      <div className="w-32">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          {getTypeLabel(item.type)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div
                          className="h-6 bg-purple-500 rounded"
                          style={{ width: `${(item.total_purchased / maxPurchaseByCategory) * 100}%`, minWidth: '4px' }}
                        />
                      </div>
                      <div className="w-40 text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(item.total_purchased)}</p>
                        <p className="text-xs text-gray-500">{item.asset_count} ativos</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <p className="text-gray-500">Nenhum dado disponivel para analise</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
