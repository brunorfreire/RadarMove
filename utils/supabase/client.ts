import { createBrowserClient } from '@supabase/ssr'

/**
 * Cria o cliente Supabase para Client Components (navegador).
 * Utiliza as credenciais públicas do ambiente.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
