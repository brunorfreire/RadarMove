"use server";

/**
 * Server Action para envio de WhatsApp.
 * Executa estritamente no backend Node.js (ou faz proxy para a rota segura /api/whatsapp quando chamado pelo cliente),
 * garantindo que as credenciais fiquem apenas no servidor e contornando bloqueios de Mixed Content.
 */
export async function sendWhatsAppAction(number: string, text: string) {
  try {
    // 1. Se invocado no ambiente de execução do navegador, repassa para a rota de API local segura
    if (typeof window !== "undefined") {
      const cleanDigits = (number || "").replace(/\D/g, "");
      const formattedNumber = (cleanDigits.length === 10 || cleanDigits.length === 11) ? `55${cleanDigits}` : cleanDigits;

      console.log(`[Client -> Server WhatsApp] Solicitando envio backend para: ${formattedNumber}`);

      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ number, text }),
      });

      const responseText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(responseText);
      } catch {
        return {
          success: false,
          error: `Erro ao comunicar com o servidor: Status HTTP ${res.status}.`,
        };
      }

      if (!res.ok || data?.success === false) {
        return {
          success: false,
          error: data?.error || `Falha no envio (Status HTTP ${res.status}).`,
        };
      }

      return { success: true };
    }

    // 2. Se executado no backend Node.js (Server Action / Server-side)
    const apiUrl = process.env.WHATSAPP_API_URL;
    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const instance = process.env.WHATSAPP_INSTANCE;

    if (!apiUrl || !apiToken || !instance) {
      console.warn("[Server Action WhatsApp] Faltam variáveis de ambiente privadas no servidor (WHATSAPP_API_URL / WHATSAPP_API_TOKEN / WHATSAPP_INSTANCE)");
      return { success: false, error: "As variáveis de ambiente não foram carregadas no servidor." };
    }

    let cleanNumber = (number || "").replace(/\D/g, "");
    if (cleanNumber.length === 10 || cleanNumber.length === 11) {
      cleanNumber = "55" + cleanNumber;
    }

    const endpoint = `${apiUrl.replace(/\/$/, '')}/message/sendText/${instance}`;

    console.log(`[Server Action WhatsApp] Disparando fetch seguro para: ${cleanNumber} | Endpoint: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiToken,
      },
      body: JSON.stringify({
        number: cleanNumber,
        options: { delay: 1000, presence: "composing" },
        textMessage: { text }
      }),
    });

    const responseText = await response.text();

    console.log(`[Server Action WhatsApp] Resposta recebida da Evolution API - HTTP Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error(`[Server Action WhatsApp] Falha na Evolution API (${response.status}):`, responseText);
      return { success: false, error: `Erro da Evolution API: ${response.status} - ${responseText}` };
    }

    console.log(`[Server Action WhatsApp] Mensagem enviada com sucesso para: ${cleanNumber}`);
    return { success: true };
  } catch (error: any) {
    console.error("[Server Action WhatsApp] Exceção na execução:", error);
    return { success: false, error: `Falha de rede interna: ${error.message}` };
  }
}
