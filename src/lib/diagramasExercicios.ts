/**
 * Gerador de composições visuais demonstrativas vetoriais (SVG com alta definição).
 * Representa com clareza anatômica posições iniciais, finais e setas direcionais de movimento.
 */

export interface DiagramaExercicio {
  titulo: string;
  quadro1: {
    nome: string;
    repeticoes: string;
    instrucoes: string;
    postura: string;
    svgCorpo: string;
  };
  quadro2: {
    nome: string;
    repeticoes: string;
    instrucoes: string;
    postura: string;
    svgCorpo: string;
  };
  quadro3: {
    nome: string;
    repeticoes: string;
    instrucoes: string;
    postura: string;
    svgCorpo: string;
  };
  adaptacaoSeguranca: string;
}

export const DIAGRAMA_RESET_CADEIRA: DiagramaExercicio = {
  titulo: 'Reset de 3 Minutos na Cadeira — Biomecânica Postural',
  quadro1: {
    nome: '1. Rotação dos Ombros',
    repeticoes: '10 repetições para trás',
    instrucoes: 'Eleve os ombros até as orelhas, empurre para trás abrindo o peitoral e desça deprimindo as escápulas.',
    postura: 'Coluna neutra, sem curvar o pescoço.',
    svgCorpo: `
      <!-- Cadeira e pessoa sentada com setas circulares no ombro -->
      <path d="M 60 170 L 60 120 L 140 120 L 140 170" stroke="#059669" stroke-width="4" fill="none" />
      <path d="M 60 70 L 60 120" stroke="#059669" stroke-width="5" />
      <!-- Tronco e Cabeça -->
      <circle cx="100" cy="50" r="14" fill="#34d399" />
      <path d="M 100 64 L 100 115" stroke="#34d399" stroke-width="8" stroke-linecap="round" />
      <!-- Braço & Ombro com Seta de Rotação -->
      <circle cx="100" cy="74" r="5" fill="#38bdf8" />
      <path d="M 100 74 L 115 100 L 105 118" stroke="#34d399" stroke-width="4" stroke-linecap="round" fill="none" />
      <!-- Seta Circular de Rotação no Ombro -->
      <path d="M 90 68 A 12 12 0 1 1 112 80" fill="none" stroke="#38bdf8" stroke-width="3" stroke-dasharray="2 2" />
      <polygon points="112,80 115,73 118,82" fill="#38bdf8" />
      <!-- Pernas sentadas 90 graus -->
      <path d="M 100 115 L 140 115 L 140 160" stroke="#34d399" stroke-width="6" stroke-linecap="round" fill="none" />
    `,
  },
  quadro2: {
    nome: '2. Extensão Torácica',
    repeticoes: '10 repetições controladas',
    instrucoes: 'Mãos na nuca com cotovelos abertos. Apoie a parte média das costas no encosto da cadeira e estenda suavemente o peito em direção ao teto.',
    postura: 'Não hiperextenda o pescoço; mantenha queixo levemente recolhido.',
    svgCorpo: `
      <!-- Cadeira com encosto como fulcro -->
      <path d="M 50 170 L 50 120 L 130 120 L 130 170" stroke="#059669" stroke-width="4" fill="none" />
      <path d="M 50 85 L 50 120" stroke="#059669" stroke-width="6" stroke-linecap="round" />
      <!-- Cabeça estendida suavemente -->
      <circle cx="75" cy="40" r="14" fill="#34d399" />
      <!-- Tronco arqueado para trás sobre o encosto -->
      <path d="M 75 54 Q 60 85 95 115" stroke="#34d399" stroke-width="8" stroke-linecap="round" fill="none" />
      <!-- Mãos atrás da nuca, cotovelo aberto -->
      <path d="M 90 70 L 70 50 L 80 44" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" fill="none" />
      <!-- Seta de extensão torácica -->
      <path d="M 90 48 Q 110 38 115 50" fill="none" stroke="#f59e0b" stroke-width="3" />
      <polygon points="115,50 118,43 110,46" fill="#f59e0b" />
      <!-- Pernas 90 graus -->
      <path d="M 95 115 L 135 115 L 135 160" stroke="#34d399" stroke-width="6" stroke-linecap="round" fill="none" />
    `,
  },
  quadro3: {
    nome: '3. Cócoras / Mobilidade de Quadril',
    repeticoes: 'Até 1 min (conforme tolerância)',
    instrucoes: 'Agache mantendo calcanhares no chão. Use o assento da cadeira à sua frente para apoio se sentir desequilíbrio.',
    postura: 'Coluna longa. Alternativa: abertura sentada com cotovelos entre os joelhos.',
    svgCorpo: `
      <!-- Cócoras / Deep Squat com cadeira para apoio opcional -->
      <path d="M 140 170 L 140 110 L 175 110 L 175 170" stroke="#059669" stroke-width="3" stroke-dasharray="3 3" fill="none" />
      <text x="145" y="100" fill="#10b981" font-size="8" font-family="sans-serif">Apoio</text>
      <!-- Cabeça -->
      <circle cx="65" cy="70" r="13" fill="#34d399" />
      <!-- Tronco ereto em cócoras -->
      <path d="M 65 83 L 70 120" stroke="#34d399" stroke-width="8" stroke-linecap="round" />
      <!-- Mãos estendidas segurando apoio ou entre joelhos -->
      <path d="M 70 92 L 115 95 L 140 110" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" fill="none" />
      <!-- Pernas dobradas em cócoras (joelhos abertos, calcanhar apoiado) -->
      <path d="M 70 120 L 40 125 L 50 162" stroke="#34d399" stroke-width="6" stroke-linecap="round" fill="none" />
      <!-- Seta indicativa de quadril solto -->
      <path d="M 85 125 L 85 140" stroke="#f59e0b" stroke-width="2" />
      <polygon points="85,140 82,134 88,134" fill="#f59e0b" />
    `,
  },
  adaptacaoSeguranca: '⚠️ Adaptação para restrições: Se cócoras completas gerarem desconforto nos joelhos ou tornozelos, permaneça sentado na beirada da cadeira com os pés afastados e use os cotovelos para empurrar gentilmente os joelhos para fora por 45 segundos.',
};

