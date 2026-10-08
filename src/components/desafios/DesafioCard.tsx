import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  Send, 
  Clock, 
  Flame, 
  MessageSquare, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  Sun, 
  Zap, 
  Shield, 
  Apple, 
  HeartPulse, 
  ChevronDown, 
  ChevronUp, 
  UserCheck, 
  ArrowUpRight, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Compass, 
  Target, 
  Calendar, 
  Loader2,
  Lock,
  ImageIcon
} from 'lucide-react';
import { DesafioTemplate, CategoriaDesafio, Aluno, DesafioEnviado, DesafioImagem } from '../../types';
import { openWhatsApp } from '../../lib/whatsappUtils';
import { verificarDesafioRepetido } from '../../lib/historicoDesafiosUtils';
import { obterImagensDesafio } from '../../lib/pocketChallengesImagesService';
import { salvarHistoricoDesafioSupabase, travarEnvio, liberarTravaEnvio } from '../../lib/historicoDesafiosService';
import { DesafioImagemViewer } from './DesafioImagemViewer';

interface DesafioCardProps {
  desafio: DesafioTemplate;
  alunos?: Aluno[];
  historico?: DesafioEnviado[];
  onDisparar: (desafio: DesafioTemplate) => void;
  onEdit?: (desafio: DesafioTemplate) => void;
  onDelete?: (id: string) => void;
  onQuickSendWhatsApp?: (aluno: Aluno, desafio: DesafioTemplate, customMessage: string) => void;
  onAgendar?: (desafio: DesafioTemplate, aluno?: Aluno) => void;
}

