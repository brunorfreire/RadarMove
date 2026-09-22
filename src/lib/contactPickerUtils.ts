/**
 * Utilitários para a Web Contact Picker API (W3C Contacts Manager API).
 * Permite que usuários em smartphones selecionem contatos da agenda nativa
 * e preencham automaticamente formulários cadastrais com higienização para o Brasil (DDD).
 */

/**
 * Verifica se o navegador atual tem suporte à Contact Picker API nativa.
 * Suportada principalmente em navegadores Chromium móveis (Chrome / Edge no Android).
 */
export function isContactPickerSupported(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  return 'contacts' in navigator && 'ContactsManager' in window;
}

/**
 * Verifica se a aplicação está rodando dentro de um iframe.
 * Iframes de preview do navegador costumam restringir APIs de hardware/contatos sem a devida diretiva de permissão.
 */
export function isRunningInIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

export interface PickedContact {
  name?: string;
  telefone?: string;
  formattedTelefone?: string;
}

/**
 * Formata um número bruto para exibição amigável no input brasileiro:
 * Ex: 11987654321 -> (11) 98765-4321
 * Ex: 1133334444 -> (11) 3333-4444
 */
export function formatPhoneDisplay(rawDigits: string): string {
  let digits = rawDigits.replace(/\D/g, '');

  // Se já veio com código do Brasil (+55), remove os 2 primeiros dígitos para exibição no input local
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    digits = digits.substring(2);
  }

  // Remove zero à esquerda do DDD caso exista (ex: 011 -> 11)
  if (digits.startsWith('0') && (digits.length === 11 || digits.length === 12)) {
    digits = digits.substring(1);
  }

  if (digits.length <= 2) {
    return digits ? `(${digits}` : '';
  }
  if (digits.length <= 6) {
    return `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
  }
  if (digits.length <= 10) {
    // Fixo com 8 dígitos: (11) 3333-4444
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
  }
  // Celular com 9 dígitos: (11) 98765-4321
  return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7, 11)}`;
}

/**
 * Aciona o seletor de contatos nativo do aparelho móvel e extrai nome e telefone higienizado.
 * Utiliza navigator.contacts.getProperties() para verificar propriedades disponíveis.
 */
export async function pickContactFromDevice(): Promise<PickedContact | null> {
  if (!isContactPickerSupported()) {
    throw new Error('NOT_SUPPORTED');
  }

  try {
    let props = ['name', 'tel'];
    if (typeof (navigator as any).contacts.getProperties === 'function') {
      try {
        const supportedProps: string[] = await (navigator as any).contacts.getProperties();
        const filtered: string[] = [];
        if (supportedProps.includes('name')) filtered.push('name');
        if (supportedProps.includes('tel')) filtered.push('tel');
        if (filtered.length > 0) {
          props = filtered;
        }
      } catch (propErr) {
        console.warn('Não foi possível consultar getProperties():', propErr);
      }
    }

    const opts = { multiple: false };
    const contacts = await (navigator as any).contacts.select(props, opts);
    if (!contacts || !contacts.length) {
      return null;
    }

    const contact = contacts[0];
    const rawName = contact.name && contact.name.length > 0 ? contact.name[0] : '';
    const rawTel = contact.tel && contact.tel.length > 0 ? contact.tel[0] : '';

    const digitsOnly = rawTel.replace(/\D/g, '');
    const displayPhone = formatPhoneDisplay(digitsOnly);

    return {
      name: rawName ? rawName.trim() : undefined,
      telefone: digitsOnly || undefined,
      formattedTelefone: displayPhone || undefined,
    };
  } catch (err: any) {
    console.error('Erro ao acessar contatos:', err);
    throw err;
  }
}
