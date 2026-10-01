/**
 * Utilitários para tratamento e formatação de números de telefone e URLs do WhatsApp.
 * Garante que o código do país (+55 para o Brasil) seja adicionado apenas quando
 * o número contiver DDD e telefone válidos.
 * 
 * NUNCA inventa DDD (como o antigo fallback de 11).
 */

/**
 * Higieniza e formata qualquer número de telefone para o padrão internacional exigido pelo WhatsApp (wa.me).
 *
 * Regras Estritas:
 * - Apenas dígitos.
 * - Adiciona o DDI 55 (Brasil) automaticamente se o número tiver DDD (10 ou 11 dígitos).
 * - Remove zeros à esquerda (ex: 011 -> 11).
 * - Trata números com 10 dígitos (DDD + 8 dígitos) ou 11 dígitos (DDD + 9 dígitos).
 * - Se já possui o DDI 55 (12 ou 13 dígitos começando com 55), preserva sem duplicar.
 * - Preserva números internacionais explicitamente informados com '+' (ex: +1..., +351...).
 * - NUNCA inventa DDD caso o usuário tenha digitado um número incompleto (8 ou 9 dígitos sem DDD).
 *   Nesses casos, retorna o número limpo sem DDI ou vazio para permitir validação estrita na UI.
 */
export function formatWhatsAppNumber(phone: string | undefined | null): string {
  if (!phone) return '';

  const raw = String(phone).trim();
  if (!raw) return '';

  // Se o usuário digitou explicitamente com '+' para outro país (não-Brasil)
  const isExplicitInternational = raw.startsWith('+') && !raw.startsWith('+55');
  const digitsOnly = raw.replace(/\D/g, '');

  if (isExplicitInternational && digitsOnly.length >= 10) {
    return digitsOnly;
  }

  let cleaned = digitsOnly;

  // Corrige eventual duplicação acidental de DDI (ex: 5555119...)
  if (cleaned.startsWith('5555')) {
    cleaned = cleaned.substring(2);
  }

  // Remove zeros de discagem interurbana (ex: 0055... ou 011...)
  if (cleaned.startsWith('0055')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && (cleaned.length === 11 || cleaned.length === 12)) {
    cleaned = cleaned.replace(/^0+/, '');
  }

  // Se já tem 12 ou 13 dígitos e começa com 55 -> está perfeito (55 + DDD + telefone)
  if ((cleaned.length === 12 || cleaned.length === 13) && cleaned.startsWith('55')) {
    return cleaned;
  }

  // Se tem 10 dígitos (DDD + 8 dígitos: ex. 1133334444) -> adiciona 55
  if (cleaned.length === 10) {
    return `55${cleaned}`;
  }

  // Se tem 11 dígitos (DDD + 9 dígitos celular: ex. 11999998888) -> adiciona 55
  if (cleaned.length === 11) {
    return `55${cleaned}`;
  }

  // Se o número não tem DDD (ex: 8 ou 9 dígitos), NÃO inventamos DDD!
  // Retorna os dígitos crus para que a interface aponte como incompleto/inválido.
  return cleaned;
}

/**
 * Valida se o número possui o tamanho mínimo e estrutura correta para disparo via WhatsApp.
 * Retorna true se for um número válido com DDD e DDI 55 (12 ou 13 dígitos) ou internacional (>= 10 dígitos).
 */
export function isValidWhatsAppNumber(phone: string | undefined | null): boolean {
  if (!phone) return false;
  const formatted = formatWhatsAppNumber(phone);
  // Número brasileiro padrão: 55 + DDD (2) + 8 ou 9 dígitos = 12 ou 13 dígitos
  if (formatted.startsWith('55')) {
    return formatted.length === 12 || formatted.length === 13;
  }
  // Outro país explicitamente formatado
  return formatted.length >= 10;
}

/**
 * Retorna a URL oficial do WhatsApp (wa.me) devidamente formatada e codificada.
 */
export function getWhatsAppUrl(phone: string | undefined | null, text?: string): string {
  const cleanPhone = formatWhatsAppNumber(phone);
  if (!text) {
    return `https://wa.me/${cleanPhone}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Abre o WhatsApp em uma nova aba com o número e mensagem prontos.
 */
export function openWhatsApp(phone: string | undefined | null, text?: string): Window | null {
  const url = getWhatsAppUrl(phone, text);
  return window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Formata um telefone para exibição amigável na interface (ex: +55 (11) 98765-4321).
 */
export function formatPhoneDisplay(phone: string | undefined | null): string {
  if (!phone) return '';
  const digits = formatWhatsAppNumber(phone);

  // Formato Brasil completo: 55 + DDD (2) + 9 dígitos (9) = 13 dígitos
  if (digits.length === 13 && digits.startsWith('55')) {
    const ddd = digits.substring(2, 4);
    const part1 = digits.substring(4, 9);
    const part2 = digits.substring(9);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }

  // Formato Brasil fixo: 55 + DDD (2) + 8 dígitos (8) = 12 dígitos
  if (digits.length === 12 && digits.startsWith('55')) {
    const ddd = digits.substring(2, 4);
    const part1 = digits.substring(4, 8);
    const part2 = digits.substring(8);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }

  // Formato sem DDI de 11 dígitos (DDD + 9 dígitos)
  if (digits.length === 11) {
    const ddd = digits.substring(0, 2);
    const part1 = digits.substring(2, 7);
    const part2 = digits.substring(7);
    return `(${ddd}) ${part1}-${part2}`;
  }

  // Formato sem DDI de 10 dígitos (DDD + 8 dígitos)
  if (digits.length === 10) {
    const ddd = digits.substring(0, 2);
    const part1 = digits.substring(2, 6);
    const part2 = digits.substring(6);
    return `(${ddd}) ${part1}-${part2}`;
  }

  return phone;
}
