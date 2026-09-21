import { DesafioEnviado, DesafioTemplate } from '../types';

/**
 * Retorna se um desafio específico já foi enviado anteriormente para um determinado aluno,
 * quantas vezes já foi enviado e quando foi o último envio.
 */
export function verificarDesafioRepetido(
  historico: DesafioEnviado[],
  alunoId: string,
  desafioId: string,
  desafioTitulo?: string
): {
  repetido: boolean;
  totalEnvios: number;
  ultimoEnvio?: DesafioEnviado;
  diasDesdeUltimoEnvio?: number;
} {
  if (!alunoId || !historico || historico.length === 0) {
    return { repetido: false, totalEnvios: 0 };
  }

  const envios = historico.filter((item) => {
    if (item.aluno_id !== alunoId) return false;
    if (item.desafio_id === desafioId) return true;
    if (desafioTitulo && item.desafio_titulo?.trim().toLowerCase() === desafioTitulo.trim().toLowerCase()) {
      return true;
    }
    return false;
  });

  if (envios.length === 0) {
    return { repetido: false, totalEnvios: 0 };
  }

  // Ordenar pelo mais recente
  const ordenados = [...envios].sort(
    (a, b) => new Date(b.data_envio).getTime() - new Date(a.data_envio).getTime()
  );
  const ultimo = ordenados[0];

  const diffMs = Date.now() - new Date(ultimo.data_envio).getTime();
  const dias = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  return {
    repetido: true,
    totalEnvios: envios.length,
    ultimoEnvio: ultimo,
    diasDesdeUltimoEnvio: dias,
  };
}

/**
 * Retorna todos os envios de um aluno específico, ordenados do mais recente para o mais antigo.
 */
export function getHistoricoAluno(
  historico: DesafioEnviado[],
  alunoId: string
): DesafioEnviado[] {
  if (!historico || !alunoId) return [];
  return historico
    .filter((h) => h.aluno_id === alunoId)
    .sort((a, b) => new Date(b.data_envio).getTime() - new Date(a.data_envio).getTime());
}

/**
 * Formata data e hora amigável para exibição
 */
export function formatDataAmigavel(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    const agora = new Date();
    const isHoje =
      d.getDate() === agora.getDate() &&
      d.getMonth() === agora.getMonth() &&
      d.getFullYear() === agora.getFullYear();

    const horas = String(d.getHours()).padStart(2, '0');
    const minutos = String(d.getMinutes()).padStart(2, '0');

    if (isHoje) {
      return `Hoje às ${horas}:${minutos}`;
    }

    const ontem = new Date(agora);
    ontem.setDate(agora.getDate() - 1);
    const isOntem =
      d.getDate() === ontem.getDate() &&
      d.getMonth() === ontem.getMonth() &&
      d.getFullYear() === ontem.getFullYear();

    if (isOntem) {
      return `Ontem às ${horas}:${minutos}`;
    }

    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();

    return `${dia}/${mes}/${ano} às ${horas}:${minutos}`;
  } catch {
    return isoDate;
  }
}
