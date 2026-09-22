'use client'

import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { 
  User as UserIcon, 
  CreditCard, 
  LogOut, 
  ChevronUp, 
  ShieldCheck, 
  Sparkles,
  ExternalLink 
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface UserProfileDropdownProps {
  collapsed?: boolean
}

export function UserProfileDropdown({ collapsed = false }: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('Treinador')
  const [initials, setInitials] = useState<string>('TR')
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadUserData() {
      try {
        const { data } = await supabase.auth.getUser()
        const user = data?.user
        
        if (user) {
          setUserEmail(user.email || null)
          
          // Extrai o nome dos metadados ou do perfil
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
      } catch (error) {
        console.error('Erro ao carregar usuário autenticado:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()

    // Ouve alterações no estado da autenticação em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
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

  // Fecha o dropdown ao clicar fora
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

  const navigateTo = (path: string) => {
    setIsOpen(false)
    window.location.href = path
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Botão de Trigger do Perfil */}
      <button
        type="button"
        id="user-profile-menu-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={`w-full group flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-[#031c16]/80 p-2.5 text-left transition-all hover:border-emerald-500/40 hover:bg-[#04241d] active:scale-[0.99] cursor-pointer ${
          collapsed ? 'justify-center p-2' : ''
        }`}
      >
        <div className="relative flex-shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs tracking-wider shadow-sm">
            {loading ? '...' : initials}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#021813]" />
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 min-w-0">
                <p className="truncate text-xs font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                  {userName}
                </p>
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
              </div>
              <ChevronUp 
                className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-emerald-400' : ''
                }`} 
              />
            </div>
            <p className="truncate text-[11px] text-zinc-400 font-normal">
              {userEmail || 'Plano Pro Ativo'}
            </p>
          </div>
        )}
      </button>

      {/* Menu Dropdown Suspenso com Animação */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute bottom-full mb-2 z-50 rounded-2xl border border-emerald-500/30 bg-[#041f18]/95 p-1.5 shadow-2xl backdrop-blur-2xl ${
              collapsed ? 'left-0 w-64' : 'left-0 right-0'
            }`}
          >
            {/* Header de Identificação do Usuário no Dropdown */}
            <div className="px-3 py-2.5 border-b border-emerald-500/15 mb-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Personal Trainer
              </p>
              <p className="text-xs font-bold text-white truncate mt-0.5">{userName}</p>
              {userEmail && (
                <p className="text-[11px] text-zinc-400 truncate">{userEmail}</p>
              )}
            </div>

            {/* Itens do Menu */}
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => navigateTo('/perfil')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-200 rounded-lg hover:bg-emerald-500/15 hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <UserIcon className="w-4 h-4 text-emerald-400" />
                  <span>Minha Conta / Perfil</span>
                </div>
                <ExternalLink className="w-3 h-3 text-zinc-500" />
              </button>

              <button
                type="button"
                onClick={() => navigateTo('/assinatura')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-200 rounded-lg hover:bg-cyan-500/15 hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span>Assinatura</span>
                </div>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                  PRO
                </span>
              </button>
            </div>

            <div className="border-t border-emerald-500/15 my-1" />

            {/* Opção Sair (Sign Out) */}
            <button
              type="button"
              id="user-signout-btn"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 rounded-lg hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
