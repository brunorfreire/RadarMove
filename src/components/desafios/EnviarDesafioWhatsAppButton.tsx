import React, { useState } from 'react';
import { Send, Loader2, Check } from 'lucide-react';

interface EnviarDesafioWhatsAppButtonProps {
  phone: string;
  message: string;
  alunoNome?: string;
  className?: string;
  onSuccess?: () => void;
  onError?: (errorMessage: string) => void;
  isRepetido?: boolean;
  label?: string;
}

export const EnviarDesafioWhatsAppButton: React.FC<EnviarDesafioWhatsAppButtonProps> = ({
  phone,
  message,
  alunoNome,
  className = '',
  onSuccess,
  onError,
  isRepetido = false,
  label,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSendBackground = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();

    if (!phone) {
      showToast('Telefone do aluno não informado.');
      onError?.('Telefone do aluno não informado.');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Falha ao disparar mensagem.');
      }

      setIsSuccess(true);
      showToast('Desafio enviado com sucesso!');
      onSuccess?.();

      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('[EnviarDesafioWhatsAppButton] Erro no envio em background:', err);
      const errMsg = err?.message || 'Erro ao conectar ao serviço de WhatsApp.';
      showToast(`Erro: ${errMsg}`);
      onError?.(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const firstName = alunoNome ? alunoNome.split(' ')[0] : 'Aluno';
  const defaultLabel = isSuccess
    ? 'Enviado!'
    : isLoading
    ? 'Enviando...'
    : isRepetido
    ? `Reenviar no WhatsApp (${firstName})`
    : `Enviar no WhatsApp (${firstName})`;

  return (
    <div className="relative inline-block w-full sm:w-auto">
      <button
        type="button"
        onClick={handleSendBackground}
        disabled={isLoading}
        className={
          className ||
          `w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed ${
            isSuccess
              ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
              : isRepetido
              ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-slate-950 shadow-amber-500/20 hover:brightness-110'
              : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 shadow-cyan-500/20 hover:brightness-110'
          }`
        }
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
            <span>Enviando...</span>
          </>
        ) : isSuccess ? (
          <>
            <Check className="h-4 w-4 text-slate-950 stroke-[3]" />
            <span>Enviado com sucesso!</span>
          </>
        ) : (
          <>
            <Send className="h-3.5 w-3.5 fill-slate-950 text-slate-950" />
            <span>{label || defaultLabel}</span>
          </>
        )}
      </button>

      {/* Toast Notification integrado e flutuante */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-[#021813] px-4 py-3 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <Check className="h-3 w-3 stroke-[3]" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default EnviarDesafioWhatsAppButton;
