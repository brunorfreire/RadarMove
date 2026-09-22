'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  User as UserIcon, 
  CreditCard, 
  LogOut, 
  ChevronDown, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  Activity,
  Bell
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface HeaderProps {
  initialUserName?: string
  initialUserEmail?: string
}

export function Header({ initialUserName, initialUserEmail }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(initialUserEmail || null)
  const [userName, setUserName] = useState<string>(initialUserName || 'Treinador')
  const [initials, setInitials] = useState<string>('TR')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUserEmail(user.email || null)
        
        const metadataName = user.user_metadata?.nome || user.user_metadata?.full_name
        const displayName = metadataName || (user.email ? user.email.split('@')[0] : 'Treinador')
        setUserName(displayName)

        // Calcula as iniciais
        const nameParts = displayName.trim().split(' ')
        if (nameParts.length >= 2) {
          setInitials(`${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase())
        } else {
          setInitials(displayName.slice(0, 2).toUpperCase())
        }
      }
    }

    loadUserData()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email || null)
        const name = session.user.user_metadata?.nome || (session.user.email ? session.user.email.split('@')[0] : 'Treinador')
        setUserName(name)
      } else {
        setUserEmail(null)
        setUserName('Treinador')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <header className="sticky top-0 z-40 flex h-20 w-full items-center justify-between border-b border-emerald-500/15 bg-[#090d16]/85 px-6 backdrop-blur-xl select-none">
      {/* Brand & Título */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Activity className="w-5 h-5 text-zinc-950 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-1.5">
            Radar<span className="text-emerald-400">Move</span>
          </h1>
          <p className="text-[11px] text-zinc-400">Plataforma de Retenção e Alunos</p>
        </div>
      </div>

      {/* Ações e Dropdown do Perfil */}
      <div className="flex items-center gap-4">
        {/* Notificações */}
        <button
          type="button"
          aria-label="Notificações"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors cursor-pointer"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-400" />
        </button>

        {/* Dropdown Menu do Usuário */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-haspopup="menu"
            className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2 pr-3 hover:border-emerald-500/40 hover:bg-zinc-900 transition-all cursor-pointer"
          >
            {/* Avatar com Iniciais */}
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#090d16]" />
            </div>

            {/* Informações do Treinador */}
            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-zinc-200">{userName}</span>
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
              </div>
              <p className="text-[11px] text-zinc-400 truncate max-w-[140px]">
                {userEmail || 'Treinador'}
              </p>
            </div>

            <ChevronDown 
              className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-emerald-400' : ''
              }`} 
            />
          </button>

          {/* Menu Dropdown Suspenso */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-zinc-800 bg-[#0d131f]/95 p-1.5 shadow-2xl backdrop-blur-2xl z-50"
              >
                {/* Cabeçalho do Dropdown */}
                <div className="px-3 py-2 border-b border-zinc-800/80 mb-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Conta Ativa
                  </p>
                  <p className="text-xs font-bold text-white truncate">{userName}</p>
                  {userEmail && (
                    <p className="text-[11px] text-zinc-400 truncate">{userEmail}</p>
                  )}
                </div>

                {/* Itens Solicitados */}
                <div className="space-y-0.5">
                  <a
                    href="/perfil"
                    className="flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-300 rounded-lg hover:bg-emerald-500/15 hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <UserIcon className="w-4 h-4 text-emerald-400" />
                      <span>Minha Conta / Perfil</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </a>

                  <a
                    href="/assinatura"
                    className="flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-300 rounded-lg hover:bg-cyan-500/15 hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-4 h-4 text-cyan-400" />
                      <span>Assinatura</span>
                    </div>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                      PRO
                    </span>
                  </a>
                </div>

                <div className="border-t border-zinc-800/80 my-1" />

                {/* Ação de Logout */}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 rounded-lg hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
