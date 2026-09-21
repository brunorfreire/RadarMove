import React from 'react';
import { Users, Zap, AlertTriangle, TrendingUp, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface TopCardsProps {
  totalAlunos: number;
  desafiosEnviados: number;
  alunosEmRisco: number;
  taxaRetencao: number;
  onFilterRisco?: () => void;
}

export const TopCards: React.FC<TopCardsProps> = ({
  totalAlunos,
  desafiosEnviados,
  alunosEmRisco,
  taxaRetencao,
  onFilterRisco,
}) => {
  return (
    <div id="dashboard-top-cards" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Card 1: Alunos Ativos */}
      <div 
        id="metric-card-alunos-ativos"
        className="relative group overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#032019]/90 p-5 backdrop-blur-xl shadow-lg transition-all duration-200 hover:border-emerald-400/40 hover:shadow-emerald-500/5"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Alunos Ativos
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Users className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {totalAlunos}
            </span>
            <span className="text-xs text-slate-400 ml-2">matriculados</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/25">
            <ArrowUpRight className="h-3 w-3" />
            +3 este mês
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-emerald-500/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>Frequência semanal média:</span>
          <span className="font-semibold text-slate-200">3.2x / semana</span>
        </div>
      </div>

      {/* Card 2: Desafios Enviados */}
      <div 
        id="metric-card-desafios-enviados"
        className="relative group overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#032019]/90 p-5 backdrop-blur-xl shadow-lg transition-all duration-200 hover:border-cyan-400/40 hover:shadow-cyan-500/5"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Desafios Enviados
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-400">
            <Zap className="h-4 w-4 fill-cyan-400" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {desafiosEnviados}
            </span>
            <span className="text-xs text-slate-400 ml-2">este mês</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-cyan-400/15 px-2 py-0.5 text-xs font-bold text-cyan-300 border border-cyan-400/25">
            <CheckCircle2 className="h-3 w-3" />
            89% resposta
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-emerald-500/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>Hoje pelo WhatsApp:</span>
          <span className="font-semibold text-cyan-300">18 micro-desafios</span>
        </div>
      </div>

      {/* Card 3: Alunos em Risco */}
      <div 
        id="metric-card-alunos-risco"
        onClick={onFilterRisco}
        className="relative group overflow-hidden rounded-2xl border border-rose-500/30 bg-[#032019]/90 p-5 backdrop-blur-xl shadow-lg transition-all duration-200 hover:border-rose-400/60 hover:bg-[#06241b] cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            Alunos em Risco
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-extrabold text-rose-400 tracking-tight">
              {alunosEmRisco}
            </span>
            <span className="text-xs text-slate-400 ml-2">sem check-in &gt; 5d</span>
          </div>
          <div className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[11px] font-bold text-rose-300 border border-rose-500/30">
            Atenção Hoje
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-rose-500/15 flex items-center justify-between text-[11px] text-rose-300/80">
          <span>Ação preventiva:</span>
          <span className="font-semibold text-rose-200 underline decoration-dotted">Ver no Radar →</span>
        </div>
      </div>

      {/* Card 4: Taxa de Retenção */}
      <div 
        id="metric-card-taxa-retencao"
        className="relative group overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#032019]/90 p-5 backdrop-blur-xl shadow-lg transition-all duration-200 hover:border-emerald-400/40 hover:shadow-emerald-500/5"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Taxa de Retenção
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              {taxaRetencao}%
            </span>
            <span className="text-xs text-slate-400 ml-2">últimos 90 dias</span>
          </div>
          <div className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/25">
            0 cancelamentos
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-emerald-500/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>Tempo médio de permanência:</span>
          <span className="font-semibold text-slate-200">11.4 meses</span>
        </div>
      </div>
    </div>
  );
};
