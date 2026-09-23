import React, { useState, useEffect, useTransition } from 'react';
import { 
  Bot, 
  Calendar, 
  Clock, 
  Send, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Settings, 
  Trash2, 
  Copy, 
  Smartphone,
  ExternalLink,
  Filter,
  Check,
  Zap,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { Aluno, AgendamentoWhatsApp, AgendamentoStatus } from '../../types';
import { 
  buscarAgendamentosWhatsApp, 
  cancelarAgendamentoWhatsApp, 
  dispararImediatamenteServidor, 
  forcarProcessamentoFila,
  obterStatusGateway
} from '../../lib/agendamentoWhatsAppService';
import { formatPhoneDisplay } from '../../lib/whatsappUtils';
import { AgendamentoWhatsAppModal } from './AgendamentoWhatsAppModal';
import { WhatsAppConfigModal } from './WhatsAppConfigModal';

interface AgendamentosWhatsAppSectionProps {
  aluno: Aluno;
  alunosList: Aluno[];
  onOpenAgendarModal?: () => void;
}

export const AgendamentosWhatsAppSection: React.FC<AgendamentosWhatsAppSectionProps> = ({
  aluno,
  alunosList,
}) => {
  const [agendamentos, setAgendamentos] = useState<AgendamentoWhatsApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEscopo, setFiltroEscopo] = useState<'aluno_atual' | 'todos'>('aluno_atual');
  const [filtroStatus, setFiltroStatus] = useState<AgendamentoStatus | 'todos'>('todos');
  const [isModalCreateOpen, setIsModalCreateOpen] = useState(false);
  const [isModalConfigOpen, setIsModalConfigOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [serverStats, setServerStats] = useState<{
    servidor_ativo: boolean;
    worker_rodando: boolean;
    provedor: string;
    fila_pendentes: number;
    total_enviados: number;
  }>({
    servidor_ativo: true,
    worker_rodando: true,
    provedor: 'RadarMove Auto-Pilot Engine',
    fila_pendentes: 0,
    total_enviados: 0,
  });

  const carregarDados = async () => {
    setLoading(true);
    try {
      const targetId = filtroEscopo === 'aluno_atual' ? aluno.id : undefined;
      const data = await buscarAgendamentosWhatsApp(targetId);
      setAgendamentos(data);

      const st = await obterStatusGateway();
      setServerStats(st);
    } catch (e) {
      console.warn('Erro ao carregar agendamentos:', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    carregarDados();
    // Atualização periódica a cada 15 segundos para acompanhar o worker do servidor
    const timer = setInterval(() => {
      carregarDados();
    }, 15000);
    return () => clearInterval(timer);
  }, [aluno.id, filtroEscopo]);

  const handleManualProcess = async () => {
    setIsRefreshing(true);
    setActionFeedback('Processando fila no servidor...');
    try {
      const res = await forcarProcessamentoFila();
      setActionFeedback(`Fila processada com sucesso! ${res.enviados} disparos executados pelo servidor.`);
      await carregarDados();
    } catch (e) {
      setActionFeedback('Fila verificada.');
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleDispararAgora = async (item: AgendamentoWhatsApp) => {
    setActionFeedback(`Disparando pelo servidor para ${item.aluno_nome || aluno.nome}...`);
    try {
      const res = await dispararImediatamenteServidor({
        id: item.id,
        aluno_id: item.aluno_id,
        aluno_nome: item.aluno_nome || aluno.nome,
        telefone: item.telefone,
        mensagem: item.mensagem,
      });
      setActionFeedback(res.message);
      await carregarDados();
    } catch (e: any) {
      setActionFeedback(`Erro: ${e.message}`);
    } finally {
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleCancelar = async (id: string) => {
    if (confirm('Deseja realmente cancelar este agendamento automático?')) {
      await cancelarAgendamentoWhatsApp(id);
      setAgendamentos((prev) => prev.filter((i) => i.id !== id));
      setActionFeedback('Agendamento cancelado com sucesso.');
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Formatação de data amigável com tempo relativo
  const formatScheduleTime = (iso: string) => {
    try {
      const date = new Date(iso);
      const now = new Date();
      const diffMs = date.getTime() - now.getTime();
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      let relativeStr = '';
      if (diffMs > 0) {
        if (diffHours < 1) relativeStr = 'em menos de 1 hora';
        else if (diffHours === 1) relativeStr = 'em 1 hora';
        else if (diffHours < 24) relativeStr = `em ${diffHours} horas`;
        else if (diffDays === 1) relativeStr = 'amanhã';
        else relativeStr = `em ${diffDays} dias`;
      } else {
        relativeStr = 'data atingida';
      }

      return {
        full: `${dateStr} às ${timeStr}`,
        relative: relativeStr,
      };
    } catch {
      return { full: iso, relative: '' };
    }
  };

  // Filtra itens
  const filteredAgendamentos = agendamentos.filter((item) => {
    if (filtroStatus !== 'todos' && item.status !== filtroStatus) return false;
    return true;
  });

  const countPendentes = agendamentos.filter((i) => i.status === 'pendente').length;
  const countEnviados = agendamentos.filter((i) => i.status === 'enviado').length;
  const countFalhas = agendamentos.filter((i) => i.status === 'falha').length;

  return (
    <div id="section-agendamentos-whatsapp" className="space-y-5 animate-in fade-in duration-200">
      {/* Toast Feedback */}
      {actionFeedback && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-[#02241b] px-4 py-3 text-xs font-bold text-cyan-300 shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* 1. Header & Server Engine Status Banner */}
      <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-[#03241b] to-[#021812] p-5 shadow-xl relative overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 shrink-0">
              <Bot className="h-6 w-6 stroke-[2.3]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-white">
                  Piloto Automático de WhatsApp
                </h3>
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-300 border border-emerald-500/30">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  Servidor Ativo
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  • {serverStats.provedor}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Envios programados executados diretamente no servidor via API. Zero cliques ou abas no WhatsApp Web.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleManualProcess}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-[#011e17] px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              title="Verifica agora se há agendamentos no horário para disparo imediato"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Processar Fila</span>
            </button>

            <button
              type="button"
              onClick={() => setIsModalConfigOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-[#011e17] px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              title="Configurar Provedor (Evolution API, Z-API, Meta Cloud API ou Motor Nativo)"
            >
              <Settings className="h-3.5 w-3.5 text-cyan-400" />
              <span>Configurações da API</span>
            </button>

            <button
              type="button"
              onClick={() => setIsModalCreateOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-md shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Agendar WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Mini Métricas do Motor */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-emerald-500/15">
          <div className="rounded-xl border border-emerald-500/15 bg-[#011913] p-2.5 flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Pendentes</div>
              <div className="text-sm font-extrabold text-white">{countPendentes}</div>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/15 bg-[#011913] p-2.5 flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Enviados pelo Servidor</div>
              <div className="text-sm font-extrabold text-emerald-400">{countEnviados}</div>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/15 bg-[#011913] p-2.5 flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Falhas / Retentativas</div>
              <div className="text-sm font-extrabold text-rose-300">{countFalhas}</div>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/15 bg-[#011913] p-2.5 flex items-center gap-2.5">
            <Zap className="h-4 w-4 text-cyan-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Status do Cron</div>
              <div className="text-xs font-bold text-cyan-300">A cada 20s (Auto)</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Controles de Filtro (Escopo e Status) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#032019]/90 border border-emerald-500/20 rounded-2xl p-3.5">
        {/* Alternador de Escopo */}
        <div className="flex items-center gap-1 bg-[#01150f] p-1 rounded-xl border border-emerald-500/20 text-xs">
          <button
            type="button"
            onClick={() => setFiltroEscopo('aluno_atual')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filtroEscopo === 'aluno_atual'
                ? 'bg-emerald-500/25 text-emerald-300 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Apenas de {aluno.nome.split(' ')[0]}
          </button>
          <button
            type="button"
            onClick={() => setFiltroEscopo('todos')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filtroEscopo === 'todos'
                ? 'bg-emerald-500/25 text-emerald-300 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos os Alunos
          </button>
        </div>

        {/* Filtro por Status */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setFiltroStatus('todos')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              filtroStatus === 'todos'
                ? 'bg-emerald-400 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({agendamentos.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltroStatus('pendente')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              filtroStatus === 'pendente'
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'text-amber-400/80 hover:text-amber-300'
            }`}
          >
            Pendentes ({countPendentes})
          </button>
          <button
            type="button"
            onClick={() => setFiltroStatus('enviado')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              filtroStatus === 'enviado'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            Enviados ({countEnviados})
          </button>
          {countFalhas > 0 && (
            <button
              type="button"
              onClick={() => setFiltroStatus('falha')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filtroStatus === 'falha'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'text-rose-400/80 hover:text-rose-300'
              }`}
            >
              Falhas ({countFalhas})
            </button>
          )}
        </div>
      </div>

      {/* 3. Lista de Agendamentos */}
      {loading ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-[#032019]/80 p-8 text-center text-slate-400 text-xs">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-400 mb-2" />
          Carregando agendamentos do servidor...
        </div>
      ) : filteredAgendamentos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-emerald-500/30 bg-[#032019]/60 p-10 text-center shadow-lg">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 mb-3">
            <Bot className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">
            Nenhum agendamento encontrado
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            {filtroEscopo === 'aluno_atual'
              ? `Programe lembretes de treino, metas de hidratação ou desafios para ${aluno.nome}. O servidor do RadarMove fará o envio 100% no automático.`
              : 'Nenhum agendamento na fila do servidor no momento.'}
          </p>
          <button
            type="button"
            onClick={() => setIsModalCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            Criar Primeiro Agendamento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAgendamentos.map((item) => {
            const timeInfo = formatScheduleTime(item.data_hora_envio);
            const isSent = item.status === 'enviado';
            const isPending = item.status === 'pendente';
            const isProcessing = item.status === 'processando';
            const isFailed = item.status === 'falha';

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                  isSent
                    ? 'border-emerald-500/30 bg-emerald-950/20'
                    : isPending
                    ? 'border-amber-500/30 bg-[#022119]'
                    : isProcessing
                    ? 'border-cyan-500/40 bg-cyan-950/20 animate-pulse'
                    : 'border-rose-500/30 bg-rose-950/20'
                }`}
              >
                <div>
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {item.aluno_nome || aluno.nome}
                        </span>
                        <span className="text-[11px] text-emerald-400 font-mono">
                          {formatPhoneDisplay(item.telefone)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-300 mt-1">
                        <Calendar className="h-3 w-3 text-cyan-400" />
                        <span className="font-semibold">{timeInfo.full}</span>
                        {isPending && timeInfo.relative && (
                          <span className="text-[10px] text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                            {timeInfo.relative}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isSent && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          Enviado via API
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-extrabold text-amber-300">
                          <Clock className="h-3 w-3 text-amber-400" />
                          Piloto Automático
                        </span>
                      )}
                      {isProcessing && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 text-[10px] font-extrabold text-cyan-300">
                          <RefreshCw className="h-3 w-3 text-cyan-400 animate-spin" />
                          Disparando...
                        </span>
                      )}
                      {isFailed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 text-[10px] font-extrabold text-rose-300">
                          <AlertCircle className="h-3 w-3 text-rose-400" />
                          Falha no Envio
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pré-visualização da Mensagem (Estilo Balão WhatsApp) */}
                  <div className="rounded-xl border border-emerald-500/20 bg-[#01140e] p-3 text-xs text-slate-200 leading-relaxed font-sans mb-3 relative">
                    <div className="text-[10px] text-emerald-400 font-bold mb-1 flex items-center gap-1">
                      <Smartphone className="h-3 w-3" />
                      Mensagem Automática:
                    </div>
                    {item.mensagem}

                    {item.erro_log && (
                      <div className="mt-2 text-[10px] text-rose-300 bg-rose-950/60 p-1.5 rounded border border-rose-500/30">
                        Motivo: {item.erro_log}
                      </div>
                    )}
                  </div>
                </div>

                {/* Rodapé de Ações */}
                <div className="flex items-center justify-between pt-2 border-t border-emerald-500/15 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(item.id, item.mensagem)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-500/20 transition-all cursor-pointer"
                      title="Copiar texto da mensagem"
                    >
                      {copiedId === item.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>

                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleCancelar(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                        title="Cancelar este agendamento"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Botão de Disparo Imediato via Servidor */}
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleDispararAgora(item)}
                        className="flex items-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-2.5 py-1 text-[11px] font-bold text-cyan-300 hover:bg-cyan-500/20 transition-all cursor-pointer"
                        title="Executa o envio pelo servidor agora mesmo"
                      >
                        <Send className="h-3 w-3" />
                        Disparar Agora (Servidor)
                      </button>
                    )}

                    {isFailed && (
                      <button
                        type="button"
                        onClick={() => handleDispararAgora(item)}
                        className="flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-500 transition-all cursor-pointer"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Tentar Novamente
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação de Agendamento */}
      <AgendamentoWhatsAppModal
        isOpen={isModalCreateOpen}
        onClose={() => setIsModalCreateOpen(false)}
        aluno={aluno}
        alunosList={alunosList}
        onAgendamentoCriado={() => {
          carregarDados();
        }}
      />

      {/* Modal de Configurações da API de WhatsApp */}
      <WhatsAppConfigModal
        isOpen={isModalConfigOpen}
        onClose={() => setIsModalConfigOpen(false)}
        onSaved={() => {
          carregarDados();
        }}
      />
    </div>
  );
};
