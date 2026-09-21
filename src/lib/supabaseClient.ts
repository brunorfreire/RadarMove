import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Variáveis de ambiente fornecidas pelo Vite com fallback para as chaves do projeto RadarMove
const DEFAULT_SUPABASE_URL = 'https://nekjixiplijorvqaeini.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_QB3EuqGRIUQEfMEpuok7GQ_P-gyj9oP';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

/**
 * Verifica se as variáveis de ambiente necessárias para o Supabase foram preenchidas.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-anon-public-key') &&
    !supabaseUrl.includes('placeholder.supabase.co')
  );
};

/**
 * Instância global do cliente Supabase para o RadarMove.
 * Se as variáveis ainda não estiverem configuradas, cria com placeholders seguros
 * para evitar erros de inicialização durante o desenvolvimento.
 */
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured() ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Testa a conexão com o banco do Supabase e retorna o status detalhado.
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  totalTemplates?: number;
  error?: any;
}> {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      message: 'Variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configuradas no .env.',
    };
  }

  try {
    const { data, count, error } = await supabase
      .from('desafios_templates')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return {
        connected: false,
        message: `Falha ao conectar: ${error.message} (Código: ${error.code})`,
        error,
      };
    }

    return {
      connected: true,
      message: 'Conexão com o Supabase estabelecida com sucesso!',
      totalTemplates: count ?? 0,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Erro de rede ao contactar o Supabase: ${err?.message || err}`,
      error: err,
    };
  }
}
