import React from 'react';
import {
  Search,
  Plus,
  Bell,
  Sun,
  Moon,
  ShieldCheck,
  User,
  Menu,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { useAuth } from '../context/AuthContext';
import { ViewTab } from '../types';

const viewTitles: Record<ViewTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Visão Geral Patrimonial',
    subtitle: 'Resumo consolidado do fluxo, posição financeira e indicadores globais',
  },
  fluxo: {
    title: 'Fluxo Financeiro Central',
    subtitle: 'Tabela unificada de receitas, despesas, cartões, financiamentos e liquidações',
  },
  central: {
    title: 'Central Financeira',
    subtitle: 'Gestão integrada de passivos, liquidez, saúde financeira e metas',
  },
  cartoes: {
    title: 'Gestão de Cartões de Crédito',
    subtitle: 'Controle de limites, faturas abertas, datas de corte e transações por cartão',
  },
  'custos-fixos': {
    title: 'Custos Fixos & Recorrências',
    subtitle: 'Mapeamento de despesas recorrentes, serviços contínuos e obrigações fixas',
  },
  credito: {
    title: 'Carteira de Crédito & Carnês',
    subtitle: 'Financiamentos imobiliários, veículos, empréstimos e carnês parcelados',
  },
  bancos: {
    title: 'Contas Bancárias & Saldos',
    subtitle: 'Consolidação multi-bancária de saldos operacionais e contas investimento',
  },
  calendario: {
    title: 'Calendário Financeiro',
    subtitle: 'Cronograma mensal de entradas e saídas programadas dia a dia',
  },
  saude: {
    title: 'Saúde Financeira & Aureum Score',
    subtitle: 'Diagnóstico patrimonial, índices de endividamento e recomendações AI',
  },
  quitacao: {
    title: 'Planejamento & Simulação de Quitação',
    subtitle: 'Calculadora de liquidação antecipada com aporte extra e economia de juros',
  },
  relatorios: {
    title: 'Relatórios & Business Intelligence',
    subtitle: 'Análise gráfica, evolução de patrimônio e exportação de relatórios em PDF/CSV',
  },
  controle: {
    title: 'Controle & Confiabilidade',
    subtitle: 'Fechamento mensal, conciliação, inconsistências, orçamentos e auditoria',
  },
  inteligencia: {
    title: 'Central de Inteligência Financeira',
    subtitle: 'Diagnóstico financeiro por IA executado exclusivamente sob sua solicitação',
  },
  configuracoes: {
    title: 'Configurações do Sistema',
    subtitle: 'Preferências de interface, segurança, conexões Open Finance e perfil',
  },
  impress3d: {
    title: 'IMPRESS 3D',
    subtitle: 'Controle financeiro e gestão do negócio',
  },
};

interface NavbarProps {
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNotifications }) => {
  const { user, profile } = useAuth();
  const {
    activeView,
    setActiveView,
    searchQuery,
    setSearchQuery,
    isDarkMode,
    toggleDarkMode,
    openNewTransactionModal,
    notifications,
    toggleMobileMenu,
  } = useFinancial();

  const unreadCount = notifications.filter((n) => !n.lida).length;
  const currentTitle = viewTitles[activeView] || {
    title: 'Aureum Private Banking',
    subtitle: 'Gestão Financeira Global',
  };

  return (
    <header className="h-16 sm:h-18 bg-zinc-950/80 backdrop-blur-md border-b border-amber-500/15 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors duration-200">
      {/* Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-amber-400 hover:bg-zinc-800 active:scale-95 transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
          aria-label="Abrir Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-sm sm:text-base font-bold text-zinc-100 font-sans tracking-tight flex items-center gap-1.5 sm:gap-2">
            <span className="truncate max-w-[150px] xs:max-w-[220px] sm:max-w-none">
              {currentTitle.title}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold shrink-0">
              PWA
            </span>
          </h1>
          <p className="text-xs text-zinc-400 font-sans hidden md:block truncate max-w-md">
            {currentTitle.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Search Bar (Desktop/Tablet) */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar lançamentos..."
            className="w-44 lg:w-64 pl-9 pr-3 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
            >
              ×
            </button>
          )}
        </div>

        {/* Quick New Transaction Button (Desktop/Tablet) */}
        <button
          onClick={() => openNewTransactionModal()}
          className="hidden sm:flex px-3.5 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 items-center gap-1.5 transition-all active:scale-95 cursor-pointer font-sans min-h-[38px]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Novo Lançamento</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          title={isDarkMode ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition-all cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-500" />}
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition-all relative cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
          aria-label="Notificações"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-zinc-950 font-mono text-[9px] font-bold flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Badge */}
        <button onClick={() => setActiveView('configuracoes')} className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-zinc-800 cursor-pointer" title="Abrir meu perfil">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-0.5 shadow-md shrink-0">
            {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="Foto de perfil" className="w-full h-full rounded-full object-cover bg-zinc-950" /> : <div className="w-full h-full bg-zinc-950 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-amber-400" /></div>}
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-bold text-zinc-200 leading-tight font-sans">
              {profile?.nomeCompleto || user?.email?.split('@')[0] || 'Usuário'}
            </div>
            <div className="text-[10px] text-amber-400 font-mono flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-2.5 h-2.5" /> Sessão protegida
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};
