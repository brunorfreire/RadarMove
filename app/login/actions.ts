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
