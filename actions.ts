/**
 * Disparo nativo de WhatsApp via Link Universal (wa.me / click-to-chat).
 * Elimina totalmente dependências de gateways externos (Evolution API, Z-API),
 * eliminando erros 504 Gateway Time-out, problemas de CORS e custos de API.
 *
 * Abre a conversa no WhatsApp Web ou App Desktop com o número formatado
 * e a mensagem devidamente codificada com encodeURIComponent.
 */
import { formatWhatsAppNumber, getWhatsAppUrl } from './src/lib/whatsappUtils';

export interface SendWhatsAppResult {
  success: boolean;
  error?: string;
  url?: string;
}

export async function sendWhatsAppAction(
  number: string,
  text: string
): Promise<SendWhatsAppResult> {
  try {
    const cleanPhone = formatWhatsAppNumber(number);

    if (!cleanPhone || cleanPhone.length < 10) {
      return {
        success: false,
        error: "Número de telefone inválido. Informe o número com DDD.",
      };
    }

    if (!text || !text.trim()) {
      return {
        success: false,
        error: "Mensagem vazia. Digite um conteúdo para enviar.",
      };
    }

    // Gera o link universal oficial wa.me devidamente codificado
    const url = getWhatsAppUrl(cleanPhone, text.trim());

    console.log(`[WhatsApp Link Universal] Abrindo conversa para: ${cleanPhone}`);

    // Abre em nova janela/aba de forma nativa e segura
    if (typeof window !== "undefined") {
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) {
        // Caso popup seja bloqueado pelo navegador, tenta abrir na janela atual
        window.location.href = url;
      }
    }

    return {
      success: true,
      url,
    };
  } catch (error: any) {
    console.error("[WhatsApp Link Universal] Erro ao abrir WhatsApp:", error);
    return {
      success: false,
      error: `Erro ao preparar link do WhatsApp: ${error?.message || error}`,
    };
  }
}
