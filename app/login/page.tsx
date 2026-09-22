'use client'

import { useState, useActionState, useTransition } from 'react'
import { login, signup, signInWithGoogle, type AuthState } from './actions'
import { Activity, Lock, Mail, User, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState<string | null>(null)

  // useActionState gerencia o estado da Server Action (React 19 / Next.js App Router)
  const [loginState, loginAction, isLoginPending] = useActionState<AuthState, FormData>(login, {})
  const [signupState, signupAction, isSignupPending] = useActionState<AuthState, FormData>(signup, {})

  const isPending = isLoginPending || isSignupPending || googleLoading
  const currentState = isSignUp ? signupState : loginState

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true)
      setGoogleError(null)
      const res = await signInWithGoogle()
      if (res?.error) {
        setGoogleError(res.error)
      }
    } catch (err: any) {
      // O redirect lança NEXT_REDIRECT normalmente no Next.js
      if (err?.message?.includes('NEXT_REDIRECT')) {
        return
      }
      setGoogleError(err?.message || 'Falha ao conectar com o Google.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-zinc-100 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Decorativo com gradientes sutis */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card Principal */}
      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-8 shadow-2xl relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3">
            <Activity className="w-6 h-6 text-zinc-950 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
            Radar<span className="text-emerald-400">Move</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Gestão inteligente de alunos e desafios para Personal Trainers
          </p>
        </div>

        {/* Toggle Login / Cadastro */}
        <div className="grid grid-cols-2 bg-zinc-950/60 p-1 rounded-xl border border-zinc-800 mb-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`py-2 rounded-lg transition-all ${
              !isSignUp
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`py-2 rounded-lg transition-all ${
              isSignUp
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Notificações de Erro e Sucesso */}
        {(currentState?.error || googleError) && (
          <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{googleError || currentState?.error}</span>
          </div>
        )}

        {currentState?.success && (
          <div className="mb-5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{currentState.success}</span>
          </div>
        )}

        {/* Botão de Login Social com Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isPending}
          className="w-full py-2.5 px-4 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-100 font-medium text-sm flex items-center justify-center gap-3 shadow-md hover:border-zinc-600 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {googleLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-zinc-300" />
              <span>Conectando com o Google...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continuar com o Google</span>
            </>
          )}
        </button>

        {/* Divisor Visual */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative bg-zinc-900/90 px-3 text-[11px] uppercase tracking-wider text-zinc-400">
            ou com e-mail
          </div>
        </div>

        {/* Formulário com Server Action */}
        <form action={isSignUp ? signupAction : loginAction} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="nome">
                Seu Nome Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required={isSignUp}
                  placeholder="Ex: Treinador Rodrigo Silva"
                  className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5" htmlFor="email">
              E-mail Profissional
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="seu.email@exemplo.com"
                className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-zinc-400" htmlFor="password">
                Senha
              </label>
              {!isSignUp && (
                <a href="#recuperar" className="text-xs text-emerald-400/80 hover:text-emerald-400 transition-colors">
                  Esqueceu a senha?
                </a>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                placeholder="••••••••"
                className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </>
            ) : isSignUp ? (
              <>
                Criar Minha Conta
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Acessar Plataforma
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Rodapé Seguro */}
        <p className="text-[11px] text-zinc-500 text-center mt-6">
          Protegido com criptografia ponta a ponta via Supabase Auth
        </p>
      </div>
    </div>
  )
}
