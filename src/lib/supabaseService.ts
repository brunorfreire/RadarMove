import { supabase, isSupabaseConfigured } from './supabaseClient';
import { DesafioTemplate, Aluno, Lead, AvaliacaoFisica } from '../types';
import { mockDesafiosTemplates, mockAlunos, mockLeads, mockAvaliacoes } from './mockData';

/**
 * Carrega templates de desafios do Supabase.
 * Caso o Supabase não esteja configurado ou ocorra erro, retorna a lista mock local.
 */
export async function getDesafiosTemplates(): Promise<DesafioTemplate[]> {
  if (!isSupabaseConfigured()) {
    return mockDesafiosTemplates;
  }

  try {
    const { data, error } = await supabase
      .from('desafios_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      console.warn('Supabase: Nenhum template encontrado ou erro na busca. Usando mock.', error?.message);
      return mockDesafiosTemplates;
    }

    return data as DesafioTemplate[];
  } catch (err) {
    console.error('Erro ao buscar desafios do Supabase:', err);
    return mockDesafiosTemplates;
  }
}

/**
 * Cria um novo template de desafio no Supabase
 */
export async function createDesafioTemplate(
  template: Omit<DesafioTemplate, 'id' | 'created_at'>
): Promise<{ success: boolean; data?: DesafioTemplate; error?: string }> {
  if (!isSupabaseConfigured()) {
    // Retorna simulado com ID gerado
    const newId = `des-local-${Date.now()}`;
    return {
      success: true,
      data: {
        id: newId,
        ...template,
      },
    };
  }

  try {
    const { data, error } = await supabase
      .from('desafios_templates')
      .insert([template])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as DesafioTemplate };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro inesperado' };
  }
}

/**
 * Carrega a lista de alunos do Supabase
 */
export async function getAlunos(): Promise<Aluno[]> {
  if (!isSupabaseConfigured()) {
    return mockAlunos;
  }

  try {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .order('nome', { ascending: true });

    if (error || !data || data.length === 0) {
      return mockAlunos;
    }

    return data as Aluno[];
  } catch (err) {
    console.error('Erro ao buscar alunos do Supabase:', err);
    return mockAlunos;
  }
}

/**
 * Carrega a lista de leads do Supabase
 */
export async function getLeads(): Promise<Lead[]> {
  if (!isSupabaseConfigured()) {
    return mockLeads;
  }

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return mockLeads;
    }

    return data as Lead[];
  } catch (err) {
    console.error('Erro ao buscar leads do Supabase:', err);
    return mockLeads;
  }
}
