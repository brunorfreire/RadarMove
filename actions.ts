/**
 * Disparo direto para Evolution API no lado do cliente (Vite / React SPA).
 * Lê as variáveis públicas do Vite:
 * - VITE_WHATSAPP_API_URL
 * - VITE_WHATSAPP_API_TOKEN
 * - VITE_WHATSAPP_INSTANCE
 */
export async function sendWhatsAppAction(number: string, text: string) {
  try {
    const apiUrl =
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_WHATSAPP_API_URL) ||
      (typeof process !== "undefined" && process.env?.VITE_WHATSAPP_API_URL) ||
      "";

    const apiToken =
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_WHATSAPP_API_TOKEN) ||
      (typeof process !== "undefined" && process.env?.VITE_WHATSAPP_API_TOKEN) ||
      "";

    const instance =
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_WHATSAPP_INSTANCE) ||
      (typeof process !== "undefined" && process.env?.VITE_WHATSAPP_INSTANCE) ||
      "";

    if (!apiUrl || !apiToken || !instance) {
      console.warn("[WhatsApp Client] Faltam variáveis de ambiente (VITE_WHATSAPP_API_URL / VITE_WHATSAPP_API_TOKEN / VITE_WHATSAPP_INSTANCE)");
      return {
        success: false,
        error: "Variáveis de ambiente (VITE_WHATSAPP_API_URL / TOKEN / INSTANCE) não configuradas no build do Vite.",
      };
    }

    let cleanNumber = (number || "").replace(/\D/g, "");
    if (cleanNumber.length === 10 || cleanNumber.length === 11) {
      cleanNumber = "55" + cleanNumber;
    }

    const endpoint = `${apiUrl.replace(/\/$/, "")}/message/sendText/${instance}`;

    console.log(`[WhatsApp Client] Disparando fetch para: ${cleanNumber} | Endpoint: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiToken,
      },
      body: JSON.stringify({
        number: cleanNumber,
        options: { delay: 1000, presence: "composing" },
        textMessage: { text },
      }),
    });

    const responseText = await response.text();
    console.log(`[WhatsApp Client] Resposta recebida da Evolution API - Status HTTP: ${response.status}`);

    if (!response.ok) {
      return {
        success: false,
        error: `Falha na Evolution API (${response.status}): ${responseText || response.statusText}`,
      };
    }

    let data: any = null;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = null;
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("[WhatsApp Client] Erro no envio:", error);
    return {
      success: false,
      error: error?.message?.includes("Failed to fetch")
        ? "Falha na conexão com a Evolution API (Failed to fetch). Verifique se o domínio possui certificado SSL (HTTPS) ou se o CORS está liberado."
        : `Erro de rede: ${error?.message || error}`,
    };
  }
}
