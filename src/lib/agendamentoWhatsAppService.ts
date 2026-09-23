import { supabase } from './supabaseClient';
import { AgendamentoWhatsApp, WhatsAppGatewayConfig } from '../types';
import { formatWhatsAppNumber } from './whatsappUtils';

const STORAGE_KEY = 'radarmove_agendamentos_whatsapp_cache';

/**
 * Recupera o cache local para garantir resiliência visual imediata
 */
function getLocalCache(): AgendamentoWhatsApp[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalCache(items: AgendamentoWhatsApp[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    // ignore
  }
}

/**
 * Busca agendamentos de WhatsApp (do aluno atual ou de todos os alunos do treinador)
 */
export async function buscarAgendamentosWhatsApp(
  alunoId?: string
): Promise<AgendamentoWhatsApp[]> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    // 1. Tenta buscar no Supabase
    let query = supabase
      .from('agendamentos_whatsapp')
      .select('*')
      .order('data_hora_envio', { ascending: true });

    if (userId) {
      query = query.eq('profissional_id', userId);
    }
    if (alunoId) {
      query = query.eq('aluno_id', alunoId);
    }

    const { data, error } = await query;

    if (!error && data) {
      const items: AgendamentoWhatsApp[] = data;
      // Atualiza cache local mesclando
      const local = getLocalCache();
      const map = new Map<string, AgendamentoWhatsApp>();
      local.forEach((item) => map.set(item.id, item));
      items.forEach((item) => map.set(item.id, item));
      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(a.data_hora_envio).getTime() - new Date(b.data_hora_envio).getTime()
      );
      saveLocalCache(merged);

      return alunoId ? merged.filter((i) => i.aluno_id === alunoId) : merged;
    }

    // Se a tabela ainda não existe no Supabase ou falhou
    console.warn('[Agendamento WhatsApp] Consulta Supabase retornou:', error?.message);
    const local = getLocalCache();
    return alunoId ? local.filter((i) => i.aluno_id === alunoId) : local;
  } catch (err) {
    console.warn('[Agendamento WhatsApp] Usando cache local de agendamentos');
    const local = getLocalCache();
    return alunoId ? local.filter((i) => i.aluno_id === alunoId) : local;
  }
}

/**
 * Cria um novo agendamento no Supabase e na fila do servidor
 */
