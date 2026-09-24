"use server";

export async function sendWhatsAppAction(number: string, text: string) {
  try {
    // 1. No ambiente de execução client (Vite SPA), direciona de forma transparente para a rota de backend /api/whatsapp
    if (typeof window !== "undefined") {
      const cleanDigits = (number || "").replace(/\D/g, "");
      const formattedNumber = (cleanDigits.length === 10 || cleanDigits.length === 11) ? `55${cleanDigits}` : cleanDigits;
      
      console.log(`[Client Action WhatsApp] Disparando envio para número formatado: ${formattedNumber}`);

      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ number, text }),
      });

      console.log(`[Client Action WhatsApp] Resposta do servidor - HTTP Status: ${res.status}`);

      const responseText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error("[Client Action WhatsApp] Resposta não-JSON retornada pelo servidor:", responseText.slice(0, 200));
        return {
          success: false,
          error: `Erro ao comunicar com o servidor: Status ${res.status}.`,
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

    // 2. No ambiente do servidor (Node.js / Server Action)
    const apiUrl = process.env.WHATSAPP_API_URL;
    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const instance = process.env.WHATSAPP_INSTANCE;

    if (!apiUrl || !apiToken || !instance) {
      console.warn("[Server Action] Faltam variáveis de ambiente (WHATSAPP_API_URL / TOKEN / INSTANCE)");
      return { success: false, error: "As variáveis de ambiente não foram carregadas no servidor." };
    }

    let cleanNumber = (number || "").replace(/\D/g, "");
    if (cleanNumber.length === 10 || cleanNumber.length === 11) {
      cleanNumber = "55" + cleanNumber;
    }

    const endpoint = `${apiUrl.replace(/\/$/, '')}/message/sendText/${instance}`;

    // Log estratégico antes do fetch exibindo o número formatado e endpoint
    console.log(`[Server Action WhatsApp] Iniciando fetch para número formatado: ${cleanNumber} | Endpoint: ${endpoint}`);

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
