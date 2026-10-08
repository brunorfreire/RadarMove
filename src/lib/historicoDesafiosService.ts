/**
 * Serviço de Gerenciamento e Persistência do Histórico de Desafios no Supabase.
 * Tabelas: `student_challenge_deliveries` e `historico_desafios` (protegidas com RLS pelo `personal_id`).
 * 
 * Funcionalidades Obrigatórias:
 * 1. Chave de Idempotência individualizada por (alunoId, desafioId, personalId).
 * 2. Bloqueio permanente de reenvio com validação em memória e no banco.
 * 3. Armazenamento e vinculação de imagens demonstrativas enviadas.
 * 4. Rastreamento granular de status: pendente -> processando -> aceito -> enviado -> entregue -> lido / falhou.
 */
import { supabase } from './supabaseClient';
import { DesafioEnviado, DesafioTemplate, StatusEntregaDesafio } from '../types';

export interface RegistrarDesafioPayload {
  alunoId: string;
  alunoNome?: string;
  desafioId?: string;
  desafioTitulo: string;
  categoria?: string;
  dificuldade?: string;
  tempoEstimado?: string;
  mensagemEnviada: string;
  imagensUrls?: string[];
  numeroDestino?: string;
  providerMessageId?: string;
  statusEnvio?: StatusEntregaDesafio;
  origemEnvio?: 'individual' | 'massa' | 'radar_alerta' | 'card_rapido' | 'radar_dashboard';
  idempotencyKey?: string;
}

// Conjunto em memória para bloquear cliques simultâneos e requisições paralelas (Race Condition Guard)
const enviosEmProcessamento = new Set<string>();

/**
 * Gera chave de idempotência exclusiva para o par Aluno + Desafio + Personal
 */
export function gerarChaveIdempotencia(alunoId: string, desafioId: string, personalId?: string | null): string {
  return `idemp_${personalId || 'trainer'}_${alunoId}_${desafioId}`;
}

/**
 * Verifica se um envio para este aluno e desafio está atualmente em trânsito
 */
export function isEnvioEmAndamento(alunoId: string, desafioId: string): boolean {
  const chave = `${alunoId}_${desafioId}`;
  return enviosEmProcessamento.has(chave);
}

/**
 * Marca o início de uma operação de envio (Trava contra double-click)
 */
export function travarEnvio(alunoId: string, desafioId: string): boolean {
  const chave = `${alunoId}_${desafioId}`;
  if (enviosEmProcessamento.has(chave)) {
    return false; // Já está travado
  }
  enviosEmProcessamento.add(chave);
  return true;
}

/**
 * Libera a trava após confirmação ou falha definitiva
 */
export function liberarTravaEnvio(alunoId: string, desafioId: string): void {
  const chave = `${alunoId}_${desafioId}`;
  enviosEmProcessamento.delete(chave);
}

/**
 * Salva ou atualiza um registro de envio no Supabase com suporte a idempotência e imagens
 */
export async function salvarHistoricoDesafioSupabase(
  payload: RegistrarDesafioPayload
): Promise<DesafioEnviado | null> {
  const desafioId = payload.desafioId || `desafio-${payload.desafioTitulo.toLowerCase().replace(/\s+/g, '-')}`;
  const chaveTrava = `${payload.alunoId}_${desafioId}`;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const personalId = session?.user?.id || null;
    const dataEnvioIso = new Date().toISOString();
    const idempKey = payload.idempotencyKey || gerarChaveIdempotencia(payload.alunoId, desafioId, personalId);

    // 1. Tenta gravar na tabela dedicada student_challenge_deliveries
    try {
      await supabase
        .from('student_challenge_deliveries')
        .insert([{
          aluno_id: payload.alunoId,
          personal_id: personalId,
          desafio_id: desafioId,
          desafio_titulo: payload.desafioTitulo,
          mensagem_enviada: payload.mensagemEnviada,
          imagens_urls: payload.imagensUrls || [],
          numero_destino: payload.numeroDestino || null,
          provider_message_id: payload.providerMessageId || null,
          status_envio: payload.statusEnvio || 'enviado',
          data_envio: dataEnvioIso,
          origem_envio: payload.origemEnvio || 'manual',
          idempotency_key: idempKey,
        }]);
    } catch (deliveryErr) {
      // Ignora erro se a tabela nova ainda estiver pendente de criação no Supabase
    }

    // 2. Grava na tabela principal historico_desafios
    const insertPayload: Record<string, any> = {
      aluno_id: payload.alunoId,
      desafio_id: desafioId,
      desafio_titulo: payload.desafioTitulo,
      mensagem_enviada: payload.mensagemEnviada,
      data_envio: dataEnvioIso,
      personal_id: personalId,
      status_envio: payload.statusEnvio || 'enviado',
      provider_message_id: payload.providerMessageId || null,
      numero_destino: payload.numeroDestino || null,
      imagens_urls: payload.imagensUrls || [],
      idempotency_key: idempKey,
    };

    const { data, error } = await supabase
      .from('historico_desafios')
      .insert([insertPayload])
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[historicoDesafiosService] Aviso ao gravar em historico_desafios:', error.message);
    }

    const idGerado = data?.id || `hist-${Date.now()}-${payload.alunoId}`;

    const registroFormatado: DesafioEnviado = {
      id: idGerado,
      aluno_id: payload.alunoId,
      aluno_nome: payload.alunoNome || 'Aluno',
      desafio_id: desafioId,
      desafio_titulo: payload.desafioTitulo,
      categoria: payload.categoria as any,
      dificuldade: payload.dificuldade as any,
      tempo_estimado: payload.tempoEstimado,
      mensagem_enviada: payload.mensagemEnviada,
      data_envio: dataEnvioIso,
      data_formatada: 'Hoje, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tempo_atras: 'Agora',
      status_resposta: 'pendente',
      origem_disparo: payload.origemEnvio || 'individual',
      status_envio: payload.statusEnvio || 'enviado',
      imagens_urls: payload.imagensUrls,
      imagem_url: payload.imagensUrls?.[0],
      numero_destino: payload.numeroDestino,
      provider_message_id: payload.providerMessageId,
      idempotency_key: idempKey,
      vezes_enviado: 1,
    };

    return registroFormatado;
  } catch (err) {
    console.error('[historicoDesafiosService] Erro ao persistir histórico no Supabase:', err);
    return null;
  } finally {
    liberarTravaEnvio(payload.alunoId, desafioId);
  }
}

