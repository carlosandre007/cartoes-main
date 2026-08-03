import React, { useEffect, useState } from 'react';
import { FinancialProvider, useFinancial } from './context/FinancialContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './components/LoginView';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { NotificationDrawer } from './components/NotificationDrawer';
import { NewTransactionModal } from './components/NewTransactionModal';
import { PayInstallmentModal } from './components/PayInstallmentModal';

// Views
import { DashboardView } from './views/DashboardView';
import { FinancialFlowView } from './views/FinancialFlowView';
import { CentralFinanceView } from './views/CentralFinanceView';
import { CardsView } from './views/CardsView';
import { FixedCostsView } from './views/FixedCostsView';
import { CreditPortfolioView } from './views/CreditPortfolioView';
import { BankAccountsView } from './views/BankAccountsView';
import { CalendarView } from './views/CalendarView';
import { FinancialHealthView } from './views/FinancialHealthView';
import { QuittatementPlanningView } from './views/QuittatementPlanningView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';

const MainContent: React.FC = () => {
  const { activeView, isNewTransactionOpen, openNewTransactionModal, closeNewTransactionModal } = useFinancial();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') openNewTransactionModal();
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'fluxo':
        return <FinancialFlowView />;
      case 'central':
        return <CentralFinanceView />;
      case 'cartoes':
        return <CardsView />;
      case 'custos-fixos':
        return <FixedCostsView />;
      case 'credito':
        return <CreditPortfolioView />;
      case 'bancos':
        return <BankAccountsView />;
      case 'calendario':
        return <CalendarView />;
      case 'saude':
        return <FinancialHealthView />;
      case 'quitacao':
        return <QuittatementPlanningView />;
      case 'relatorios':
        return <ReportsView />;
      case 'configuracoes':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Sidebar Navigation (Responsive Desktop + Mobile Drawer) */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <Navbar onOpenNotifications={() => setIsNotificationsOpen(true)} />

        {/* Dynamic View Canvas with bottom padding for Mobile Navigation */}
        <main className="flex-1 overflow-y-auto bg-zinc-950 custom-scrollbar pb-24 lg:pb-6">
          {renderView()}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav />
      </div>

      {/* Global Drawers & Modals */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
      <NewTransactionModal isOpen={isNewTransactionOpen} onClose={closeNewTransactionModal} />
      <PayInstallmentModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

const AuthenticatedApp: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-amber-400 font-mono text-xs">CARREGANDO SESSÃO...</div>;
  }
  if (!user) return <LoginView />;
  return <FinancialProvider><MainContent /></FinancialProvider>;
};
