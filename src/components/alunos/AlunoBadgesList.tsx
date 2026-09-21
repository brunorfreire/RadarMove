import React, { useState } from 'react';
import { 
  Shield, 
  Flame, 
  Trophy, 
  Zap, 
  Activity, 
  Award, 
  Sparkles, 
  ChevronRight,
  Info
} from 'lucide-react';
import { AlunoBadge, Aluno, AvaliacaoFisica } from '../../types';
import { calcularBadgesDoAluno } from '../../lib/badges';
import { BadgeModal } from './BadgeModal';

interface AlunoBadgesListProps {
  aluno: Aluno;
  avaliacoes: AvaliacaoFisica[];
  onSendWhatsAppCelebration?: (texto: string) => void;
}

export const AlunoBadgesList: React.FC<AlunoBadgesListProps> = ({
  aluno,
  avaliacoes,
  onSendWhatsAppCelebration,
}) => {
  const [selectedBadge, setSelectedBadge] = useState<AlunoBadge | null>(null);

  // Compute badges dynamically based on current student data and assessments
  const badges = calcularBadgesDoAluno(aluno, avaliacoes);

  const getBadgeIcon = (icone: string) => {
    switch (icone) {
      case 'flame':
        return <Flame className="h-3.5 w-3.5 text-amber-400" />;
      case 'shield':
        return <Shield className="h-3.5 w-3.5 text-cyan-400" />;
      case 'activity':
        return <Activity className="h-3.5 w-3.5 text-emerald-400" />;
      case 'trophy':
        return <Trophy className="h-3.5 w-3.5 text-yellow-300" />;
      case 'zap':
        return <Zap className="h-3.5 w-3.5 text-cyan-300" />;
      case 'award':
      default:
        return <Award className="h-3.5 w-3.5 text-teal-300" />;
    }
  };

  const getRaridadeBorder = (raridade: AlunoBadge['raridade']) => {
    switch (raridade) {
      case 'diamante':
        return 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200 hover:border-cyan-300 shadow-sm shadow-cyan-500/10';
      case 'ouro':
        return 'border-amber-400/40 bg-amber-400/10 text-amber-200 hover:border-amber-300 shadow-sm shadow-amber-500/10';
      case 'prata':
        return 'border-slate-300/30 bg-slate-400/10 text-slate-200 hover:border-slate-200';
      case 'bronze':
      default:
        return 'border-amber-600/30 bg-amber-700/10 text-amber-300 hover:border-amber-500';
    }
  };

  if (badges.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/15 bg-[#021813]/60 px-3 py-2 text-xs text-slate-400">
        <Info className="h-4 w-4 text-slate-500" />
        <span>Nenhum selo ativo no momento. Incentive check-ins ou registre uma bioimpedância para desbloquear!</span>
      </div>
    );
  }

  return (
    <div id="aluno-badges-section" className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          Selos de Conquista & Retenção ({badges.length}):
        </span>
        <span className="text-[10px] text-cyan-300/80 font-semibold">
          Clique no selo para parabenizar via WhatsApp
        </span>
      </div>

      {/* Badges Flow Container */}
      <div className="flex flex-wrap items-center gap-2">
        {badges.map((b) => {
          return (
            <button
              key={b.id}
              id={`badge-pill-${b.id}`}
              type="button"
              onClick={() => setSelectedBadge(b)}
              title={`${b.nome}: ${b.descricao} (Clique para ver detalhes)`}
              className={`group flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all duration-200 active:scale-95 ${getRaridadeBorder(
                b.raridade
              )}`}
            >
              <span className="flex-shrink-0 group-hover:scale-110 transition-transform">
                {getBadgeIcon(b.icone)}
              </span>
              <span className="font-extrabold tracking-tight">{b.nome}</span>
              <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-black/40 text-slate-400 font-mono">
                {b.raridade}
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail & WhatsApp Celebration Modal */}
      <BadgeModal
        isOpen={!!selectedBadge}
        onClose={() => setSelectedBadge(null)}
        badge={selectedBadge}
        aluno={aluno}
        onSendWhatsAppMsg={onSendWhatsAppCelebration}
      />
    </div>
  );
};