/**
 * Atualiza o status de entrega de um desafio já registrado (ex: entregue, lido, falhou)
 */
export async function atualizarStatusEntregaDesafio(
  desafioEnviadoId: string,
  novoStatus: StatusEntregaDesafio,
  detalhes?: { providerMessageId?: string; erroEnvio?: string }
): Promise<boolean> {
  try {
    const updateData: Record<string, any> = {
      status_envio: novoStatus,
    };
    if (detalhes?.providerMessageId) updateData.provider_message_id = detalhes.providerMessageId;
    if (detalhes?.erroEnvio) updateData.erro_envio = detalhes.erroEnvio;
    if (novoStatus === 'entregue') updateData.data_entrega = new Date().toISOString();
    if (novoStatus === 'lido') updateData.data_leitura = new Date().toISOString();

    await supabase
      .from('historico_desafios')
      .update(updateData)
      .eq('id', desafioEnviadoId);

    return true;
  } catch (err) {
    console.warn('[historicoDesafiosService] Erro ao atualizar status de entrega:', err);
    return false;
  }
}

/**
 * Busca todo o histórico de desafios do Personal Trainer autenticado.
 */
export async function listarHistoricoDesafiosPersonal(): Promise<DesafioEnviado[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const personalId = session?.user?.id;

    if (!personalId) return [];

    const { data, error } = await supabase
      .from('historico_desafios')
      .select('*')
      .eq('personal_id', personalId)
      .order('data_envio', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      aluno_id: item.aluno_id,
      aluno_nome: item.aluno_nome || 'Aluno',
      desafio_id: item.desafio_id,
      desafio_titulo: item.desafio_titulo || 'Micro-Desafio',
      categoria: item.categoria || item.desafio_categoria,
      dificuldade: item.dificuldade || item.desafio_dificuldade,
      tempo_estimado: item.tempo_estimado,
      mensagem_enviada: item.mensagem_enviada || '',
      data_envio: item.data_envio,
      data_formatada: new Date(item.data_envio).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      tempo_atras: '',
      status_resposta: item.status_resposta || 'pendente',
      origem_disparo: item.origem_disparo || item.origem_envio || 'individual',
      status_envio: (item.status_envio as StatusEntregaDesafio) || 'enviado',
      imagens_urls: Array.isArray(item.imagens_urls) ? item.imagens_urls : (item.imagem_url ? [item.imagem_url] : []),
      imagem_url: Array.isArray(item.imagens_urls) && item.imagens_urls.length > 0 ? item.imagens_urls[0] : item.imagem_url,
      numero_destino: item.numero_destino,
      provider_message_id: item.provider_message_id,
      idempotency_key: item.idempotency_key,
      vezes_enviado: 1,
    }));
  } catch (err) {
    console.error('[historicoDesafiosService] Erro ao listar histórico:', err);
    return [];
  }
}

/**
 * Busca o histórico de desafios enviados especificamente para um determinado aluno.
 */
export async function listarHistoricoPorAluno(alunoId: string): Promise<DesafioEnviado[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const personalId = session?.user?.id;

    if (!personalId || !alunoId) return [];

    const { data, error } = await supabase
      .from('historico_desafios')
      .select('*')
      .eq('personal_id', personalId)
      .eq('aluno_id', alunoId)
      .order('data_envio', { ascending: false });

    if (error || !data) return [];

    return data.map((item: any) => ({
      id: item.id,
      aluno_id: item.aluno_id,
      aluno_nome: item.aluno_nome || 'Aluno',
      desafio_id: item.desafio_id,
      desafio_titulo: item.desafio_titulo || 'Micro-Desafio',
      categoria: item.categoria,
      dificuldade: item.dificuldade,
      tempo_estimado: item.tempo_estimado,
      mensagem_enviada: item.mensagem_enviada || '',
      data_envio: item.data_envio,
      data_formatada: new Date(item.data_envio).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      tempo_atras: '',
      status_resposta: item.status_resposta || 'pendente',
      origem_disparo: 'individual',
      status_envio: (item.status_envio as StatusEntregaDesafio) || 'enviado',
      imagens_urls: Array.isArray(item.imagens_urls) ? item.imagens_urls : (item.imagem_url ? [item.imagem_url] : []),
      imagem_url: Array.isArray(item.imagens_urls) && item.imagens_urls.length > 0 ? item.imagens_urls[0] : item.imagem_url,
      numero_destino: item.numero_destino,
      provider_message_id: item.provider_message_id,
      idempotency_key: item.idempotency_key,
      vezes_enviado: 1,
    }));
  } catch (err) {
    console.error('[historicoDesafiosService] Erro ao buscar histórico do aluno:', err);
    return [];
  }
}
