import { NextResponse } from 'next/server';

/**
 * Rota de API Next.js (App Router) para envio de mensagens via WhatsApp em segundo plano.
 * Suporta integração com Evolution API (ou similar) através da variável de ambiente WHATSAPP_API_URL.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Parâmetros "phone" e "message" são obrigatórios.' },
        { status: 400 }
      );
    }

    // Higienização dos dígitos do telefone
    let cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
      cleanPhone = `55${cleanPhone}`;
    }

    const apiUrl = process.env.WHATSAPP_API_URL;
    const apiKey = process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_API_KEY;
    const instance = process.env.WHATSAPP_INSTANCE || 'default';

    // Se a Evolution API estiver configurada no ambiente
    if (apiUrl) {
      try {
        const endpoint = `${apiUrl.replace(/\/$/, '')}/message/sendText/${instance}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { apikey: apiKey } : {}),
          },
          body: JSON.stringify({
            number: cleanPhone,
            text: message,
            delay: 1200,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || 'Falha ao comunicar com a Evolution API');
        }

        return NextResponse.json({
          success: true,
          provider: 'evolution_api',
          messageId: data?.key?.id || `evo-${Date.now()}`,
          message: 'Desafio enviado com sucesso via Evolution API!',
        });
      } catch (externalError: any) {
        console.error('[WhatsApp API] Erro na Evolution API:', externalError.message);
        return NextResponse.json(
          { error: externalError.message || 'Erro ao disparar mensagem na Evolution API' },
          { status: 502 }
        );
      }
    }

    // Simulação de sucesso (quando WHATSAPP_API_URL não estiver configurada no ambiente)
    // Permite testes imediatos em desenvolvimento sem quebrar a interface
    await new Promise((resolve) => setTimeout(resolve, 800));

    return NextResponse.json({
      success: true,
      simulated: true,
      messageId: `sim-${Date.now()}`,
      phone: cleanPhone,
      message: 'Desafio enviado com sucesso!',
    });
  } catch (error: any) {
    console.error('[WhatsApp Route Error]', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno no servidor ao processar envio.' },
      { status: 500 }
    );
  }
}
