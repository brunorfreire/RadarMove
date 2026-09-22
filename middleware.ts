import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRÍTICO: Sempre use getUser() em vez de getSession() para validar o token JWT
  // no servidor com garantia criptográfica contra sessões forjadas.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/alunos') || 
    pathname.startsWith('/leads') || 
    pathname.startsWith('/desafios') || 
    pathname.startsWith('/perfil') || 
    pathname.startsWith('/assinatura')

  // Redireciona usuários não autenticados para a tela de login
  if (!user && isProtectedRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redireciona usuários já autenticados tentando acessar /login de volta para /dashboard
  if (user && pathname === '/login') {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Aplica o middleware a todas as rotas da aplicação, exceto:
     * - _next/static (arquivos estáticos de build)
     * - _next/image (imagens otimizadas pelo Next.js)
     * - favicon.ico (ícone do navegador)
     * - arquivos estáticos de imagem/áudio/fonte (svg, png, jpg, webp, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
