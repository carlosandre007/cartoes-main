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
  Camera,
  Trash2,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const SettingsView: React.FC = () => {
  const { isDarkMode, toggleDarkMode, isPwaInstallable, installPwa, bankAccounts } = useFinancial();
  const { user, profile, updateAccount, updateAvatar, signOut } = useAuth();
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
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

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setAccountMessage('Selecione um arquivo de imagem.'); return; }
    if (file.size > 10 * 1024 * 1024) { setAccountMessage('A imagem deve ter no máximo 10 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = async () => {
        const size = 320;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const context = canvas.getContext('2d');
        if (!context) return;
        const crop = Math.min(image.width, image.height);
        context.drawImage(image, (image.width - crop) / 2, (image.height - crop) / 2, crop, crop, 0, 0, size, size);
        const result = await updateAvatar(canvas.toDataURL('image/jpeg', 0.82));
        setAccountMessage(result.message || 'Foto atualizada.');
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
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
            <div className="flex flex-col sm:flex-row items-center gap-4 pb-3 border-b border-zinc-800">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-1 shadow-lg shrink-0">
                {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="Foto de perfil" className="w-full h-full rounded-full object-cover bg-zinc-950" /> : <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center"><User className="w-9 h-9 text-amber-400" /></div>}
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <strong className="text-sm text-zinc-100 block">Foto de perfil</strong>
                <p className="text-[11px] text-zinc-400">JPG, PNG ou WEBP. A imagem será ajustada automaticamente.</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  <button type="button" onClick={() => avatarInputRef.current?.click()} className="px-3 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold rounded-xl flex items-center gap-2"><Camera className="w-4 h-4" /> Adicionar foto</button>
                  {profile?.avatarUrl && <button type="button" onClick={async () => { const result = await updateAvatar(''); setAccountMessage(result.message || 'Foto removida.'); }} className="px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 font-bold rounded-xl flex items-center gap-2"><Trash2 className="w-4 h-4" /> Remover</button>}
                </div>
              </div>
            </div>
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
