import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Send, 
  Mic, 
  Cake, 
  CalendarX2, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Flame, 
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { RadarAlerta, Aluno } from '../../types';

interface RadarRelacionamentoProps {
  alertas: RadarAlerta[];
  alunos: Aluno[];
  onOpenSendChallenge: (alerta: RadarAlerta) => void;
  onOpenVoiceModalForAluno: (aluno: Aluno) => void;
  onResolveAlerta: (alertaId: string) => void;
}

export const RadarRelacionamento: React.FC<RadarRelacionamentoProps> = ({
  alertas,
  alunos,
  onOpenSendChallenge,
  onOpenVoiceModalForAluno,
  onResolveAlerta,
}) => {
  const [filterType, setFilterType] = useState<'todos' | 'cancelamento' | 'aniversario' | 'sem_treino' | 'meta_batida'>('todos');

  const filteredAlertas = filterType === 'todos' 
    ? alertas 
    : alertas.filter((a) => a.tipo === filterType);

  const getAlertIcon = (tipo: RadarAlerta['tipo']) => {
    switch (tipo) {
      case 'cancelamento':
        return <CalendarX2 className="h-4 w-4 text-rose-400" />;
      case 'aniversario':
        return <Cake className="h-4 w-4 text-amber-400" />;
      case 'sem_treino':
        return <AlertTriangle className="h-4 w-4 text-rose-400" />;
      case 'meta_batida':
        return <Flame className="h-4 w-4 text-emerald-400" />;
      default:
        return <Sparkles className="h-4 w-4 text-cyan-400" />;
    }
  };

  const getUrgencyBadge = (urgencia: RadarAlerta['urgencia']) => {
    switch (urgencia) {
      case 'alta':
        return (
          <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
            Urgência Alta
          </span>
        );
      case 'media':
        return (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
            Atenção Hoje
          </span>
        );
      case 'baixa':
        return (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
            Oportunidade
          </span>
        );
    }
  };

  return (
    <div 
      id="radar-relacionamento-card"
      className="rounded-2xl border border-emerald-500/20 bg-[#032019]/90 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="border-b border-emerald-500/15 bg-[#021813]/80 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-emerald-500/20 border border-cyan-400/30 text-cyan-300">
            <Sparkles className="h-5 w-5 fill-cyan-400/40 text-cyan-300" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Radar de Relacionamento & Retenção
              </h3>
              <span className="rounded-full bg-rose-500/20 px-2 py-0.2 text-[10px] font-bold text-rose-300">
                {alertas.length} alertas
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Gatilhos automáticos para agir antes do aluno esfriar ou cancelar
            </p>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('todos')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
              filterType === 'todos'
                ? 'bg-cyan-400 text-slate-950 font-bold'
                : 'bg-[#021510] text-slate-400 hover:text-slate-200 border border-emerald-500/15'
            }`}
          >
            Todos ({alertas.length})
          </button>
          <button
            onClick={() => setFilterType('cancelamento')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
              filterType === 'cancelamento'
                ? 'bg-rose-500 text-white font-bold'
                : 'bg-[#021510] text-slate-400 hover:text-slate-200 border border-emerald-500/15'
            }`}
          >
            Cancelamentos
          </button>
          <button
            onClick={() => setFilterType('aniversario')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
              filterType === 'aniversario'
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'bg-[#021510] text-slate-400 hover:text-slate-200 border border-emerald-500/15'
            }`}
          >
            Aniversários
          </button>
          <button
            onClick={() => setFilterType('sem_treino')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
              filterType === 'sem_treino'
                ? 'bg-rose-500 text-white font-bold'
                : 'bg-[#021510] text-slate-400 hover:text-slate-200 border border-emerald-500/15'
            }`}
          >
            Sem Treino &gt; 5d
          </button>
        </div>
      </div>

      {/* Dynamic Alerts List */}
      <div className="p-4 md:p-5 space-y-3.5 flex-1 overflow-y-auto max-h-[580px]">
        {filteredAlertas.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-emerald-500/20 bg-[#021510]/50">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400 mb-2" />
            <h4 className="text-sm font-bold text-white">Nenhum alerta pendente nessa categoria</h4>
            <p className="text-xs text-slate-400 mt-1">Todos os alunos foram contatados ou estão em dia!</p>
          </div>
        ) : (
          filteredAlertas.map((alerta) => {
            const aluno = alunos.find((a) => a.id === alerta.aluno_id);
            return (
              <div
                key={alerta.id}
                id={`radar-alerta-${alerta.id}`}
                className="group relative rounded-2xl border border-emerald-500/20 bg-[#021712]/95 p-4 md:p-5 backdrop-blur-md shadow-md transition-all duration-200 hover:border-cyan-400/40 hover:bg-[#032019]"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Avatar and Trigger Info */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                      <div className="h-12 w-12 overflow-hidden rounded-xl border-2 border-emerald-500/30 bg-[#02130e]">
                        {alerta.aluno_avatar ? (
                          <img src={alerta.aluno_avatar} alt={alerta.aluno_nome} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center font-bold text-emerald-300">
                            {alerta.aluno_nome.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 rounded-md bg-[#021813] p-1 border border-emerald-500/30 shadow">
                        {getAlertIcon(alerta.tipo)}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm md:text-base font-bold text-white truncate">
                          {alerta.aluno_nome}
                        </h4>
                        {getUrgencyBadge(alerta.urgencia)}
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto md:ml-0">
                          <Clock className="h-3 w-3" />
                          {alerta.tempo_atras}
                        </span>
                      </div>

                      <p className="mt-1 text-xs md:text-sm text-slate-200 leading-relaxed font-sans">
                        {alerta.descricao}
                      </p>

                      {aluno && (
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                          <span className="font-medium text-emerald-400">
                            Plano: {aluno.plano}
                          </span>
                          <span>•</span>
                          <span>Telefone: {aluno.telefone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Quick Actions Group */}
                  <div className="flex flex-wrap items-center gap-2 self-end md:self-center flex-shrink-0">
                    {/* Botão de Gravar Áudio Rápido (Sem Digitar) */}
                    {aluno && (
                      <button
                        id={`btn-voice-alert-${alerta.id}`}
                        onClick={() => onOpenVoiceModalForAluno(aluno)}
                        title="Falar ou ditar mensagem de áudio para este aluno"
                        className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400 active:scale-95 transition-all"
                      >
                        <Mic className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="hidden sm:inline">Áudio</span>
                      </button>
                    )}

                    {/* Botão Principal Ciano "Enviar Desafio" */}
                    <button
                      id={`btn-send-challenge-${alerta.id}`}
                      onClick={() => onOpenSendChallenge(alerta)}
                      className="group/btn relative flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 px-4 py-2 text-xs md:text-sm font-extrabold text-slate-950 shadow-lg shadow-cyan-400/20 hover:brightness-110 active:scale-95 transition-all"
                    >
                      <Send className="h-3.5 w-3.5 text-slate-950 group-hover/btn:translate-x-0.5 transition-transform" />
                      <span>Enviar Desafio</span>
                    </button>

                    {/* Botão Marcar Como Resolvido */}
                    <button
                      id={`btn-resolve-alert-${alerta.id}`}
                      onClick={() => onResolveAlerta(alerta.id)}
                      title="Marcar como atendido"
                      className="rounded-xl border border-emerald-500/20 bg-[#021510] p-2 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Tip */}
      <div className="border-t border-emerald-500/15 bg-[#02140f] p-3 px-5 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Dica do CRM: Contatar o aluno nas primeiras 2 horas após o cancelamento reduz o risco de desistência em 78%.</span>
        </span>
      </div>
    </div>
  );
};
