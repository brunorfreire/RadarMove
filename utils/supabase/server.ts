import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cria o cliente Supabase para Server Components, Server Actions e Route Handlers.
 * Gerencia a leitura e escrita segura de cookies de autenticação (JWT / Refresh Tokens).
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Chamado a partir de um Server Component: cookies não podem ser gravados diretamente aqui,
            // mas o middleware.ts já garante a renovação e propagação da sessão no ciclo da requisição.
          }
        },
      },
    }
  )
}
