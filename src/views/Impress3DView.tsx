import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { impress3dService } from '../services/impress3dService';
import {
  Impress3DTransaction,
  Impress3DInvestment,
  Impress3DProduct,
  Impress3DSettings
} from '../types/impress3d';
import { Impress3DDashboard } from '../components/impress3d/Impress3DDashboard';
import { Impress3DTransactions } from '../components/impress3d/Impress3DTransactions';
import { Impress3DInvestments } from '../components/impress3d/Impress3DInvestments';
import { Impress3DProducts } from '../components/impress3d/Impress3DProducts';
import { Impress3DCalculator } from '../components/impress3d/Impress3DCalculator';
import { Impress3DReports } from '../components/impress3d/Impress3DReports';
import {
  Printer,
  LayoutDashboard,
  ArrowLeftRight,
  ShieldCheck,
  TrendingUp,
  Settings,
  Calculator,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

export const Impress3DView: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || '';

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<Impress3DSettings>({
    user_id: userId,
    kwh_price: 0.85,
    printer_power_w: 350,
    filament_default_price_kg: 100
  });

  const [transactions, setTransactions] = useState<Impress3DTransaction[]>([]);
  const [investments, setInvestments] = useState<Impress3DInvestment[]>([]);
  const [products, setProducts] = useState<Impress3DProduct[]>([]);
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);

  // Settings modification
  const [editSettings, setEditSettings] = useState<boolean>(false);
  const [kwhVal, setKwhVal] = useState<string>('0.85');
  const [powerVal, setPowerVal] = useState<string>('350');
  const [filamentVal, setFilamentVal] = useState<string>('100');

  const loadAllData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const userSettings = await impress3dService.getSettings(userId);
      setSettings(userSettings);
      setKwhVal(userSettings.kwh_price.toString());
      setPowerVal(userSettings.printer_power_w.toString());
      setFilamentVal(userSettings.filament_default_price_kg.toString());

      const userTransactions = await impress3dService.getTransactions(userId);
      setTransactions(userTransactions);

      const userInvestments = await impress3dService.getInvestments(userId);
      setInvestments(userInvestments);

      const userProducts = await impress3dService.getProducts(userId);
      setProducts(userProducts);

      const hasDemo = userTransactions.some(t => t.is_demo) || userInvestments.some(i => i.is_demo) || userProducts.some(p => p.is_demo);
      setIsDemoActive(hasDemo);
    } catch (err) {
      console.error('Error loading Impress 3D business data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [userId]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Impress3DSettings = {
      user_id: userId,
      kwh_price: parseFloat(kwhVal) || 0.85,
      printer_power_w: parseFloat(powerVal) || 350,
      filament_default_price_kg: parseFloat(filamentVal) || 100
    };

    setLoading(true);
    const res = await impress3dService.saveSettings(updated);
    if (res.success) {
      setSettings(updated);
      setEditSettings(false);
    }
    setLoading(false);
  };

  const handleLoadDemo = async () => {
    setLoading(true);
    const res = await impress3dService.loadDemoData(userId);
    if (res) {
      await loadAllData();
    } else {
      alert('Falha ao carregar dados de demonstração. Verifique se as tabelas "impress3d_" foram criadas executando o script SQL no Supabase.');
    }
    setLoading(false);
  };

  const handleClearDemo = async () => {
    const confirm = window.confirm('Deseja realmente excluir todos os dados de demonstração do IMPRESS 3D? Seus dados reais não serão afetados.');
    if (confirm) {
      setLoading(true);
      const res = await impress3dService.clearDemoData(userId);
      if (res) {
        await loadAllData();
      } else {
        alert('Erro ao limpar dados de demonstração.');
      }
      setLoading(false);
    }
  };

  // State callbacks for CRUD modifications
  const handleAddTransaction = async (tx: any) => {
    setLoading(true);
    const res = await impress3dService.createTransaction({ ...tx, user_id: userId });
    if (!res.success) {
      alert('Erro ao cadastrar movimentação. Verifique se executou o script "supabase-migration-impress3d.sql" no console do seu Supabase. Erro: ' + (res.error?.message || 'Tabela não encontrada'));
    } else {
      await loadAllData();
    }
    setLoading(false);
  };

  const handleEditTransaction = async (id: string, tx: any) => {
    setLoading(true);
    const res = await impress3dService.updateTransaction(id, tx);
    if (!res.success) {
      alert('Erro ao editar movimentação no banco. Erro: ' + (res.error?.message || 'Falha de comunicação'));
    } else {
      await loadAllData();
    }
    setLoading(false);
  };

  const handleDeleteTransaction = async (id: string) => {
    setLoading(true);
    const res = await impress3dService.deleteTransaction(id);
    if (!res.success) {
      alert('Erro ao excluir movimentação. Erro: ' + (res.error?.message || 'Falha de comunicação'));
    } else {
      await loadAllData();
    }
    setLoading(false);
  };

  const handleAddInvestment = async (inv: any) => {
    setLoading(true);
    const res = await impress3dService.createInvestment({ ...inv, user_id: userId });
    if (!res.success) {
      alert('Erro ao salvar investimento. Verifique se as tabelas foram criadas no Supabase. Erro: ' + (res.error?.message || 'Tabela não encontrada'));
    } else {
      await loadAllData();
    }
    setLoading(false);
  };

  const handleEditInvestment = async (id: string, inv: any) => {
    setLoading(true);
    const res = await impress3dService.updateInvestment(id, inv);
    if (!res.success) {
      alert('Erro ao editar investimento. Erro: ' + (res.error?.message || 'Falha de comunicação'));
    } else {
      await loadAllData();
    }
    setLoading(false);
  };

  const handleDeleteInvestment = async (id: string) => {
    setLoading(true);
    const res = await impress3dService.deleteInvestment(id);
    if (!res.success) {
      alert('Erro ao excluir investimento. Erro: ' + (res.error?.message || 'Falha de comunicação'));
    } else {
      await loadAllData();
    }
    setLoading(false);
  };

  const handleAddProduct = async (prod: any) => {
    setLoading(true);
    const res = await impress3dService.createProduct({ ...prod, user_id: userId });
    if (!res.success) {
      alert('Erro ao cadastrar produto. Verifique se as tabelas do Supabase existem. Erro: ' + (res.error?.message || 'Tabela não encontrada'));
    } else {
      await loadAllData();
    }
    setLoading(false);
  };

  const handleEditProduct = async (id: string, prod: any) => {
    setLoading(true);
    const res = await impress3dService.updateProduct(id, prod);
    if (!res.success) {
      alert('Erro ao atualizar produto. Erro: ' + (res.error?.message || 'Falha de comunicação'));
    } else {
      await loadAllData();
    }
    setLoading(false);
  };

  const handleDeleteProduct = async (id: string) => {
    setLoading(true);
    const res = await impress3dService.deleteProduct(id);
    if (!res.success) {
      alert('Erro ao excluir produto. Erro: ' + (res.error?.message || 'Falha de comunicação'));
    } else {
      await loadAllData();
    }
    setLoading(false);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Impress3DDashboard transactions={transactions} investments={investments} />;
      case 'movimentacoes':
        return (
          <Impress3DTransactions
            transactions={transactions}
            onAdd={handleAddTransaction}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
          />
        );
      case 'investimentos':
        return (
          <Impress3DInvestments
            investments={investments}
            onAdd={handleAddInvestment}
            onEdit={handleEditInvestment}
            onDelete={handleDeleteInvestment}
          />
        );
      case 'produtos':
        return (
          <Impress3DProducts
            products={products}
            settings={settings}
            onAdd={handleAddProduct}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
          />
        );
      case 'calculadora':
        return <Impress3DCalculator settings={settings} />;
      case 'resultado':
        return <Impress3DReports transactions={transactions} investments={investments} />;
      default:
        return <Impress3DDashboard transactions={transactions} investments={investments} />;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Controls: Settings, Demo Tools */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900 border border-amber-500/15 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center border border-amber-300/30">
            <Printer className="w-5 h-5 text-zinc-950 font-bold" />
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-widest text-amber-400 uppercase font-mono">
              Módulo de Negócios
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-zinc-100 flex items-center gap-2">
              IMPRESS 3D
              <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Supabase Ativo
              </span>
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {isDemoActive ? (
            <button
              onClick={handleClearDemo}
              disabled={loading}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold font-mono flex items-center gap-1.5 transition-all"
            >
              <span>Excluir Demonstração</span>
            </button>
          ) : (
            <button
              onClick={handleLoadDemo}
              disabled={loading}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold font-mono flex items-center gap-1.5 transition-all"
            >
              <span>Carregar Demonstração</span>
            </button>
          )}

          <button
            onClick={() => setEditSettings(!editSettings)}
            className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configurações</span>
          </button>

          <button
            onClick={loadAllData}
            disabled={loading}
            className="p-1.5 bg-zinc-950 hover:bg-zinc-850 text-zinc-400 hover:text-amber-400 border border-zinc-800 rounded-xl transition-all"
            title="Sincronizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Settings Form Modal Drawer */}
      {editSettings && (
        <div className="bg-zinc-900 border border-amber-500/20 p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest font-mono">
              Configurações Padrão de Fabricação
            </h3>
            <button onClick={() => setEditSettings(false)} className="text-xs text-zinc-500 hover:text-zinc-300">
              [Fechar]
            </button>
          </div>

          <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Tarifa média de energia elétrica (R$/kWh)</label>
              <input
                type="number"
                step="0.0001"
                required
                value={kwhVal}
                onChange={(e) => setKwhVal(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-850 rounded-xl text-zinc-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Consumo nominal da impressora (Watts - W)</label>
              <input
                type="number"
                required
                value={powerVal}
                onChange={(e) => setPowerVal(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-850 rounded-xl text-zinc-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Preço médio padrão do Filamento (R$/kg)</label>
              <input
                type="number"
                required
                value={filamentVal}
                onChange={(e) => setFilamentVal(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-850 rounded-xl text-zinc-200 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 border-t border-zinc-800 pt-3">
              <button
                type="button"
                onClick={() => setEditSettings(false)}
                className="px-3.5 py-1.5 bg-zinc-950 hover:bg-zinc-850 text-zinc-400 rounded-xl font-semibold transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-xl shadow-md transition-all"
              >
                Salvar Configurações
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Internal Navigation Tabs */}
      <div className="flex overflow-x-auto gap-1 border-b border-zinc-850 pb-px scrollbar-none">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'movimentacoes', label: 'Movimentações', icon: ArrowLeftRight },
          { id: 'investimentos', label: 'Investimentos', icon: Printer },
          { id: 'produtos', label: 'Produtos', icon: FolderOpen },
          { id: 'calculadora', label: 'Calculadora', icon: Calculator },
          { id: 'resultado', label: 'Resultado & DRE', icon: TrendingUp }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider font-mono rounded-t-xl transition-all border-t-2 border-x ${
                isActive
                  ? 'bg-zinc-900 text-amber-400 border-amber-500 border-x-zinc-850 shadow-sm font-bold'
                  : 'text-zinc-500 hover:text-zinc-300 border-transparent border-x-transparent hover:bg-zinc-900/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Loading state indicator */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-amber-400 animate-pulse">
          Carregando dados do Supabase...
        </div>
      ) : (
        <div className="transition-all duration-150">
          {renderActiveTab()}
        </div>
      )}
    </div>
  );
};
