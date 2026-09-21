import React, { useState } from 'react';
import { 
  X, 
  Send, 
  ExternalLink, 
  Sparkles, 
  Check, 
  Shield, 
  Flame, 
  Trophy, 
  Zap, 
  Activity, 
  Award, 
  Copy 
} from 'lucide-react';
import { AlunoBadge, Aluno } from '../../types';
import { openWhatsApp } from '../../lib/whatsappUtils';

interface BadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  badge: AlunoBadge | null;
  aluno: Aluno;
  onSendWhatsAppMsg?: (texto: string) => void;
}

export const BadgeModal: React.FC<BadgeModalProps> = ({
  isOpen,
  onClose,
  badge,
  aluno,
  onSendWhatsAppMsg,
}) => {
  if (!isOpen || !badge) return null;

  const [copied, setCopied] = useState(false);

  const getBadgeIcon = (icone: string) => {
    switch (icone) {
      case 'flame':
        return <Flame className="h-10 w-10 text-amber-400 animate-pulse" />;
      case 'shield':
        return <Shield className="h-10 w-10 text-cyan-400" />;
      case 'activity':
        return <Activity className="h-10 w-10 text-emerald-400" />;
      case 'trophy':
        return <Trophy className="h-10 w-10 text-yellow-400" />;
      case 'zap':
        return <Zap className="h-10 w-10 text-cyan-300" />;
      case 'award':
      default:
        return <Award className="h-10 w-10 text-teal-300" />;
    }
  };

  const getRaridadeStyle = (raridade: AlunoBadge['raridade']) => {
    switch (raridade) {
      case 'diamante':
        return {
          badge: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40 shadow-cyan-500/20',
          glow: 'from-cyan-500/30 to-teal-500/10 border-cyan-400/50',
          pill: 'bg-cyan-400 text-slate-950 font-black',
        };
      case 'ouro':
        return {
          badge: 'bg-amber-400/20 text-amber-300 border-amber-400/40 shadow-amber-500/20',
          glow: 'from-amber-500/30 to-yellow-500/10 border-amber-400/50',
          pill: 'bg-amber-400 text-slate-950 font-black',
        };
      case 'prata':
        return {
          badge: 'bg-slate-300/20 text-slate-200 border-slate-300/40 shadow-slate-400/20',
          glow: 'from-slate-400/20 to-teal-500/10 border-slate-400/40',
          pill: 'bg-slate-300 text-slate-950 font-black',
        };
      case 'bronze':
      default:
        return {
          badge: 'bg-amber-700/20 text-amber-400 border-amber-600/40 shadow-amber-700/20',
          glow: 'from-amber-700/20 to-orange-500/10 border-amber-600/40',
          pill: 'bg-amber-600 text-white font-black',
        };
    }
  };

  const style = getRaridadeStyle(badge.raridade);
  const personalizedMessage = badge.mensagemIncentivo.replace(
    /\{aluno\}/g,
    aluno.nome.split(' ')[0]
  );

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(personalizedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsAppDirect = () => {
    openWhatsApp(aluno.telefone, personalizedMessage);
    if (onSendWhatsAppMsg) {
      onSendWhatsAppMsg(personalizedMessage);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        id={`modal-badge-detalhe-${badge.id}`}
        className="w-full max-w-md rounded-3xl border border-emerald-500/30 bg-[#032019]/95 p-6 shadow-2xl backdrop-blur-xl relative flex flex-col text-slate-100 overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-b ${style.glow} opacity-40 blur-2xl pointer-events-none`} />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-xl p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Badge Hero Icon */}
        <div className="flex flex-col items-center text-center mt-2 relative z-10">
          <div className={`relative flex h-24 w-24 items-center justify-center rounded-3xl border-2 p-4 shadow-xl backdrop-blur-xl mb-4 ${style.badge}`}>
            {getBadgeIcon(badge.icone)}
            <div className="absolute -bottom-2.5 px-3 py-0.5 rounded-full text-[9px] uppercase tracking-wider shadow-md ${style.pill}">
              {badge.raridade}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-cyan-400 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            Selo Conquistado por {aluno.nome.split(' ')[0]}
          </div>

          <h3 className="text-xl font-extrabold text-white tracking-tight">
            {badge.nome}
          </h3>

          <p className="text-xs text-slate-300 mt-1 max-w-xs leading-relaxed">
            {badge.descricao}
          </p>
        </div>

        {/* Achievement Criteria Card */}
        <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-[#021813] p-3.5 text-left text-xs space-y-1 relative z-10">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Critério Alcançado no CRM:
          </span>
          <p className="text-emerald-300 font-semibold text-xs">
            ✓ {badge.criterio}
          </p>
        </div>

        {/* WhatsApp Motivational Bubble Preview */}
        <div className="mt-3 rounded-2xl border border-emerald-500/20 bg-[#02140f] p-3.5 text-left relative z-10 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-white/5 pb-1">
            <span className="font-bold text-cyan-300 flex items-center gap-1">
              💬 Mensagem de Parabéns Pronta:
            </span>
            <button
              onClick={handleCopyMessage}
              className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-200 font-sans italic leading-relaxed">
            "{personalizedMessage}"
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-3 border-t border-emerald-500/20 flex items-center justify-end gap-2 relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-all"
          >
            Fechar
          </button>

          <button
            type="button"
            id="btn-enviar-parabens-whatsapp"
            onClick={handleOpenWhatsAppDirect}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-lg shadow-cyan-400/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Send className="h-3.5 w-3.5 fill-slate-950 text-slate-950" />
            <span>Parabenizar no WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
