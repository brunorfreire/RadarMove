import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  MessageSquare, 
  Sparkles, 
  ShieldCheck, 
  Zap,
  Info,
  Clock,
  Check
} from 'lucide-react';
import { formatWhatsAppNumber, formatPhoneDisplay } from '../../lib/whatsappUtils';

interface MensagemAvulsaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (info: { phone: string; message: string }) => void;
}

export const MensagemAvulsaModal: React.FC<MensagemAvulsaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  // Preset templates rápidos para agilizar o trabalho do personal
  const quickTemplates = [
    {
      label: 'Desafio Rápido',
      text: 'Olá! Passando para te lançar o desafio do dia no RadarMove: 10 minutos de caminhada pós-almoço e meta de 2L de água batida. Topa cumprir hoje?',
    },
    {
      label: 'Convite Avaliação',
      text: 'Olá! Sou o seu treinador do RadarMove. Gostaria de te convidar para agendarmos a sua próxima avaliação física e alinharmos as novas metas de treino. Que dia fica melhor para você?',
    },
    {
      label: 'Aviso & Check-in',
      text: 'Olá! Passando para um check-in rápido de treino e recuperação. Como estão as suas dores musculares e energia hoje?',
    },
  ];

  // Máscara e formatação amigável enquanto digita
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Permite digitar dígitos ou símbolos
    setPhone(raw);
  };

  const cleanDigits = phone.replace(/\D/g, '');
  const isDdiIncluded = cleanDigits.startsWith('55') && cleanDigits.length >= 12;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusFeedback(null);

    const rawDigits = phone.replace(/\D/g, '');

    if (!rawDigits || rawDigits.length < 10) {
      setStatusFeedback({
        type: 'error',
        text: 'Por favor, informe um número de WhatsApp válido com DDD (ex: 5521999999999 ou 21999999999).',
      });
      return;
    }

    if (!message.trim()) {
      setStatusFeedback({
        type: 'error',
        text: 'Por favor, digite o conteúdo da mensagem antes de enviar.',
      });
      return;
    }

    // Normaliza para o padrão internacional com DDI 55
    const formattedPhone = formatWhatsAppNumber(phone);

    setIsLoading(true);

    try {
      // Faz requisição POST para a rota de envio com o payload exigido pela Evolution API (number & text)
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: formattedPhone,
          text: message.trim(),
          // Envia também aliases comuns para garantia total de interoperabilidade
          phone: formattedPhone,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Falha ao processar envio na API do WhatsApp');
      }

      // Sucesso
      setStatusFeedback({
        type: 'success',
        text: 'Mensagem enviada com sucesso!',
      });

      if (onSuccess) {
        onSuccess({ phone: formattedPhone, message: message.trim() });
      }

      // Limpa os campos e fecha após breve intervalo de feedback
      setTimeout(() => {
        setPhone('');
        setMessage('');
        setStatusFeedback(null);
        onClose();
      }, 1400);
    } catch (err: any) {
      console.error('[MensagemAvulsaModal] Erro ao enviar mensagem avulsa:', err);
      setStatusFeedback({
        type: 'error',
        text: err?.message || 'Erro ao conectar à API do WhatsApp. Verifique as configurações.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="modal-mensagem-avulsa-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="modal-mensagem-avulsa"
        className="w-full max-w-lg rounded-2xl border border-emerald-500/30 bg-[#032019] shadow-2xl backdrop-blur-2xl relative flex flex-col max-h-[92vh] overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow decoration */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-500/20 px-5 sm:px-6 py-4 bg-[#021813]/60 relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400">
              <Zap className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">Mensagem Avulsa</h3>
                <span className="rounded bg-cyan-400/15 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-400/30">
                  Envio Rápido
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dispare via Evolution API sem cadastrar a pessoa como aluno
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-fechar-mensagem-avulsa"
            onClick={onClose}
            aria-label="Fechar modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-[#021813] text-slate-400 hover:text-white hover:border-emerald-500/50 transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 relative z-10">
          {/* Status Feedback Banner */}
          {statusFeedback && (
            <div
              id="status-feedback-mensagem-avulsa"
              className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold animate-in fade-in duration-200 ${
                statusFeedback.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }`}
            >
              {statusFeedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              )}
              <span className="flex-1">{statusFeedback.text}</span>
            </div>
          )}

          {/* Campo: Número do WhatsApp */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="input-whatsapp-phone" className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-emerald-400" />
                <span>Número do WhatsApp</span>
                <span className="text-rose-400">*</span>
              </label>

              {cleanDigits.length >= 10 && (
                <span className="text-[11px] font-mono text-cyan-300">
                  DDI +55 ativo
                </span>
              )}
            </div>

            <div className="relative">
              <input
                id="input-whatsapp-phone"
                type="text"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="Ex: 5521999999999 ou (21) 98888-7777"
                required
                className="w-full rounded-xl border border-emerald-500/25 bg-[#02140f] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
              />
            </div>

            {/* Aviso informativo de formato com código de país */}
            <div className="flex items-start gap-1.5 text-[11px] text-slate-400 pt-0.5">
              <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Recomendado: inclua o código do país e DDD (ex: <strong className="text-slate-200">5521999999999</strong>). 
                Se omitido, o DDI <strong>55</strong> será aplicado automaticamente.
              </span>
            </div>
          </div>

          {/* Templates Rápidos (Presets) */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-cyan-400" />
              Preenchimento Rápido com Modelos:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickTemplates.map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMessage(tpl.text)}
                  className="rounded-lg border border-emerald-500/20 bg-[#021813] px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 hover:bg-[#03261e] active:scale-95 transition-all cursor-pointer"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Campo: Mensagem */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="textarea-whatsapp-message" className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
                <span>Mensagem</span>
                <span className="text-rose-400">*</span>
              </label>

              <span className="text-[10px] text-slate-400">
                {message.length} caracteres
              </span>
            </div>

            <textarea
              id="textarea-whatsapp-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite aqui o texto do desafio, convite ou aviso que deseja disparar..."
              required
              className="w-full rounded-xl border border-emerald-500/25 bg-[#02140f] p-3 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Preview da Mensagem */}
          {message.trim() && (
            <div className="rounded-xl border border-emerald-500/20 bg-[#021611] p-3 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-white/5">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Prévia no WhatsApp:
                </span>
                <span className="font-mono text-cyan-300">
                  {cleanDigits ? formatPhoneDisplay(cleanDigits) : 'Destinatário'}
                </span>
              </div>
              <p className="text-xs text-slate-200 pt-1 italic whitespace-pre-wrap font-sans">
                &quot;{message.trim()}&quot;
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-emerald-500/20">
            <button
              type="button"
              id="btn-cancelar-mensagem-avulsa"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              id="btn-submeter-mensagem-avulsa"
              disabled={isLoading || !cleanDigits || !message.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                  <span>Enviando WhatsApp...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 fill-slate-950 text-slate-950" />
                  <span>Enviar WhatsApp</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MensagemAvulsaModal;
