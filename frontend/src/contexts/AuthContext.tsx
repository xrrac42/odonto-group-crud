// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Profile, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(false);

  // Verificar sessão ao montar
  useEffect(() => {
    checkSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const checkSession = async () => {
    // Evitar múltiplas chamadas simultâneas
    if (isCheckingSession) {
      console.log('⏭️ checkSession já está rodando, pulando...');
      return;
    }
    
    try {
      console.log('🔐 Iniciando checkSession...');
      setIsCheckingSession(true);
      setLoading(true);
      
      console.log('📡 Buscando sessão do Supabase...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      console.log('📦 Sessão recebida:', session ? 'Sim' : 'Não', sessionError ? `Erro: ${sessionError.message}` : '');

      // Ignorar erros de abort
      if (sessionError) {
        if (sessionError.message?.includes('aborted') || sessionError.name === 'AbortError') {
          console.log('⚠️ Erro de abort ignorado');
          return;
        }
        throw sessionError;
      }

      if (session?.user) {
        console.log('👤 Carregando perfil do usuário:', session.user.id);
        await loadProfile(session.user.id);
      } else {
        console.log('❌ Sem sessão, limpando user');
        setUser(null);
      }
      console.log('✅ checkSession concluído');
    } catch (err) {
      // Ignorar erros de abort silenciosamente
      if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
        console.log('⚠️ AbortError capturado e ignorado');
        return;
      }
      if (err && typeof err === 'object' && 'message' in err) {
        const error = err as { message: string };
        if (error.message?.includes('aborted')) {
          console.log('⚠️ Mensagem de abort ignorada');
          return;
        }
      }
      console.error('❌ Error checking session:', err);
      // Não mostrar erro de sessão para o usuário
      setUser(null);
    } finally {
      console.log('🏁 Finalizando checkSession, setLoading(false)');
      setLoading(false);
      setIsCheckingSession(false);
    }
  };

  const loadProfile = async (userId: string) => {
    try {
      console.log('👤 loadProfile iniciado para:', userId);
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('📊 Profile recebido:', data ? 'Sim' : 'Não', queryError ? `Erro: ${queryError.message}` : '');

      if (queryError) {
        // Ignorar erros de abort - acontecem durante desenvolvimento
        if (queryError.message?.includes('aborted')) {
          console.log('⚠️ Query abortada, ignorando');
          return;
        }
        throw queryError;
      }
      
      if (!data) {
        throw new Error('Profile not found');
      }
      
      console.log('✅ User setado:', data.nome);
      setUser(data as Profile);
      setError(null);
    } catch (err) {
      // Ignorar erros de abort
      if (err && typeof err === 'object' && 'message' in err) {
        const error = err as { message: string };
        if (error.message?.includes('aborted')) {
          console.log('⚠️ Erro de abort em loadProfile');
          return;
        }
      }
      console.error('❌ Erro ao carregar perfil:', err);
      setError('Erro ao carregar perfil do usuário');
      setUser(null);
    }
  };

  // Login com CPF e senha
  const loginWithCPF = async (cpf: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      // Converter CPF para email fictício
      const email = `${cpf}@sistema.local`;

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Carregar perfil imediatamente
      if (data?.user) {
        await loadProfile(data.user.id);
      }
    } catch (err) {
      // Ignorar erros de abort
      if (err && typeof err === 'object' && 'name' in err && (err as any).name === 'AbortError') {
        return;
      }
      const message = err instanceof Error ? err.message : 'Erro ao fazer login';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      
      // Limpar estado local imediatamente
      setUser(null);
      setError(null);
      
      // Fazer logout no servidor
      await supabase.auth.signOut();
    } catch (err) {
      // Se houver erro no logout do servidor, já saímos localmente
      console.error('Error during logout:', err);
      setUser(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    loginWithCPF,
    logout,
    isAdmin: user?.role === 'admin',
    isOperator: user?.role === 'operator',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  return useContext(AuthContext);
}
