import React, { useState } from 'react';
import { 
  Activity, 
  ArrowRight, 
  Check, 
  CheckCircle2, 
  ChevronRight, 
  Clock, 
  DollarSign, 
  ExternalLink, 
  Flame, 
  Globe, 
  Lock, 
  MessageSquare, 
  Play, 
  ShieldCheck, 
  Smartphone, 
  Sparkles, 
  Star, 
  Target, 
  TrendingUp, 
  Users, 
  Zap,
  HelpCircle,
  BarChart3,
  Layers,
  ArrowUpRight,
  FileText,
  LogIn
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp?: () => void;
  onGoToLogin?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onEnterApp,
  onGoToLogin 
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // WhatsApp checkout / contato direto comercial
  const handleOpenWhatsAppSales = (planoNome: string, valor: string) => {
    const msg = encodeURIComponent(
      `Olá! Tenho interesse no *Plano ${planoNome}* do Radar Move (${valor}). Gostaria de agendar a configuração do meu ecossistema de Personal Trainer.`
    );
    window.open(`https://wa.me/5521999999999?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  const handleCtaClick = () => {
    const el = document.getElementById('pricing-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (onGoToLogin) {
      onGoToLogin();
    }
  };

  const faqs = [
    {
      q: 'O que significa um sistema White-label?',
      a: 'Significa que o ecossistema (site, aplicativo de treino e painel de acompanhamento) carrega a sua marca, o seu logotipo e a sua paleta de cores. Seus alunos enxergam você como uma assessoria esportiva de elite com tecnologia proprietária, e não uma planilha genérica de terceiros.'
    },
    {
      q: 'Preciso saber programar ou configurar servidores?',
      a: 'Zero. Nossa equipe entrega o Setup 100% pronto e configurado para você. Seu site vai ao ar no Google, seu app com seus treinos é disponibilizado e seu painel CRM é sincronizado com seu WhatsApp em poucos dias.'
    },
    {
      q: 'Como funciona a garantia de 7 dias sem riscos?',
      a: 'Você tem 7 dias corridos após a ativação para testar seu ecossistema na prática com seus primeiros alunos. Se por qualquer motivo sentir que o Radar Move não acelerou sua captação e retenção, devolvemos 100% do valor do seu setup, sem letras miúdas.'
    },
    {
      q: 'Os disparos de WhatsApp podem bloquear meu chip?',
      a: 'Não! O Radar Move utiliza a tecnologia de Link Universal Oficial (wa.me click-to-chat). Você não depende de robôs invasivos ou APIs de terceiros suscetíveis a banimento. Você envia mensagens hiper-personalizadas com 1 clique nativo, respeitando 100% as diretrizes da Meta.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#020b08] text-slate-100 font-sans selection:bg-emerald-400 selection:text-slate-950 overflow-x-hidden">
      {/* Luzes de Fundo Ambientais (Glow Neon Escuro) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-emerald-500/10 blur-[150px]" />
        <div className="absolute top-[40%] -left-40 h-[600px] w-[600px] rounded-full bg-teal-500/10 blur-[160px]" />
        <div className="absolute top-[70%] -right-40 h-[600px] w-[600px] rounded-full bg-emerald-400/10 blur-[150px]" />
      </div>

      {/* NAVBAR SUPERIOR FIXA */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#020b08]/90 border-b border-emerald-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo Branding */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="h-full w-full bg-[#031d16] rounded-[14px] flex items-center justify-center">
                <Activity className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
                Radar<span className="text-emerald-400">Move</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400/80 tracking-widest block uppercase font-bold">
                Elite Trainer Ecosystem
              </span>
            </div>
          </div>

          {/* Links de Navegação Desktop */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#problema" className="hover:text-emerald-400 transition-colors">O Problema</a>
            <a href="#pilares" className="hover:text-emerald-400 transition-colors">Os 3 Pilares</a>
            <a href="#pricing-section" className="hover:text-emerald-400 transition-colors">Planos & Preços</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">Dúvidas</a>
          </nav>

          {/* CTAs de Acesso e Área de Membros */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <button
              type="button"
              id="btn-acessar-sistema-header"
              onClick={onGoToLogin}
              className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-[#032019]/90 hover:bg-[#053227] hover:border-emerald-400/60 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-emerald-300 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <LogIn className="h-4 w-4 text-emerald-400" />
              <span>Acessar Sistema</span>
            </button>

            <button
              type="button"
              onClick={handleCtaClick}
              className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <span>Começar Agora</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION (DOBRA PRINCIPAL) */}
      <section className="relative z-10 pt-16 pb-24 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Badge de Destaque */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-bold mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>A Plataforma Definitiva de Gestão & Conversão para Personais</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Headline Principal */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.1] mb-6">
          Pare de Perder Alunos para Personais{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Menos Qualificados
          </span>{' '}
          que Você.
        </h1>

        {/* Sub-headline */}
        <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10 font-normal">
          Descubra como treinadores de elite automatizam a captação, o envio de treinos e as cobranças. 
          Tenha seu próprio <strong className="text-emerald-300 font-bold">Site Premium</strong>,{' '}
          <strong className="text-emerald-300 font-bold">App de Treino</strong> e{' '}
          <strong className="text-emerald-300 font-bold">CRM White-label</strong> rodando no automático.
        </p>

        {/* Botão de Ação Principal (Hero CTA) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-14">
          <button
            type="button"
            onClick={handleCtaClick}
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 text-slate-950 font-black text-base px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/30 transition-all active:scale-95 cursor-pointer"
          >
            <span>Quero Profissionalizar Minha Consultoria</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* Prova Social Rápida */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 border-t border-emerald-500/10 pt-8 max-w-3xl mx-auto font-medium">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Configuração 100% Chave na Mão</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span>Avaliado 4.9/5 por Treinadores</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-cyan-400" />
            <span>Disparos WhatsApp Sem Bloqueios</span>
          </div>
        </div>

        {/* Mockup Preview da Interface (Dark Neon Glass) */}
        <div className="mt-14 relative rounded-3xl border border-emerald-500/30 bg-[#021812]/90 p-3 sm:p-5 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 px-2 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-slate-300 font-sans font-bold">app.radarmove.com.br — Painel de Controle</span>
            </div>
            <span className="text-emerald-400 hidden sm:inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              CRM Ativo & Sincronizado
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 sm:p-6 text-left">
            <div className="rounded-2xl border border-emerald-500/25 bg-[#01140e] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Alunos Ativos</span>
                <Users className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-3xl font-black text-white">48 Alunos</p>
              <p className="text-xs text-emerald-300 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>+8 novos alunos este mês</span>
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/25 bg-[#01140e] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Micro-Desafios Enviados</span>
                <MessageSquare className="h-5 w-5 text-cyan-400" />
              </div>
              <p className="text-3xl font-black text-white">142 Disparos</p>
              <p className="text-xs text-cyan-300 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Zero risco de banimento de chip</span>
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/25 bg-[#01140e] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Índice de Retenção</span>
                <Flame className="h-5 w-5 text-amber-400" />
              </div>
              <p className="text-3xl font-black text-white">94.2%</p>
              <p className="text-xs text-amber-300 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Alertas preventivos anti-churn</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SEÇÃO DE DOR (O PROBLEMA REAL DO PERSONAL) */}
      <section id="problema" className="relative z-10 py-24 bg-[#010e0a] border-y border-emerald-500/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-mono font-bold tracking-widest text-rose-400 uppercase bg-rose-500/10 border border-rose-500/20 px-3.5 py-1 rounded-full">
              O Gargalo da Sua Carreira
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-4 mb-6">
              Você estudou anos sobre biomecânica para virar refém de planilhas e do WhatsApp?
            </h2>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              A maioria dos personais com excelente formação técnica continua cobrando pouco e trabalhando 14 horas por dia. 
              O motivo? Enquanto você perde tempo cobrando mensalidade manualmente e enviando PDFs amadores, clientes de alto padrão 
              fecham com quem apresenta autoridade visual e tecnologia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-rose-500/20 bg-rose-950/10 p-7 space-y-4 hover:border-rose-500/40 transition-all">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Horas Perdidas no WhatsApp</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Domingo à noite digitando treinos, cobrando alunos que esquecem de pagar e enviando lembretes um a um. Sua hora técnica é desperdiçada em trabalho braçal.
              </p>
            </div>

            <div className="rounded-3xl border border-rose-500/20 bg-rose-950/10 p-7 space-y-4 hover:border-rose-500/40 transition-all">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">PDFs e Planilhas Amadoras</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                PDFs que não abrem direito no celular e planilhas confusas transmitem amadorismo. É impossível cobrar R$ 300 a R$ 500 por aluno com a mesma entrega de quem cobra R$ 50.
              </p>
            </div>

            <div className="rounded-3xl border border-rose-500/20 bg-rose-950/10 p-7 space-y-4 hover:border-rose-500/40 transition-all">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Invisibilidade no Google Local</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Quem procura por &quot;Personal Trainer no seu bairro&quot; encontra a academia da esquina ou concorrentes, porque você depende apenas do boca a boca e do algoritmo instável do Instagram.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SEÇÃO DE SOLUÇÃO (OS 3 PILARES DO ECOSSISTEMA) */}
      <section id="pilares" className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-full">
            A Solução Definitiva
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-4 mb-6">
            O Ecossistema Completo do Personal Trainer 10k+
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Não é apenas um software. É uma esteira de tecnologia desenhada para resolver os três pontos vitais da sua consultoria: atrair, entregar e reter alunos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pilar 1 */}
          <div className="rounded-3xl border border-emerald-500/25 bg-[#021812]/80 p-8 space-y-6 flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Globe className="h-6 w-6" />
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Pilar 01
                </span>
              </div>
              <h3 className="text-2xl font-black text-white">Atração Automática</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Seu próprio <strong>Site Institucional Premium</strong> com design de agência, integrado ao seu <strong>Google Meu Negócio</strong> com SEO local. Clientes da sua região te encontram diretamente no topo das buscas no momento exato em que decidem treinar.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Posicionamento no Google Maps da sua cidade</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Botão direto para o seu WhatsApp comercial</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Calculadoras de IMC e captação de leads</span>
                </li>
              </ul>
            </div>
            <div className="p-3 rounded-xl bg-[#01140e] border border-white/5 text-[11px] text-emerald-300 font-mono">
              Resultado: Novos contatos qualificados sem gastar rios em anúncios.
            </div>
          </div>

          {/* Pilar 2 */}
          <div className="rounded-3xl border border-emerald-500/25 bg-[#021812]/80 p-8 space-y-6 flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center text-cyan-400">
                  <Smartphone className="h-6 w-6" />
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Pilar 02
                </span>
              </div>
              <h3 className="text-2xl font-black text-white">Entrega de Elite</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Substitua de vez o PDF amador por um <strong>App de Treino Moderno</strong>. Seus alunos acessam vídeos demonstrativos de cada exercício, cronômetros de descanso e registro de cargas direto na tela do smartphone, com a sua assinatura visual.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Biblioteca com centenas de exercícios em vídeo</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Histórico de sobrecarga progressiva e peso</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Feedbacks de execução direto no aplicativo</span>
                </li>
              </ul>
            </div>
            <div className="p-3 rounded-xl bg-[#01140e] border border-white/5 text-[11px] text-cyan-300 font-mono">
              Resultado: Percepção de valor multiplicada para justificar tickets altos.
            </div>
          </div>

          {/* Pilar 3 */}
          <div className="rounded-3xl border border-emerald-400/50 bg-[#021f17]/90 p-8 space-y-6 flex flex-col justify-between hover:shadow-2xl hover:shadow-emerald-500/20 transition-all relative">
            <div className="absolute -top-3 right-6 bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3 py-0.5 rounded-full shadow-md">
              Diferencial Único
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-emerald-400/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300">
                  <Flame className="h-6 w-6" />
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-400/25 text-emerald-200 border border-emerald-400/40">
                  Pilar 03
                </span>
              </div>
              <h3 className="text-2xl font-black text-white">Retenção Blindada (Radar Move CRM)</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                O coração da sua consultoria. Nosso CRM monitora a frequência dos alunos e alerta quando alguém entra em risco de cancelamento. Dispare micro-desafios e check-ins com 1 clique no WhatsApp oficial, sem mensagens genéricas de robô.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Alertas preditivos de cancelamento (&gt;4 dias sem treinar)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Disparo nativo wa.me com variáveis dinâmicas de nome</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Histórico inteligente para nunca enviar desafio repetido</span>
                </li>
              </ul>
            </div>
            <div className="p-3 rounded-xl bg-[#011611] border border-emerald-500/20 text-[11px] text-emerald-300 font-mono">
              Resultado: O aluno permanece meses a mais pagando a sua consultoria.
            </div>
          </div>
        </div>
      </section>

      {/* 4. SEÇÃO DE PREÇOS (TABELA COM DESTAQUE VISUAL NO ELITE) */}
      <section id="pricing-section" className="relative z-10 py-24 bg-[#010e0a] border-t border-emerald-500/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-full">
              Investimento Transparente
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-4 mb-4">
              Escolha o Nível de Tecnologia da Sua Consultoria
            </h2>
            <p className="text-slate-300 text-base sm:text-lg">
              Sem contratos de fidelidade que te prendem. Setup único de implementação com suporte e mensalidade acessível de manutenção.
            </p>
          </div>

          {/* Cards de Preços */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {/* PLANO STARTER */}
            <div className="rounded-3xl border border-emerald-500/20 bg-[#021812]/80 p-8 flex flex-col justify-between hover:border-emerald-500/40 transition-all">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Plano Starter</h3>
                  <p className="text-xs text-slate-400 mt-1">Para quem quer presença profissional básica e ser encontrado no Google.</p>
                </div>

                <div className="border-y border-white/5 py-4 space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-slate-400">Setup Único:</span>
                    <span className="text-2xl font-black text-white">R$ 597,00</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    + Manutenção de <strong className="text-emerald-400 font-bold">R$ 27,90/mês</strong>
                  </div>
                </div>

                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Site Institucional Responsivo de Alta Conversão</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Configuração e Otimização do Google Meu Negócio</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Botão de WhatsApp Flutuante</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Hospedagem e Certificado SSL Inclusos</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button
                  type="button"
                  onClick={() => handleOpenWhatsAppSales('Starter', 'Setup R$ 597 + R$ 27,90/mês')}
                  className="w-full py-3.5 px-4 rounded-xl border border-emerald-500/30 bg-[#03241b] text-emerald-300 hover:bg-[#043327] hover:border-emerald-400 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Contratar Starter
                </button>
              </div>
            </div>

            {/* PLANO PRO */}
            <div className="rounded-3xl border border-emerald-500/20 bg-[#021812]/80 p-8 flex flex-col justify-between hover:border-emerald-500/40 transition-all">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Plano Pro</h3>
                  <p className="text-xs text-slate-400 mt-1">Para quem quer atração no Google somada à entrega de treinos por aplicativo.</p>
                </div>

                <div className="border-y border-white/5 py-4 space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-slate-400">Setup Único:</span>
                    <span className="text-2xl font-black text-white">R$ 797,00</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    + Manutenção de <strong className="text-emerald-400 font-bold">R$ 47,90/mês</strong>
                  </div>
                </div>

                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Tudo do Plano Starter (Site + Google)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>App de Treino Completo (Substitui o PDF)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Registro de Cargas e Histórico para o Aluno</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Suporte Prioritário de Implantação</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button
                  type="button"
                  onClick={() => handleOpenWhatsAppSales('Pro', 'Setup R$ 797 + R$ 47,90/mês')}
                  className="w-full py-3.5 px-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 text-cyan-300 hover:bg-cyan-900/30 hover:border-cyan-400 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Contratar Pro
                </button>
              </div>
            </div>

            {/* PLANO ELITE (DESTAQUE / MAIS POPULAR) */}
            <div className="rounded-3xl border-2 border-emerald-400 bg-gradient-to-b from-[#032e22] via-[#022118] to-[#01140e] p-8 flex flex-col justify-between shadow-2xl shadow-emerald-500/20 relative scale-105 z-20">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider px-4 py-1 rounded-full shadow-lg">
                🔥 Mais Escolhido por Personais 10k
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-white">Plano Elite</h3>
                    <Sparkles className="h-5 w-5 text-emerald-400" />
                  </div>
                  <p className="text-xs text-emerald-200 mt-1">O ecossistema completo: Site + App + Radar Move CRM White-label.</p>
                </div>

                <div className="border-y border-emerald-500/25 py-4 space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-slate-300">Setup Completo:</span>
                    <span className="text-3xl font-black text-emerald-300">R$ 997,00</span>
                  </div>
                  <div className="text-xs text-slate-300">
                    + Manutenção de <strong className="text-white font-bold">R$ 97,90/mês</strong>
                  </div>
                </div>

                <ul className="space-y-3 text-xs text-slate-200">
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 stroke-[3] shrink-0 mt-0.5" />
                    <span><strong>Site Institucional Premium</strong> + Google Meu Negócio</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 stroke-[3] shrink-0 mt-0.5" />
                    <span><strong>App de Treino Interativo</strong> com seus vídeos</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 stroke-[3] shrink-0 mt-0.5" />
                    <span><strong>Radar Move CRM White-label</strong> com o seu logotipo</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 stroke-[3] shrink-0 mt-0.5" />
                    <span><strong>Disparo Nativo de WhatsApp (wa.me)</strong> sem risco de ban</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 stroke-[3] shrink-0 mt-0.5" />
                    <span><strong>Banco de 60+ Micro-Desafios</strong> e Filtro Anti-Repetição</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 stroke-[3] shrink-0 mt-0.5" />
                    <span>Gestão de Leads de Conversão e Pipeline de Vendas</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button
                  type="button"
                  onClick={() => handleOpenWhatsAppSales('Elite', 'Setup R$ 997 + R$ 97,90/mês')}
                  className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 hover:brightness-110 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/30 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Quero o Ecossistema Elite</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SEÇÃO DE GARANTIA (RISCO ZERO) */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-[#022018] to-[#01140e] p-8 sm:p-12 relative shadow-2xl">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 mb-6">
            <ShieldCheck className="h-8 w-8" />
          </div>

          <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
            Risco Zero Incondicional
          </span>

          <h2 className="text-3xl sm:text-4xl font-black text-white mt-2 mb-4">
            7 Dias de Garantia Total
          </h2>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-8">
            Nós confiamos tanto na transformação que o Radar Move traz para a autoridade e a rotina do Personal Trainer que assumimos todo o risco. 
            Se em até 7 dias após a ativação você não sentir que sua consultoria subiu de patamar, basta nos avisar pelo WhatsApp que devolvemos 100% do seu investimento.
          </p>

          <button
            type="button"
            onClick={handleCtaClick}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 text-slate-950 font-black text-sm px-8 py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer"
          >
            <span>Quero Configurar Meu Ecossistema Agora</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* 6. SEÇÃO DE PERGUNTAS FREQUENTES (FAQ) */}
      <section id="faq" className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Perguntas Frequentes
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-emerald-500/20 bg-[#021812]/70 overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-white hover:text-emerald-300 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronRight className={`h-5 w-5 text-emerald-400 shrink-0 transition-transform ${activeFaq === idx ? 'rotate-90' : ''}`} />
              </button>
              {activeFaq === idx && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="relative z-10 border-t border-emerald-500/15 bg-[#010906] py-12 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-400" />
            <span className="font-extrabold text-white text-sm">RadarMove</span>
            <span className="text-slate-600">|</span>
            <span>Tecnologia & CRM para Personal Trainers de Elite</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={onGoToLogin}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Acesso ao Sistema
            </button>
            <a
              href="https://wa.me/5521999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <span>Suporte Comercial</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-[11px] text-slate-500">
          © {new Date().getFullYear()} RadarMove. Todos os direitos reservados. Feito para valorizar os melhores treinadores do Brasil.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
