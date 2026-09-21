import { Aluno, AvaliacaoFisica, AlunoBadge } from '../types';

/**
 * Motor de Gamificação & Badges de Retenção RadarMove
 * Calcula os selos conquistados com base na frequência de check-in e histórico de bioimpedância.
 */
export function calcularBadgesDoAluno(
  aluno: Aluno,
  avaliacoesDoAluno: AvaliacaoFisica[]
): AlunoBadge[] {
  const badges: AlunoBadge[] = [];

  // ==========================================
  // 1. SELOS DE FREQUÊNCIA DE CHECK-IN
  // ==========================================

  // Badge 1: Frequência Blindada (4x ou mais por semana e sem atrasos)
  if (aluno.frequencia_semanal >= 4 && aluno.dias_sem_treino <= 2) {
    badges.push({
      id: 'badge-frequencia-blindada',
      nome: 'Frequência Blindada',
      descricao: 'Mantém 4 ou mais treinos semanais com assiduidade impecável.',
      categoria: 'checkin',
      raridade: 'diamante',
      icone: 'shield',
      criterio: 'Frequência semanal ≥ 4x e máximo de 2 dias sem treino.',
      mensagemIncentivo: `Fala {aluno}! Você desbloqueou o selo *Frequência Blindada* 🛡️⚡ por manter ${aluno.frequencia_semanal}x de treino na semana. Parabéns pela consistência absurda!`,
      destaque: true,
    });
  }

  // Badge 2: Streak Em Chamas (Treinou hoje ou ontem)
  if (aluno.dias_sem_treino <= 1) {
    badges.push({
      id: 'badge-em-chamas',
      nome: 'Streak Em Chamas',
      descricao: 'Sequência ativa com check-in realizado nas últimas 24-48 horas.',
      categoria: 'checkin',
      raridade: 'ouro',
      icone: 'flame',
      criterio: 'Treinou hoje ou ontem (dias sem treino ≤ 1).',
      mensagemIncentivo: `Parabéns {aluno}! Você está *Em Chamas* 🔥! Sequência de treinos ativa sem furar. Vamos manter esse ritmo!`,
      destaque: true,
    });
  } else if (aluno.dias_sem_treino <= 3 && aluno.status === 'ativo') {
    // Badge 3: Ritmo Constante
    badges.push({
      id: 'badge-ritmo-constante',
      nome: 'Ritmo Constante',
      descricao: 'Check-in em dia dentro da janela regular de descanso planejado.',
      categoria: 'checkin',
      raridade: 'prata',
      icone: 'zap',
      criterio: 'Check-in recente (menos de 3 dias sem treino).',
      mensagemIncentivo: `Fala {aluno}! Seu ritmo está excelente ⚡. Vamos para a próxima sessão de treino?`,
      destaque: false,
    });
  }

  // Badge 4: Hábito Consistente (Frequência regular 3x ou mais)
  if (aluno.frequencia_semanal >= 3) {
    badges.push({
      id: 'badge-habito-3x',
      nome: 'Hábito de Ferro (3x+)',
      descricao: 'Compromisso semanal firmado com 3 ou mais sessões programadas.',
      categoria: 'consistencia',
      raridade: 'ouro',
      icone: 'award',
      criterio: 'Grade semanal de 3x ou mais treinos.',
      mensagemIncentivo: `Sensacional {aluno}! O selo *Hábito de Ferro* 🏅 mostra sua dedicação semanal. Não é motivação, é disciplina!`,
      destaque: false,
    });
  }

  // ==========================================
  // 2. SELOS DE AVALIAÇÃO FÍSICA & BIOIMPEDÂNCIA
  // ==========================================

  // Ordena avaliações da mais antiga para a mais recente
  const avaliacoesOrdenadas = [...avaliacoesDoAluno].sort(
    (a, b) => new Date(a.data_registro).getTime() - new Date(b.data_registro).getTime()
  );

  const totalAvaliacoes = avaliacoesOrdenadas.length;

  if (totalAvaliacoes > 0) {
    const ultimaAvaliacao = avaliacoesOrdenadas[totalAvaliacoes - 1];
    const dataUltima = new Date(ultimaAvaliacao.data_registro);
    const hoje = new Date();
    const diffDias = Math.floor((hoje.getTime() - dataUltima.getTime()) / (1000 * 60 * 60 * 24));

    // Badge 5: Bioimpedância Pontual (Feita há menos de 45 dias)
    if (diffDias <= 45) {
      badges.push({
        id: 'badge-bioimpedancia-pontual',
        nome: 'Bioimpedância em Dia',
        descricao: 'Dados biométricos e composição corporal avaliados recentemente.',
        categoria: 'avaliacao',
        raridade: 'ouro',
        icone: 'activity',
        criterio: `Última medição realizada há menos de 45 dias (feita há ${diffDias} dias).`,
        mensagemIncentivo: `Excelente {aluno}! Suas métricas de bioimpedância estão atualizadas 📊. Ter dados precisos é o segredo para evoluir com segurança.`,
        destaque: true,
      });
    }

    // Badge 6: Consistência Histórica (2 ou mais avaliações registradas)
    if (totalAvaliacoes >= 2) {
      badges.push({
        id: 'badge-consistencia-avaliacoes',
        nome: 'Registro Evolutivo',
        descricao: 'Histórico comparativo com múltiplos marcos de bioimpedância salvos.',
        categoria: 'avaliacao',
        raridade: 'prata',
        icone: 'trophy',
        criterio: `${totalAvaliacoes} avaliações registradas ao longo do acompanhamento.`,
        mensagemIncentivo: `{aluno}, você já possui ${totalAvaliacoes} avaliações físicas mapeadas 📈. Esse acompanhamento contínuo garante resultados duradouros!`,
        destaque: false,
      });
    }

    // Badge 7: Recomposição Corporal Detectada (Redução de abdômen ou gordura com ganho/manutenção muscular)
    if (totalAvaliacoes >= 2) {
      const primeira = avaliacoesOrdenadas[0];
      const atual = avaliacoesOrdenadas[totalAvaliacoes - 1];

      const reduziuAbdomen = atual.circ_abdominal < primeira.circ_abdominal;
      const aumentouMassa = atual.massa_muscular >= primeira.massa_muscular;
      const reduziuGordura = atual.perc_gordura < primeira.perc_gordura;

      if ((reduziuAbdomen || reduziuGordura) && aumentouMassa) {
        const deltaAbdomen = (primeira.circ_abdominal - atual.circ_abdominal).toFixed(1);
        const deltaMassa = (atual.massa_muscular - primeira.massa_muscular).toFixed(1);

        badges.push({
          id: 'badge-recomposicao-corporal',
          nome: 'Recomposição Ativa',
          descricao: `Evolução comprovada: -${deltaAbdomen}cm de abdômen e +${deltaMassa}kg de massa magra.`,
          categoria: 'recomposicao',
          raridade: 'diamante',
          icone: 'award',
          criterio: 'Redução de gordura/circunferência abdominal associada a ganho de massa muscular.',
          mensagemIncentivo: `Parabéns épico {aluno}! Você conquistou o selo *Recomposição Ativa* 🏆🧬! Reduziu ${deltaAbdomen}cm de abdômen mantendo e ganhando massa muscular. Orgulho do seu personal!`,
          destaque: true,
        });
      }
    }
  }

  return badges;
}
