/**
 * Serviço de Gerenciamento e Persistência do Histórico de Desafios no Supabase.
 * Tabela: `historico_desafios` (protegida com RLS pelo `personal_id`).
 * Evita o reenvio acidental de desafios repetidos para o mesmo aluno.
 */
import { supabase } from './supabaseClient';
import { DesafioEnviado, DesafioTemplate } from '../types';

export interface RegistrarDesafioPayload {
  alunoId: string;
  alunoNome?: string;
  desafioId?: string;
  desafioTitulo: string;
  categoria?: string;
  dificuldade?: string;
  tempoEstimado?: string;
  mensagemEnviada: string;
}

/**
 * Salva um novo registro na tabela `historico_desafios` no Supabase com isolamento de personal_id.
 */
export async function salvarHistoricoDesafioSupabase(
  payload: RegistrarDesafioPayload
): Promise<DesafioEnviado | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const personalId = session?.user?.id || null;

    if (!personalId) {
      console.warn('[historicoDesafiosService] Usuário não autenticado no Supabase. Salvando apenas localmente.');
    }

    const dataEnvioIso = new Date().toISOString();

    const insertPayload: Record<string, any> = {
      aluno_id: payload.alunoId,
      desafio_id: payload.desafioId || null,
      desafio_titulo: payload.desafioTitulo,
      mensagem_enviada: payload.mensagemEnviada,
      data_envio: dataEnvioIso,
      personal_id: personalId,
    };

    // Insere no banco com fallback resiliente
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
      desafio_id: payload.desafioId,
      desafio_titulo: payload.desafioTitulo,
      categoria: payload.categoria as any,
      dificuldade: payload.dificuldade as any,
      tempo_estimado: payload.tempoEstimado,
      mensagem_enviada: payload.mensagemEnviada,
      data_envio: dataEnvioIso,
      data_formatada: 'Hoje, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tempo_atras: 'Agora',
      status_resposta: 'pendente',
      origem_disparo: 'individual',
      vezes_enviado: 1,
    };

    return registroFormatado;
  } catch (err) {
    console.error('[historicoDesafiosService] Erro ao persistir histórico no Supabase:', err);
    return null;
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
      origem_disparo: item.origem_disparo || 'individual',
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
      vezes_enviado: 1,
    }));
  } catch (err) {
    console.error('[historicoDesafiosService] Erro ao buscar histórico do aluno:', err);
    return [];
  }
}
