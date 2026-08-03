import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string | null;
  nomeCompleto: string;
  telefone: string;
  avatarUrl: string;
}

interface AuthResult { success: boolean; message?: string }

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, name: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updateAccount: (data: { name: string; phone: string; email: string; password?: string }) => Promise<AuthResult>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const messageFor = (message: string) => {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) return 'E-mail ou senha inválidos.';
  if (normalized.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (normalized.includes('user already registered')) return 'Este e-mail já possui cadastro.';
  if (normalized.includes('password should be')) return 'A senha deve possuir pelo menos 6 caracteres.';
  return message;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (currentUser: User | null) => {
    if (!currentUser) { setProfile(null); return; }
    const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle();
    setProfile({
      id: currentUser.id,
      email: currentUser.email || data?.email || null,
      nomeCompleto: data?.nome_completo || currentUser.user_metadata?.nome_completo || '',
      telefone: data?.telefone || '',
      avatarUrl: data?.avatar_url || '',
    });
  };

  const refreshProfile = async () => loadProfile(user);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setUser(data.session?.user || null);
      await loadProfile(data.session?.user || null);
      if (active) setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user || null;
      setUser(nextUser);
      void loadProfile(nextUser);
      setLoading(false);
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error ? { success: false, message: messageFor(error.message) } : { success: true };
  };

  const signUp = async (email: string, password: string, name: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { nome_completo: name.trim() } },
    });
    if (error) return { success: false, message: messageFor(error.message) };
    return data.session
      ? { success: true }
      : { success: true, message: 'Cadastro criado. Confirme o e-mail para entrar.' };
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  const updateAccount = async ({ name, phone, email, password }: { name: string; phone: string; email: string; password?: string }): Promise<AuthResult> => {
    if (!user) return { success: false, message: 'Sessão expirada.' };
    const authChanges: { email?: string; password?: string; data?: Record<string, string> } = { data: { nome_completo: name } };
    if (email.trim() && email.trim() !== user.email) authChanges.email = email.trim();
    if (password) authChanges.password = password;
    const { error: authError } = await supabase.auth.updateUser(authChanges);
    if (authError) return { success: false, message: messageFor(authError.message) };
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      email: email.trim(),
      nome_completo: name.trim(),
      telefone: phone.trim(),
    });
    if (profileError) return { success: false, message: profileError.message };
    await loadProfile({ ...user, email: email.trim() } as User);
    return { success: true, message: authChanges.email ? 'Dados salvos. Confirme o novo e-mail.' : 'Dados salvos com sucesso.' };
  };

  return <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, updateAccount, refreshProfile }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
};
