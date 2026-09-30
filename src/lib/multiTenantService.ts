/**
 * Camada de Acesso a Dados Multi-Tenant do RadarMove.
 * Garante em tempo de execução que todas as operações filtrem e vinculem
 * rigorosamente o `personal_id` (Tenant ID) do usuário logado.
 */
import { supabase } from './supabaseClient';
import { formatWhatsAppNumber, getWhatsAppUrl } from './whatsappUtils';

export interface AlunoTenant {
  id: string;
  personal_id: string;
  nome: string;
  telefone: string;
  status: 'ativo' | 'inativo' | 'em_risco';
  objetivo?: string;
  dias_sem_treino?: number;
  plano?: string;
  avatar_url?: string;
}

export interface TemplateTenant {
  id: string;
  personal_id: string | null;
  categoria: string;
  titulo: string;
  conteudo: string;
  is_global: boolean;
}

/**
 * Retorna o ID do Personal Trainer autenticado na sessão atual.
 * Lança erro se não houver sessão ativa, impedindo vazamento de dados.
 */
export async function getLoggedPersonalId(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.user?.id) {
    throw new Error('Sessão expirada ou usuário não autenticado no RadarMove.');
  }
  return session.user.id;
}

// ============================================================================
// CRUD MULTI-TENANT: ALUNOS & CONTATOS
// ============================================================================

/**
 * Busca apenas os alunos pertencentes ao Personal Trainer autenticado.
 */
export async function listarAlunosPorPersonal(): Promise<AlunoTenant[]> {
  const personalId = await getLoggedPersonalId();

  const { data, error } = await supabase
    .from('alunos')
    .select('*')
    .eq('personal_id', personalId)
    .order('nome', { ascending: true });

  if (error) {
    console.error('[Multi-tenant Alunos] Erro ao buscar alunos:', error.message);
    throw error;
  }

  return data || [];
}

/**
 * Cadastra um novo aluno vinculando obrigatoriamente o personal_id.
 */
export async function criarAlunoTenant(
  alunoData: Omit<AlunoTenant, 'id' | 'personal_id'>
): Promise<AlunoTenant> {
  const personalId = await getLoggedPersonalId();

  const novoAluno = {
    ...alunoData,
    personal_id: personalId,
    telefone: formatWhatsAppNumber(alunoData.telefone),
  };

  const { data, error } = await supabase
    .from('alunos')
    .insert([novoAluno])
    .select()
    .single();

  if (error) {
    console.error('[Multi-tenant Alunos] Erro ao criar aluno:', error.message);
    throw error;
  }

  return data;
}

/**
 * Atualiza um aluno garantindo que pertença ao personal_id autenticado.
 */
export async function atualizarAlunoTenant(
  id: string,
  dadosAtualizacao: Partial<Omit<AlunoTenant, 'id' | 'personal_id'>>
): Promise<AlunoTenant> {
  const personalId = await getLoggedPersonalId();

  const { data, error } = await supabase
    .from('alunos')
    .update({
      ...dadosAtualizacao,
      ...(dadosAtualizacao.telefone ? { telefone: formatWhatsAppNumber(dadosAtualizacao.telefone) } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('personal_id', personalId) // Defesa em profundidade no código
    .select()
    .single();

  if (error) {
    console.error('[Multi-tenant Alunos] Erro ao atualizar aluno:', error.message);
    throw error;
  }

  return data;
}

/**
 * Deleta um aluno garantindo o filtro por personal_id.
 */
export async function excluirAlunoTenant(id: string): Promise<boolean> {
  const personalId = await getLoggedPersonalId();

  const { error } = await supabase
    .from('alunos')
    .delete()
    .eq('id', id)
    .eq('personal_id', personalId);

  if (error) {
    console.error('[Multi-tenant Alunos] Erro ao excluir aluno:', error.message);
    throw error;
  }

  return true;
}

// ============================================================================
// CRUD MULTI-TENANT: TEMPLATES DE MENSAGEM
// ============================================================================

/**
 * Busca templates globais do sistema RadarMove + templates criados pelo Personal logado.
 */
export async function listarTemplatesPersonal(): Promise<TemplateTenant[]> {
  const personalId = await getLoggedPersonalId();

  const { data, error } = await supabase
    .from('templates_mensagens')
    .select('*')
    .or(`is_global.eq.true,personal_id.eq.${personalId}`)
    .order('titulo', { ascending: true });

  if (error) {
    console.error('[Multi-tenant Templates] Erro ao buscar templates:', error.message);
    throw error;
  }

  return data || [];
}

/**
 * Cria um novo template de mensagem exclusivo do Personal.
 */
export async function criarTemplatePersonal(
  templateData: Omit<TemplateTenant, 'id' | 'personal_id' | 'is_global'>
): Promise<TemplateTenant> {
  const personalId = await getLoggedPersonalId();

  const novoTemplate = {
    ...templateData,
    personal_id: personalId,
    is_global: false,
  };

  const { data, error } = await supabase
    .from('templates_mensagens')
    .insert([novoTemplate])
    .select()
    .single();

  if (error) {
    console.error('[Multi-tenant Templates] Erro ao criar template:', error.message);
    throw error;
  }

  return data;
}

// ============================================================================
// FLUXO DE DISPARO WA.ME COM AUDITORIA ISOLADA POR PERSONAL
// ============================================================================

export interface DisparoWaParams {
  alunoId?: string;
  destinatarioNome: string;
  telefone: string;
  mensagem: string;
}

/**
 * Executa o fluxo de disparo nativo:
 * 1. Higieniza o número com código internacional (+55);
 * 2. Gera a URL oficial wa.me devidamente codificada;
 * 3. Registra auditoria na tabela 'historico_disparos' vinculada ao personal_id;
 * 4. Abre o WhatsApp no navegador/app do personal.
 */
export async function dispararWhatsAppComRegistro(
  params: DisparoWaParams
): Promise<{ success: boolean; url: string }> {
  const personalId = await getLoggedPersonalId();
  const cleanPhone = formatWhatsAppNumber(params.telefone);

  if (!cleanPhone || cleanPhone.length < 10) {
    throw new Error('Número de telefone inválido para o WhatsApp.');
  }

  // Gera o link wa.me com codificação uniforme
  const url = getWhatsAppUrl(cleanPhone, params.mensagem.trim());

  // Registra no banco isolado do personal (auditoria e métricas)
  try {
    await supabase.from('historico_disparos').insert([
      {
        personal_id: personalId,
        aluno_id: params.alunoId || null,
        destinatario_nome: params.destinatarioNome,
        telefone_destinatario: cleanPhone,
        conteudo_mensagem: params.mensagem.trim(),
        url_wa_gerada: url,
        metodo: 'wa_me_link',
      },
    ]);
  } catch (err) {
    console.warn('[Auditoria Disparo] Não foi possível persistir histórico:', err);
  }

  // Abre nativamente a janela de conversa no WhatsApp
  if (typeof window !== 'undefined') {
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = url;
    }
  }

  return { success: true, url };
}