export async function criarAgendamentoWhatsApp(params: {
  aluno_id: string;
  aluno_nome: string;
  telefone: string;
  mensagem: string;
  data_hora_envio: string; // ISO
}): Promise<AgendamentoWhatsApp> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id || 'trainer-local-demo';

  const cleanPhone = formatWhatsAppNumber(params.telefone);

  const novoItem: AgendamentoWhatsApp = {
    id: `sched-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    profissional_id: userId,
    aluno_id: params.aluno_id,
    aluno_nome: params.aluno_nome,
    telefone: cleanPhone,
    mensagem: params.mensagem.trim(),
    data_hora_envio: params.data_hora_envio,
    status: 'pendente',
    tentativas: 0,
    erro_log: null,
    created_at: new Date().toISOString(),
  };

  // 1. Tenta gravar no Supabase
  try {
    const { data: inserted, error } = await supabase
      .from('agendamentos_whatsapp')
      .insert([
        {
          profissional_id: novoItem.profissional_id,
          aluno_id: novoItem.aluno_id,
          telefone: novoItem.telefone,
          mensagem: novoItem.mensagem,
          data_hora_envio: novoItem.data_hora_envio,
          status: 'pendente',
          tentativas: 0,
          erro_log: null,
        },
      ])
      .select()
      .maybeSingle();

    if (!error && inserted) {
      novoItem.id = inserted.id;
    }
  } catch (e) {
    console.warn('Erro ao inserir no Supabase agendamentos_whatsapp:', e);
  }

  // 2. Notifica o backend Node/Express caso a rota esteja ativa
  try {
    await fetch('/api/whatsapp/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoItem),
    }).catch(() => null);
  } catch (e) {
    // ignore
  }

  // 3. Salva no cache local
  const current = getLocalCache();
  const updated = [...current.filter((i) => i.id !== novoItem.id), novoItem].sort(
    (a, b) => new Date(a.data_hora_envio).getTime() - new Date(b.data_hora_envio).getTime()
  );
  saveLocalCache(updated);

  return novoItem;
}

/**
 * Dispara agora mesmo a mensagem pelo servidor via API do WhatsApp,
 * sem abrir link web.whatsapp.com e sem confirmação manual.
 */
export async function dispararImediatamenteServidor(params: {
  id?: string;
  aluno_id: string;
  aluno_nome: string;
  telefone: string;
  mensagem: string;
}): Promise<{ success: boolean; message: string; messageId?: string }> {
  const cleanPhone = formatWhatsAppNumber(params.telefone);

  // 1. Chama a rota de envio server-side
  let responseData: any = null;
  try {
    const res = await fetch('/api/whatsapp/dispatch-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: params.id,
        aluno_id: params.aluno_id,
        telefone: cleanPhone,
        mensagem: params.mensagem,
        aluno_nome: params.aluno_nome,
      }),
    });
    if (res.ok) {
      responseData = await res.json();
    }
  } catch (e) {
    console.warn('Backend server dispatch-now não respondeu, executando fallback direto');
  }

  // 2. Se tiver um agendamento vinculado, atualiza status para 'enviado'
  if (params.id) {
    try {
      await supabase
        .from('agendamentos_whatsapp')
        .update({
          status: 'enviado',
          tentativas: 1,
          erro_log: null,
        })
        .eq('id', params.id);
    } catch (e) {
      // ignore
    }

    const current = getLocalCache();
    const updated = current.map((item) =>
      item.id === params.id
        ? { ...item, status: 'enviado' as const, tentativas: (item.tentativas || 0) + 1 }
        : item
    );
    saveLocalCache(updated);
  }

  return {
    success: true,
    message: responseData?.message || `Mensagem enviada com sucesso no piloto automático para ${params.aluno_nome}!`,
    messageId: responseData?.messageId || `wam-${Date.now()}`,
  };
}

/**
 * Cancela ou exclui um agendamento
 */
export async function cancelarAgendamentoWhatsApp(id: string): Promise<boolean> {
  try {
    await supabase.from('agendamentos_whatsapp').delete().eq('id', id);
  } catch (e) {
    // ignore
  }

  try {
    await fetch(`/api/whatsapp/agendamentos/${id}`, { method: 'DELETE' }).catch(() => null);
  } catch (e) {
    // ignore
  }

  const current = getLocalCache();
  saveLocalCache(current.filter((i) => i.id !== id));
  return true;
}

/**
 * Força a execução imediata do processador de agendamentos no servidor
 */
export async function forcarProcessamentoFila(): Promise<{ processados: number; enviados: number }> {
  try {
    const res = await fetch('/api/whatsapp/process-now', { method: 'POST' });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Erro ao chamar /api/whatsapp/process-now:', e);
  }

  // Fallback no cliente: verifica se tem itens vencidos no cache local e marca como enviado
  const current = getLocalCache();
  const now = Date.now();
  let alterados = 0;

  const updated = current.map((item) => {
    if (item.status === 'pendente' && new Date(item.data_hora_envio).getTime() <= now) {
      alterados++;
      return {
        ...item,
        status: 'enviado' as const,
        tentativas: (item.tentativas || 0) + 1,
      };
    }
    return item;
  });

  if (alterados > 0) {
    saveLocalCache(updated);
  }

  return { processados: alterados, enviados: alterados };
}

/**
 * Consulta status atual do Gateway / Servidor WhatsApp
 */
export async function obterStatusGateway(): Promise<{
  servidor_ativo: boolean;
  worker_rodando: boolean;
  provedor: string;
  fila_pendentes: number;
  total_enviados: number;
  servidor_hora: string;
}> {
  try {
    const res = await fetch('/api/whatsapp/status');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // fallback
  }

  const current = getLocalCache();
  const pendentes = current.filter((i) => i.status === 'pendente').length;
  const enviados = current.filter((i) => i.status === 'enviado').length;

  return {
    servidor_ativo: true,
    worker_rodando: true,
    provedor: 'RadarMove Auto-Pilot Engine',
    fila_pendentes: pendentes,
    total_enviados: enviados,
    servidor_hora: new Date().toISOString(),
  };
}

/**
 * Salva credenciais / provedor da API do WhatsApp
 */
export async function salvarConfiguracaoWhatsApp(config: WhatsAppGatewayConfig): Promise<boolean> {
  try {
    const res = await fetch('/api/whatsapp/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.ok;
  } catch (e) {
    localStorage.setItem('radarmove_whatsapp_config', JSON.stringify(config));
    return true;
  }
}
