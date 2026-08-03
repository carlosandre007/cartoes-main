import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginView: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [createMode, setCreateMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || password.length < 6 || (createMode && !name.trim())) {
      setMessage({ text: 'Preencha os campos corretamente. A senha deve ter ao menos 6 caracteres.', error: true });
      return;
    }
    setBusy(true);
    setMessage(null);
    const result = createMode ? await signUp(email, password, name) : await signIn(email, password);
    setBusy(false);
    if (!result.success || result.message) setMessage({ text: result.message || 'Não foi possível continuar.', error: !result.success });
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-zinc-950 shadow-2xl shadow-amber-950/30 overflow-hidden">
        <div className="p-6 sm:p-8 bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950/40 border-b border-amber-500/20 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center shadow-lg mb-4">
            <Sparkles className="w-7 h-7 text-zinc-950" />
          </div>
          <div className="text-[11px] font-mono text-amber-400 font-bold tracking-[0.25em]">AUREUM</div>
          <h1 className="text-xl font-black mt-1">Central Financeira</h1>
          <p className="text-xs text-zinc-400 mt-2">{createMode ? 'Crie seu acesso protegido' : 'Entre para acessar seus dados financeiros'}</p>
        </div>

        <form onSubmit={submit} className="p-6 sm:p-8 space-y-4">
          {createMode && <label className="block"><span className="text-xs text-zinc-400">Nome</span><div className="relative mt-1"><UserRound className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" /><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="w-full pl-10 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-sm outline-none" /></div></label>}
          <label className="block"><span className="text-xs text-zinc-400">E-mail</span><div className="relative mt-1"><Mail className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="w-full pl-10 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-sm outline-none" /></div></label>
          <label className="block"><span className="text-xs text-zinc-400">Senha</span><div className="relative mt-1"><LockKeyhole className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={createMode ? 'new-password' : 'current-password'} className="w-full pl-10 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl text-sm outline-none" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-2.5 text-zinc-500">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></label>

          {message && <div className={`p-3 rounded-xl border text-xs ${message.error ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>{message.text}</div>}

          <button disabled={busy} className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-zinc-950 font-black text-sm disabled:opacity-60 flex items-center justify-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {createMode ? 'Criar acesso' : 'Entrar'}
          </button>
          <button type="button" onClick={() => { setCreateMode((value) => !value); setMessage(null); }} className="w-full text-xs text-amber-400 hover:text-amber-300">
            {createMode ? 'Já tenho cadastro' : 'Criar primeiro acesso'}
          </button>
        </form>
      </div>
    </main>
  );
};
