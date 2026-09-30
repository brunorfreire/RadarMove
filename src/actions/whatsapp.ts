"use server";

import { formatWhatsAppNumber, getWhatsAppUrl } from "../lib/whatsappUtils";

/**
 * Envia mensagem nativamente abrindo o WhatsApp via Link Universal (wa.me).
 * Elimina timeouts (504), restrições de CORS e necessidade de instâncias da Evolution API.
 */
export async function sendWhatsAppMessage(number: string, text: string) {
  try {
    const cleanNumber = formatWhatsAppNumber(number);

    if (!cleanNumber || cleanNumber.length < 10) {
      return { success: false, error: "Número de telefone inválido." };
    }

    if (!text || !text.trim()) {
      return { success: false, error: "Texto da mensagem não informado." };
    }

    const url = getWhatsAppUrl(cleanNumber, text.trim());

    if (typeof window !== "undefined") {
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) {
        window.location.href = url;
      }
    }

    return { success: true, url };
  } catch (error: any) {
    return { success: false, error: `Erro interno: ${error.message}` };
  }
}
