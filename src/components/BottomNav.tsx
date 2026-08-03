import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  Calculator,
  Menu,
  Plus,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { ViewTab } from '../types';

export const BottomNav: React.FC = () => {
  const { activeView, setActiveView, toggleMobileMenu, openNewTransactionModal } = useFinancial();

  const primaryTabs: { id: ViewTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'fluxo', label: 'Fluxo', icon: ArrowLeftRight },
    { id: 'cartoes', label: 'Cartões', icon: CreditCard },
    { id: 'quitacao', label: 'Quitação', icon: Calculator },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-zinc-950/95 dark:bg-zinc-950/95 light:bg-slate-900/95 backdrop-blur-md border-t border-amber-500/20 px-2 py-1.5 flex items-center justify-around shadow-2xl transition-all duration-200">
      {primaryTabs.slice(0, 2).map((tab) => {
        const Icon = tab.icon;
        const isActive = activeView === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all min-w-[56px] min-h-[48px] ${
              isActive
                ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
            <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
          </button>
        );
      })}

      {/* Floating Center Action Button */}
      <button
        onClick={() => openNewTransactionModal()}
        className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 text-zinc-950 shadow-lg shadow-amber-500/30 border border-amber-300/40 transform -translate-y-2 active:scale-95 transition-all min-w-[48px] min-h-[48px]"
        aria-label="Novo Lançamento"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      {primaryTabs.slice(2, 4).map((tab) => {
        const Icon = tab.icon;
        const isActive = activeView === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all min-w-[56px] min-h-[48px] ${
              isActive
                ? 'text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-amber-400' : 'text-zinc-400'}`} />
            <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
          </button>
        );
      })}

      {/* Menu / Drawer Toggle */}
      <button
        onClick={toggleMobileMenu}
        className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all text-zinc-400 hover:text-zinc-200 min-w-[56px] min-h-[48px]"
        aria-label="Abrir Menu Completo"
      >
        <Menu className="w-5 h-5 mb-0.5 text-amber-400/80" />
        <span className="text-[10px] font-medium leading-tight text-amber-400/80">Menu</span>
      </button>
    </div>
  );
};
