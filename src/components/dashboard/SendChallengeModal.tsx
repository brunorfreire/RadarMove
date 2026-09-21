import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Mic, 
  Copy, 
  Check, 
  Zap, 
  User, 
  Calendar, 
  CheckCircle2,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';
import { RadarAlerta, DesafioTemplate, Aluno, DesafioEnviado } from '../../types';
import { verificarDesafioRepetido } from '../../lib/historicoDesafiosUtils';
import { openWhatsApp, formatPhoneDisplay } from '../../lib/whatsappUtils';

interface SendChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerta: RadarAlerta | null;
  aluno?: Aluno | null;
  templates: DesafioTemplate[];
  historico?: DesafioEnviado[];
  onChallengeSent: (alertaId: string, template: DesafioTemplate, customMessage: string) => void;
  onOpenVoiceModalForAluno: (aluno: Aluno) => void;
}

export const SendChallengeModal: React.FC<SendChallengeModalProps> = ({
  isOpen,
  onClose,
  alerta,
  aluno,
  templates,
  historico = [],
  onChallengeSent,
  onOpenVoiceModalForAluno,
}) => {
  if (!isOpen || !alerta) return null;

  // Preselect recommended challenge
  const initialTemplate = templates.find((t) => t.id === alerta.desafio_sugerido_id) || templates[0];
  const [selectedTemplate, setSelectedTemplate] = useState<DesafioTemplate>(initialTemplate);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialTemplate?.categoria || 'Lifestyle 23h');
  
  const alunoFirstName = alerta.aluno_nome.split(' ')[0];

  const repeticaoTemplate = verificarDesafioRepetido(
    historico,
    alerta.aluno_id,
    selectedTemplate.id,
    selectedTemplate.titulo
  );

  const getCustomizedMessage = (template: DesafioTemplate) => {
    return template.mensagem_whatsapp.replace(/\{aluno\}/g, alunoFirstName);
  };

  const [messageText, setMessageText] = useState<string>(getCustomizedMessage(initialTemplate));
  const [copied, setCopied] = useState(false);

  const categories = ['Lifestyle 23h', 'Desafio de Bolso', 'Estoicismo'];

  const handleSelectTemplate = (template: DesafioTemplate) => {
    setSelectedTemplate(template);
    setMessageText(getCustomizedMessage(template));
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const firstInCat = templates.find((t) => t.categoria === category);
    if (firstInCat) {
      handleSelectTemplate(firstInCat);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendViaWhatsApp = () => {
    openWhatsApp(alerta.aluno_telefone, messageText);
    onChallengeSent(alerta.id, selectedTemplate, messageText);
    onClose();
  };

  const handleSwitchToVoice = () => {
    if (aluno) {
      onOpenVoiceModalForAluno(aluno);
    }
    onClose();
  };

  const categoryTemplates = templates.filter((t) => t.categoria === selectedCategory);

  return (
    <div 
      id="send-challenge-modal-overlay" 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        id="send-challenge-modal-card"
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-400/30 bg-[#031d17] shadow-2xl backdrop-blur-2xl text-slate-100 flex flex-col max-h-[92vh]"
      >
        {/* Glow ambient background */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />

        {/* Modal Header (Fixed) */}
        <div className="flex items-center justify-between border-b border-emerald-500/20 px-5 sm:px-6 py-4 bg-[#021813]/90 flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-cyan-400/15 border border-cyan-400/30 text-cyan-300">
              <Zap className="h-5 w-5 fill-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Enviar Micro-Desafio de Retenção
                </h3>
                <span className="rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-400/30">
                  Ação Rápida WhatsApp
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dispare uma mensagem personalizada com 1 clique ou grave um áudio para o aluno
              </p>
            </div>
          </div>
          <button
            id="close-send-challenge-modal-btn"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          {/* Context Card: Destinatário & Alerta do Radar */}
          <div className="rounded-xl border border-emerald-500/20 bg-[#021510] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-cyan-400/40 bg-emerald-950">
                {alerta.aluno_avatar ? (
                  <img src={alerta.aluno_avatar} alt={alerta.aluno_nome} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs font-bold text-cyan-300">
                    {alerta.aluno_nome.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{alerta.aluno_nome}</span>
                  <span className="rounded bg-emerald-500/15 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                    {formatPhoneDisplay(alerta.aluno_telefone)}
                  </span>
                </div>
                <p className="text-xs text-amber-300/90 font-medium mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Gatilho: {alerta.descricao}
                </p>
              </div>
            </div>

            <button
              id="modal-switch-to-audio-btn"
              onClick={handleSwitchToVoice}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-400/20 transition-all self-start sm:self-center cursor-pointer"
            >
              <Mic className="h-3.5 w-3.5 text-cyan-400" />
              Preferir Áudio de Voz
            </button>
          </div>

          {/* Categoria Tabs */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
              1. Selecionar Categoria do Desafio:
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'border border-emerald-500/20 bg-[#021813] text-slate-300 hover:bg-[#04241d]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Templates na Categoria */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
              2. Escolher Template:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {categoryTemplates.map((template) => {
                const isSelected = selectedTemplate.id === template.id;
                const st = verificarDesafioRepetido(historico, alerta.aluno_id, template.id, template.titulo);
                return (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={`rounded-xl p-2.5 text-left border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-400/10 text-white font-semibold shadow-sm'
                        : 'border-emerald-500/15 bg-[#021611] text-slate-300 hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold truncate">{template.titulo}</span>
                      <span className="text-[10px] text-cyan-300">{template.tempo_estimado}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      {st.repetido ? (
                        <span className="text-[9px] text-amber-300 font-bold bg-amber-400/15 px-1 py-0.5 rounded">
                          ⚠️ Já enviado ({st.totalEnvios}x)
                        </span>
                      ) : (
                        <span className="text-[9px] text-emerald-400 font-medium">
                          ✓ Inédito
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                      {template.mensagem_whatsapp}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Repetition Alert Banner for Selected Template */}
            {repeticaoTemplate.repetido ? (
              <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-200 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-300">
                    Atenção: Este desafio já foi enviado para {alunoFirstName} ({repeticaoTemplate.totalEnvios}x)
                  </span>
                  <p className="text-[11px] text-amber-200/90 mt-0.5">
                    Último envio em {repeticaoTemplate.ultimoEnvio?.data_formatada || 'anteriormente'} ({repeticaoTemplate.diasDesdeUltimoEnvio === 0 ? 'hoje' : `há ${repeticaoTemplate.diasDesdeUltimoEnvio} dia(s)`}). Você pode reenviar para reforçar ou selecionar outro template inédito acima.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-2 p-1.5 px-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Template inédito para {alunoFirstName}.</span>
              </div>
            )}
          </div>

          {/* Mensagem Personalizada Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span>3. Mensagem WhatsApp:</span>
                <span className="text-emerald-400 font-normal lowercase">(editável)</span>
              </label>
              <button
                id="copy-challenge-msg-btn"
                onClick={handleCopy}
                className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>

            <div className="relative">
              <textarea
                id="challenge-message-preview"
                rows={3}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full rounded-xl border border-emerald-500/25 bg-[#02140f] p-3 text-xs md:text-sm text-slate-200 leading-relaxed focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-sans"
              />
            </div>
          </div>
        </div>

        {/* ALWAYS VISIBLE FIXED FOOTER */}
        <div 
          id="send-challenge-modal-footer"
          className="px-5 sm:px-6 py-3.5 border-t border-emerald-500/25 bg-[#02140f] flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl z-20"
        >
          <div className="flex items-center gap-2 text-xs text-slate-300 w-full sm:w-auto">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            <span>Destinatário: <strong className="text-white">{alerta.aluno_nome}</strong> ({formatPhoneDisplay(alerta.aluno_telefone)})</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              id="cancel-send-challenge-btn"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
            >
              Cancelar
            </button>

            <button
              id="confirm-send-whatsapp-btn"
              onClick={handleSendViaWhatsApp}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-xs sm:text-sm font-black text-slate-950 shadow-lg active:scale-95 transition-all cursor-pointer ${
                repeticaoTemplate.repetido
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 shadow-amber-500/20 hover:brightness-110'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-cyan-500/30 hover:brightness-110'
              }`}
            >
              <Send className="h-4 w-4 text-slate-950 fill-slate-950" />
              <span>
                {repeticaoTemplate.repetido
                  ? `Reenviar via WhatsApp (${alunoFirstName})`
                  : `Enviar via WhatsApp (${alunoFirstName})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
