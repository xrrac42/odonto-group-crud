// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
export const SUPABASE_ANON_KEY = supabaseKey;
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

const JWT_STORAGE_KEY = 'supabase-jwt';
const JWT_EXPIRY_KEY = 'supabase-jwt-expiry';

/**
 * Validar se JWT ainda é válido (não expirou)
 * JWTs são válidos por ~3600s (1h) após o login
 */
function isJWTValid(expiryTime: number | null): boolean {
  if (!expiryTime) return false;
  const now = Date.now();
  // Adiciona buffer de 5min antes da expiração
  return now < (expiryTime - 5 * 60 * 1000);
}

/**
 * Redirecionar para login quando sessão expira
 */
export function redirectToLogin() {
  console.warn('🔴 Sessão expirada! Redirecionando para login...');
  clearJWTCache();
  window.location.href = '/login';
}

/**
 * Obter JWT do usuário atualmente autenticado
 * Usado para autenticar requisições ao backend Go
 * 
 * Estratégia:
 * 1. Tenta ler do localStorage com validação de expiração
 * 2. Se expirado, tenta fazer refresh da sessão com timeout
 * 3. Se timeout, redireciona para login
 * 4. Se sucesso, salva novo token e expiry
 */
export async function getUserJWT(): Promise<string | null> {
  try {
    // ✅ PRIMEIRA TENTATIVA: localStorage (rápido)
    console.log('🚀 Tentando ler JWT do localStorage...');
    const cachedJWT = localStorage.getItem(JWT_STORAGE_KEY);
    const cachedExpiry = localStorage.getItem(JWT_EXPIRY_KEY);
    
    if (cachedJWT && isJWTValid(cachedExpiry ? parseInt(cachedExpiry) : null)) {
      console.log('✅ JWT válido no cache!');
      return cachedJWT;
    }
    
    if (cachedJWT && !isJWTValid(cachedExpiry ? parseInt(cachedExpiry) : null)) {
      console.warn('⏰ JWT expirou, tentando refresh...');
    }

    // ✅ SEGUNDA TENTATIVA: getSession() com timeout
    console.log('🔑 Tentando getSession() com timeout...');
    const sessionPromise = supabase.auth.getSession();
    
    const sessionWithTimeout = Promise.race([
      sessionPromise,
      new Promise((_, reject) => 
        setTimeout(() => {
          console.warn('⏱️ getSession timeout (2s)');
          reject(new Error('getSession timeout'));
        }, 2000)
      )
    ]);
    
    const { data: { session }, error } = await sessionWithTimeout as any;
    
    if (error || !session?.access_token) {
      console.error('❌ Erro ao obter sessão:', error?.message || 'Sem sessão');
      // Se tem JWT no cache, tenta usar mesmo que expirado
      if (cachedJWT) {
        console.warn('⚠️ Usando JWT expirado do cache por falta de conexão');
        return cachedJWT;
      }
      // Caso contrário, redireciona
      redirectToLogin();
      return null;
    }
    
    // Calcular expiração (geralmente 3600s = 1h)
    const expiryTime = Date.now() + (3600 * 1000);
    
    // Salva no localStorage para próximas chamadas
    console.log('💾 Salvando JWT no localStorage...');
    localStorage.setItem(JWT_STORAGE_KEY, session.access_token);
    localStorage.setItem(JWT_EXPIRY_KEY, expiryTime.toString());
    console.log('✅ JWT obtido, cacheado e validado com sucesso');
    return session.access_token;
  } catch (err) {
    console.error('❌ Erro crítico ao obter JWT:', err);
    redirectToLogin();
    return null;
  }
}

/**
 * Limpar JWT do cache (chamar ao fazer logout)
 */
export function clearJWTCache() {
  console.log('🧹 Limpando JWT do cache');
  localStorage.removeItem(JWT_STORAGE_KEY);
  localStorage.removeItem(JWT_EXPIRY_KEY);
}

/**
 * Fetch interceptor que automaticamente:
 * 1. Adiciona JWT ao Authorization header
 * 2. Redireciona para login em 401
 * 3. Valida token antes de fazer request
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const jwt = await getUserJWT();
  if (!jwt) {
    throw new Error('Sessão expirada');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${jwt}`);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Se é 401, sessão expirou
  if (response.status === 401) {
    console.warn('🔴 Resposta 401: Token inválido!');
    redirectToLogin();
    throw new Error('Sessão expirada');
  }

  return response;
}

// Função para limpar TODOS os channels com força bruta
export function forceCleanAllChannels() {
  console.log('🧹 LIMPEZA FORÇADA DE TODOS OS CHANNELS');
  try {
    const channels = supabase.getChannels();
    console.log(`📡 Channels ativos antes da limpeza: ${channels.length}`);
    
    channels.forEach((channel, index) => {
      console.log(`  ${index + 1}. ${channel.topic} (state: ${channel.state})`);
    });
    
    supabase.removeAllChannels();
    
    const afterChannels = supabase.getChannels();
    console.log(`✅ Channels após limpeza: ${afterChannels.length}`);
    
    return channels.length;
  } catch (err) {
    console.error('❌ Erro ao limpar channels:', err);
    return 0;
  }
}
