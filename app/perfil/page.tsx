'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  User, 
  Phone, 
  Building2, 
  Camera, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  ArrowLeft,
  Trash2,
  Palette,
  Activity
} from 'lucide-react'

export default function PerfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string>('')
  const [nome, setNome] = useState<string>('')
  const [telefone, setTelefone] = useState<string>('')
  const [empresa, setEmpresa] = useState<string>('')
  const [corPrimaria, setCorPrimaria] = useState<string>('#10b981')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const coresPresets = [
    { label: 'Esmeralda', hex: '#10b981' },
    { label: 'Ciano', hex: '#06b6d4' },
    { label: 'Azul Real', hex: '#3b82f6' },
    { label: 'Violeta', hex: '#8b5cf6' },
    { label: 'Âmbar', hex: '#f59e0b' },
  ]

  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true)
        const { data: authData } = await supabase.auth.getUser()
        const user = authData?.user

        if (!user) {
          // Demonstração
          setNome('Treinador Rodrigo Silva')
          setEmail('treinador@radarmove.com.br')
          setEmpresa('RadarMove Studio')
          setTelefone('(11) 98765-4321')
          setLoading(false)
          return
        }

        setUserId(user.id)
        setEmail(user.email || '')

        // Busca na tabela 'profissionais'
        const { data: perfilData } = await supabase
          .from('profissionais')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (perfilData) {
          setNome(perfilData.nome_profissional || user.user_metadata?.nome || '')
          setEmpresa(perfilData.nome_empresa || 'RadarMove Studio')
          setTelefone(perfilData.telefone || '')
          setCorPrimaria(perfilData.cor_primaria || '#10b981')
          setAvatarUrl(perfilData.avatar_url || user.user_metadata?.avatar_url || null)
        } else {
          setNome(user.user_metadata?.nome || (user.email ? user.email.split('@')[0] : 'Personal Trainer'))
          setEmpresa(user.user_metadata?.empresa || 'RadarMove Studio')
          setTelefone(user.user_metadata?.telefone || '')
        }
      } catch (err: any) {
        console.error('Erro ao carregar perfil:', err)
        setErrorMessage('Não foi possível carregar os dados do perfil.')
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage('A imagem deve ter no máximo 3MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setAvatarUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      if (!nome.trim()) throw new Error('O nome do treinador é obrigatório.')

      if (userId) {
        await supabase.from('profissionais').upsert({
          id: userId,
          nome_profissional: nome.trim(),
          nome_empresa: empresa.trim() || 'RadarMove Studio',
          telefone: telefone.trim(),
          cor_primaria: corPrimaria,
          avatar_url: avatarUrl,
        })

        await supabase.auth.updateUser({
          data: {
            nome: nome.trim(),
            empresa: empresa.trim(),
            telefone: telefone.trim(),
            avatar_url: avatarUrl,
          },
        })
      }

      setSuccessMessage('Alterações salvas com sucesso!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar alterações.')
    } finally {
      setSaving(false)
    }
  }

  const getInitials = () => {
    if (!nome.trim()) return 'PT'
    const parts = nome.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return nome.slice(0, 2).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-[#022c22] text-zinc-100 p-4 md:p-8 flex justify-center items-start">
      <div className="w-full max-w-2xl bg-[#021813]/90 border border-emerald-500/20 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-emerald-500/15 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-[#031d17] text-zinc-400 hover:text-white hover:border-emerald-500/50 transition-colors cursor-pointer"
              title="Voltar ao RadarMove"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Minha Conta & Perfil
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                  RadarMove PRO
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                Gerencie seus dados profissionais e identidade do estúdio
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {successMessage && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/15 p-3.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mb-2" />
            <p className="text-xs">Carregando dados da sua conta...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            {/* Foto de Perfil */}
            <div className="flex items-center gap-4 rounded-xl border border-emerald-500/15 bg-[#032019]/70 p-4">
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
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                >
                  <Camera className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white mb-0.5">Logo ou Foto do Treinador</p>
                <p className="text-[11px] text-zinc-400 mb-2">
                  Formato PNG ou JPG. Exibido na plataforma e nos relatórios de bioimpedância.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-[#042d23] px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-[#063d30] transition-colors cursor-pointer"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Enviar Foto
                  </button>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl(null)}
                      className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
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

            {/* Inputs em Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-emerald-200/80 mb-1.5" htmlFor="nome">
                  Nome Completo do Treinador *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400/60" />
                  <input
                    id="nome"
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Treinador Rodrigo Silva"
                    className="w-full rounded-xl border border-emerald-500/20 bg-[#031d17] pl-10 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-emerald-200/80 mb-1.5" htmlFor="telefone">
                  Telefone / WhatsApp com DDD *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400/60" />
                  <input
                    id="telefone"
                    type="text"
                    required
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full rounded-xl border border-emerald-500/20 bg-[#031d17] pl-10 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-emerald-200/80 mb-1.5" htmlFor="empresa">
                  Nome da Empresa / Estúdio *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400/60" />
                  <input
                    id="empresa"
                    type="text"
                    required
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    placeholder="Ex: Estúdio Personal RadarMove"
                    className="w-full rounded-xl border border-emerald-500/20 bg-[#031d17] pl-10 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-emerald-200/80 mb-1.5" htmlFor="email">
                  E-mail da Conta (Supabase Auth)
                </label>
                <input
                  id="email"
                  type="email"
                  disabled
                  value={email || 'treinador@radarmove.com.br'}
                  className="w-full rounded-xl border border-emerald-500/10 bg-[#021813]/60 px-3 py-2.5 text-xs text-zinc-400 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Cor Primária */}
            <div className="rounded-xl border border-emerald-500/15 bg-[#032019]/70 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-emerald-400" />
                  Cor de Destaque da sua Marca
                </span>
                <span className="text-xs font-mono text-emerald-300 uppercase">{corPrimaria}</span>
              </div>
              <div className="flex items-center gap-2">
                {coresPresets.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setCorPrimaria(c.hex)}
                    className={`h-7 w-7 rounded-lg transition-transform cursor-pointer border ${
                      corPrimaria === c.hex ? 'scale-110 border-white shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Botão Salvar */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 px-6 py-2.5 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando alterações...
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
      </div>
    </div>
  )
}
