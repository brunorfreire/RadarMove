"use server";

export async function sendWhatsAppAction(number: string, text: string) {
  try {
    const apiUrl =
      (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_WHATSAPP_API_URL) ||
      (typeof process !== "undefined" && process.env?.VITE_WHATSAPP_API_URL) ||
      (typeof process !== "undefined" && process.env?.WHATSAPP_API_URL);

    const apiToken =
      (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_WHATSAPP_API_TOKEN) ||
      (typeof process !== "undefined" && process.env?.VITE_WHATSAPP_API_TOKEN) ||
      (typeof process !== "undefined" && process.env?.WHATSAPP_API_TOKEN);

    const instance =
      (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_WHATSAPP_INSTANCE) ||
      (typeof process !== "undefined" && process.env?.VITE_WHATSAPP_INSTANCE) ||
      (typeof process !== "undefined" && process.env?.WHATSAPP_INSTANCE);

    if (!apiUrl || !apiToken || !instance) {
      console.warn("[Server Action] Faltam variáveis de ambiente (VITE_WHATSAPP_API_URL / TOKEN / INSTANCE)");
      return { success: false, error: "As variáveis de ambiente não foram carregadas no servidor." };
    }

    let cleanNumber = (number || "").replace(/\D/g, "");
    if (cleanNumber.length === 10 || cleanNumber.length === 11) {
      cleanNumber = "55" + cleanNumber;
    }

    const endpoint = `${apiUrl.replace(/\/$/, '')}/message/sendText/${instance}`;

    // Log estratégico antes do fetch exibindo o número formatado e endpoint
    console.log(`[Server Action WhatsApp] Iniciando envio para o número formatado: ${cleanNumber} | Endpoint: ${endpoint}`);

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

    // Log estratégico após o fetch exibindo o status HTTP da Evolution API
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
