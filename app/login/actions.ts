'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export type AuthState = {
  error?: string
  success?: string
}

/**
 * Server Action para autenticação com e-mail e senha.
 */
export async function login(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Por favor, informe seu e-mail e senha.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message === 'Invalid login credentials' 
      ? 'E-mail ou senha inválidos.' 
      : error.message 
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

/**
 * Server Action para cadastro de novos Personal Trainers.
 */
export async function signup(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nome = formData.get('nome') as string

  if (!email || !password) {
    return { error: 'Por favor, preencha todos os campos obrigatórios.' }
  }

  if (password.length < 6) {
    return { error: 'A senha deve conter no mínimo 6 caracteres.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nome: nome || 'Personal Trainer',
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { 
    success: 'Conta criada com sucesso! Verifique seu e-mail para confirmação ou faça login.' 
  }
}

/**
 * Server Action para iniciar o fluxo OAuth com o Google.
 */
export async function signInWithGoogle(): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()

  // Prioriza a URL pública do ambiente ou localhost em dev
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data?.url) {
    redirect(data.url)
  }

  return { error: 'Não foi possível gerar a URL de autenticação com o Google.' }
}

