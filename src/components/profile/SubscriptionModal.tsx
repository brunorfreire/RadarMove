'use client'

import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  X, 
  CreditCard, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  Calendar,
  MessageSquare,
  Users,
  Database
} from 'lucide-react'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg rounded-2xl border border-emerald-500/25 bg-[#022c22] p-6 shadow-2xl text-zinc-100 z-10 overflow-hidden"
          >
            {/* Decorações */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 shadow-lg shadow-cyan-500/20">
                  <CreditCard className="h-5 w-5 text-zinc-950 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Minha Assinatura
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                      ATIVA
                    </span>
                  </h2>
                  <p className="text-xs text-emerald-200/70">
                    Gerencie seu plano e recursos no RadarMove
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-[#031d17] text-zinc-400 hover:text-white hover:border-emerald-500/50 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Card do Plano Atual */}
            <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-[#03241c] to-[#043327] p-4 mb-5 shadow-inner">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Plano Pro Ativo
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-white">R$ 49,90</span>
                    <span className="text-xs text-zinc-400">/mês</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/40">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Plano Pro Ativo
                  </span>
                  <p className="text-[10px] text-zinc-400 mt-1 flex items-center justify-end gap-1">
                    <Calendar className="h-3 w-3" />
                    Renovação: Automática
                  </p>
                </div>
              </div>

              {/* Lista de Vantagens Inclusas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-emerald-500/15 text-xs text-zinc-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Alunos Ilimitados</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Disparos WhatsApp Web</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>10 Desafios de Retenção</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Banco Supabase Dedicado</span>
                </div>
              </div>
            </div>

            {/* Informações de Suporte e Faturamento */}
            <div className="rounded-xl border border-emerald-500/15 bg-[#031d17] p-3 text-xs text-zinc-300 space-y-2 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Forma de Pagamento:</span>
                <span className="font-semibold text-white">Cartão de Crédito (•••• 4242)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Notas Fiscais:</span>
                <span className="text-cyan-400 hover:underline cursor-pointer">Baixar recibos</span>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 py-2.5 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
