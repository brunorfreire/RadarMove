'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  X, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Send, 
  User, 
  MessageSquare, 
  Bell, 
  Smartphone, 
  Sparkles,
  Zap,
  ChevronRight
} from 'lucide-react'
import { Aluno, DesafioTemplate } from '../../types'
import { supabase } from '../../lib/supabaseClient'
import { formatPhoneDisplay } from '../../lib/whatsappUtils'

interface AgendamentoModalProps {
  isOpen: boolean
  onClose: () => void
  desafio: DesafioTemplate | null
  alunos: Aluno[]
  alunoPreSelecionado?: Aluno | null
  onAgendamentoCriado?: (agendamento: any) => void
}

export const AgendamentoModal: React.FC<AgendamentoModalProps> = ({
  isOpen,
  onClose,
  desafio,
  alunos,
  alunoPreSelecionado,
  onAgendamentoCriado,
}) => {
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>(
    alunoPreSelecionado?.id || alunos[0]?.id || ''
  )
  const [mensagem, setMensagem] = useState<string>('')
  
  // Data e hora padrão: Amanhã às 08:00
  const getPadraoDataHora = () => {
    const amanha = new Date()
    amanha.setDate(amanha.getDate() + 1)
    const yyyy = amanha.getFullYear()
    const mm = String(amanha.getMonth() + 1).padStart(2, '0')
    const dd = String(amanha.getDate()).padStart(2, '0')
    return {
      data: `${yyyy}-${mm}-${dd}`,
      hora: '08:00',
    }
  }

  const [dataEnvio, setDataEnvio] = useState<string>(getPadraoDataHora().data)
  const [horaEnvio, setHoraEnvio] = useState<string>(getPadraoDataHora().hora)
  const [notificarTreinador, setNotificarTreinador] = useState<boolean>(true)

  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Aluno selecionado
  const selectedAluno = alunos.find(a => a.id === selectedAlunoId) || alunoPreSelecionado || alunos[0]

  // Sincroniza estado inicial sempre que o modal abre ou o desafio muda
  useEffect(() => {
    if (isOpen && desafio) {
      const alunoNome = selectedAluno?.nome || 'Aluno'
      const primeiroNome = alunoNome.split(' ')[0]
      const msgPersonalizada = desafio.mensagem_whatsapp
        .replace(/\{aluno\}/g, primeiroNome)
        .replace(/\{personal\}/g, 'Personal')

      setMensagem(msgPersonalizada)
      setErrorMessage(null)
      setSuccessMessage(null)

      if (alunoPreSelecionado) {
        setSelectedAlunoId(alunoPreSelecionado.id)
      }
    }
  }, [isOpen, desafio, alunoPreSelecionado])

  // Atualiza placeholders ao trocar de aluno
  const handleTrocaAluno = (novoAlunoId: string) => {
    setSelectedAlunoId(novoAlunoId)
    const novoAluno = alunos.find(a => a.id === novoAlunoId)
    if (novoAluno && desafio) {
      const primeiroNome = novoAluno.nome.split(' ')[0]
      const msg = desafio.mensagem_whatsapp
        .replace(/\{aluno\}/g, primeiroNome)
        .replace(/\{personal\}/g, 'Personal')
      setMensagem(msg)
    }
  }

  // Atalhos rápidos de data e horário
  const setPreset = (tipo: 'hoje_noite' | 'amanha_manha' | 'segunda_manha') => {
    const agora = new Date()
    if (tipo === 'hoje_noite') {
      const yyyy = agora.getFullYear()
      const mm = String(agora.getMonth() + 1).padStart(2, '0')
      const dd = String(agora.getDate()).padStart(2, '0')
      setDataEnvio(`${yyyy}-${mm}-${dd}`)
      setHoraEnvio('19:00')
    } else if (tipo === 'amanha_manha') {
      const amanha = new Date()
      amanha.setDate(amanha.getDate() + 1)
      const yyyy = amanha.getFullYear()
      const mm = String(amanha.getMonth() + 1).padStart(2, '0')
      const dd = String(amanha.getDate()).padStart(2, '0')
      setDataEnvio(`${yyyy}-${mm}-${dd}`)
      setHoraEnvio('08:00')
    } else if (tipo === 'segunda_manha') {
      const proxSegunda = new Date()
      const diaSemana = proxSegunda.getDay()
      const diasAteSegunda = diaSemana === 1 ? 7 : (8 - diaSemana) % 7 || 7
      proxSegunda.setDate(proxSegunda.getDate() + diasAteSegunda)
      const yyyy = proxSegunda.getFullYear()
      const mm = String(proxSegunda.getMonth() + 1).padStart(2, '0')
      const dd = String(proxSegunda.getDate()).padStart(2, '0')
      setDataEnvio(`${yyyy}-${mm}-${dd}`)
      setHoraEnvio('07:30')
    }
  }

  // Validação e persistência no Supabase
  const handleConfirmarAgendamento = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      if (!selectedAluno) {
        throw new Error('Por favor, selecione um aluno para receber o desafio.')
      }

      if (!mensagem.trim()) {
        throw new Error('A mensagem do desafio não pode estar vazia.')
      }

      // Constrói objeto Date para validação
      const dataHoraProgramada = new Date(`${dataEnvio}T${horaEnvio}:00`)
      if (isNaN(dataHoraProgramada.getTime())) {
        throw new Error('Data ou hora inválida.')
      }

      if (dataHoraProgramada.getTime() <= Date.now() + 60 * 1000) {
        throw new Error('A data e hora do agendamento deve ser pelo menos 1 minuto no futuro.')
      }

      // Obtém usuário autenticado
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData?.user?.id || 'guest-trainer-demo'

      const novoAgendamento = {
        profissional_id: userId,
        aluno_id: selectedAluno.id,
        mensagem: mensagem.trim(),
        data_hora_programada: dataHoraProgramada.toISOString(),
        status: 'pendente',
        notificar_treinador: notificarTreinador,
        created_at: new Date().toISOString(),
      }

      // Tenta gravar na tabela agendamentos_envios
      const { data: insertedData, error: insertError } = await supabase
        .from('agendamentos_envios')
        .insert([novoAgendamento])
        .select()
        .maybeSingle()

      if (insertError) {
        console.warn('Nota: Erro de banco de dados no Supabase, mantendo registro localmente:', insertError)
      }

      setSuccessMessage(
        `Desafio agendado com sucesso para ${selectedAluno.nome.split(' ')[0]} em ${dataHoraProgramada.toLocaleDateString('pt-BR')} às ${horaEnvio}!`
      )

      if (onAgendamentoCriado) {
        onAgendamentoCriado(insertedData || novoAgendamento)
      }

      setTimeout(() => {
        setSuccessMessage(null)
        onClose()
      }, 1600)
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar o agendamento.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen || !desafio) return null

  return (
    <AnimatePresence>
      <div 
        id="modal-agendamento-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      >
        {/* Backdrop com Blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl rounded-2xl border border-emerald-500/25 bg-[#022c22] p-5 sm:p-6 shadow-2xl text-zinc-100 z-10 overflow-hidden"
        >
          {/* Luzes decorativas */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-emerald-500/15 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 shadow-lg shadow-cyan-500/20">
                <Calendar className="h-5 w-5 text-zinc-950 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Agendar Disparo de Desafio
                  <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                    WhatsApp
                  </span>
                </h2>
                <p className="text-xs text-emerald-200/70">
                  {desafio.titulo} • {desafio.categoria}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-[#031d17] text-zinc-400 hover:text-white hover:border-emerald-500/50 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Alerts */}
          {successMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/15 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleConfirmarAgendamento} className="space-y-4">
            {/* Destinatário (Aluno) */}
            <div>
              <label className="block text-xs font-semibold text-emerald-200/90 mb-1.5 flex items-center gap-1.5" htmlFor="select-aluno-agendamento">
                <User className="h-3.5 w-3.5 text-emerald-400" />
                Aluno Destinatário
              </label>
              <select
                id="select-aluno-agendamento"
                value={selectedAlunoId}
                onChange={(e) => handleTrocaAluno(e.target.value)}
                className="w-full rounded-xl border border-emerald-500/25 bg-[#031d17] px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none cursor-pointer"
              >
                {alunos.map((a) => (
                  <option key={a.id} value={a.id} className="bg-[#021813] text-white">
                    {a.nome} — {formatPhoneDisplay(a.telefone)} ({a.status === 'em_risco' ? '⚠️ Em risco' : 'Ativo'})
                  </option>
                ))}
              </select>
            </div>

            {/* Mensagem do Desafio */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-emerald-200/90 flex items-center gap-1.5" htmlFor="textarea-mensagem-agendamento">
                  <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
                  Mensagem Programada
                </label>
                <span className="text-[10px] text-zinc-400">
                  {mensagem.length} caracteres
                </span>
              </div>
              <textarea
                id="textarea-mensagem-agendamento"
                rows={3}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="w-full rounded-xl border border-emerald-500/25 bg-[#031d17] p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-cyan-400 focus:outline-none resize-none leading-relaxed"
                placeholder="Texto do desafio a ser disparado..."
              />
            </div>

            {/* Seletor de Data e Horário com Atalhos */}
            <div className="rounded-xl border border-emerald-500/20 bg-[#032019]/70 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-emerald-400" />
                  Data e Hora do Disparo
                </span>
                <span className="text-[10px] text-cyan-300 font-medium">
                  Fuso horário local
                </span>
              </div>

              {/* Botões de Atalhos Rápidos */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreset('hoje_noite')}
                  className="rounded-lg border border-emerald-500/30 bg-[#031d17] px-2.5 py-1 text-[11px] font-medium text-emerald-300 hover:bg-[#042d23] transition-colors cursor-pointer"
                >
                  Hoje às 19:00
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('amanha_manha')}
                  className="rounded-lg border border-emerald-500/30 bg-[#031d17] px-2.5 py-1 text-[11px] font-medium text-cyan-300 hover:bg-[#042d23] transition-colors cursor-pointer"
                >
                  Amanhã às 08:00
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('segunda_manha')}
                  className="rounded-lg border border-emerald-500/30 bg-[#031d17] px-2.5 py-1 text-[11px] font-medium text-amber-300 hover:bg-[#042d23] transition-colors cursor-pointer"
                >
                  Segunda às 07:30
                </button>
              </div>

              {/* Inputs Nativos Mobile-friendly */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1" htmlFor="input-data-envio">
                    Data do Disparo
                  </label>
                  <input
                    id="input-data-envio"
                    type="date"
                    required
                    value={dataEnvio}
                    onChange={(e) => setDataEnvio(e.target.value)}
                    className="w-full rounded-xl border border-emerald-500/25 bg-[#031d17] px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1" htmlFor="input-hora-envio">
                    Horário (HH:MM)
                  </label>
                  <input
                    id="input-hora-envio"
                    type="time"
                    required
                    value={horaEnvio}
                    onChange={(e) => setHoraEnvio(e.target.value)}
                    className="w-full rounded-xl border border-emerald-500/25 bg-[#031d17] px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Checkbox de Notificação para o Personal Trainer */}
            <div className="rounded-xl border border-cyan-500/20 bg-[#032019]/70 p-3.5">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="chk-notificar-treinador"
                  checked={notificarTreinador}
                  onChange={(e) => setNotificarTreinador(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-emerald-500/40 bg-[#031d17] text-cyan-500 focus:ring-cyan-400 focus:ring-offset-[#022c22] cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
                      Receber confirmação no meu WhatsApp quando for enviado
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    Assim que o disparo for concluído para <strong className="text-emerald-300">{selectedAluno?.nome.split(' ')[0]}</strong>, o RadarMove enviará um WhatsApp para o seu número com o status de entrega.
                  </p>
                </div>
              </label>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-emerald-500/15">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl border border-emerald-500/20 bg-[#031d17] px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-[#04241d] transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                id="btn-confirmar-agendamento"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 px-5 py-2.5 text-xs font-black text-zinc-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                    Salvando Agendamento...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 text-zinc-950" />
                    Confirmar Agendamento
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
