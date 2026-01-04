import { useState } from 'react';
import Layout from '../components/layout/Layout';
import { TrendingUp, BarChart3, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';

export default function Investments() {
  const [cadastroOpen, setCadastroOpen] = useState(false);
  const [movimentoOpen, setMovimentoOpen] = useState(true);
  const [analiseOpen, setAnaliseOpen] = useState(false);

  return (
    <Layout title="Investimentos">
      <div className="space-y-4">
        {/* Menu Cadastro */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setCadastroOpen(!cadastroOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ClipboardList className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Cadastro</span>
            </div>
            {cadastroOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {cadastroOpen && (
            <div className="p-4 border-t border-gray-100">
              <p className="text-gray-500">Conteudo de cadastro...</p>
            </div>
          )}
        </div>

        {/* Menu Movimento */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setMovimentoOpen(!movimentoOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Movimento</span>
            </div>
            {movimentoOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {movimentoOpen && (
            <div className="p-4 border-t border-gray-100">
              <p className="text-gray-500">Conteudo de movimento...</p>
            </div>
          )}
        </div>

        {/* Menu Análise */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => setAnaliseOpen(!analiseOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Análise</span>
            </div>
            {analiseOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {analiseOpen && (
            <div className="p-4 border-t border-gray-100">
              <p className="text-gray-500">Conteudo de analise...</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
