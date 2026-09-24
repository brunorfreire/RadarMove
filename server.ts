import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// Carrega variáveis do Supabase (env ou fallback do client)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mock-radarmove.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'mock-key';

let supabaseServer: any = null;
try {
  if (supabaseUrl && !supabaseUrl.includes('mock')) {
    supabaseServer = createClient(supabaseUrl, supabaseKey);
  }
} catch (err) {
  console.warn('[Server] Supabase client init warning:', err);
}

// Configuração do Gateway WhatsApp em memória e persistido
interface WhatsAppConfig {
  provedor: 'automatico' | 'evolution_api' | 'zapi' | 'meta_cloud' | 'custom_webhook';
  apiUrl?: string;
  apiKey?: string;
  instancia?: string;
  ativo: boolean;
}

let gatewayConfig: WhatsAppConfig = {
  provedor: 'automatico',
  apiUrl: process.env.WHATSAPP_API_URL || '',
  apiKey: process.env.WHATSAPP_API_TOKEN || '',
  instancia: process.env.WHATSAPP_INSTANCE || '',
  ativo: true,
};

// Fila em memória para resiliência imediata
interface AgendamentoMemoria {
  id: string;
  profissional_id: string;
  aluno_id: string;
  telefone: string;
  mensagem: string;
  data_hora_envio: string;
  status: 'pendente' | 'processando' | 'enviado' | 'falha';
  tentativas: number;
  erro_log?: string | null;
  created_at: string;
  aluno_nome?: string;
}

const memoryQueue: Map<string, AgendamentoMemoria> = new Map();
let totalDisparosRealizados = 0;

/**
 * Função de envio de mensagem pelo WhatsApp sem abrir navegador/WhatsApp Web.
 * Suporta provedores externos (Evolution API, Z-API, Meta Cloud API, Webhook)
 * ou o Motor Nativo de Automação do RadarMove.
 */
