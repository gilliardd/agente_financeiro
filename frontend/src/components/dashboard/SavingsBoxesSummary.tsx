import { PiggyBank, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DashboardSavingsBoxes } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface SavingsBoxesSummaryProps {
  data: DashboardSavingsBoxes;
}

export default function SavingsBoxesSummary({ data }: SavingsBoxesSummaryProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800">Caixinhas</h3>
        </div>
        <Link
          to="/caixinhas"
          className="text-sm text-green-600 hover:text-green-700 font-medium"
        >
          Ver todas
        </Link>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-green-600 font-medium">Total Guardado</p>
          <p className="text-lg font-bold text-green-700">
            {formatCurrency(data.totalSaved)}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-600 font-medium">Caixinhas Ativas</p>
          <p className="text-lg font-bold text-blue-700">{data.count}</p>
        </div>
      </div>

      {/* Lista de caixinhas */}
      {data.boxes.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <PiggyBank className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma caixinha criada</p>
          <Link
            to="/caixinhas"
            className="text-sm text-green-600 hover:underline mt-1 inline-block"
          >
            Criar primeira caixinha
          </Link>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {data.boxes.map((box) => (
            <div
              key={box.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${box.color}20` }}
              >
                <PiggyBank className="w-5 h-5" style={{ color: box.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {box.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${box.progress}%`,
                        backgroundColor: box.color,
                      }}
                    />
                  </div>
                  {box.goalAmount > 0 && (
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {box.progress.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold" style={{ color: box.color }}>
                  {formatCurrency(box.currentAmount)}
                </p>
                {box.goalAmount > 0 && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                    <Target className="w-3 h-3" />
                    {formatCurrency(box.goalAmount)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
