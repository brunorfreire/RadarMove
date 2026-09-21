import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Flame, 
  Target, 
  Check, 
  Phone, 
  FileText,
  Clock,
  Compass,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Lead, DesafioTemplate } from '../../types';
import { openWhatsApp, formatPhoneDisplay } from '../../lib/whatsappUtils';
import { registrarInteracaoLead } from '../../lib/leadsFollowupUtils';

interface EnviarDesafioLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  templates: DesafioTemplate[];
  onDesafioEnviadoParaLead: (leadId: string, desafio: DesafioTemplate, mensagemEnviada: string) => void;
}

export const EnviarDesafioLeadModal: React.FC<EnviarDesafioLeadModalProps> = ({
  isOpen,
  onClose,
  lead,
  templates,
  onDesafioEnviadoParaLead,
}) => {
  if (!isOpen || !lead) return null;

  // Filter conversion challenges first
  const desafiosConversao = templates.filter(t => t.categoria === 'Desafio de Conversão');
  const outrosDesafios = templates.filter(t => t.categoria !== 'Desafio de Conversão');

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    desafiosConversao[0]?.id || templates[0]?.id || ''
  );

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  const leadFirstName = lead.nome ? lead.nome.split(' ')[0] : 'Futuro Aluno';

  // Build high-converting trial message
  const buildInitialMessage = (template: DesafioTemplate) => {
    return `Fala ${leadFirstName}! Tudo bem? 💪\n\nConforme conversamos sobre o seu objetivo de *${lead.objetivo_interesse}*, eu gosto de gerar resultado prático primeiro para você sentir a diferença na pele antes de fechar qualquer plano.\n\nSeparei um desafio exclusivo de degustação para você começar hoje:\n🎯 *${template.titulo}*\n\n👉 *Como funciona:* ${template.mensagem_whatsapp.replace(/\{aluno\}/g, leadFirstName)}\n\nTopa fazer comigo e me contar o que achou amanhã? Bora dar o primeiro passo! 🔥`;
  };

  const [customMessage, setCustomMessage] = useState<string>(
    selectedTemplate ? buildInitialMessage(selectedTemplate) : ''
  );

  // When changing template, optionally regenerate message
  const handleSelectTemplate = (template: DesafioTemplate) => {
    setSelectedTemplateId(template.id);
    setCustomMessage(buildInitialMessage(template));
  };

  const handleSend = () => {
    if (!selectedTemplate) return;

    // Send via WhatsApp
    openWhatsApp(lead.telefone, customMessage);

    // Update parent
    onDesafioEnviadoParaLead(lead.id, selectedTemplate, customMessage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-emerald-500/25 bg-[#031d17] p-6 shadow-2xl shadow-emerald-950/80 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-500/15 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Enviar Desafio de Degustação para Lead
                </h2>
                <span className="rounded bg-cyan-400/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-400/30">
                  Lead Magnet
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gere valor imediato no WhatsApp antes de apresentar a proposta comercial
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

        {/* Lead Summary Bar */}
        <div className="mb-4 rounded-xl bg-[#02130e] border border-emerald-500/20 p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
              {lead.nome.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{lead.nome}</span>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  {formatPhoneDisplay(lead.telefone)}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Interesse: <strong className="text-cyan-300">{lead.objetivo_interesse}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Flame className="h-3 w-3" />
              Lead {lead.temperatura.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* Escolha do Desafio */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
              <Target className="h-4 w-4 text-emerald-400" />
              <span>Selecione o Desafio de Conversão</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Highlight conversion challenges first */}
              {desafiosConversao.map((template) => {
                const isSelected = selectedTemplateId === template.id;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleSelectTemplate(template)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400 shadow-md shadow-cyan-500/10'
                        : 'bg-[#02140f] border-emerald-500/15 hover:border-emerald-500/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-cyan-300 bg-cyan-400/20 px-1.5 py-0.2 rounded border border-cyan-400/30">
                        Degustação
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {template.tempo_estimado}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{template.titulo}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                      {template.mensagem_whatsapp.substring(0, 80)}...
                    </p>
                  </button>
                );
              })}

              {/* Other challenges */}
              {outrosDesafios.slice(0, 2).map((template) => {
                const isSelected = selectedTemplateId === template.id;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleSelectTemplate(template)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400 shadow-md shadow-cyan-500/10'
                        : 'bg-[#02140f] border-emerald-500/15 hover:border-emerald-500/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-emerald-300 bg-emerald-400/10 px-1.5 py-0.2 rounded border border-emerald-400/20">
                        {template.categoria}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {template.tempo_estimado}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white line-clamp-1">{template.titulo}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                      {template.mensagem_whatsapp.substring(0, 80)}...
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mensagem WhatsApp Preview & Edição */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-emerald-400" />
                <span>Mensagem Personalizada para o WhatsApp</span>
              </label>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                100% editável
              </span>
            </div>

            <textarea
              rows={6}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full rounded-xl border border-emerald-500/30 bg-[#02130e] p-3 text-xs text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none font-sans leading-relaxed"
            />
          </div>

          {/* Dica de Follow-up */}
          <div className="rounded-xl bg-cyan-400/10 border border-cyan-400/25 p-3 flex items-start gap-2.5 text-xs text-cyan-200">
            <Sparkles className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Régua de Acompanhamento Automática:</strong>
              Ao enviar, o lead passará para a etapa <strong>Desafio Enviado</strong> e você receberá o lembrete de follow-up de 24h para checar a execução e abrir a conversa sobre a consultoria!
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-emerald-500/15 pt-4 mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-emerald-500/10 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSend}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 px-6 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>Enviar Desafio via WhatsApp (1 Clique)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
