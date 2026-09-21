import { Lead, LeadInteracao, LeadStatus, DesafioTemplate, Aluno } from '../types';
import { formatWhatsAppNumber } from './whatsappUtils';

export interface FollowUpScriptOption {
  etapa: number;
  nomeEtapa: string;
  tagline: string;
  delayRecomendado: string;
  mensagemPadrao: (leadNome: string, desafioTitulo?: string) => string;
}

/**
 * Scripts persuasivos de alta conversão para Personal Trainers
 * Baseados em neurovendas, micro-compromisso e degustação do método.
 */
export const FOLLOW_UP_SCRIPTS: FollowUpScriptOption[] = [
  {
    etapa: 1,
    nomeEtapa: '1. Envio do Desafio Degustação',
    tagline: 'Entrega do micro-desafio de boas-vindas para gerar valor imediato',
    delayRecomendado: 'Imediato após primeiro contato',
    mensagemPadrao: (nome, desafio) => 
      `Fala ${nome}! Tudo bem? 💪\n\nConforme conversamos, antes de falar de valores ou planos, eu gosto de gerar resultado prático primeiro para você sentir a diferença na pele.\n\nSeparei um desafio exclusivo de degustação para você começar hoje:\n🎯 *${desafio || 'Desafio Degustação RadarMove'}*\n\nTopa fazer comigo e me contar o que achou amanhã?`,
  },
  {
    etapa: 2,
    nomeEtapa: '2. Check-in 24h (Quebra de Inércia)',
    tagline: 'Verificar se o lead executou a meta e elogiar a atitude',
    delayRecomendado: '24 horas após o desafio',
    mensagemPadrao: (nome, desafio) =>
      `Fala ${nome}! Passando rapidinho pra saber:\n\nComo foi o *${desafio || 'desafio'}* hoje? Conseguiu cumprir a meta ou sentiu alguma dificuldade? 👊\n\nMe dá um toque por aqui!`,
  },
  {
    etapa: 3,
    nomeEtapa: '3. Ponte para a Consultoria (Ponto de Virada)',
    tagline: 'Conectar o micro-resultado à necessidade de um plano completo personalizado',
    delayRecomendado: '48h a 72h após o desafio',
    mensagemPadrao: (nome, desafio) =>
      `E aí ${nome}! Vi que você teve uma ótima atitude no desafio. 👏\n\nEssa é a diferença quando a gente tem clareza e direção. Imagina agora se você tivesse uma periodização completa feita sob medida para o seu objetivo, corrigindo sua postura e sem perder tempo?\n\nQuer que eu monte uma prévia de como seria sua rotina de treinos comigo?`,
  },
  {
    etapa: 4,
    nomeEtapa: '4. Oferta VIP & Fechamento de Vaga',
    tagline: 'Apresentar condições de início, escassez de vagas e agendamento da 1ª aula/avaliação',
    delayRecomendado: 'Após confirmação de interesse',
    mensagemPadrao: (nome) =>
      `Fala ${nome}! Estou organizando a minha grade de alunos presenciais e consultoria desta semana.\n\nTenho exatamente *2 vagas prioritárias* abertas para quem quer começar com foco total agora.\n\nPodemos marcar sua avaliação física inicial na academia ou prefere que eu te envie o link da consultoria híbrida? Bora fechar sua vaga hoje? 🚀`,
  },
  {
    etapa: 5,
    nomeEtapa: 'Reativação (Lead Frio / Sem Resposta)',
    tagline: 'Mensagem despretensiosa para reaquecer o contato sem ser chato',
    delayRecomendado: '5 a 7 dias sem contato',
    mensagemPadrao: (nome) =>
      `Opa ${nome}! Lembrei de você hoje aqui na academia. 💪\n\nSei que a rotina deve estar corrida, mas passando só pra saber como você está e se já conseguiu retomar os treinos? Se ainda quiser aquela ajuda para destravar seu resultado, me dá um alô!`,
  }
];

/**
 * Retorna o script sugerido para o lead baseado na etapa atual dele
 */
export function getScriptParaLead(lead: Lead, etapa?: number): string {
  const primeironome = lead.nome ? lead.nome.split(' ')[0] : 'Futuro Atleta';
  const desafio = lead.desafio_ativo_titulo || 'Desafio Degustação';
  const targetEtapa = etapa !== undefined ? etapa : lead.etapa_followup || 1;
  const scriptObj = FOLLOW_UP_SCRIPTS.find(s => s.etapa === targetEtapa) || FOLLOW_UP_SCRIPTS[0];
  return scriptObj.mensagemPadrao(primeironome, desafio);
}

