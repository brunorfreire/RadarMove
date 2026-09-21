import React, { useState } from 'react';
import { 
  UserPlus, 
  Sparkles, 
  Target, 
  Flame, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  Search, 
  Filter, 
  LayoutGrid, 
  ListFilter, 
  MessageSquare, 
  Send, 
  Clock, 
  ArrowRight,
  Trophy,
  Phone,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Lead, DesafioTemplate, Aluno, LeadStatus, LeadTemperatura } from '../../types';
import { LeadCard } from './LeadCard';
import { NovoLeadModal } from './NovoLeadModal';
import { EnviarDesafioLeadModal } from './EnviarDesafioLeadModal';
import { FollowUpModal } from './FollowUpModal';
import { ConverterLeadModal } from './ConverterLeadModal';
import { registrarInteracaoLead } from '../../lib/leadsFollowupUtils';

interface LeadsViewProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  templates: DesafioTemplate[];
  onAlunoConvertido: (novoAluno: Aluno, lead: Lead) => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  setLeads,
  templates,
  onAlunoConvertido,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [temperaturaFilter, setTemperaturaFilter] = useState<'todas' | LeadTemperatura>('todas');
  const [statusFilter, setStatusFilter] = useState<'todos' | LeadStatus>('todos');
  const [viewMode, setViewMode] = useState<'kanban' | 'lista'>('kanban');

  // Modals state
  const [isNovoLeadModalOpen, setIsNovoLeadModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  
  const [isEnviarDesafioModalOpen, setIsEnviarDesafioModalOpen] = useState(false);
  const [leadForDesafio, setLeadForDesafio] = useState<Lead | null>(null);

  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);
  const [leadForFollowup, setLeadForFollowup] = useState<Lead | null>(null);

  const [isConverterModalOpen, setIsConverterModalOpen] = useState(false);
  const [leadForConverter, setLeadForConverter] = useState<Lead | null>(null);

  // Success Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Metrics calculations
  const totalLeads = leads.length;
  const desafiosAtivos = leads.filter(l => l.status === 'desafio_enviado' || l.desafio_ativo_titulo).length;
  const emFollowup = leads.filter(l => l.status === 'em_followup' || l.proximo_followup === 'Hoje').length;
  const convertidos = leads.filter(l => l.status === 'convertido').length;
  const taxaConversao = totalLeads > 0 ? Math.round((convertidos / totalLeads) * 100) : 0;
  const receitaEstimadaGanha = leads
    .filter(l => l.status === 'convertido')
    .reduce((acc, l) => acc + (l.valor_estimado_plano || 0), 0);

  // Filtered Leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefone.includes(searchTerm) ||
      lead.objetivo_interesse.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTemp = temperaturaFilter === 'todas' || lead.temperatura === temperaturaFilter;
    const matchesStatus = statusFilter === 'todos' || lead.status === statusFilter;

    return matchesSearch && matchesTemp && matchesStatus;
  });

  // Handlers
  const handleSaveNovoLead = (leadData: Partial<Lead>) => {
    if (leadToEdit) {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadToEdit.id ? ({ ...l, ...leadData } as Lead) : l))
      );
      showToast(`Lead "${leadData.nome}" atualizado com sucesso!`);
      setLeadToEdit(null);
    } else {
      const novo: Lead = {
        id: `lead-${Date.now()}`,
        profissional_id: 'prof-001',
        nome: leadData.nome || 'Novo Lead',
        telefone: leadData.telefone || '',
        origem: leadData.origem || 'instagram',
        objetivo_interesse: leadData.objetivo_interesse || 'Melhora de saúde',
        status: 'novo',
        temperatura: leadData.temperatura || 'quente',
        etapa_followup: 0,
        data_criacao: new Date().toISOString(),
        ultimo_contato: new Date().toISOString(),
        proximo_followup: 'Hoje',
        valor_estimado_plano: leadData.valor_estimado_plano || 350,
        notas: leadData.notas,
        historico_interacoes: [
          {
            id: `int-${Date.now()}`,
            data: new Date().toISOString(),
            dataFormatada: 'Hoje às ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            tipo: 'anotacao',
            titulo: 'Lead Cadastrado',
            descricao: 'Lead adicionado ao funil de conversão.',
          }
        ],
      };
      setLeads((prev) => [novo, ...prev]);
      showToast(`Lead "${novo.nome}" cadastrado no funil!`);
    }
  };

  const handleDesafioEnviadoParaLead = (leadId: string, desafio: DesafioTemplate, mensagemEnviada: string) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== leadId) return l;
        const updated = registrarInteracaoLead(
          l,
          'desafio_enviado',
          `Desafio Degustação: ${desafio.titulo}`,
          `Enviado via WhatsApp: "${desafio.titulo}".`
        );
        return {
          ...updated,
          status: 'desafio_enviado',
          desafio_ativo_id: desafio.id,
          desafio_ativo_titulo: desafio.titulo,
          data_envio_desafio: new Date().toISOString(),
          dias_desafio_decorridos: 0,
          etapa_followup: 1,
          proximo_followup: 'Amanhã',
        };
      })
    );
    showToast(`Desafio enviado com sucesso para o lead via WhatsApp!`);
  };

  const handleSalvarInteracaoFollowup = (
    leadId: string,
    mensagemEnviada: string,
    novaEtapa: number,
    novoStatus: LeadStatus,
    notaAdicional?: string
  ) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== leadId) return l;
        const updated = registrarInteracaoLead(
          l,
          'followup_realizado',
          `Follow-up Etapa ${novaEtapa}`,
          `Mensagem disparada via WhatsApp. ${notaAdicional ? `Feedback: ${notaAdicional}` : ''}`
        );
        return {
          ...updated,
          status: novoStatus,
          etapa_followup: novaEtapa,
          notas: notaAdicional ? `${l.notas || ''} | ${notaAdicional}` : l.notas,
        };
      })
    );
    showToast(`Follow-up registrado com sucesso!`);
  };

  const handleConfirmarConversao = (
    lead: Lead,
    novoAluno: Aluno,
    mensagemBoasVindas?: string,
    enviarWhatsApp?: boolean
  ) => {
    // 1. Update lead status to convertido
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== lead.id) return l;
        const updated = registrarInteracaoLead(
          l,
          'convertido_aluno',
          '🎉 Convertido em Aluno Oficial!',
          `Matriculado no plano ${novoAluno.plano}.`
        );
        return {
          ...updated,
          status: 'convertido',
        };
      })
    );

    // 2. Add to Alunos list via parent callback
    onAlunoConvertido(novoAluno, lead);
    showToast(`🎉 Parabéns! ${lead.nome} agora é oficialmente seu aluno!`);
  };

  // Kanban Column Groups
  const colunasKanban: { status: LeadStatus; titulo: string; cor: string; badgeCor: string }[] = [
    { status: 'novo', titulo: '1. Novos Leads', cor: 'border-slate-500/30', badgeCor: 'bg-slate-500/20 text-slate-300' },
    { status: 'desafio_enviado', titulo: '2. Desafio Enviado (Degustação)', cor: 'border-cyan-500/30', badgeCor: 'bg-cyan-500/20 text-cyan-300' },
    { status: 'em_followup', titulo: '3. Em Follow-up Ativo', cor: 'border-amber-500/30', badgeCor: 'bg-amber-500/20 text-amber-300' },
    { status: 'proposta_enviada', titulo: '4. Proposta Apresentada', cor: 'border-indigo-500/30', badgeCor: 'bg-indigo-500/20 text-indigo-300' },
    { status: 'convertido', titulo: '5. Convertidos em Alunos 🎉', cor: 'border-emerald-500/30', badgeCor: 'bg-emerald-500/20 text-emerald-300' },
  ];

  return (
    <div id="leads-conversao-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-400 bg-[#021813] px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-emerald-950 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-500/15 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-md bg-cyan-400/20 px-2 py-0.5 text-xs font-bold text-cyan-300 border border-cyan-400/30">
              Aquisição & Vendas
            </span>
            <span className="text-xs text-slate-400">Personal Trainer CRM</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Funil de Leads & Desafios de Conversão
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Envie micro-desafios de degustação via WhatsApp, realize follow-up estratégico guiado por scripts e converta possíveis clientes em alunos pagantes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {/* View Toggle */}
          <div className="flex items-center rounded-xl bg-[#02140f] p-1 border border-emerald-500/20">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Funil</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('lista')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'lista'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span>Lista</span>
            </button>
          </div>

          {/* Novo Lead Button */}
          <button
            type="button"
            onClick={() => {
              setLeadToEdit(null);
              setIsNovoLeadModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 px-4 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Novo Lead</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Leads */}
        <div className="rounded-2xl border border-emerald-500/20 bg-[#021813]/90 p-4 shadow-md shadow-emerald-950/40">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold">Total no Funil</span>
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{totalLeads}</span>
            <span className="text-xs text-slate-400">prospectos</span>
          </div>
        </div>

        {/* Desafios Ativos */}
        <div className="rounded-2xl border border-cyan-500/25 bg-[#021813]/90 p-4 shadow-md shadow-cyan-950/40">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold">Desafios em Degustação</span>
            <Target className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-300">{desafiosAtivos}</span>
            <span className="text-xs text-cyan-400/80">ativos no WhatsApp</span>
          </div>
        </div>

        {/* Follow-up Pendente */}
        <div className="rounded-2xl border border-amber-500/25 bg-[#021813]/90 p-4 shadow-md shadow-amber-950/40">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold">Follow-up Hoje</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-300">{emFollowup}</span>
            <span className="text-xs text-amber-400/80">precisam de retorno</span>
          </div>
        </div>

        {/* Convertidos & Taxa */}
        <div className="rounded-2xl border border-emerald-500/30 bg-[#03231a]/90 p-4 shadow-md shadow-emerald-950/50">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold">Convertidos em Alunos</span>
            <Trophy className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-300">{convertidos}</span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/30">
              {taxaConversao}% de conversão
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#021813] border border-emerald-500/15 p-3">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar lead por nome, telefone ou objetivo..."
            className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Temperatura */}
          <div className="flex items-center gap-1 bg-[#02130e] p-1 rounded-xl border border-emerald-500/20">
            <span className="text-[11px] text-slate-400 px-2">Temp:</span>
            {(['todas', 'quente', 'morno', 'frio'] as const).map((temp) => (
              <button
                key={temp}
                type="button"
                onClick={() => setTemperaturaFilter(temp)}
                className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all ${
                  temperaturaFilter === temp
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {temp === 'quente' ? '🔥 Quente' : temp === 'morno' ? '⚡ Morno' : temp === 'frio' ? '❄️ Frio' : 'Todas'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban Pipeline View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
          {colunasKanban.map((coluna) => {
            const leadsNaColuna = filteredLeads.filter(l => l.status === coluna.status);

            return (
              <div 
                key={coluna.status}
                className="rounded-2xl bg-[#02140f]/90 border border-emerald-500/15 p-3 flex flex-col min-h-[480px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-500/10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white leading-tight">
                      {coluna.titulo}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 ${coluna.badgeCor}`}>
                    {leadsNaColuna.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-0.5">
                  {leadsNaColuna.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-emerald-500/15 p-6 text-center text-xs text-slate-500">
                      Nenhum lead nesta fase
                    </div>
                  ) : (
                    leadsNaColuna.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onOpenEnviarDesafio={(l) => {
                          setLeadForDesafio(l);
                          setIsEnviarDesafioModalOpen(true);
                        }}
                        onOpenFollowup={(l) => {
                          setLeadForFollowup(l);
                          setIsFollowupModalOpen(true);
                        }}
                        onOpenConverter={(l) => {
                          setLeadForConverter(l);
                          setIsConverterModalOpen(true);
                        }}
                        onOpenEdit={(l) => {
                          setLeadToEdit(l);
                          setIsNovoLeadModalOpen(true);
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Mode */
        <div className="rounded-2xl border border-emerald-500/20 bg-[#021813] overflow-hidden">
          <div className="p-4 border-b border-emerald-500/15 flex items-center justify-between">
            <span className="text-xs font-bold text-white">Lista Completa de Leads ({filteredLeads.length})</span>
          </div>

          <div className="divide-y divide-emerald-500/10">
            {filteredLeads.map((lead) => (
              <div 
                key={lead.id} 
                className="p-4 hover:bg-emerald-500/5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-extrabold text-sm shrink-0">
                    {lead.nome.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{lead.nome}</span>
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                        {lead.telefone}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Interesse: <strong className="text-cyan-300">{lead.objetivo_interesse}</strong> • Desafio:{' '}
                      <span className="text-emerald-400">{lead.desafio_ativo_titulo || 'Nenhum'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setLeadForFollowup(lead);
                      setIsFollowupModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/30 text-xs font-bold transition-all"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Follow-up</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLeadForDesafio(lead);
                      setIsEnviarDesafioModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#02140f] hover:bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-all"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Desafio</span>
                  </button>

                  {lead.status !== 'convertido' && (
                    <button
                      type="button"
                      onClick={() => {
                        setLeadForConverter(lead);
                        setIsConverterModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all"
                    >
                      <Trophy className="h-3.5 w-3.5" />
                      <span>Matricular</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <NovoLeadModal
        isOpen={isNovoLeadModalOpen}
        onClose={() => setIsNovoLeadModalOpen(false)}
        onSaveLead={handleSaveNovoLead}
        leadToEdit={leadToEdit}
      />

      <EnviarDesafioLeadModal
        isOpen={isEnviarDesafioModalOpen}
        onClose={() => setIsEnviarDesafioModalOpen(false)}
        lead={leadForDesafio}
        templates={templates}
        onDesafioEnviadoParaLead={handleDesafioEnviadoParaLead}
      />

      <FollowUpModal
        isOpen={isFollowupModalOpen}
        onClose={() => setIsFollowupModalOpen(false)}
        lead={leadForFollowup}
        onSalvarInteracaoFollowup={handleSalvarInteracaoFollowup}
        onAbrirConversaoAluno={(l) => {
          setLeadForConverter(l);
          setIsConverterModalOpen(true);
        }}
      />

      <ConverterLeadModal
        isOpen={isConverterModalOpen}
        onClose={() => setIsConverterModalOpen(false)}
        lead={leadForConverter}
        onConfirmarConversao={handleConfirmarConversao}
      />
    </div>
  );
};
