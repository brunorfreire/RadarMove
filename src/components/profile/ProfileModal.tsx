'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  X, 
  User, 
  Phone, 
  Building2, 
  Camera, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  Trash2,
  Sparkles,
  Palette
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onProfileUpdated?: (updatedData: { nome: string; empresa: string; telefone: string; avatarUrl?: string }) => void
}

export function ProfileModal({ isOpen, onClose, onProfileUpdated }: ProfileModalProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Campos do formulário
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string>('')
  const [nome, setNome] = useState<string>('')
  const [telefone, setTelefone] = useState<string>('')
  const [empresa, setEmpresa] = useState<string>('')
  const [corPrimaria, setCorPrimaria] = useState<string>('#10b981')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Paleta de cores rápidas para a marca
  const coresPresets = [
    { label: 'Esmeralda', hex: '#10b981' },
    { label: 'Ciano', hex: '#06b6d4' },
    { label: 'Azul Real', hex: '#3b82f6' },
    { label: 'Violeta', hex: '#8b5cf6' },
    { label: 'Âmbar', hex: '#f59e0b' },
  ]

  // Carrega os dados reais do profissional autenticado
  useEffect(() => {
    if (!isOpen) return

    async function fetchProfile() {
      setLoading(true)
      setErrorMessage(null)
      setSuccessMessage(null)

      try {
        const { data: authData } = await supabase.auth.getUser()
        const user = authData?.user

        if (!user) {
          // Fallback para demonstração sem sessão ativa
          setUserId('guest-demo')
          setNome('Treinador Rodrigo Silva')
          setEmail('treinador@radarmove.com.br')
          setEmpresa('RadarMove Studio')
          setTelefone('(11) 98765-4321')
          setAvatarUrl(null)
          setLoading(false)
          return
        }

        setUserId(user.id)
        setEmail(user.email || '')

        // 1. Tenta buscar da tabela 'profissionais'
        const { data: perfilData, error: perfilError } = await supabase
          .from('profissionais')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (perfilData && !perfilError) {
          setNome(perfilData.nome_profissional || user.user_metadata?.nome || '')
          setEmpresa(perfilData.nome_empresa || 'RadarMove Studio')
          setTelefone(perfilData.telefone || '')
          setCorPrimaria(perfilData.cor_primaria || '#10b981')
          setAvatarUrl(perfilData.avatar_url || user.user_metadata?.avatar_url || null)
        } else {
          // Preenche a partir dos metadados do auth
          setNome(user.user_metadata?.nome || (user.email ? user.email.split('@')[0] : 'Personal Trainer'))
          setEmpresa(user.user_metadata?.empresa || 'RadarMove Studio')
          setTelefone(user.user_metadata?.telefone || '')
          setAvatarUrl(user.user_metadata?.avatar_url || null)
        }
      } catch (err: any) {
        console.error('Erro ao buscar dados do perfil:', err)
        setErrorMessage('Não foi possível carregar os dados do perfil.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [isOpen])

  // Tratar upload de imagem (com leitura local e suporte a Supabase Storage)
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limite de 3MB
    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage('A imagem deve ter no máximo 3MB.')
      return
    }

    // Leitura imediata em Base64 para preview instantâneo
    const reader = new FileReader()
    reader.onload = async () => {
      const base64Url = reader.result as string
      setAvatarUrl(base64Url)

      // Se houver usuário logado e storage disponível, tenta persistir
      if (userId && userId !== 'guest-demo') {
        try {
          const fileExt = file.name.split('.').pop()
          const fileName = `${userId}-${Date.now()}.${fileExt}`
          const filePath = `avatars/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('perfis')
            .upload(filePath, file, { upsert: true })

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('perfis')
              .getPublicUrl(filePath)
            if (publicUrlData?.publicUrl) {
              setAvatarUrl(publicUrlData.publicUrl)
            }
          }
        } catch (uploadErr) {
          // Mantém o preview em base64 se storage não estiver configurado
          console.warn('Storage opcional não configurado, utilizando base64:', uploadErr)
        }
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setAvatarUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Salvar no Supabase
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      if (!nome.trim()) {
        throw new Error('O nome do treinador é obrigatório.')
      }

      // Se autenticado no Supabase
      if (userId && userId !== 'guest-demo') {
        // 1. Atualiza a tabela 'profissionais'
        const { error: updateError } = await supabase
          .from('profissionais')
          .upsert({
            id: userId,
            nome_profissional: nome.trim(),
            nome_empresa: empresa.trim() || 'RadarMove Studio',
            telefone: telefone.trim(),
            cor_primaria: corPrimaria,
            avatar_url: avatarUrl,
          })

        if (updateError) {
          console.warn('Aviso no upsert de profissionais, atualizando auth metadata:', updateError)
        }

        // 2. Atualiza os metadados do auth.user para refletir em toda a sessão
        await supabase.auth.updateUser({
          data: {
            nome: nome.trim(),
            empresa: empresa.trim(),
            telefone: telefone.trim(),
            avatar_url: avatarUrl,
          },
        })
      }

      setSuccessMessage('Perfil atualizado com sucesso!')

      if (onProfileUpdated) {
        onProfileUpdated({
          nome: nome.trim(),
          empresa: empresa.trim(),
          telefone: telefone.trim(),
          avatarUrl: avatarUrl || undefined,
        })
      }

      setTimeout(() => {
        setSuccessMessage(null)
        onClose()
      }, 1200)
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar alterações.')
    } finally {
      setSaving(false)
    }
  }

  // Gera as iniciais do avatar caso não tenha foto
  const getInitials = () => {
    if (!nome.trim()) return 'PT'
    const parts = nome.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return nome.slice(0, 2).toUpperCase()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop Escuro com Blur */}
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
            className="relative w-full max-w-xl rounded-2xl border border-emerald-500/25 bg-[#022c22] p-6 shadow-2xl text-zinc-100 z-10 overflow-hidden"
          >
            {/* Gradiente sutil decorativo de fundo */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />

            {/* Header do Modal */}
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
                  <ShieldCheck className="h-5 w-5 text-zinc-950 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Minha Conta & Perfil
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                      PRO
                    </span>
                  </h2>
                  <p className="text-xs text-emerald-200/70">
                    Personalize sua identidade e informações do estúdio no RadarMove
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

            {/* Feedback Alerts */}
            {successMessage && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3 text-xs text-emerald-300 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span className="font-semibold">{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/15 p-3 text-xs text-rose-300 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mb-2" />
                <p className="text-xs">Carregando dados do perfil...</p>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                {/* Seção de Avatar / Foto de Perfil */}
                <div className="flex items-center gap-4 rounded-xl border border-emerald-500/15 bg-[#032019]/70 p-3.5">
                  <div className="relative group shrink-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={nome}
                        className="h-16 w-16 rounded-xl object-cover border-2 border-emerald-500/40 shadow-md"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border-2 border-emerald-500/40 text-emerald-400 font-extrabold text-lg shadow-md">
                        {getInitials()}
                      </div>
                    )}

                    {/* Botão de câmera sobreposto */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Alterar foto"
                      className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                    >
                      <Camera className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white mb-0.5">Foto de Perfil / Logo</p>
                    <p className="text-[11px] text-zinc-400 mb-2">
                      PNG ou JPG até 3MB. Aparece nos relatórios e mensagens de WhatsApp.
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-[#042d23] px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:bg-[#063d30] transition-colors cursor-pointer"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        Carregar Foto
                      </button>

                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remover
                        </button>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Campos de Texto em Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Nome Completo */}
                  <div>
                    <label className="block text-xs font-medium text-emerald-200/80 mb-1" htmlFor="profile-nome">
                      Nome Completo do Treinador *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400/60 pointer-events-none" />
                      <input
                        id="profile-nome"
                        type="text"
                        required
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Ex: Treinador Rodrigo Silva"
                        className="w-full rounded-xl border border-emerald-500/20 bg-[#031d17] pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      />
                    </div>
                  </div>

                  {/* Telefone / WhatsApp */}
                  <div>
                    <label className="block text-xs font-medium text-emerald-200/80 mb-1" htmlFor="profile-tel">
                      WhatsApp com DDD *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400/60 pointer-events-none" />
                      <input
                        id="profile-tel"
                        type="text"
                        required
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        placeholder="(11) 99999-8888"
                        className="w-full rounded-xl border border-emerald-500/20 bg-[#031d17] pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      />
                    </div>
                  </div>

                  {/* Nome da Empresa / Estúdio */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-emerald-200/80 mb-1" htmlFor="profile-empresa">
                      Nome da Empresa / Estúdio Personal *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400/60 pointer-events-none" />
                      <input
                        id="profile-empresa"
                        type="text"
                        required
                        value={empresa}
                        onChange={(e) => setEmpresa(e.target.value)}
                        placeholder="Ex: Estúdio Personal RadarMove"
                        className="w-full rounded-xl border border-emerald-500/20 bg-[#031d17] pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      />
                    </div>
                  </div>

                  {/* E-mail (somente leitura) */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-emerald-200/80">E-mail da Conta</span>
                      <span className="text-[10px] text-zinc-400">Vinculado ao Supabase Auth</span>
                    </div>
                    <input
                      type="email"
                      disabled
                      value={email || 'treinador@radarmove.com.br'}
                      className="w-full rounded-xl border border-emerald-500/10 bg-[#021813]/60 px-3 py-2 text-xs text-zinc-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Seletor de Cor da Marca */}
                <div className="rounded-xl border border-emerald-500/15 bg-[#032019]/70 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white flex items-center gap-1.5">
                      <Palette className="h-3.5 w-3.5 text-emerald-400" />
                      Cor Principal da sua Marca
                    </span>
                    <span className="text-[11px] font-mono text-emerald-300 uppercase">
                      {corPrimaria}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {coresPresets.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setCorPrimaria(c.hex)}
                        title={c.label}
                        className={`h-7 w-7 rounded-lg transition-transform cursor-pointer border ${
                          corPrimaria === c.hex ? 'scale-110 border-white shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                    <input
                      type="color"
                      value={corPrimaria}
                      onChange={(e) => setCorPrimaria(e.target.value)}
                      title="Escolher cor personalizada"
                      className="h-7 w-8 rounded-lg bg-transparent border border-emerald-500/30 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Botões de Ação */}
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
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 px-5 py-2 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
