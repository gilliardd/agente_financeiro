import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Categories from './pages/Categories';
import SavingsBoxes from './pages/SavingsBoxes';
import Reports from './pages/Reports';
import Bills from './pages/Bills';
import InvestCadastro from './pages/investments/Cadastro';
import InvestMovimento from './pages/investments/Movimento';
import InvestAnalise from './pages/investments/Analise';

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{title}</h1>
          <p className="text-gray-500">Em desenvolvimento...</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/transacoes" element={<Transactions />} />
        <Route path="/categorias" element={<Categories />} />
        <Route path="/caixinhas" element={<SavingsBoxes />} />
        <Route path="/contas" element={<Bills />} />
        <Route path="/orcamentos" element={<ComingSoon title="Orcamentos" />} />
        <Route path="/investimentos/cadastro" element={<InvestCadastro />} />
        <Route path="/investimentos/movimento" element={<InvestMovimento />} />
        <Route path="/investimentos/analise" element={<InvestAnalise />} />
        <Route path="/relatorios" element={<Reports />} />
        <Route path="/configuracoes" element={<ComingSoon title="Configuracoes" />} />
      </Routes>
    </BrowserRouter>
  );
}