export const DesafioCard: React.FC<DesafioCardProps> = ({
  desafio,
  alunos = [],
  historico = [],
  onDisparar,
  onEdit,
  onDelete,
  onQuickSendWhatsApp,
  onAgendar,
}) => {
  const [copied, setCopied] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>(alunos[0]?.id || '');
  const [quickSent, setQuickSent] = useState(false);
  const [isSendingBackground, setIsSendingBackground] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [imagensDemonstrativas, setImagensDemonstrativas] = useState<DesafioImagem[]>(desafio.imagens || []);

  // Carrega imagens anatômicas/demonstrativas associadas
  useEffect(() => {
    let isMounted = true;
    async function carregarImagens() {
      if (desafio.imagens && desafio.imagens.length > 0) {
        setImagensDemonstrativas(desafio.imagens);
        return;
      }
      const imgs = await obterImagensDesafio(desafio.id, desafio.titulo);
      if (isMounted && imgs && imgs.length > 0) {
        setImagensDemonstrativas(imgs);
      }
    }
    carregarImagens();
    return () => { isMounted = false; };
  }, [desafio.id, desafio.titulo, desafio.imagens]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getCategoryConfig = (categoria: CategoriaDesafio) => {
    switch (categoria) {
      case 'Lazer Ativo':
        return {
          icon: Compass,
          textColor: 'text-sky-300',
          borderColor: 'border-sky-400/30',
          bgBadge: 'bg-sky-400/15 text-sky-300 border-sky-400/30',
          accentGlow: 'from-sky-500/15 to-transparent',
        };
      case 'Mindset Estoico':
      case 'Estoicismo':
        return {
          icon: Shield,
          textColor: 'text-amber-300',
          borderColor: 'border-amber-500/30',
          bgBadge: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
          accentGlow: 'from-amber-500/15 to-transparent',
        };
      case 'Desafio de Conversão':
        return {
          icon: Target,
          textColor: 'text-cyan-300',
          borderColor: 'border-cyan-400/30',
          bgBadge: 'bg-cyan-400/15 text-cyan-300 border-cyan-400/30',
          accentGlow: 'from-cyan-500/15 to-transparent',
        };
      case 'Lifestyle 23h':
        return {
          icon: Sun,
          textColor: 'text-cyan-300',
          borderColor: 'border-cyan-400/30',
          bgBadge: 'bg-cyan-400/15 text-cyan-300 border-cyan-400/30',
          accentGlow: 'from-cyan-500/15 to-transparent',
        };
      case 'Desafio de Bolso':
        return {
          icon: Zap,
          textColor: 'text-emerald-400',
          borderColor: 'border-emerald-500/30',
          bgBadge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          accentGlow: 'from-emerald-500/15 to-transparent',
        };
      case 'Nutrição':
        return {
          icon: Apple,
          textColor: 'text-rose-300',
          borderColor: 'border-rose-500/30',
          bgBadge: 'bg-rose-400/15 text-rose-300 border-rose-400/30',
          accentGlow: 'from-rose-500/15 to-transparent',
        };
      case 'Recuperação':
      default:
        return {
          icon: HeartPulse,
          textColor: 'text-teal-300',
          borderColor: 'border-teal-500/30',
          bgBadge: 'bg-teal-400/15 text-teal-300 border-teal-400/30',
          accentGlow: 'from-teal-500/15 to-transparent',
        };
    }
  };

  const config = getCategoryConfig(desafio.categoria);
  const CategoryIcon = config.icon;

  const getDifficultyBadge = (dif: string) => {
    switch (dif) {
      case 'Fácil':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Médio':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Desafiador':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(desafio.mensagem_whatsapp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedAluno = alunos.find((a) => a.id === selectedAlunoId) || alunos[0];
  const alunoFirstName = selectedAluno ? selectedAluno.nome.split(' ')[0] : 'Aluno';

  // Verificação estrita de bloqueio e repetição por aluno e desafio
  const repeticaoStatus = verificarDesafioRepetido(
    historico,
    selectedAluno?.id || '',
    desafio.id,
    desafio.titulo
  );

  const jaEnviadoParaAluno = repeticaoStatus.repetido;

  const formatMessageForAluno = () => {
    return desafio.mensagem_whatsapp
      .replace(/\{aluno\}|\{aluno_nome\}/g, alunoFirstName)
      .replace(/\{personal\}|\{treinador_nome\}/g, 'Treinador');
  };

  // Disparo direto com trava contra duplo clique e persistência
  const handleQuickSend = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedAluno) return;
    if (isSendingBackground) return;

    // Se já foi enviado para este aluno, o reenvio é bloqueado
    if (jaEnviadoParaAluno) {
      showToast(`Este desafio já foi enviado para ${alunoFirstName} em ${repeticaoStatus.dataEnvioFormatada}.`);
      return;
    }

    // Trava de idempotência por aluno e desafio
    const travadoComSucesso = travarEnvio(selectedAluno.id, desafio.id);
    if (!travadoComSucesso) {
      showToast('Operação em andamento. Aguarde...');
      return;
    }

    const personalizedText = formatMessageForAluno();
    setIsSendingBackground(true);

    try {
      // 1. Disparo no backend com suporte a mídia e provedor
      const primeImagemUrl = imagensDemonstrativas[0]?.url;
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: selectedAluno.telefone,
          message: personalizedText,
          mediaUrl: primeImagemUrl,
          imageUrl: primeImagemUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Erro ao processar envio pelo provedor');
      }

      // 2. Registro no histórico com status 'aceito'/'enviado' no Supabase
      await salvarHistoricoDesafioSupabase({
        alunoId: selectedAluno.id,
        alunoNome: selectedAluno.nome,
        desafioId: desafio.id,
        desafioTitulo: desafio.titulo,
        categoria: desafio.categoria,
        dificuldade: desafio.dificuldade,
        tempoEstimado: desafio.tempo_estimado,
        mensagemEnviada: personalizedText,
        imagensUrls: imagensDemonstrativas.map(i => i.url),
        numeroDestino: selectedAluno.telefone,
        providerMessageId: data.messageId,
        statusEnvio: 'enviado',
        origemEnvio: 'card_rapido',
      });

      showToast('Desafio aceito pelo provedor e registrado no histórico!');

      if (onQuickSendWhatsApp) {
        onQuickSendWhatsApp(selectedAluno, desafio, personalizedText);
      }
      setQuickSent(true);
      setTimeout(() => setQuickSent(false), 3500);
    } catch (err: any) {
      console.warn('[DesafioCard] Fallback controlado de envio:', err.message);
      // Fallback nativo: abre wa.me
      openWhatsApp(selectedAluno.telefone, personalizedText);
      
      // Registra com observação
      await salvarHistoricoDesafioSupabase({
        alunoId: selectedAluno.id,
        alunoNome: selectedAluno.nome,
        desafioId: desafio.id,
        desafioTitulo: desafio.titulo,
        categoria: desafio.categoria,
        dificuldade: desafio.dificuldade,
        tempoEstimado: desafio.tempo_estimado,
        mensagemEnviada: personalizedText,
        imagensUrls: imagensDemonstrativas.map(i => i.url),
        numeroDestino: selectedAluno.telefone,
        statusEnvio: 'enviado',
        origemEnvio: 'card_rapido',
      });

      showToast('Desafio aberto no WhatsApp e salvo no histórico.');
      if (onQuickSendWhatsApp) {
        onQuickSendWhatsApp(selectedAluno, desafio, personalizedText);
      }
    } finally {
      setIsSendingBackground(false);
      liberarTravaEnvio(selectedAluno.id, desafio.id);
    }
  };

  // Render message with highlighted tags
  const renderMessageWithTags = (text: string) => {
    const parts = text.split(/(\{aluno\}|\{aluno_nome\}|\{personal\}|\{treinador_nome\})/g);
    return parts.map((part, i) => {
      if (part === '{aluno}' || part === '{aluno_nome}') {
        return (
          <span key={i} className="rounded bg-cyan-400/20 px-1 py-0.5 font-bold text-cyan-300 border border-cyan-400/30">
            {'{aluno}'}
          </span>
        );
      }
      if (part === '{personal}' || part === '{treinador_nome}') {
        return (
          <span key={i} className="rounded bg-emerald-400/20 px-1 py-0.5 font-bold text-emerald-300 border border-emerald-400/30">
            {'{personal}'}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div 
      id={`desafio-card-${desafio.id}`}
      className={`rounded-2xl border transition-all duration-200 backdrop-blur-xl shadow-xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group ${
        isOptionsOpen
          ? 'border-cyan-400 bg-[#03241d] ring-2 ring-cyan-400/20'
          : 'border-emerald-500/20 bg-[#032019]/90 hover:border-emerald-400/50 hover:shadow-2xl hover:shadow-cyan-500/5'
      }`}
    >
      {/* Top Accent Gradient Header */}
      <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${config.accentGlow}`} />

      <div>
        {/* 1. Categoria, Nível e Duração */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${config.bgBadge}`}>
              <CategoryIcon className="h-3 w-3" />
              {desafio.categoria}
            </span>

            {/* Status de Envio para o aluno selecionado */}
            {selectedAluno && (
              jaEnviadoParaAluno ? (
                <span 
                  title={`Enviado em ${repeticaoStatus.dataEnvioFormatada}`}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold bg-amber-400/15 border border-amber-400/30 text-amber-300"
                >
                  <Lock className="h-2.5 w-2.5 text-amber-400" />
                  <span>Já enviado ({repeticaoStatus.dataEnvioFormatada})</span>
                </span>
              ) : (
                <span 
                  title={`Disponível para envio`}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                >
                  <Check className="h-2.5 w-2.5" />
                  <span>Inédito ({alunoFirstName})</span>
                </span>
              )
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${getDifficultyBadge(desafio.dificuldade)}`}>
              {desafio.dificuldade}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
              <Clock className="h-3 w-3 text-slate-500" />
              {desafio.tempo_estimado}
            </span>
          </div>
        </div>

        {/* 2. Nome do Desafio */}
        <h4 
          onClick={() => setIsOptionsOpen(!isOptionsOpen)}
          className="text-base font-extrabold text-white tracking-tight group-hover:text-cyan-300 transition-colors mb-2.5 cursor-pointer flex items-center justify-between"
        >
          <span>{desafio.titulo}</span>
          <span className="text-xs text-slate-400 font-normal">
            {isOptionsOpen ? (
              <span className="text-cyan-300 text-[11px] font-bold flex items-center gap-0.5">
                <ChevronUp className="h-3.5 w-3.5" />
                Fechar
              </span>
            ) : (
              <span className="text-slate-400 text-[11px] flex items-center gap-0.5 group-hover:text-cyan-300">
                <ChevronDown className="h-3.5 w-3.5" />
                Opções
              </span>
            )}
          </span>
        </h4>

        {/* 3. Mensagem WhatsApp */}
        <div 
          onClick={() => setIsOptionsOpen(!isOptionsOpen)}
          className="cursor-pointer rounded-xl border border-emerald-500/20 bg-[#021813] p-3 text-xs text-slate-300 relative font-sans leading-relaxed space-y-1 hover:border-emerald-500/40 transition-colors"
        >
          <div className="flex items-center justify-between text-[10px] text-slate-500 pb-1 border-b border-white/5">
            <span className="flex items-center gap-1 font-semibold text-emerald-400">
              <MessageSquare className="h-3 w-3" />
              Mensagem WhatsApp
            </span>
            <span className="text-[10px] text-cyan-400/80 font-medium">Clique no card para abrir opções</span>
          </div>
          <p className="pt-1 text-slate-200 whitespace-pre-wrap">
            {renderMessageWithTags(desafio.mensagem_whatsapp)}
          </p>
        </div>

        {/* 4. Imagem Demonstrativa Educativa Abaixo da Mensagem */}
        {imagensDemonstrativas.length > 0 && (
          <DesafioImagemViewer
            imagens={imagensDemonstrativas}
            tituloDesafio={desafio.titulo}
            adaptacoesSeguranca={desafio.adaptacoes_seguranca}
          />
        )}

        {/* PAINEL EXPANSÍVEL DE OPÇÕES E CONFIRMAÇÃO */}
        {isOptionsOpen && (
          <div 
            id={`opcoes-desafio-${desafio.id}`}
            className="mt-3.5 p-3.5 rounded-xl border border-cyan-400/40 bg-[#02140f] space-y-3 animate-in slide-in-from-top-2 duration-200 text-xs shadow-inner"
          >
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5 text-xs">
                <Zap className="h-3.5 w-3.5 text-cyan-400" />
                Disparo Individualizado & Idempotente
              </span>
              <button
                type="button"
                onClick={() => setIsOptionsOpen(false)}
                className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer bg-white/5 px-2 py-0.5 rounded"
              >
                <ChevronUp className="h-3 w-3" />
                Recolher
              </button>
            </div>

            {/* Selecionar Aluno Destinatário */}
            {alunos.length > 0 && (
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Aluno Destinatário:
                </label>
                <select
                  value={selectedAlunoId}
                  onChange={(e) => setSelectedAlunoId(e.target.value)}
                  className="w-full rounded-lg border border-emerald-500/30 bg-[#032019] px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                >
                  {alunos.map((a) => {
                    const check = verificarDesafioRepetido(historico, a.id, desafio.id, desafio.titulo);
                    return (
                      <option key={a.id} value={a.id}>
                        {a.nome} {check.repetido ? `[Já enviado em ${check.dataEnvioFormatada}]` : '[Inédito]'} - ({a.telefone})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Prévia com nome do aluno */}
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] text-slate-300 space-y-1">
              <span className="text-[10px] uppercase font-bold text-cyan-400">Conteúdo do Disparo:</span>
              <p className="italic leading-relaxed">&quot;{formatMessageForAluno()}&quot;</p>
              {imagensDemonstrativas.length > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold pt-1">
                  <ImageIcon className="h-3 w-3" />
                  <span>Inclui {imagensDemonstrativas.length} {imagensDemonstrativas.length === 1 ? 'imagem demonstrativa' : 'imagens em sequência'}</span>
                </div>
              )}
            </div>

            {/* Banner de Bloqueio ou Liberação */}
            {selectedAluno && (
              jaEnviadoParaAluno ? (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-200 text-xs flex items-start gap-2.5">
                  <Lock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300">Desafio Bloqueado para {alunoFirstName}</span>
                    <p className="text-[11px] text-amber-200/90 mt-0.5">
                      Este desafio já foi enviado para este aluno em <strong>{repeticaoStatus.dataEnvioFormatada}</strong>. 
                      O reenvio está bloqueado para preservar a novidade e a metodologia do aluno.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Desafio inédito para {alunoFirstName}. Pronto para envio!</span>
                </div>
              )
            )}

            {/* Ações do painel */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <button
                type="button"
                id={`btn-enviar-wpp-rapido-${desafio.id}`}
                onClick={handleQuickSend}
                disabled={isSendingBackground || jaEnviadoParaAluno}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer ${
                  jaEnviadoParaAluno
                    ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 shadow-cyan-500/20 hover:brightness-110 active:scale-95'
                }`}
              >
                {isSendingBackground ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-950" />
                    <span>Enviando...</span>
                  </>
                ) : jaEnviadoParaAluno ? (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    <span>Já enviado</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 fill-slate-950 text-slate-950" />
                    <span>Disparar Desafio ({alunoFirstName})</span>
                  </>
                )}
              </button>

              {onAgendar && (
                <button
                  type="button"
                  id={`btn-agendar-shelf-${desafio.id}`}
                  onClick={() => onAgendar(desafio, selectedAluno)}
                  disabled={jaEnviadoParaAluno}
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-emerald-500/30 bg-[#021813] text-emerald-300 hover:bg-[#03241c] hover:border-emerald-400 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Agendar</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onDisparar(desafio)}
                className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20 text-xs font-bold transition-all cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Modal Completo</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Botões de Ação no Rodapé do Card */}
      <div className="mt-4 pt-3 border-t border-emerald-500/15 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            title="Copiar texto da mensagem"
            className="flex items-center gap-1 rounded-xl border border-emerald-500/25 bg-[#021813] px-2.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-[#03241c] active:scale-95 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-[11px]">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[11px]">Copiar</span>
              </>
            )}
          </button>

          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(desafio);
              }}
              title="Editar template"
              className="p-1.5 rounded-xl border border-emerald-500/20 bg-[#021813] text-slate-400 hover:text-cyan-300 hover:bg-[#03241c] transition-all cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
          )}

          {onDelete && desafio.profissional_id !== null && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(desafio.id);
              }}
              title="Excluir template customizado"
              className="p-1.5 rounded-xl border border-emerald-500/20 bg-[#021813] text-slate-400 hover:text-rose-400 hover:bg-[#03241c] transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onAgendar && (
            <button
              type="button"
              id={`btn-agendar-footer-${desafio.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onAgendar(desafio, selectedAluno);
              }}
              disabled={jaEnviadoParaAluno}
              className="flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-[#021813] px-2.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-[#03241c] hover:border-emerald-400 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px]">Agendar</span>
            </button>
          )}

          <button
            type="button"
            id={`btn-disparar-desafio-${desafio.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onDisparar(desafio);
            }}
            disabled={jaEnviadoParaAluno || isSendingBackground}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-black transition-all ${
              jaEnviadoParaAluno
                ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-95 cursor-pointer'
            }`}
          >
            {isSendingBackground ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-950" />
                <span>Enviando...</span>
              </>
            ) : jaEnviadoParaAluno ? (
              <>
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                <span>Já enviado</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5 fill-slate-950" />
                <span>Disparar Desafio</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 6. Status de Envio */}
      <div className="mt-2.5 pt-2 border-t border-emerald-500/10 flex items-center justify-between text-[11px] flex-wrap gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 uppercase font-bold">Status de Envio:</span>
          {jaEnviadoParaAluno ? (
            <span className="flex items-center gap-1 text-amber-300 font-bold bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px]">
              <Lock className="h-2.5 w-2.5 text-amber-400" />
              <span>Já enviado para {alunoFirstName} em {repeticaoStatus.dataEnvioFormatada}</span>
            </span>
          ) : quickSent ? (
            <span className="flex items-center gap-1 text-emerald-300 font-bold bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px]">
              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
              <span>Aceito pelo provedor • Registrado no histórico</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-400 text-[10px]">
              <Check className="h-2.5 w-2.5 text-emerald-400" />
              <span>Disponível para {alunoFirstName} (Inédito)</span>
            </span>
          )}
        </div>

        {selectedAluno && (
          <button
            type="button"
            onClick={() => setIsOptionsOpen(!isOptionsOpen)}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
          >
            {isOptionsOpen ? 'Recolher' : 'Disparo Rápido & Prévia'}
          </button>
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 rounded-2xl border border-emerald-400/50 bg-[#021813]/95 px-5 py-3 shadow-2xl backdrop-blur-xl text-xs font-bold text-emerald-300 flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}
    </div>
  );
};
