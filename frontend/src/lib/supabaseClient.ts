// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
export const SUPABASE_ANON_KEY = supabaseKey;

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
