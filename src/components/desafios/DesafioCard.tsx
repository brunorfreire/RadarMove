import React, { useState } from 'react';
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
  Calendar
} from 'lucide-react';
import { DesafioTemplate, CategoriaDesafio, Aluno, DesafioEnviado } from '../../types';
import { openWhatsApp } from '../../lib/whatsappUtils';
import { verificarDesafioRepetido } from '../../lib/historicoDesafiosUtils';

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
          textColor: 'text-purple-300',
          borderColor: 'border-purple-500/30',
          bgBadge: 'bg-purple-400/15 text-purple-300 border-purple-400/30',
          accentGlow: 'from-purple-500/15 to-transparent',
        };
    }
  };

  const getDifficultyBadge = (dif: DesafioTemplate['dificuldade']) => {
    switch (dif) {
      case 'Fácil':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Médio':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      case 'Desafiador':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
    }
  };

  const config = getCategoryConfig(desafio.categoria);
  const CategoryIcon = config.icon;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(desafio.mensagem_whatsapp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedAluno = alunos.find((a) => a.id === selectedAlunoId) || alunos[0];
  const alunoFirstName = selectedAluno ? selectedAluno.nome.split(' ')[0] : 'Aluno';

  // Check if challenge was already sent to the selected student
  const repeticaoStatus = verificarDesafioRepetido(
    historico,
    selectedAluno?.id || '',
    desafio.id,
    desafio.titulo
  );

  const formatMessageForAluno = () => {
    return desafio.mensagem_whatsapp
      .replace(/\{aluno\}/g, alunoFirstName)
      .replace(/\{personal\}/g, 'Treinador');
  };

  const handleQuickSend = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedAluno) return;
    const personalizedText = formatMessageForAluno();
    openWhatsApp(selectedAluno.telefone, personalizedText);

    if (onQuickSendWhatsApp) {
      onQuickSendWhatsApp(selectedAluno, desafio, personalizedText);
    }
    setQuickSent(true);
    setTimeout(() => setQuickSent(false), 3500);
  };

  // Render message with highlighted tag
  const renderMessageWithTags = (text: string) => {
    const parts = text.split(/(\{aluno\}|\{personal\})/g);
    return parts.map((part, i) => {
      if (part === '{aluno}') {
        return (
          <span key={i} className="rounded bg-cyan-400/20 px-1 py-0.5 font-bold text-cyan-300 border border-cyan-400/30">
            {'{aluno}'}
          </span>
        );
      }
      if (part === '{personal}') {
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
      className={`rounded-2xl border transition-all duration-200 backdrop-blur-xl shadow-xl p-5 flex flex-col justify-between relative overflow-hidden group ${
        isOptionsOpen
          ? 'border-cyan-400 bg-[#03241d] ring-2 ring-cyan-400/20'
          : 'border-emerald-500/20 bg-[#032019]/90 hover:border-emerald-400/50 hover:shadow-2xl hover:shadow-cyan-500/5'
      }`}
    >
      {/* Top Accent Gradient Header */}
      <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${config.accentGlow}`} />

      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${config.bgBadge}`}>
              <CategoryIcon className="h-3 w-3" />
              {desafio.categoria}
            </span>

            {/* Repetition indicator for selected student */}
            {selectedAluno && (
              repeticaoStatus.repetido ? (
                <span 
                  title={`Este desafio já foi enviado ${repeticaoStatus.totalEnvios}x para ${alunoFirstName}`}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold bg-amber-400/15 border border-amber-400/30 text-amber-300"
                >
                  <AlertTriangle className="h-2.5 w-2.5 text-amber-400" />
                  <span>Enviado {repeticaoStatus.totalEnvios}x ({alunoFirstName})</span>
                </span>
              ) : (
                <span 
                  title={`Desafio inédito para ${alunoFirstName}`}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
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

        {/* Title */}
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

        {/* WhatsApp Message Preview Bubble */}
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

        {/* EXPANDED OPTIONS DIRECTLY BELOW THIS CARD */}
        {isOptionsOpen && (
          <div 
            id={`opcoes-desafio-${desafio.id}`}
            className="mt-3.5 p-3.5 rounded-xl border border-cyan-400/40 bg-[#02140f] space-y-3 animate-in slide-in-from-top-2 duration-200 text-xs shadow-inner"
          >
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5 text-xs">
                <Zap className="h-3.5 w-3.5 text-cyan-400" />
                Opções Rápidas do Desafio
              </span>
              <button
                type="button"
                onClick={() => setIsOptionsOpen(false)}
                className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer bg-white/5 px-2 py-0.5 rounded"
              >
                <ChevronUp className="h-3 w-3" />
                Voltar / Recolher
              </button>
            </div>

            {/* Select student recipient */}
            {alunos.length > 0 && (
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Enviar diretamente para:
                </label>
                <select
                  value={selectedAlunoId}
                  onChange={(e) => setSelectedAlunoId(e.target.value)}
                  className="w-full rounded-lg border border-emerald-500/30 bg-[#032019] px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                >
                  {alunos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome} ({a.telefone})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Text preview with student name */}
            <div className="p-2 rounded-lg bg-black/40 border border-white/5 text-[11px] text-slate-300 italic">
              &quot;{formatMessageForAluno()}&quot;
            </div>

            {/* Repetition Alert Banner in options shelf */}
            {selectedAluno && (
              repeticaoStatus.repetido ? (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300">Atenção: Desafio Já Enviado para {alunoFirstName}</span>
                    <p className="text-[11px] text-amber-200/90 mt-0.5">
                      Este aluno já recebeu este micro-desafio {repeticaoStatus.totalEnvios}x no histórico
                      {repeticaoStatus.ultimoEnvio && (
                        <span> (último em {repeticaoStatus.ultimoEnvio.data_formatada || repeticaoStatus.ultimoEnvio.tempo_atras})</span>
                      )}. Você pode reenviar para reforçar ou escolher outro.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Desafio inédito: {alunoFirstName} ainda não recebeu este micro-desafio.</span>
                </div>
              )
            )}

            {/* Quick Actions in options shelf */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <button
                type="button"
                id={`btn-enviar-wpp-rapido-${desafio.id}`}
                onClick={handleQuickSend}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer ${
                  repeticaoStatus.repetido
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-amber-500/20 hover:brightness-110'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 shadow-cyan-500/20 hover:brightness-110'
                } active:scale-95`}
              >
                <Send className="h-3.5 w-3.5 fill-slate-950 text-slate-950" />
                <span>
                  {quickSent 
                    ? 'Reenviado!' 
                    : repeticaoStatus.repetido 
                      ? `Reenviar no WhatsApp (${alunoFirstName})` 
                      : `Enviar no WhatsApp (${alunoFirstName})`}
                </span>
              </button>

              {onAgendar && (
                <button
                  type="button"
                  id={`btn-agendar-shelf-${desafio.id}`}
                  onClick={() => onAgendar(desafio, selectedAluno)}
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-emerald-500/30 bg-[#021813] text-emerald-300 hover:bg-[#03241c] hover:border-emerald-400 text-xs font-bold transition-all cursor-pointer"
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
                <span>Mais opções</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOptionsOpen(false)}
                className="px-2.5 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Voltar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Footers */}
      <div className="mt-4 pt-3 border-t border-emerald-500/15 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {/* Copy Button */}
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

          {/* Edit Template (if provided) */}
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

          {/* Delete Template (if provided and custom) */}
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

        {/* Primary CTA: Toggle Options or Disparar */}
        <div className="flex items-center gap-1.5">
          {onAgendar && (
            <button
              type="button"
              id={`btn-agendar-footer-${desafio.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onAgendar(desafio, alunos.find(a => a.id === selectedAlunoId) || alunos[0]);
              }}
              title="Agendar disparo programado"
              className="flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-[#021813] px-2.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-[#03241c] hover:border-emerald-400 active:scale-95 transition-all cursor-pointer"
            >
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              <span>Agendar</span>
            </button>
          )}

          <button
            type="button"
            id={`btn-opcoes-${desafio.id}`}
            onClick={() => setIsOptionsOpen(!isOptionsOpen)}
            className="flex items-center gap-1 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-400/20 active:scale-95 transition-all cursor-pointer"
          >
            {isOptionsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            <span>{isOptionsOpen ? 'Recolher' : 'Opções'}</span>
          </button>

          <button
            id={`btn-disparar-${desafio.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onDisparar(desafio);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 px-3.5 py-1.5 text-xs font-extrabold text-slate-950 shadow-md shadow-cyan-400/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <Send className="h-3.5 w-3.5 text-slate-950 fill-slate-950" />
            <span>Disparar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
