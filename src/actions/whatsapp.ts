"use server";

export async function sendWhatsAppMessage(number: string, text: string) {
  try {
    // No ambiente do navegador (Vite SPA), invoca a rota de servidor local para executar a chamada segura
    if (typeof window !== "undefined") {
      const res = await fetch("/api/whatsapp/send-message", {
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
        // Se a rota retornar HTML de erro (ex: 502/404)
        return {
          success: false,
          error: `Falha na rota do servidor: ${res.status} - ${responseText.slice(0, 150)}`,
        };
      }

      if (!res.ok || data?.success === false) {
        return {
          success: false,
          error: data?.error || `Falha no envio (Status HTTP ${res.status})`,
        };
      }

      return { success: true };
    }

    const apiUrl = process.env.WHATSAPP_API_URL;
    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const instance = process.env.WHATSAPP_INSTANCE;

    if (!apiUrl || !apiToken || !instance) {
      return { success: false, error: "Faltam credenciais no servidor." };
    }

    let cleanNumber = number.replace(/\D/g, "");
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
          text: text
        }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      return { success: false, error: `Falha na Evolution API: ${response.status} - ${responseText}` };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: `Erro interno: ${error.message}` };
  }
}
