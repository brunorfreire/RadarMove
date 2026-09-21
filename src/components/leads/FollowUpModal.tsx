import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  History, 
  UserCheck, 
  ArrowRight,
  Flame,
  Phone,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Lead, LeadStatus } from '../../types';
import { openWhatsApp, formatPhoneDisplay } from '../../lib/whatsappUtils';
import { FOLLOW_UP_SCRIPTS, getScriptParaLead } from '../../lib/leadsFollowupUtils';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onSalvarInteracaoFollowup: (
    leadId: string, 
    mensagemEnviada: string, 
    novaEtapa: number, 
    novoStatus: LeadStatus,
    notaAdicional?: string
  ) => void;
  onAbrirConversaoAluno: (lead: Lead) => void;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  onClose,
  lead,
  onSalvarInteracaoFollowup,
  onAbrirConversaoAluno,
}) => {
  if (!isOpen || !lead) return null;

  const [selectedEtapa, setSelectedEtapa] = useState<number>(
    lead.etapa_followup ? Math.min(lead.etapa_followup, 5) : 2
  );

  const [mensagem, setMensagem] = useState<string>(() => 
    getScriptParaLead(lead, lead.etapa_followup ? Math.min(lead.etapa_followup, 5) : 2)
  );

  const [notaRapida, setNotaRapida] = useState<string>('');

  const handleSelectEtapa = (etapaNum: number) => {
    setSelectedEtapa(etapaNum);
    setMensagem(getScriptParaLead(lead, etapaNum));
  };

  const handleEnviarWhatsApp = () => {
    openWhatsApp(lead.telefone, mensagem);

    // Determine new status based on etapa
    let novoStatus: LeadStatus = lead.status;
    if (selectedEtapa === 1) novoStatus = 'desafio_enviado';
    else if (selectedEtapa === 2 || selectedEtapa === 3) novoStatus = 'em_followup';
    else if (selectedEtapa === 4) novoStatus = 'proposta_enviada';

    onSalvarInteracaoFollowup(
      lead.id,
      mensagem,
      selectedEtapa,
      novoStatus,
      notaRapida.trim() || undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-emerald-500/25 bg-[#031d17] p-6 shadow-2xl shadow-emerald-950/80 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-500/15 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-slate-950 font-bold shadow-md shadow-emerald-500/25">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Acompanhamento de Follow-up (Conversão)
                </h2>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  Régua de Vendas
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Guie o prospecto do desafio até a matrícula oficial
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-500/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lead Info Bar */}
        <div className="mb-4 rounded-xl bg-[#02130e] border border-emerald-500/20 p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              {lead.nome.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{lead.nome}</span>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  {formatPhoneDisplay(lead.telefone)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>Desafio Ativo: <strong className="text-cyan-300">{lead.desafio_ativo_titulo || 'Nenhum'}</strong></span>
                {lead.dias_desafio_decorridos !== undefined && (
                  <span className="text-emerald-400">({lead.dias_desafio_decorridos}d decorridos)</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Convert Button */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onAbrirConversaoAluno(lead);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Fechar Matrícula (Virou Aluno!)</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* Etapas do Funil Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2">
              Escolha a Etapa do Follow-up:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
              {FOLLOW_UP_SCRIPTS.map((script) => {
                const isSelected = selectedEtapa === script.etapa;
                return (
                  <button
                    key={script.etapa}
                    type="button"
                    onClick={() => handleSelectEtapa(script.etapa)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/15'
                        : 'bg-[#02140f] border-emerald-500/15 text-slate-400 hover:text-slate-200 hover:border-emerald-500/30'
                    }`}
                  >
                    <div>
                      <span className={`text-[10px] font-bold block ${isSelected ? 'text-cyan-300' : 'text-emerald-400'}`}>
                        Etapa {script.etapa}
                      </span>
                      <h4 className="text-xs font-bold line-clamp-2 mt-0.5 leading-tight">{script.nomeEtapa.split('. ')[1] || script.nomeEtapa}</h4>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-2 block">
                      {script.delayRecomendado}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Script WhatsApp */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-emerald-400" />
                <span>Script Sugerido para WhatsApp</span>
              </label>
              <span className="text-[10px] text-cyan-300 font-bold bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">
                Personalizado para {lead.nome.split(' ')[0]}
              </span>
            </div>
            <textarea
              rows={5}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="w-full rounded-xl border border-emerald-500/30 bg-[#02130e] p-3 text-xs text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none font-sans leading-relaxed"
            />
          </div>

          {/* Anotação rápida do que o lead respondeu */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">
              Registro / Feedback do Lead (opcional):
            </label>
            <input
              type="text"
              value={notaRapida}
              onChange={(e) => setNotaRapida(e.target.value)}
              placeholder="Ex: Disse que cumpriu o desafio e quer saber os horários disponíveis..."
              className="w-full rounded-xl border border-emerald-500/20 bg-[#02140f] px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Histórico de Interações */}
          {lead.historico_interacoes && lead.historico_interacoes.length > 0 && (
            <div className="rounded-xl border border-emerald-500/15 bg-[#02130e] p-3">
              <div className="flex items-center gap-2 mb-2.5 text-xs font-bold text-slate-300">
                <History className="h-4 w-4 text-emerald-400" />
                <span>Histórico de Interações com este Lead</span>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {lead.historico_interacoes.map((item) => (
                  <div 
                    key={item.id}
                    className="p-2 rounded-lg bg-[#021813] border border-emerald-500/10 text-xs flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-white font-semibold">{item.titulo}</strong>
                        <span className="text-[10px] text-slate-400">{item.dataFormatada}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">{item.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-emerald-500/15 pt-4 mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-emerald-500/10 transition-colors"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={handleEnviarWhatsApp}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 px-6 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-cyan-400/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>Enviar Mensagem no WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
