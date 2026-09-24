"use server";

export async function sendWhatsAppMessage(number: string, text: string) {
  try {
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
        textMessage: { text: text }
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
