import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  CreditCard,
  Repeat,
  FileCheck2,
  Building2,
  CalendarDays,
  ShieldCheck,
  Calculator,
  PieChart,
  Settings,
  Sparkles,
  Download,
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { ViewTab } from '../types';

interface NavItem {
  id: ViewTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = React.useState(() => localStorage.getItem('aureum_sidebar_collapsed') === 'true');
  const {
    activeView,
    setActiveView,
    isPwaInstallable,
    installPwa,
    isMobileMenuOpen,
    closeMobileMenu,
    cards,
    contracts,
  } = useFinancial();

  const toggleSidebar = () => {
    setIsCollapsed((current) => {
      const next = !current;
      localStorage.setItem('aureum_sidebar_collapsed', String(next));
      return next;
    });
  };

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'fluxo', label: 'Fluxo Financeiro', icon: ArrowLeftRight, badge: 'Central' },
    { id: 'central', label: 'Central Financeira', icon: Landmark },
    { id: 'cartoes', label: 'Gestão de Cartões', icon: CreditCard, badge: String(cards.length) },
    { id: 'custos-fixos', label: 'Custos Fixos', icon: Repeat },
    { id: 'credito', label: 'Carteira de Crédito', icon: FileCheck2, badge: String(contracts.length) },
    { id: 'bancos', label: 'Contas Bancárias', icon: Building2 },
    { id: 'calendario', label: 'Calendário Financeiro', icon: CalendarDays },
    { id: 'saude', label: 'Saúde Financeira', icon: ShieldCheck },
    { id: 'quitacao', label: 'Planejamento Quitação', icon: Calculator, badge: 'Simulador' },
    { id: 'relatorios', label: 'Relatórios & BI', icon: PieChart },
    { id: 'controle', label: 'Controle & Confiabilidade', icon: ShieldCheck, badge: 'Novo' },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
    { id: 'impress3d', label: 'IMPRESS 3D', icon: Printer, badge: 'Novo' },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-zinc-300 border-r border-amber-500/20 shadow-2xl">
      {/* Brand Header */}
      <div className={`p-4 sm:p-5 border-b border-amber-500/15 flex items-center justify-between ${isCollapsed ? 'lg:px-3 lg:flex-col lg:gap-2' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/10 border border-amber-300/30">
            <Sparkles className="w-5 h-5 text-zinc-950 font-bold" />
          </div>
          <div className={isCollapsed ? 'lg:hidden' : ''}>
            <div className="text-[10px] sm:text-xs font-semibold tracking-widest text-amber-400/90 uppercase font-mono">
              AUREUM
            </div>
            <div className="text-xs sm:text-sm font-extrabold tracking-tight text-zinc-100 font-sans">
              PRIVATE BANKING
            </div>
          </div>
        </div>

        <button
          onClick={toggleSidebar}
          className="hidden lg:flex p-2 rounded-xl text-zinc-400 hover:text-amber-400 hover:bg-zinc-900 transition-colors"
          aria-label={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={closeMobileMenu}
          className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-amber-400 hover:bg-zinc-900 transition-colors"
          aria-label="Fechar Menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className={`flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar ${isCollapsed ? 'lg:px-2' : ''}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center justify-between px-3.5 py-3 sm:py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group min-h-[44px] ${isCollapsed ? 'lg:justify-center lg:px-2' : ''} ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent text-amber-300 font-semibold border-l-2 border-amber-400 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors shrink-0 ${
                    isActive ? 'text-amber-400' : 'text-zinc-500 group-hover:text-amber-400/80'
                  }`}
                />
                <span className={`truncate ${isCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-mono rounded-md font-semibold shrink-0 ml-1 ${isCollapsed ? 'lg:hidden' : ''} ${
                    item.badgeColor ||
                    (isActive
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      : 'bg-zinc-800 text-zinc-400')
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Banner & PWA button */}
      <div className={`p-4 border-t border-amber-500/15 space-y-3 bg-zinc-950/80 pb-20 lg:pb-4 ${isCollapsed ? 'lg:hidden' : ''}`}>
        {isPwaInstallable && (
          <button
            onClick={installPwa}
            className="w-full py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Instalar Aureum App (PWA)</span>
          </button>
        )}

        <div className="p-3 rounded-xl bg-gradient-to-br from-zinc-900 to-amber-950/30 border border-amber-500/20 text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-[11px] mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Aureum Intelligence Active
          </div>
          <p className="text-[11px] text-zinc-400 leading-snug">
            Gestão patrimonial com consolidação de risco e liquidez.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Permanent Sidebar */}
      <aside className={`hidden lg:flex flex-shrink-0 h-screen sticky top-0 z-30 transition-[width] duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={closeMobileMenu}
          className="lg:hidden fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Mobile Off-Canvas Drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
