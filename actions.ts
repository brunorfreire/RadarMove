/**
 * Disparo direto para Evolution API no lado do cliente (Vite / React SPA).
 * Lê as variáveis públicas do Vite:
 * - VITE_WHATSAPP_API_URL
 * - VITE_EVOLUTION_API_KEY (ou VITE_WHATSAPP_API_TOKEN como fallback)
 * - VITE_WHATSAPP_INSTANCE
 */
export async function sendWhatsAppAction(number: string, text: string) {
  try {
    const apiUrl =
      import.meta.env.VITE_WHATSAPP_API_URL ||
      "https://api.personalcerto.com";

    const apiKey =
      import.meta.env.VITE_EVOLUTION_API_KEY ||
      import.meta.env.VITE_WHATSAPP_API_TOKEN ||
      "";

    const instance =
      import.meta.env.VITE_WHATSAPP_INSTANCE ||
      "whatsapp_principal";

    if (!apiKey) {
      console.warn("[WhatsApp Client] Chave de API não encontrada em import.meta.env.VITE_EVOLUTION_API_KEY");
      return {
        success: false,
        error: "Chave de autenticação ausente. Configure VITE_EVOLUTION_API_KEY no seu arquivo .env.",
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
        "apikey": import.meta.env.VITE_EVOLUTION_API_KEY || apiKey,
      },
      body: JSON.stringify({
        number: cleanNumber,
        text: text,
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
        ? "Falha na conexão com a Evolution API (Failed to fetch). Verifique se o CORS está liberado na Evolution API e se o cabeçalho apikey está correto."
        : `Erro de rede: ${error?.message || error}`,
    };
  }
}
