import React, { useState, useEffect, useMemo } from 'react';
import {
  Send,
  Users,
  Phone,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Search,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  ArrowRight,
  Flame,
  Dumbbell,
  HeartHandshake,
  FileText,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { formatWhatsAppNumber, formatPhoneDisplay } from '../../lib/whatsappUtils';
import { 
  listarAlunosPorPersonal, 
  listarTemplatesPersonal, 
  dispararWhatsAppComRegistro,
  AlunoTenant,
  TemplateTenant 
} from '../../lib/multiTenantService';

interface DisparoWhatsAppViewProps {
  onNavigateLogin?: () => void;
}

export const DisparoWhatsAppView: React.FC<DisparoWhatsAppViewProps> = ({
  onNavigateLogin,
}) => {
  // 1. Verificação de autenticação & Tenant do Personal Trainer
  const [personalId, setPersonalId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [authChecking, setAuthChecking] = useState(true);

  // Estados de dados Multi-tenant
  const [alunos, setAlunos] = useState<AlunoTenant[]>([]);
  const [templates, setTemplates] = useState<TemplateTenant[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Estados do formulário de disparo
  const [recipientType, setRecipientType] = useState<'aluno' | 'avulso'>('aluno');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAluno, setSelectedAluno] = useState<AlunoTenant | null>(null);
  const [manualPhone, setManualPhone] = useState('');
  const [manualName, setManualName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  
  // Feedback e status
  const [copiedLink, setCopiedLink] = useState(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Disparo recente para histórico visual na sessão
  const [ultimosDisparos, setUltimosDisparos] = useState<Array<{
    id: string;
    nome: string;
    telefone: string;
    hora: string;
    texto: string;
  }>>([]);

  // ==========================================================================
  // 1. VERIFICAÇÃO DE LOGIN & TENANT
  // ==========================================================================
  useEffect(() => {
    async function checkAuthAndLoadTenant() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session?.user) {
          // Não autenticado: redireciona para a tela de login
          if (onNavigateLogin) {
            onNavigateLogin();
          } else {
            window.location.hash = '#login';
          }
          return;
        }

        const currentUserId = session.user.id;
        setPersonalId(currentUserId);
        setUserEmail(session.user.email || '');

        // Carrega dados multi-tenant isolados pelo personal_id
        await carregarDadosTenant();
      } catch (err: any) {
        console.error('[DisparoView] Falha na verificação de sessão:', err);
        setToast({
          type: 'error',
          message: 'Erro ao verificar credenciais: ' + (err.message || 'Sessão inválida'),
        });
      } finally {
        setAuthChecking(false);
      }
    }

    checkAuthAndLoadTenant();
  }, [onNavigateLogin]);

  // Carrega alunos e templates do tenant
  const carregarDadosTenant = async () => {
    setLoadingData(true);
    try {
      const [alunosData, templatesData] = await Promise.all([
        listarAlunosPorPersonal(),
        listarTemplatesPersonal().catch(() => []),
      ]);

      setAlunos(alunosData);
      setTemplates(templatesData);
    } catch (err: any) {
      console.warn('[DisparoView] Atenção ao carregar banco:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // ==========================================================================
  // FILTRAGEM DE CONTATOS DO TENANT
  // ==========================================================================
  const filteredAlunos = useMemo(() => {
    if (!searchQuery.trim()) return alunos;
    const q = searchQuery.toLowerCase();
    const digitsOnly = searchQuery.replace(/\D/g, '');
    return alunos.filter((aluno) => {
      const matchNome = aluno.nome.toLowerCase().includes(q);
      const matchTelefone = digitsOnly && aluno.telefone.replace(/\D/g, '').includes(digitsOnly);
      return matchNome || matchTelefone;
    });
  }, [alunos, searchQuery]);

  // Telefone efetivo selecionado
  const activeRawPhone = recipientType === 'aluno' ? (selectedAluno?.telefone || '') : manualPhone;
  const activeCleanPhone = formatWhatsAppNumber(activeRawPhone);
  const activeDestinatarioNome = recipientType === 'aluno' ? (selectedAluno?.nome || '') : (manualName || 'Destinatário');

  // Máscara dinâmica de telefone avulso (+55 DDD NÚMERO)
  const handleManualPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    let formatted = rawDigits;

    if (rawDigits.length > 0) {
      if (rawDigits.length <= 2) {
        formatted = `(${rawDigits}`;
      } else if (rawDigits.length <= 6) {
        formatted = `(${rawDigits.slice(0, 2)}) ${rawDigits.slice(2)}`;
      } else if (rawDigits.length <= 10) {
        formatted = `(${rawDigits.slice(0, 2)}) ${rawDigits.slice(2, 6)}-${rawDigits.slice(6)}`;
      } else {
        formatted = `(${rawDigits.slice(0, 2)}) ${rawDigits.slice(2, 7)}-${rawDigits.slice(7, 11)}`;
      }
    }
    setManualPhone(formatted);
  };

  // Seleciona um template e personaliza com o nome do aluno se aplicável
  const handleSelectTemplate = (template: TemplateTenant) => {
    setSelectedTemplateId(template.id);
    let texto = template.conteudo;
    if (selectedAluno) {
      const primeiroNome = selectedAluno.nome.split(' ')[0];
      texto = texto.replace(/\{aluno\}|\{nome\}/gi, primeiroNome);
      texto = texto.replace(/Olá!/g, `Olá, ${primeiroNome}!`);
    }
    setMessage(texto);
    setToast(null);
  };

  // Templates rápidos estáticos padrão caso o banco ainda esteja novo
  const templatesRapidos = [
    {
      titulo: '🔥 Desafio do Dia',
      conteudo: 'Fala {aluno}! Desafio de hoje lançado pelo RadarMove: 15 min de caminhada intensa e meta de 2.5L de água batida. Bora pontuar hoje?',
    },
    {
      titulo: '📋 Check-in & Dores',
      conteudo: 'Olá {aluno}! Passando para um check-in rápido do nosso último treino. Como estão as dores musculares, recuperação e energia hoje?',
    },
    {
      titulo: '📅 Reagendamento / Treino',
      conteudo: 'Fala {aluno}! Notei que você não conseguiu treinar ontem. Que tal reagendarmos para hoje ou amanhã para mantermos o ritmo?',
    },
    {
      titulo: '🎯 Avaliação Física',
      conteudo: 'Olá {aluno}! Sua avaliação física está prevista para os próximos dias. Qual melhor horário para você agendar seu teste de bioimpedância?',
    },
  ];

  // Aplica template rápido
  const handleApplyPreset = (presetText: string) => {
    let finalMsg = presetText;
    if (selectedAluno) {
      const firstName = selectedAluno.nome.split(' ')[0];
      finalMsg = finalMsg.replace(/\{aluno\}/g, firstName);
    } else {
      finalMsg = finalMsg.replace(/\{aluno\}!/g, 'tudo bem?');
    }
    setMessage(finalMsg);
  };

  // ==========================================================================
  // 4. O BOTÃO MÁGICO WA.ME (CLICK-TO-CHAT NATIVO)
  // ==========================================================================
  /**
   * Lógica do Botão Mágico:
   * 1. Captura o número de telefone higienizado (apenas números com DDI +55).
   * 2. Captura o texto da mensagem e codifica via encodeURIComponent().
   * 3. Registra na tabela `historico_disparos` isolada com o `personal_id`.
   * 4. Abre imediatamente "https://wa.me/{numero}?text={texto_codificado}" em nova aba.
   */
  const handleBotaoMagicoWaMe = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setToast(null);

    // Validação 1: Destinatário
    if (!activeCleanPhone || activeCleanPhone.length < 10) {
      setToast({
        type: 'error',
        message: 'Por favor, selecione um aluno ou digite um telefone válido com DDD.',
      });
      return;
    }

    // Validação 2: Mensagem
    if (!message.trim()) {
      setToast({
        type: 'error',
        message: 'Por favor, digite o conteúdo da mensagem antes de enviar.',
      });
      return;
    }

    try {
      // Codificação e abertura do link wa.me via serviço multi-tenant seguro
      const resultado = await dispararWhatsAppComRegistro({
        alunoId: selectedAluno?.id,
        destinatarioNome: activeDestinatarioNome,
        telefone: activeCleanPhone,
        mensagem: message.trim(),
      });

      if (resultado.success) {
        setToast({
          type: 'success',
          message: `WhatsApp aberto com sucesso para ${activeDestinatarioNome}! Conversa nativa iniciada.`,
        });

        // Adiciona à lista local da sessão
        setUltimosDisparos((prev) => [
          {
            id: String(Date.now()),
            nome: activeDestinatarioNome,
            telefone: activeCleanPhone,
            hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            texto: message.trim(),
          },
          ...prev.slice(0, 4),
        ]);
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        message: 'Erro ao processar disparo: ' + (err.message || 'Erro inesperado'),
      });
    }
  };

  // URL gerada em tempo real para prévia
  const generatedWaUrl = useMemo(() => {
    if (!activeCleanPhone || !message.trim()) return '';
    return `https://wa.me/${activeCleanPhone}?text=${encodeURIComponent(message.trim())}`;
  }, [activeCleanPhone, message]);

  const handleCopyLink = () => {
    if (!generatedWaUrl) return;
    navigator.clipboard.writeText(generatedWaUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Renderização de carregamento de autenticação
  if (authChecking) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-300">
          Validando credenciais e Tenant ID do Personal...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header com Identificação do Tenant / Personal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-[#03241b] via-[#021813] to-[#01140f] shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 font-black shadow-lg shadow-emerald-500/25">
            <Send className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white font-sans">
                Disparo Direto WhatsApp
              </h1>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                wa.me nativo
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Envio instantâneo sem risco de bloqueio de API externa • Isolado no Tenant{' '}
              <strong className="text-cyan-300 font-mono text-[11px]">{userEmail.split('@')[0]}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={carregarDadosTenant}
          disabled={loadingData}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#03261e] border border-emerald-500/20 text-slate-300 hover:text-white hover:border-emerald-500/40 transition-all cursor-pointer self-start sm:self-center"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loadingData ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Sincronizar Alunos ({alunos.length})</span>
        </button>
      </div>

      {/* Banner de Feedback / Toast */}
      {toast && (
        <div
          role="alert"
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
              : toast.type === 'error'
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-200'
              : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid Principal: Seletor de Destinatário & Área de Mensagem */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Destinatário e Contatos */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-emerald-500/20 bg-[#021813]/90 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-emerald-400" />
                1. Escolha o Destinatário
              </span>
              <span className="text-[11px] text-cyan-400 font-mono">
                {alunos.length} cadastrados
              </span>
            </div>

            {/* Alternador: Aluno Cadastrado vs Número Avulso */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#01140f] rounded-xl border border-emerald-500/20">
              <button
                type="button"
                onClick={() => {
                  setRecipientType('aluno');
                  setToast(null);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  recipientType === 'aluno'
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Meus Alunos</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRecipientType('avulso');
                  setSelectedAluno(null);
                  setToast(null);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  recipientType === 'avulso'
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Número Avulso</span>
              </button>
            </div>

            {/* Modo A: Seleção de Aluno do Banco */}
            {recipientType === 'aluno' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar aluno por nome ou telefone..."
                    className="w-full rounded-xl border border-emerald-500/25 bg-[#01140f] pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-all"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-white/5">
                  {filteredAlunos.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      <p>Nenhum aluno encontrado.</p>
                      <button
                        type="button"
                        onClick={() => setRecipientType('avulso')}
                        className="text-cyan-400 hover:underline mt-1 font-semibold"
                      >
                        Digitar número avulso agora
                      </button>
                    </div>
                  ) : (
                    filteredAlunos.map((aluno) => {
                      const isSelected = selectedAluno?.id === aluno.id;
                      return (
                        <div
                          key={aluno.id}
                          onClick={() => {
                            setSelectedAluno(aluno);
                            setToast(null);
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-emerald-500/20 border border-emerald-500/40 text-white shadow-md'
                              : 'hover:bg-white/5 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-300 shrink-0">
                              {aluno.nome.charAt(0).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold truncate leading-tight">
                                {aluno.nome}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono">
                                {formatPhoneDisplay(aluno.telefone) || 'Sem telefone'}
                              </p>
                            </div>
                          </div>

                          {isSelected ? (
                            <UserCheck className="h-4 w-4 text-emerald-400 shrink-0 ml-2" />
                          ) : (
                            <span className="text-[10px] text-slate-500 capitalize">
                              {aluno.status || 'Ativo'}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {selectedAluno && (
                  <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/30 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Aluno Selecionado:</span>
                      <strong className="text-emerald-300">{selectedAluno.nome}</strong>
                    </div>
                    <span className="font-mono text-cyan-300 text-xs font-bold">
                      {formatPhoneDisplay(selectedAluno.telefone)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Modo B: Digitação Manual de Número Avulso */}
            {recipientType === 'avulso' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nome da Pessoa (Opcional)
                  </label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Ex: João Silva ou Aluno Experimental"
                    className="w-full rounded-xl border border-emerald-500/25 bg-[#01140f] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Telefone com DDD (+55) <span className="text-rose-400">*</span>
                    </label>
                    {activeCleanPhone.length >= 10 && (
                      <span className="text-[10px] font-mono text-cyan-300">
                        wa.me/{activeCleanPhone}
                      </span>
                    )}
                  </div>
                  <input
                    type="tel"
                    value={manualPhone}
                    onChange={handleManualPhoneChange}
                    placeholder="(11) 99999-8888"
                    maxLength={16}
                    className="w-full rounded-xl border border-emerald-500/25 bg-[#01140f] px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    O DDI internacional <strong>+55</strong> é aplicado automaticamente na URL.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Card de Disparos Recentes na Sessão */}
          {ultimosDisparos.length > 0 && (
            <div className="rounded-2xl border border-emerald-500/20 bg-[#021813]/60 p-4 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
                Disparos Recentes da Sessão
              </span>
              <div className="space-y-1.5">
                {ultimosDisparos.map((disp) => (
                  <div
                    key={disp.id}
                    className="p-2 rounded-lg bg-[#01140f] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="truncate mr-2">
                      <p className="font-semibold text-slate-200 truncate">{disp.nome}</p>
                      <p className="text-[10px] text-slate-400 truncate italic">&quot;{disp.texto}&quot;</p>
                    </div>
                    <span className="text-[10px] text-cyan-300 font-mono shrink-0">
                      {disp.hora}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Coluna Direita: Templates, Mensagem e O Botão Mágico */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-emerald-500/20 bg-[#021813]/90 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-cyan-400" />
                2. Mensagem & Templates
              </span>
              <span className="text-[10px] text-slate-400">
                {message.length} caracteres
              </span>
            </div>

            {/* Modelos Rápidos para Personal */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-emerald-400" />
                Modelos de Alta Conversão (1 Clique):
              </label>
              <div className="grid grid-cols-2 gap-2">
                {templatesRapidos.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyPreset(tpl.conteudo)}
                    className="text-left p-2 rounded-xl border border-emerald-500/20 bg-[#011611] hover:bg-[#03261e] hover:border-emerald-500/40 transition-all cursor-pointer group"
                  >
                    <p className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                      {tpl.titulo}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {tpl.conteudo}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Templates salvos do Tenant (caso existam no banco) */}
            {templates.length > 0 && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <FileText className="h-3 w-3 text-cyan-400" />
                  Templates do seu RadarMove:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {templates.slice(0, 4).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectTemplate(t)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        selectedTemplateId === t.id
                          ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                          : 'bg-[#01140f] border-emerald-500/20 text-slate-300 hover:border-cyan-400/40'
                      }`}
                    >
                      {t.titulo}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Campo de Texto da Mensagem */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Conteúdo da Mensagem <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Olá! Digite sua mensagem de treino, aviso, motivação ou acompanhamento aqui..."
                className="w-full rounded-xl border border-emerald-500/25 bg-[#01140f] p-3.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Prévia da URL gerada */}
            {generatedWaUrl && (
              <div className="p-3 rounded-xl border border-emerald-500/20 bg-[#01140f] space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    Link wa.me gerado:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 text-cyan-300 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedLink ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedLink ? 'Copiado!' : 'Copiar link'}</span>
                  </button>
                </div>
                <p className="text-[11px] font-mono text-slate-300 truncate">
                  {generatedWaUrl}
                </p>
              </div>
            )}

            {/* ============================================================= */}
            {/* 3. O BOTÃO MÁGICO (wa.me) */}
            {/* ============================================================= */}
            <div className="pt-2">
              <button
                type="button"
                id="btn-magico-whatsapp-wa-me"
                onClick={handleBotaoMagicoWaMe}
                disabled={!activeCleanPhone || !message.trim()}
                className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 p-4 font-black text-slate-950 shadow-xl shadow-emerald-500/30 hover:shadow-cyan-500/40 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="flex items-center justify-center gap-2.5">
                  <Send className="h-5 w-5 fill-slate-950 text-slate-950 group-hover:translate-x-0.5 transition-transform" />
                  <span className="text-base tracking-wide uppercase font-sans">
                    Enviar WhatsApp para {activeDestinatarioNome.split(' ')[0] || 'Destinatário'}
                  </span>
                  <ExternalLink className="h-4 w-4 stroke-[3]" />
                </div>
                <p className="text-[10px] font-medium text-slate-950/80 tracking-tight text-center mt-0.5">
                  Abre no WhatsApp Web / Desktop sem falhas de timeout ou CORS
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisparoWhatsAppView;
