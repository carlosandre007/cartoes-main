import React from 'react';
import {
  Settings,
  User,
  Moon,
  Sun,
  ShieldCheck,
  Building2,
  Smartphone,
  Download,
  Lock,
  CheckCircle2,
  Database,
  Save,
  LogOut,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const SettingsView: React.FC = () => {
  const { isDarkMode, toggleDarkMode, isPwaInstallable, installPwa, bankAccounts } = useFinancial();
  const { user, profile, updateAccount, signOut } = useAuth();
  const [accountForm, setAccountForm] = React.useState({ name: '', phone: '', email: '', password: '' });
  const [accountMessage, setAccountMessage] = React.useState('');
  const [savingAccount, setSavingAccount] = React.useState(false);

  React.useEffect(() => {
    setAccountForm({
      name: profile?.nomeCompleto || '',
      phone: profile?.telefone || '',
      email: user?.email || '',
      password: '',
    });
  }, [profile, user]);

  const handleAccountSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingAccount(true);
    const result = await updateAccount(accountForm);
    setSavingAccount(false);
    setAccountMessage(result.message || (result.success ? 'Dados atualizados.' : 'Não foi possível atualizar.'));
    if (result.success) setAccountForm((current) => ({ ...current, password: '' }));
  };

  return (
    <div className="p-6 space-y-6 text-zinc-100 font-sans">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/40 border border-amber-500/30 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
            AUREUM CONFIGURAÇÕES & PREFERÊNCIAS
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-zinc-100">Configurações do Sistema</h2>
        <p className="text-xs text-zinc-400">
          Ajustes de interface, modo offline PWA, conexão de dados e segurança.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Profile & Theme */}
        <div className="p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-xl space-y-5">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <User className="w-4 h-4 text-amber-400" /> Perfil do Cliente & Interface
          </h3>

          <form onSubmit={handleAccountSubmit} className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3 text-xs">
            <label className="block"><span className="text-zinc-400">Nome</span><input value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} className="mt-1 w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 outline-none focus:border-amber-500" /></label>
            <label className="block"><span className="text-zinc-400">Telefone</span><input value={accountForm.phone} onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })} className="mt-1 w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 outline-none focus:border-amber-500" /></label>
            <label className="block"><span className="text-zinc-400">E-mail</span><input type="email" value={accountForm.email} onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })} className="mt-1 w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 outline-none focus:border-amber-500" /></label>
            <label className="block"><span className="text-zinc-400">Nova senha (opcional)</span><input type="password" minLength={6} value={accountForm.password} onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })} className="mt-1 w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 outline-none focus:border-amber-500" /></label>
            {accountMessage && <p className="text-amber-300">{accountMessage}</p>}
            <div className="flex gap-2">
              <button disabled={savingAccount} className="flex-1 px-3 py-2 bg-amber-500 text-zinc-950 font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"><Save className="w-4 h-4" /> Salvar</button>
              <button type="button" onClick={() => void signOut()} className="px-3 py-2 bg-zinc-950 border border-red-500/30 text-red-400 font-bold rounded-xl flex items-center gap-2"><LogOut className="w-4 h-4" /> Sair</button>
            </div>
          </form>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-zinc-200 block">Tema da Aplicação</span>
                <span className="text-[11px] text-zinc-400">Alternar entre Dark Graphite/Gold e Light</span>
              </div>
              <button
                onClick={toggleDarkMode}
                className="px-3 py-1.5 bg-zinc-950 border border-amber-500/30 text-amber-300 font-bold rounded-xl flex items-center gap-2 cursor-pointer"
              >
                {isDarkMode ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                <span>{isDarkMode ? 'Escuro (Grafite/Ouro)' : 'Claro'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* PWA & Mobile App */}
        <div className="p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-xl space-y-5">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-400" /> PWA Modo Offline & App
          </h3>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-zinc-200 block">Aplicativo Instalável (PWA)</span>
                <span className="text-[11px] text-zinc-400">
                  Mantém a interface disponível offline e sincroniza quando houver conexão.
                </span>
              </div>
              {isPwaInstallable ? (
                <button
                  onClick={installPwa}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-extrabold rounded-xl flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Instalar
                </button>
              ) : (
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-bold rounded-lg text-[10px]">
                  Disponível pelo navegador
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-zinc-200 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-amber-400" /> Supabase Backend & RLS
                </span>
                <span className="text-[11px] text-zinc-400">
                  {isSupabaseConfigured
                    ? 'Conectado e sincronizado com Supabase PostgreSQL'
                    : 'Supabase não configurado neste ambiente'}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 font-mono font-bold rounded-lg text-[10px] ${
                  isSupabaseConfigured
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                {isSupabaseConfigured ? 'Ativo' : 'Pronto'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-zinc-200 block">Proteção de acesso</span>
                <span className="text-[11px] text-zinc-400">Será habilitada com a etapa de autenticação</span>
              </div>
              <span className="text-zinc-400 font-mono font-bold">Pendente</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contas cadastradas */}
      <div className="p-6 rounded-2xl bg-zinc-950/90 border border-amber-500/20 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-400" />
          Contas bancárias cadastradas
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {bankAccounts.map((b) => (
            <div
              key={b.id}
              className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex justify-between items-center"
            >
              <div>
                <div className="font-bold text-zinc-200">{b.banco}</div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  {b.ativa ? 'Conta ativa' : 'Conta inativa'}
                </div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