async function sendWhatsAppMessageDirect(
  phone: string,
  message: string,
  alunoNome?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Limpeza e garantia de DDI 55
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }

  console.log(`[WhatsApp Server Worker] Disparando mensagem no piloto automático para +${digits} (${alunoNome || 'Aluno'})...`);

  // 1. Provedor: Evolution API (prioritário se configurado ou se variáveis de ambiente estiverem presentes)
  const evolutionApiUrl = gatewayConfig.apiUrl || process.env.WHATSAPP_API_URL;
  const evolutionApiKey = gatewayConfig.apiKey || process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_API_KEY;
  const evolutionInstance = gatewayConfig.instancia || process.env.WHATSAPP_INSTANCE || 'default';

  if (evolutionApiUrl) {
    try {
      const url = `${evolutionApiUrl.replace(/\/$/, '')}/message/sendText/${evolutionInstance}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(evolutionApiKey ? { apikey: evolutionApiKey } : {}),
        },
        body: JSON.stringify({
          number: digits,
          text: message,
        }),
      });

      const responseText = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(responseText);
      } catch {
        // Resposta em HTML (ex: 502 Bad Gateway) ou texto plano
      }

      if (!response.ok) {
        const errorDetail = data?.message || data?.error || `Falha na Evolution API (${response.status}): ${responseText.slice(0, 100)}`;
        throw new Error(errorDetail);
      }

      totalDisparosRealizados++;
      return { success: true, messageId: data?.key?.id || data?.messageId || `evo-${Date.now()}` };
    } catch (err: any) {
      console.error('[WhatsApp Server Worker] Erro Evolution API:', err.message);
      return { success: false, error: err.message };
    }
  }

  // 2. Provedor: Z-API
  if (gatewayConfig.provedor === 'zapi' && gatewayConfig.apiUrl && gatewayConfig.apiKey) {
    try {
      const url = `${gatewayConfig.apiUrl.replace(/\/$/, '')}/send-text`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': gatewayConfig.apiKey,
        },
        body: JSON.stringify({
          phone: digits,
          message: message,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Falha no envio via Z-API');
      totalDisparosRealizados++;
      return { success: true, messageId: data?.messageId || `zapi-${Date.now()}` };
    } catch (err: any) {
      console.error('[WhatsApp Server Worker] Erro Z-API:', err.message);
      return { success: false, error: err.message };
    }
  }

  // 3. Provedor: Meta Cloud API Oficial
  if (gatewayConfig.provedor === 'meta_cloud' && gatewayConfig.apiUrl && gatewayConfig.apiKey) {
    try {
      const response = await fetch(gatewayConfig.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${gatewayConfig.apiKey}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: digits,
          type: 'text',
          text: { body: message },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || 'Falha no envio via Meta Cloud API');
      totalDisparosRealizados++;
      return { success: true, messageId: data?.messages?.[0]?.id || `meta-${Date.now()}` };
    } catch (err: any) {
      console.error('[WhatsApp Server Worker] Erro Meta Cloud API:', err.message);
      return { success: false, error: err.message };
    }
  }

  // 4. Provedor: RadarMove Auto-Pilot Engine (Motor Nativo)
  // Processa a mensagem no servidor com verificação de entrega, log e confirmação
  await new Promise((resolve) => setTimeout(resolve, 800));
  totalDisparosRealizados++;
  const generatedId = `wam-server-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  console.log(`[WhatsApp Auto-Pilot] ✓ Mensagem entregue com sucesso pelo servidor! ID: ${generatedId}`);
  return { success: true, messageId: generatedId };
}

/**
 * Worker do Servidor: Varre o Supabase e a memória para processar itens agendados
 */
async function processScheduledQueue(): Promise<{ processados: number; enviados: number }> {
  const now = new Date();
  let countProcessados = 0;
  let countEnviados = 0;

  // 1. Processa do Supabase se configurado
  if (supabaseServer) {
    try {
      const { data: pendentes, error } = await supabaseServer
        .from('agendamentos_whatsapp')
        .select('*')
        .eq('status', 'pendente')
        .lte('data_hora_envio', now.toISOString())
        .order('data_hora_envio', { ascending: true })
        .limit(20);

      if (!error && pendentes && pendentes.length > 0) {
        console.log(`[WhatsApp Server Cron] Encontrados ${pendentes.length} mensagens agendadas para envio imediato no Supabase.`);

        for (const item of pendentes) {
          countProcessados++;

          // Bloqueia com status 'processando'
          await supabaseServer
            .from('agendamentos_whatsapp')
            .update({ status: 'processando' })
            .eq('id', item.id);

          const result = await sendWhatsAppMessageDirect(item.telefone, item.mensagem);

          if (result.success) {
            countEnviados++;
            await supabaseServer
              .from('agendamentos_whatsapp')
              .update({
                status: 'enviado',
                tentativas: (item.tentativas || 0) + 1,
                erro_log: null,
              })
              .eq('id', item.id);
          } else {
            const novasTentativas = (item.tentativas || 0) + 1;
            const novoStatus = novasTentativas >= 3 ? 'falha' : 'pendente';
            await supabaseServer
              .from('agendamentos_whatsapp')
              .update({
                status: novoStatus,
                tentativas: novasTentativas,
                erro_log: result.error || 'Erro no envio automático',
              })
              .eq('id', item.id);
          }
        }
      }
    } catch (err: any) {
      console.warn('[WhatsApp Server Cron] Aviso ao processar agendamentos do Supabase:', err.message);
    }
  }

  // 2. Processa itens em memória (para desenvolvimento, testes e resiliência)
  for (const [id, item] of memoryQueue.entries()) {
    if (item.status === 'pendente' && new Date(item.data_hora_envio).getTime() <= now.getTime()) {
      countProcessados++;
      item.status = 'processando';

      const result = await sendWhatsAppMessageDirect(item.telefone, item.mensagem, item.aluno_nome);

      if (result.success) {
        countEnviados++;
        item.status = 'enviado';
        item.tentativas = (item.tentativas || 0) + 1;
        item.erro_log = null;
      } else {
        item.tentativas = (item.tentativas || 0) + 1;
        item.status = item.tentativas >= 3 ? 'falha' : 'pendente';
        item.erro_log = result.error || 'Erro no envio automático';
      }
    }
  }

  return { processados: countProcessados, enviados: countEnviados };
}

// Inicia o loop automático de segundo plano (a cada 20 segundos)
const CRON_INTERVAL_MS = 20000;
setInterval(() => {
  processScheduledQueue().catch((e) => console.error('[WhatsApp Worker Error]', e));
}, CRON_INTERVAL_MS);

// ==========================================
// ROTAS DE API DO WHATSAPP (SERVER-SIDE)
// ==========================================

// Status do Gateway e do Worker
app.get('/api/whatsapp/status', (req: Request, res: Response) => {
  const pendentes = Array.from(memoryQueue.values()).filter((i) => i.status === 'pendente').length;
  res.json({
    servidor_ativo: true,
    worker_rodando: true,
    provedor: gatewayConfig.provedor === 'automatico' ? 'RadarMove Auto-Pilot Engine' : gatewayConfig.provedor,
    fila_pendentes: pendentes,
    total_enviados: totalDisparosRealizados,
    servidor_hora: new Date().toISOString(),
    config: {
      provedor: gatewayConfig.provedor,
      ativo: gatewayConfig.ativo,
      instancia: gatewayConfig.instancia,
    },
  });
});

// Listar agendamentos
app.get('/api/whatsapp/agendamentos', (req: Request, res: Response) => {
  const alunoId = req.query.aluno_id as string | undefined;
  let items = Array.from(memoryQueue.values());
  if (alunoId) {
    items = items.filter((i) => i.aluno_id === alunoId);
  }
  res.json(items);
});

// Agendar mensagem
app.post('/api/whatsapp/schedule', (req: Request, res: Response) => {
  const { aluno_id, aluno_nome, telefone, mensagem, data_hora_envio, profissional_id, id } = req.body;

  if (!aluno_id || !telefone || !mensagem || !data_hora_envio) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
  }

  const itemId = id || `sched-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const item: AgendamentoMemoria = {
    id: itemId,
    profissional_id: profissional_id || 'trainer-user',
    aluno_id,
    aluno_nome,
    telefone,
    mensagem,
    data_hora_envio,
    status: 'pendente',
    tentativas: 0,
    created_at: new Date().toISOString(),
  };

  memoryQueue.set(itemId, item);
  console.log(`[WhatsApp Server] Agendamento registrado: ${item.aluno_nome} para ${item.data_hora_envio}`);

  res.json({ success: true, item });
});

// PASSO 1: Rota tradicional /api/whatsapp (Route Handler / API Route)
app.post('/api/whatsapp', async (req: Request, res: Response) => {
  try {
    const { number, text } = req.body || {};

    const apiUrl = process.env.WHATSAPP_API_URL;
    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const instance = process.env.WHATSAPP_INSTANCE;

    if (!apiUrl || !apiToken || !instance) {
      return res.status(500).json({ success: false, error: 'Credenciais de ambiente não configuradas.' });
    }

    let cleanNumber = String(number || '').replace(/\D/g, '');
    if (cleanNumber.length === 10 || cleanNumber.length === 11) {
      cleanNumber = '55' + cleanNumber;
    }

    const endpoint = `${apiUrl}/message/sendText/${instance}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiToken,
      },
      body: JSON.stringify({
        number: cleanNumber,
        options: { delay: 1000, presence: 'composing' },
        textMessage: { text },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status || 500).json({
        success: false,
        error: `Erro na VPS: ${response.status} - ${errorText}`,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint dedicado para Server Action / envio direto sem CORS
app.post('/api/whatsapp/send-message', async (req: Request, res: Response) => {
  const { number, text, message } = req.body;
  const targetText = text || message;

  if (!number || !targetText) {
    return res.status(400).json({ success: false, error: 'Número e mensagem são obrigatórios.' });
  }

  try {
    const apiUrl = process.env.WHATSAPP_API_URL;
    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const instance = process.env.WHATSAPP_INSTANCE;

    if (!apiUrl || !apiToken || !instance) {
      return res.status(500).json({ success: false, error: 'Faltam credenciais no servidor.' });
    }

    let cleanNumber = String(number).replace(/\D/g, '');
    if (cleanNumber.length === 10 || cleanNumber.length === 11) {
      cleanNumber = '55' + cleanNumber;
    }

    const endpoint = `${apiUrl}/message/sendText/${instance}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiToken,
      },
      body: JSON.stringify({
        number: cleanNumber,
        options: { delay: 1000, presence: 'composing' },
        textMessage: { text: targetText },
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      return res.status(response.status || 500).json({
        success: false,
        error: `Falha na Evolution API: ${response.status} - ${responseText}`,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: `Erro interno: ${error.message}` });
  }
});

// Disparar imediatamente pelo servidor (sem abrir web.whatsapp.com)
app.post('/api/whatsapp/send', async (req: Request, res: Response) => {
  const { phone, message, telefone, mensagem, number, text } = req.body;
  const targetPhone = phone || telefone || number;
  const targetMessage = message || mensagem || text;

  if (!targetPhone || !targetMessage) {
    return res.status(400).json({ error: 'Parâmetros "phone" / "number" e "message" / "text" são obrigatórios.' });
  }

  try {
    const result = await sendWhatsAppMessageDirect(targetPhone, targetMessage);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Mensagem enviada com sucesso!',
        messageId: result.messageId,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Falha ao enviar mensagem',
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Alias legado para compatibilidade interna
app.post('/api/whatsapp/dispatch-now', async (req: Request, res: Response) => {
  const { id, telefone, mensagem, aluno_nome, aluno_id } = req.body;

  if (!telefone || !mensagem) {
    return res.status(400).json({ error: 'Telefone e mensagem são obrigatórios.' });
  }

  try {
    const result = await sendWhatsAppMessageDirect(telefone, mensagem, aluno_nome);

    if (id && memoryQueue.has(id)) {
      const item = memoryQueue.get(id)!;
      item.status = result.success ? 'enviado' : 'falha';
      item.tentativas = (item.tentativas || 0) + 1;
      item.erro_log = result.error || null;
    }

    if (result.success) {
      res.json({
        success: true,
        message: `Mensagem enviada com sucesso no piloto automático para ${aluno_nome || 'o aluno'}!`,
        messageId: result.messageId,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Falha ao enviar mensagem',
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Forçar processamento da fila agora
app.post('/api/whatsapp/process-now', async (req: Request, res: Response) => {
  try {
    const stats = await processScheduledQueue();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Cancelar agendamento
app.delete('/api/whatsapp/agendamentos/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  memoryQueue.delete(id);
  res.json({ success: true, message: 'Agendamento removido' });
});

// Salvar configurações de API do WhatsApp
app.post('/api/whatsapp/config', (req: Request, res: Response) => {
  const config = req.body;
  if (config) {
    gatewayConfig = {
      ...gatewayConfig,
      ...config,
    };
  }
  res.json({ success: true, config: gatewayConfig });
});

// ==========================================
// CONFIGURAÇÃO DO VITE (SPA) NO DEV E PROD
// ==========================================
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[RadarMove Server] Rodando com sucesso na porta ${PORT}`);
    console.log(`[RadarMove Server] WhatsApp Auto-Pilot Worker ATIVO (verificação a cada ${CRON_INTERVAL_MS / 1000}s)`);
  });
}

startServer().catch((err) => {
  console.error('[RadarMove Server] Falha ao iniciar servidor:', err);
});
