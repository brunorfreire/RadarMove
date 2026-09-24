"use server";

export async function sendWhatsAppAction(number: string, text: string) {
  try {
    // 1. No ambiente do navegador (Vite SPA Client), invoca a rota de backend /api/whatsapp sem CORS
    if (typeof window !== "undefined") {
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
      return { success: false, error: "As variáveis de ambiente não foram carregadas no servidor." };
    }

    let cleanNumber = (number || "").replace(/\D/g, "");
    if (cleanNumber.length === 10 || cleanNumber.length === 11) {
      cleanNumber = "55" + cleanNumber;
    }

    const endpoint = `${apiUrl}/message/sendText/${instance}`;

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

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Erro da Evolution API: ${response.status} - ${errorText}` };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Falha de rede interna: ${error.message}` };
  }
}
