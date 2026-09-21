export type AlunoStatus = 'ativo' | 'inativo' | 'em_risco';

export type CategoriaDesafio = 
  | 'Lazer Ativo'
  | 'Mindset Estoico'
  | 'Lifestyle 23h'
  | 'Desafio de Bolso'
  | 'Estoicismo'
  | 'Recuperação'
  | 'Nutrição'
  | 'Desafio de Conversão';

export interface Profissional {
  id: string;
  nome_empresa: string;
  nome_profissional: string;
  telefone: string;
  logo_url?: string;
  cor_primaria: string;
  total_alunos: number;
}

export interface Aluno {
  id: string;
  profissional_id: string;
  nome: string;
  telefone: string;
  data_nascimento: string;
  status: AlunoStatus;
  ultimo_checkin: string;
  avatar_url?: string;
  objetivo: string;
  dias_sem_treino: number;
  plano: string;
  frequencia_semanal: number;
  altura_cm?: number; // cm (ex: 175)
}

export interface AvaliacaoFisica {
  id: string;
  aluno_id: string;
  data_registro: string;
  circ_abdominal: number; // cm
  perc_gordura: number; // %
  massa_muscular: number; // kg
  gordura_visceral: number; // escala
  taxa_metabolica: number; // kcal
  peso?: number; // kg
  altura_cm?: number; // cm (número inteiro sem vírgula, ex: 175)
  observacoes?: string;
}

export type FotoAngulo = 'frente' | 'costas' | 'perfil_direito' | 'perfil_esquerdo' | 'outro';

export interface FotoEvolucao {
  id: string;
  aluno_id: string;
  data: string; // YYYY-MM-DD
  foto_url: string; // base64 ou URL
  angulo: FotoAngulo;
  peso_kg?: number;
  observacoes?: string;
  etiqueta?: string; // e.g. "Início", "30 dias", "60 dias", "90 dias", "Fase Atual"
}

export interface DesafioTemplate {
  id: string;
  profissional_id: string | null;
  categoria: CategoriaDesafio;
  titulo: string;
  mensagem_whatsapp: string;
  tempo_estimado: string;
  dificuldade: 'Fácil' | 'Médio' | 'Desafiador';
}

export interface RadarAlerta {
  id: string;
  aluno_id: string;
  aluno_nome: string;
  aluno_avatar?: string;
  aluno_telefone: string;
  tipo: 'cancelamento' | 'aniversario' | 'sem_treino' | 'meta_batida' | 'bioimpedancia_vencida';
  descricao: string;
  tempo_atras: string;
  urgencia: 'alta' | 'media' | 'baixa';
  desafio_sugerido_id: string;
}

export interface WhatsAppMensagem {
  id: string;
  aluno_id: string;
  aluno_nome: string;
  aluno_avatar?: string;
  texto: string;
  data_hora: string;
  origem: 'aluno' | 'personal';
  lida: boolean;
  status_envio?: 'enviado' | 'entregue' | 'lido';
}

export interface AudioNote {
  id: string;
  timestamp: string;
  aluno_id?: string;
  transcricao?: string;
  audioUrl?: string;
  duracaoSegundos: number;
}

export type BadgeRaridade = 'bronze' | 'prata' | 'ouro' | 'diamante';
export type BadgeCategoria = 'checkin' | 'avaliacao' | 'consistencia' | 'recomposicao';

export interface AlunoBadge {
  id: string;
  nome: string;
  descricao: string;
  categoria: BadgeCategoria;
  raridade: BadgeRaridade;
  icone: string; // Key for icon identification: 'flame' | 'shield' | 'trophy' | 'zap' | 'activity' | 'award' | 'heart'
  criterio: string;
  mensagemIncentivo: string;
  destaque: boolean;
}

export interface DesafioEnviado {
  id: string;
  aluno_id: string;
  aluno_nome: string;
  desafio_id?: string;
  desafio_titulo: string;
  desafio_categoria?: CategoriaDesafio;
  categoria?: CategoriaDesafio;
  desafio_dificuldade?: 'Fácil' | 'Médio' | 'Desafiador';
  dificuldade?: 'Fácil' | 'Médio' | 'Desafiador';
  tempo_estimado?: string;
  mensagem_enviada: string;
  data_envio: string; // ISO string (e.g. 2026-09-18T10:30:00Z)
  data_formatada: string; // e.g. "18/09/2026 às 10:30"
  tempo_atras?: string; // e.g. "Hoje", "Há 2 dias"
  vezes_enviado?: number; // 1 = 1º envio, 2+ = repetido
  status_resposta?: 'concluido' | 'em_andamento' | 'pendente' | 'sem_resposta';
  origem_disparo?: 'individual' | 'massa' | 'radar_alerta' | 'card_rapido' | 'radar_dashboard';
}

export type LeadOrigem = 'instagram' | 'indicacao' | 'whatsapp' | 'trafego_pago' | 'presencial_academia' | 'outro';
export type LeadStatus = 'novo' | 'desafio_enviado' | 'em_followup' | 'proposta_enviada' | 'convertido' | 'perdido';
export type LeadTemperatura = 'quente' | 'morno' | 'frio';

export interface LeadInteracao {
  id: string;
  data: string; // ISO
  dataFormatada: string;
  tipo: 'desafio_enviado' | 'mensagem_whatsapp' | 'followup_realizado' | 'proposta_apresentada' | 'convertido_aluno' | 'anotacao';
  titulo: string;
  descricao: string;
  detalhes?: string;
}

export interface Lead {
  id: string;
  profissional_id: string;
  nome: string;
  telefone: string;
  email?: string;
  avatar_url?: string;
  origem: LeadOrigem;
  objetivo_interesse: string;
  status: LeadStatus;
  temperatura: LeadTemperatura;
  desafio_ativo_id?: string;
  desafio_ativo_titulo?: string;
  data_envio_desafio?: string;
  dias_desafio_decorridos?: number;
  etapa_followup: number; // 0=Novo, 1=Desafio Enviado, 2=Check 24h, 3=Ponte Consultoria, 4=Proposta/Fechamento
  data_criacao: string;
  ultimo_contato: string;
  proximo_followup?: string;
  valor_estimado_plano?: number; // R$
  notas?: string;
  historico_interacoes: LeadInteracao[];
}

