import { supabase } from './supabaseClient';
import { DesafioImagem } from '../types';
import { gerarSvgDemonstrativoResetCadeira } from './diagramasExercicios';

/**
 * Mapeamento inicial nativo de imagens para desafios de bolso com riqueza anatômica e postural
 */
export const IMAGENS_DESAFIOS_PADRAO: Record<string, DesafioImagem[]> = {
  'Reset de 3 Minutos na Cadeira': [
    {
      id: 'img-reset-cadeira-full',
      url: gerarSvgDemonstrativoResetCadeira(),
      quadro_numero: 1,
      exercicio_nome: 'Sequência Completa de Reset (Ombros, Torácica e Cócoras)',
      repeticoes_tempo: '3 Minutos Totais',
      orientacoes_postura: '1. Rotação ombros (10x) -> 2. Extensão torácica na cadeira (10x) -> 3. Cócoras / Mobilidade quadril (até 1m)',
      adaptacao_mobilidade: 'Se sentir desconforto ao agachar, faça a opção apoiado no assento ou com os pés afastados na cadeira.',
      ordem: 1,
    },
    {
      id: 'img-reset-cadeira-fase1',
      url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
      quadro_numero: 1,
      exercicio_nome: 'Fase 1: Rotação Escapular e Ombros',
      repeticoes_tempo: '10 repetições',
      orientacoes_postura: 'Coluna ereta, eleve e rode os ombros abrindo a caixa torácica.',
      adaptacao_mobilidade: 'Amplitude livre de dor.',
      ordem: 2,
    },
    {
      id: 'img-reset-cadeira-fase2',
      url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
      quadro_numero: 2,
      exercicio_nome: 'Fase 2: Extensão Torácica Apoiada',
      repeticoes_tempo: '10 repetições',
      orientacoes_postura: 'Mãos na nuca, apoie as costas no encosto da cadeira e expanda o tórax.',
      adaptacao_mobilidade: 'Não force a coluna cervical.',
      ordem: 3,
    },
    {
      id: 'img-reset-cadeira-fase3',
      url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
      quadro_numero: 3,
      exercicio_nome: 'Fase 3: Mobilidade de Quadril em Cócoras',
      repeticoes_tempo: 'Até 1 minuto',
      orientacoes_postura: 'Calcanhares firmes no chão, use o assento à frente se necessário.',
      adaptacao_mobilidade: 'Alternativa sentada: abra os joelhos com os cotovelos.',
      ordem: 4,
    },
  ],
  'Mini-HIIT Anti-Cancelamento (12 Min)': [
    {
      id: 'img-hiit-1',
      url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
      quadro_numero: 1,
      exercicio_nome: 'Polichinelos + Agachamento + Prancha',
      repeticoes_tempo: '4 Rounds de 30s',
      orientacoes_postura: 'Mantenha ritmo constante e aterrissagem suave nas pontas dos pés.',
      adaptacao_mobilidade: 'Sem salto: passos laterais alternados.',
      ordem: 1,
    },
  ],
  'Prancha Isométrica de 60 Segundos': [
    {
      id: 'img-prancha-1',
      url: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?auto=format&fit=crop&w=800&q=80',
      quadro_numero: 1,
      exercicio_nome: 'Prancha Ventral nos Antebraços',
      repeticoes_tempo: '60 segundos contínuos',
      orientacoes_postura: 'Cotovelos abaixo dos ombros, glúteos contraídos e abdômen travado sem curvar lombar.',
      adaptacao_mobilidade: 'Apoie os joelhos no chão mantendo a inclinação do tronco.',
      ordem: 1,
    },
  ],
  'Agachamento Isométrico na Parede (Wall Sit 90s)': [
    {
      id: 'img-wallsit-1',
      url: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&w=800&q=80',
      quadro_numero: 1,
      exercicio_nome: 'Wall Sit a 90 Graus',
      repeticoes_tempo: '90 segundos',
      orientacoes_postura: 'Costas bem apoiadas na parede, joelhos alinhados com tornozelos.',
      adaptacao_mobilidade: 'Inicie com 45 graus ou reduza o tempo para blocos de 30s.',
      ordem: 1,
    },
  ],
  'Mobilidade Torácica do Gato e Vaca': [
    {
      id: 'img-gato-vaca-1',
      url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
      quadro_numero: 1,
      exercicio_nome: 'Transição Gato e Vaca (Cat-Cow)',
      repeticoes_tempo: '15 repetições lentas',
      orientacoes_postura: 'Em 4 apoios, alterne arredondamento torácico e extensão com respiração rítmica.',
      adaptacao_mobilidade: 'Pode ser realizado com as mãos apoiadas em uma mesa firme se houver desconforto nos joelhos.',
      ordem: 1,
    },
  ],
};

/**
 * Busca imagens associadas ao desafio no Supabase ou no catálogo padrão
 */
export async function obterImagensDesafio(desafioId: string, desafioTitulo?: string): Promise<DesafioImagem[]> {
  try {
    // 1. Tenta carregar imagens customizadas da tabela pocket_challenge_images no Supabase
    const { data, error } = await supabase
      .from('pocket_challenge_images')
      .select('*')
      .eq('desafio_id', desafioId)
      .order('ordem', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        url: d.url,
        quadro_numero: d.quadro_numero || 1,
        exercicio_nome: d.exercicio_nome || 'Exercício',
        repeticoes_tempo: d.repeticoes_tempo || '',
        orientacoes_postura: d.orientacoes_postura || '',
        adaptacao_mobilidade: d.adaptacao_mobilidade || '',
        ordem: d.ordem || 1,
      }));
    }
  } catch (err) {
    console.warn('[Imagens Desafio] Erro ao consultar tabela pocket_challenge_images:', err);
  }

  // 2. Fallback baseado no título do desafio
  if (desafioTitulo && IMAGENS_DESAFIOS_PADRAO[desafioTitulo]) {
    return IMAGENS_DESAFIOS_PADRAO[desafioTitulo];
  }

  // Se o título contiver Reset de 3 Minutos
  if (desafioTitulo?.toLowerCase().includes('reset') && desafioTitulo?.toLowerCase().includes('cadeira')) {
    return IMAGENS_DESAFIOS_PADRAO['Reset de 3 Minutos na Cadeira'];
  }

  return [];
}

/**
 * Upload de imagem para o Supabase Storage (bucket 'desafios-bolso')
 */
export async function uploadImagemDesafioStorage(
  file: File,
  desafioId: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `desafio_${desafioId}_${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('desafios-bolso')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      return { url: null, error: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from('desafios-bolso')
      .getPublicUrl(data.path);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (err: any) {
    return { url: null, error: err.message || 'Erro no upload' };
  }
}
