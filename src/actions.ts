"use server";

export async function sendWhatsAppAction(number: string, text: string) {
  try {
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
