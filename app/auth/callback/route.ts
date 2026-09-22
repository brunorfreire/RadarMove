import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://nekjixiplijorvqaeini.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_QB3EuqGRIUQEfMEpuok7GQ_P-gyj9oP',
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
            } catch {}
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data?.user) {
      // Garante que o profissional exista na tabela 'profissionais'
      try {
        await supabase.from('profissionais').upsert(
          {
            id: data.user.id,
            nome_profissional: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Treinador',
            nome_empresa: 'RadarMove Studio',
            telefone: data.user.user_metadata?.phone || '',
            avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
            cor_primaria: '#10b981',
          },
          { onConflict: 'id' }
        )
      } catch (err) {
        console.warn('Aviso: Perfil do profissional via Google OAuth será sincronizado posteriormente:', err)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-failed`)
}