/**
 * Gera Data URI do SVG pedagógico para renderização instantânea
 */
export function gerarSvgDemonstrativoResetCadeira(): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" width="900" height="480">
  <defs>
    <linearGradient id="bgGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#021a14" />
      <stop offset="50%" stop-color="#01130e" />
      <stop offset="100%" stop-color="#02241b" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#032b21" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#011812" stop-opacity="0.95" />
    </linearGradient>
  </defs>

  <!-- Background Geral -->
  <rect width="900" height="480" fill="url(#bgGlow)" rx="24" />
  <rect x="2" y="2" width="896" height="476" fill="none" stroke="#10b981" stroke-width="1.5" stroke-opacity="0.3" rx="22" />

  <!-- Cabeçalho -->
  <rect x="30" y="24" width="840" height="54" rx="14" fill="#043327" fill-opacity="0.6" stroke="#059669" stroke-width="1" />
  <circle cx="58" cy="51" r="12" fill="#10b981" />
  <path d="M 54 51 L 57 54 L 63 47" stroke="#021a14" stroke-width="2.5" fill="none" stroke-linecap="round" />
  <text x="82" y="46" fill="#f8fafc" font-size="16" font-weight="bold" font-family="system-ui, -apple-system, sans-serif">DESAFIO DE BOLSO: RESET DE 3 MINUTOS NA CADEIRA</text>
  <text x="82" y="65" fill="#6ee7b7" font-size="11" font-weight="600" font-family="system-ui, -apple-system, sans-serif">Biomecânica Postural Anti-Sedentarismo • 3 Fases Numeradas</text>
  <rect x="740" y="38" width="114" height="26" rx="8" fill="#10b981" fill-opacity="0.2" stroke="#34d399" stroke-width="1" />
  <text x="752" y="55" fill="#34d399" font-size="11" font-weight="bold" font-family="monospace">RADARMOVE PRO</text>

  <!-- Quadro 1 -->
  <g transform="translate(30, 95)">
    <rect width="265" height="315" rx="16" fill="url(#cardGrad)" stroke="#10b981" stroke-opacity="0.3" stroke-width="1.5" />
    <!-- Badge do Passo -->
    <rect x="14" y="14" width="85" height="24" rx="6" fill="#10b981" />
    <text x="22" y="30" fill="#021813" font-size="11" font-weight="900" font-family="system-ui">FASE 1 • 10x</text>
    <text x="14" y="58" fill="#ffffff" font-size="14" font-weight="bold" font-family="system-ui">Rotação dos Ombros</text>
    <text x="14" y="74" fill="#a7f3d0" font-size="11" font-weight="500" font-family="system-ui">Depressão e retração escapular</text>

    <!-- Ilustração Anatômica 1 -->
    <rect x="14" y="86" width="237" height="135" rx="12" fill="#02130e" stroke="#059669" stroke-opacity="0.3" />
    <g transform="translate(38, 55)">
      ${DIAGRAMA_RESET_CADEIRA.quadro1.svgCorpo}
    </g>

    <!-- Instruções Pedagógicas -->
    <rect x="14" y="232" width="237" height="68" rx="10" fill="#04271e" />
    <text x="24" y="250" fill="#38bdf8" font-size="10" font-weight="bold" font-family="system-ui">COMO EXECUTAR:</text>
    <text x="24" y="266" fill="#e2e8f0" font-size="10" font-family="system-ui">Suba os ombros até as orelhas, gire</text>
    <text x="24" y="280" fill="#e2e8f0" font-size="10" font-family="system-ui">para trás e desça espremendo escápulas.</text>
    <text x="24" y="294" fill="#34d399" font-size="9" font-family="system-ui">✓ Alívio de tensão no trapézio</text>
  </g>

  <!-- Quadro 2 -->
  <g transform="translate(315, 95)">
    <rect width="265" height="315" rx="16" fill="url(#cardGrad)" stroke="#10b981" stroke-opacity="0.3" stroke-width="1.5" />
    <rect x="14" y="14" width="85" height="24" rx="6" fill="#38bdf8" />
    <text x="22" y="30" fill="#021813" font-size="11" font-weight="900" font-family="system-ui">FASE 2 • 10x</text>
    <text x="14" y="58" fill="#ffffff" font-size="14" font-weight="bold" font-family="system-ui">Extensão Torácica</text>
    <text x="14" y="74" fill="#7dd3fc" font-size="11" font-weight="500" font-family="system-ui">Apoio no encosto da cadeira</text>

    <!-- Ilustração Anatômica 2 -->
    <rect x="14" y="86" width="237" height="135" rx="12" fill="#02130e" stroke="#059669" stroke-opacity="0.3" />
    <g transform="translate(38, 55)">
      ${DIAGRAMA_RESET_CADEIRA.quadro2.svgCorpo}
    </g>

    <!-- Instruções Pedagógicas -->
    <rect x="14" y="232" width="237" height="68" rx="10" fill="#04271e" />
    <text x="24" y="250" fill="#38bdf8" font-size="10" font-weight="bold" font-family="system-ui">COMO EXECUTAR:</text>
    <text x="24" y="266" fill="#e2e8f0" font-size="10" font-family="system-ui">Mãos na nuca, apoie o meio das costas</text>
    <text x="24" y="280" fill="#e2e8f0" font-size="10" font-family="system-ui">e abra o peitoral olhando para cima.</text>
    <text x="24" y="294" fill="#34d399" font-size="9" font-family="system-ui">✓ Desfaz a postura cifótica de tela</text>
  </g>

  <!-- Quadro 3 -->
  <g transform="translate(600, 95)">
    <rect width="270" height="315" rx="16" fill="url(#cardGrad)" stroke="#10b981" stroke-opacity="0.3" stroke-width="1.5" />
    <rect x="14" y="14" width="95" height="24" rx="6" fill="#f59e0b" />
    <text x="22" y="30" fill="#021813" font-size="11" font-weight="900" font-family="system-ui">FASE 3 • ATÉ 1m</text>
    <text x="14" y="58" fill="#ffffff" font-size="14" font-weight="bold" font-family="system-ui">Cócoras / Quadril</text>
    <text x="14" y="74" fill="#fde68a" font-size="11" font-weight="500" font-family="system-ui">Mobilidade pélvica e lombar</text>

    <!-- Ilustração Anatômica 3 -->
    <rect x="14" y="86" width="242" height="135" rx="12" fill="#02130e" stroke="#059669" stroke-opacity="0.3" />
    <g transform="translate(35, 55)">
      ${DIAGRAMA_RESET_CADEIRA.quadro3.svgCorpo}
    </g>

    <!-- Instruções Pedagógicas -->
    <rect x="14" y="232" width="242" height="68" rx="10" fill="#04271e" />
    <text x="24" y="250" fill="#f59e0b" font-size="10" font-weight="bold" font-family="system-ui">ADAPTAÇÃO E SEGURANÇA:</text>
    <text x="24" y="266" fill="#e2e8f0" font-size="10" font-family="system-ui">Use a cadeira à frente para apoio se</text>
    <text x="24" y="280" fill="#e2e8f0" font-size="10" font-family="system-ui">precisar, ou fique sentado afastando joelhos.</text>
    <text x="24" y="294" fill="#34d399" font-size="9" font-family="system-ui">✓ Descomprime vértebras L4-L5-S1</text>
  </g>

  <!-- Rodapé com Adaptações de Segurança -->
  <g transform="translate(30, 424)">
    <rect width="840" height="42" rx="10" fill="#062e24" stroke="#f59e0b" stroke-opacity="0.3" />
    <circle cx="24" cy="21" r="9" fill="#f59e0b" fill-opacity="0.2" />
    <text x="20" y="25" fill="#f59e0b" font-size="11" font-weight="bold">!</text>
    <text x="40" y="25" fill="#fef08a" font-size="11" font-family="system-ui" font-weight="500">
      Orientações: Respeite a amplitude sem dor. Na dúvida ou dor articular pré-existente, realize a opção adaptada apoiada.
    </text>
  </g>
</svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