/**
 * Templates de Desafios específicos para conversão de Leads (Degustação / Lead Magnet)
 */
export const DESAFIOS_LEADS_CONVERSAO: DesafioTemplate[] = [
  {
    id: 'des-lead-01',
    profissional_id: null,
    categoria: 'Desafio de Conversão',
    titulo: 'Desafio 3 Dias Sem Açúcar Líquido & Refri',
    mensagem_whatsapp: 'Fala {aluno}! Desafio de degustação de 3 dias: zero refrigerante comum, suco de caixinha ou bebidas açucaradas. Só água, café puro e chá. Esse simples corte desincha até 1.5kg em 72h. Topa o teste? 🥤❌',
    tempo_estimado: '3 dias',
    dificuldade: 'Fácil',
  },
  {
    id: 'des-lead-02',
    profissional_id: null,
    categoria: 'Desafio de Conversão',
    titulo: 'Desafio 10 Minutos Metabólicos Sem Peso',
    mensagem_whatsapp: 'E aí {aluno}! Para você ver que não precisa de horas na academia para ter resultado: 3 séries de 40s polichinelo + 40s agachamento livre + 30s prancha. Fez em 10 minutos no quarto ou sala. Me manda um check ✅ quando terminar!',
    tempo_estimado: '10 min',
    dificuldade: 'Fácil',
  },
  {
    id: 'des-lead-03',
    profissional_id: null,
    categoria: 'Desafio de Conversão',
    titulo: 'Desafio Detox Postural & Alívio de Lombar',
    mensagem_whatsapp: 'Opa {aluno}! Se você trabalha sentado e sente as costas travadas: 3 minutos de descompressão lombar (posição da criança no chão + gato e camelo). Faz antes de deitar e me conta se acordou sem dores! 🧘‍♂️',
    tempo_estimado: '3 min',
    dificuldade: 'Fácil',
  },
  {
    id: 'des-lead-04',
    profissional_id: null,
    categoria: 'Desafio de Conversão',
    titulo: 'Desafio Hidratação Matinal + 6.000 Passos',
    mensagem_whatsapp: 'Fala {aluno}! O pontapé inicial perfeito: 500ml de água logo ao acordar e uma meta simples de bater 6.000 passos no dia. Quem domina a manhã, domina o corpo. Topa começar comigo hoje? 💧🚶‍♂️',
    tempo_estimado: '1 dia',
    dificuldade: 'Fácil',
  },
];

/**
 * Cria uma nova interação no histórico do Lead
 */
export function registrarInteracaoLead(
  lead: Lead,
  tipo: LeadInteracao['tipo'],
  titulo: string,
  descricao: string,
  detalhes?: string
): Lead {
  const novaInteracao: LeadInteracao = {
    id: `interacao-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    data: new Date().toISOString(),
    dataFormatada: 'Hoje às ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    tipo,
    titulo,
    descricao,
    detalhes,
  };

  return {
    ...lead,
    ultimo_contato: new Date().toISOString(),
    historico_interacoes: [novaInteracao, ...(lead.historico_interacoes || [])],
  };
}

/**
 * Converte um Lead em um objeto Aluno completo para a base oficial
 */
export function converterLeadParaAluno(
  lead: Lead,
  profissionalId: string,
  planoEscolhido: string = 'Presencial VIP 3x/semana',
  frequenciaSemanal: number = 3,
  alturaCm: number = 175
): Aluno {
  const cleanPhone = formatWhatsAppNumber(lead.telefone);

  return {
    id: `aluno-conv-${Date.now()}`,
    profissional_id: profissionalId,
    nome: lead.nome,
    telefone: cleanPhone,
    data_nascimento: '1995-01-01',
    status: 'ativo',
    ultimo_checkin: new Date().toISOString(),
    avatar_url: lead.avatar_url,
    objetivo: lead.objetivo_interesse || 'Condicionamento físico e hipertrofia',
    dias_sem_treino: 0,
    plano: planoEscolhido,
    frequencia_semanal: frequenciaSemanal,
    altura_cm: alturaCm,
  };
}
