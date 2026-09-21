/**
 * Utilitários para tratamento e formatação de números de telefone e URLs do WhatsApp.
 * Garante que o código do país (+55 para o Brasil) esteja sempre presente no formato
 * exigido pelo WhatsApp (wa.me), evitando erros de "código do país inválido".
 */

/**
 * Higieniza e formata qualquer número de telefone para o padrão internacional exigido pelo WhatsApp (wa.me).
 *
 * Regras:
 * - Apenas dígitos.
 * - Adiciona o DDI 55 (Brasil) automaticamente se não estiver presente.
 * - Remove zeros à esquerda (ex: 011 -> 11).
 * - Trata números com 10 dígitos (DDD + 8 dígitos) ou 11 dígitos (DDD + 9 dígitos).
 * - Se já possui o DDI 55 (12 ou 13 dígitos começando com 55), preserva sem duplicar.
 * - Preserva números internacionais explicitamente informados com '+' (ex: +1..., +351...).
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

  // Se tem 10 dígitos (DDD + 8 dígitos: ex. 1133334444) -> adiciona 55
  if (cleaned.length === 10) {
    return `55${cleaned}`;
  }

  // Se tem 11 dígitos (DDD + 9 dígitos celular: ex. 11999998888) -> adiciona 55
  if (cleaned.length === 11) {
    return `55${cleaned}`;
  }

  // Se já tem 12 ou 13 dígitos e começa com 55 -> está perfeito (55 + DDD + telefone)
  if ((cleaned.length === 12 || cleaned.length === 13) && cleaned.startsWith('55')) {
    return cleaned;
  }

  // Se tem 8 ou 9 dígitos (faltou DDD) -> assume DDD 11 padrão de São Paulo e DDI 55
  if (cleaned.length === 8 || cleaned.length === 9) {
    return `5511${cleaned}`;
  }

  // Se já tem mais dígitos mas não começa com 55 e não era internacional explícito,
  // garante o DDI 55 caso seja padrão Brasil
  if (!cleaned.startsWith('55') && cleaned.length >= 10 && cleaned.length <= 11) {
    return `55${cleaned}`;
  }

  return cleaned;
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
  return window.open(url, '_blank');
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

  // Formato sem DDI de 11 dígitos
  if (digits.length === 11) {
    const ddd = digits.substring(0, 2);
    const part1 = digits.substring(2, 7);
    const part2 = digits.substring(7);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }

  return phone;
}
