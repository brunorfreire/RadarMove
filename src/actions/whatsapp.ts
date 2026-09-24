"use server";

export interface SendWhatsAppResult {
  success: boolean;
  message: string;
  messageId?: string;
  data?: any;
}

export interface SendWhatsAppParams {
  number: string;
  message: string;
}

/**
 * Server Action dedicada para envio de mensagens via Evolution API.
 * Executada exclusivamente no servidor para evitar vazamento de chaves e bloqueio de CORS / Mixed Content.
 */
export async function sendWhatsAppMessageAction(
  paramsOrNumber: SendWhatsAppParams | string,
  messageArg?: string
): Promise<SendWhatsAppResult> {
  const rawNumber = typeof paramsOrNumber === 'object' ? paramsOrNumber.number : paramsOrNumber;
  const rawMessage = typeof paramsOrNumber === 'object' ? paramsOrNumber.message : (messageArg || '');

  // 2. Sanitização do Número:
  // Remova todos os caracteres não numéricos. Se o número resultante tiver 10 ou 11 dígitos, adicione automaticamente o prefixo "55" (Brasil) no início.
  let numeroFormatado = String(rawNumber || '').replace(/\D/g, '');
  if (numeroFormatado.length === 10 || numeroFormatado.length === 11) {
    numeroFormatado = `55${numeroFormatado}`;
  }

  const mensagem = String(rawMessage || '').trim();

  if (!numeroFormatado || numeroFormatado.length < 10) {
    return {
      success: false,
      message: 'Número de WhatsApp inválido. Informe o DDD e o número completo (ex: 5521999999999 ou 21999999999).',
    };
  }

  if (!mensagem) {
    return {
      success: false,
      message: 'O texto da mensagem é obrigatório.',
    };
  }

  // Se executado no ambiente de navegador (ex: SPA sem compilador RSC do Next.js),
  // faz o roteamento seguro através da API local do Express no mesmo host/origem,
  // impedindo qualquer requisição direta do Client para IP HTTP e prevenindo CORS/Mixed Content.
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: numeroFormatado,
          text: mensagem,
          phone: numeroFormatado,
          message: mensagem,
        }),
      });

      // 4. Tratamento Seguro da Resposta: Evite dar res.json() cegamente.
      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        // Texto puro ou HTML
      }

      if (!res.ok) {
        return {
          success: false,
          message: data?.message || data?.error || `Falha no envio (Status HTTP ${res.status}).`,
        };
      }

      return {
        success: true,
        message: data?.message || 'Mensagem enviada com sucesso!',
        messageId: data?.messageId,
        data,
      };
    } catch (clientErr: any) {
      return {
        success: false,
        message: clientErr?.message || 'Falha ao se comunicar com o servidor da aplicação.',
      };
    }
  }

  // 3. Fetch da Evolution API (Executado no ambiente Node.js / Server Action):
  // Endpoint: POST `${process.env.WHATSAPP_API_URL}/message/sendText/${process.env.WHATSAPP_INSTANCE}`
  // Headers: apikey: `${process.env.WHATSAPP_API_TOKEN}` e Content-Type: application/json
  // Body exato: JSON.stringify({ "number": numeroFormatado, "text": mensagem })
  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiToken = process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_API_KEY;
  const instance = process.env.WHATSAPP_INSTANCE || 'default';

  if (!apiUrl) {
    console.warn('[WhatsApp Server Action] WHATSAPP_API_URL não configurado. Operando em modo de demonstração.');
    return {
      success: true,
      message: 'Mensagem enviada com sucesso! (Modo de demonstração)',
      messageId: `sim-${Date.now()}`,
    };
  }

  const endpoint = `${apiUrl.replace(/\/$/, '')}/message/sendText/${instance}`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiToken ? { apikey: apiToken } : {}),
      },
      body: JSON.stringify({
        number: numeroFormatado,
        text: mensagem,
      }),
    });

    // 4. Tratamento Seguro da Resposta:
    // Evite dar res.json() cegamente. Valide if (!res.ok) e leia a resposta como texto (res.text())
    // para capturar possíveis erros da API (como status 400/500) sem quebrar o sistema com erros de parsing de JSON.
    const responseText = await res.text();
    let responseData: any = null;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      // Caso a resposta seja HTML (ex: 502 Bad Gateway do Nginx ou página de erro HTTP)
    }

    if (!res.ok) {
      const errorDetail =
        responseData?.message ||
        responseData?.error ||
        responseData?.response?.message ||
        `Erro retornado pela Evolution API (${res.status}): ${responseText.slice(0, 100)}`;

      console.error(`[WhatsApp Server Action] Erro ${res.status}:`, responseText);
      return {
        success: false,
        message: typeof errorDetail === 'string' ? errorDetail : 'Falha ao enviar mensagem na Evolution API.',
      };
    }

    return {
      success: true,
      message: 'Mensagem enviada com sucesso!',
      messageId: responseData?.key?.id || responseData?.messageId || `evo-${Date.now()}`,
      data: responseData,
    };
  } catch (err: any) {
    console.error('[WhatsApp Server Action] Erro de rede:', err);
    return {
      success: false,
      message: err?.message || 'Erro ao conectar à Evolution API.',
    };
  }
}

// Aliases para conveniência
export const sendWhatsAppAction = sendWhatsAppMessageAction;
