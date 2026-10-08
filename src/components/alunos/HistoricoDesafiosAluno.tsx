import React, { useState } from 'react';
import { 
  Award, 
  Clock, 
  Send, 
  MessageSquare, 
  Copy, 
  Check, 
  AlertTriangle, 
  Filter, 
  Search, 
  RotateCcw, 
  ExternalLink, 
  Zap,
  Sparkles,
  Shield,
  Apple,
  HeartPulse,
  Flame,
  CheckCircle2,
  Compass,
  Calendar,
  ImageIcon,
  Eye,
  CheckCheck,
  AlertCircle,
  Loader2,
  X,
  Layers,
  ZoomIn,
  ShieldCheck,
  Phone,
  Info
} from 'lucide-react';
import { Aluno, DesafioEnviado, CategoriaDesafio, StatusEntregaDesafio, DesafioImagem } from '../../types';
import { openWhatsApp } from '../../lib/whatsappUtils';
import { IMAGENS_DESAFIOS_PADRAO } from '../../lib/pocketChallengesImagesService';
import { DesafioImagemViewer } from '../desafios/DesafioImagemViewer';

interface HistoricoDesafiosAlunoProps {
  aluno: Aluno;
  historico: DesafioEnviado[];
  onOpenNewChallengeForAluno?: (aluno: Aluno) => void;
  onResendChallengeWhatsApp?: (aluno: Aluno, desafioEnviado: DesafioEnviado) => void;
  onReenviarDesafio?: (aluno: Aluno, desafioTitulo: string, mensagem: string) => void;
  onAgendarDesafio?: (aluno: Aluno) => void;
}

export const HistoricoDesafiosAluno: React.FC<HistoricoDesafiosAlunoProps> = ({
  aluno,
  historico,
  onOpenNewChallengeForAluno,
  onResendChallengeWhatsApp,
  onReenviarDesafio,
  onAgendarDesafio,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [categoriaFilter, setCategoriaFilter] = useState<string>('Todas');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [repeticaoFilter, setRepeticaoFilter] = useState<'todos' | 'ineditos' | 'repetidos'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemSelecionadoConsulta, setItemSelecionadoConsulta] = useState<DesafioEnviado | null>(null);

  // Filtra o histórico para este aluno específico
  const alunoHistorico = historico
    .filter((h) => h.aluno_id === aluno.id)
    .sort((a, b) => new Date(b.data_envio || 0).getTime() - new Date(a.data_envio || 0).getTime());

  // Agrupamento para verificar frequência e duplicidade
  const countPorDesafio = alunoHistorico.reduce((acc, curr) => {
    const key = curr.desafio_id || curr.desafio_titulo;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Estatísticas
  const totalEnvios = alunoHistorico.length;
  const desafiosDistintos = Object.keys(countPorDesafio).length;
  const totalRepetidos = totalEnvios - desafiosDistintos;

  // Filtros aplicados
  const filteredList = alunoHistorico.filter((item) => {
    const itemCat = item.desafio_categoria || item.categoria;
    const matchesCat = categoriaFilter === 'Todas' || itemCat === categoriaFilter;
    const matchesSearch = 
      item.desafio_titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mensagem_enviada.toLowerCase().includes(searchTerm.toLowerCase());

    const freq = countPorDesafio[item.desafio_id || item.desafio_titulo] || 1;
    const isRepetido = freq > 1;

    let matchesRepeticao = true;
    if (repeticaoFilter === 'ineditos') matchesRepeticao = !isRepetido;
    if (repeticaoFilter === 'repetidos') matchesRepeticao = isRepetido;

    let matchesStatus = true;
    if (statusFilter !== 'todos') {
      const st = item.status_envio || 'enviado';
      matchesStatus = st === statusFilter;
    }

    return matchesCat && matchesSearch && matchesRepeticao && matchesStatus;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResend = (desafioEnviado: DesafioEnviado) => {
    if (onReenviarDesafio) {
      onReenviarDesafio(aluno, desafioEnviado.desafio_titulo, desafioEnviado.mensagem_enviada);
    } else if (onResendChallengeWhatsApp) {
      onResendChallengeWhatsApp(aluno, desafioEnviado);
    } else {
      openWhatsApp(aluno.telefone, desafioEnviado.mensagem_enviada);
    }
  };

  // Helper para obter miniatura ou imagens associadas
  const getImagensDoDesafio = (item: DesafioEnviado): DesafioImagem[] => {
    if (item.imagens_urls && item.imagens_urls.length > 0) {
      return item.imagens_urls.map((url, idx) => ({
        id: `img-${idx}`,
        url,
        quadro_numero: idx + 1,
        exercicio_nome: `${item.desafio_titulo} (Quadro ${idx + 1})`,
      }));
    }
    if (item.imagem_url) {
      return [{
        id: 'img-main',
        url: item.imagem_url,
        quadro_numero: 1,
        exercicio_nome: item.desafio_titulo,
      }];
    }
    if (IMAGENS_DESAFIOS_PADRAO[item.desafio_titulo]) {
      return IMAGENS_DESAFIOS_PADRAO[item.desafio_titulo];
    }
    // Procura por palavra-chave se for Reset na cadeira
    if (item.desafio_titulo.toLowerCase().includes('reset') && item.desafio_titulo.toLowerCase().includes('cadeira')) {
      return IMAGENS_DESAFIOS_PADRAO['Reset de 3 Minutos na Cadeira'] || [];
    }
    return [];
  };

  const getCategoryIcon = (categoria: CategoriaDesafio) => {
    switch (categoria) {
      case 'Lazer Ativo':
        return <Compass className="h-3.5 w-3.5 text-sky-400" />;
      case 'Mindset Estoico':
      case 'Estoicismo':
        return <Shield className="h-3.5 w-3.5 text-slate-300" />;
      case 'Nutrição':
        return <Apple className="h-3.5 w-3.5 text-emerald-400" />;
      case 'Recuperação':
        return <HeartPulse className="h-3.5 w-3.5 text-teal-400" />;
      case 'Desafio de Bolso':
      default:
        return <Flame className="h-3.5 w-3.5 text-cyan-400" />;
    }
  };

  // Configuração visual dos 7 estados do provedor
  const getStatusBadge = (status?: StatusEntregaDesafio) => {
    switch (status) {
      case 'aceito':
        return {
          label: 'Aceito pelo Provedor',
          icon: CheckCheck,
          className: 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300',
          desc: 'Mensagem e imagens recebidas pelo provedor oficial',
        };
      case 'entregue':
        return {
          label: 'Entregue no WhatsApp',
          icon: CheckCheck,
          className: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300',
          desc: 'Mensagem confirmada no smartphone do aluno',
        };
      case 'lido':
        return {
          label: 'Lido pelo Aluno',
          icon: CheckCheck,
          className: 'bg-blue-500/20 border-blue-400/40 text-blue-300',
          desc: 'Visualizado e confirmado pelo aluno',
        };
      case 'enviado':
        return {
          label: 'Enviado',
          icon: Check,
          className: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
          desc: 'Disparo efetuado com sucesso',
        };
      case 'processando':
        return {
          label: 'Processando Envio',
          icon: Loader2,
          className: 'bg-amber-500/15 border-amber-400/40 text-amber-300 animate-pulse',
          desc: 'Em fila de transmissão para o provedor',
        };
      case 'pendente':
        return {
          label: 'Pendente (Ação manual)',
          icon: Clock,
          className: 'bg-yellow-500/15 border-yellow-400/40 text-yellow-300',
          desc: 'Aberto no WhatsApp Web, aguardando envio manual',
        };
      case 'falhou':
        return {
          label: 'Falhou no Envio',
          icon: AlertCircle,
          className: 'bg-rose-500/15 border-rose-400/40 text-rose-300',
          desc: 'Erro de conexão ou número inválido',
        };
      default:
        return {
          label: 'Registrado',
          icon: Check,
          className: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
          desc: 'Disparo registrado no histórico',
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Cabeçalho Oficial: Histórico de Desafios de Bolso */}
      <div className="rounded-2xl border border-emerald-500/20 bg-[#032019]/90 backdrop-blur-xl p-4 md:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-cyan-400 shadow-md">
              <Flame className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                  Engajamento & Retenção
                </span>
                <span className="text-[10px] text-slate-400">• Mobile-First</span>
              </div>
              <h3 className="text-lg md:text-xl font-black text-white tracking-tight mt-0.5">
                Histórico de Desafios de Bolso
              </h3>
              <p className="text-xs text-slate-400">
                Acompanhe todos os desafios de bolso enviados para <strong className="text-cyan-300">{aluno.nome.split(' ')[0]}</strong>, confira miniaturas, orientações e evite disparos duplicados.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            {onAgendarDesafio && (
              <button
                type="button"
                id="btn-agendar-desafio-aluno"
                onClick={() => onAgendarDesafio(aluno)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-bold text-xs hover:bg-cyan-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                <span>Agendar Envio</span>
              </button>
            )}

            {onOpenNewChallengeForAluno && (
              <button
                type="button"
                id="btn-enviar-novo-desafio-aluno"
                onClick={() => onOpenNewChallengeForAluno(aluno)}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                <Send className="h-3.5 w-3.5 fill-slate-950 text-slate-950" />
                <span>Disparar Novo Desafio</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Cards de Métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="rounded-xl border border-emerald-500/15 bg-[#021813] p-3">
            <span className="text-[11px] font-semibold text-slate-400 block">Total Disparado</span>
            <span className="text-lg font-black text-white">{totalEnvios}</span>
          </div>

          <div className="rounded-xl border border-emerald-500/15 bg-[#021813] p-3">
            <span className="text-[11px] font-semibold text-slate-400 block">Desafios Distintos</span>
            <span className="text-lg font-black text-cyan-300">{desafiosDistintos}</span>
          </div>

          <div className="rounded-xl border border-emerald-500/15 bg-[#021813] p-3">
            <span className="text-[11px] font-semibold text-slate-400 block">Repetições Bloqueadas</span>
            <span className={`text-lg font-black ${totalRepetidos > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {totalRepetidos}
            </span>
          </div>

          <div className="rounded-xl border border-emerald-500/15 bg-[#021813] p-3">
            <span className="text-[11px] font-semibold text-slate-400 block">Status de Variabilidade</span>
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1 mt-1">
              {totalRepetidos === 0 ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 100% Inéditos
                </span>
              ) : (
                <span className="text-amber-300 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> {totalRepetidos} repetido(s)
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="rounded-2xl border border-emerald-500/20 bg-[#032019]/80 backdrop-blur-xl p-3 md:p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Pílulas de Categoria */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          {['Todas', 'Lifestyle 23h', 'Desafio de Bolso', 'Estoicismo', 'Nutrição', 'Recuperação'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoriaFilter(cat)}
              className={`rounded-xl px-2.5 py-1 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                categoriaFilter === cat
                  ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white bg-[#021813] border border-emerald-500/15'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filtro de Status, Repetição e Busca */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status do Provedor */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-emerald-500/25 bg-[#02140f] px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
          >
            <option value="todos">Todos os status</option>
            <option value="aceito">Aceito pelo provedor</option>
            <option value="enviado">Enviado</option>
            <option value="entregue">Entregue</option>
            <option value="lido">Lido</option>
            <option value="pendente">Pendente (Manual)</option>
            <option value="falhou">Falhou</option>
          </select>

          {/* Filtro de Repetição */}
          <select
            value={repeticaoFilter}
            onChange={(e) => setRepeticaoFilter(e.target.value as any)}
            className="rounded-xl border border-emerald-500/25 bg-[#02140f] px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
          >
            <option value="todos">Todos os envios</option>
            <option value="ineditos">Apenas inéditos</option>
            <option value="repetidos">Apenas repetidos</option>
          </select>

          {/* Campo de Busca */}
          <div className="relative w-full sm:w-44">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar no histórico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-emerald-500/25 bg-[#02140f] pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Lista em Ordem Cronológica */}
      {filteredList.length === 0 ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-[#032019]/90 p-10 text-center backdrop-blur-xl">
          <Sparkles className="mx-auto h-9 w-9 text-cyan-400 mb-2 opacity-50" />
          <h4 className="text-sm font-bold text-white">Nenhum registro encontrado no histórico</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {totalEnvios === 0
              ? `${aluno.nome.split(' ')[0]} ainda não recebeu nenhum desafio de bolso. Dispare o primeiro para começar a construir o histórico de retenção!`
              : 'Nenhum desafio corresponde aos filtros selecionados. Tente limpar os filtros acima.'}
          </p>

          {totalEnvios === 0 && (
            <button
              type="button"
              onClick={() => onOpenNewChallengeForAluno?.(aluno)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 px-4 py-2 text-xs font-black text-slate-950 shadow-lg shadow-cyan-400/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Enviar Primeiro Desafio de Bolso</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((item, index) => {
            const freq = countPorDesafio[item.desafio_id || item.desafio_titulo] || 1;
            const isRepetido = freq > 1;
            const imagens = getImagensDoDesafio(item);
            const primeiraImagem = imagens[0];
            const statusCfg = getStatusBadge(item.status_envio);
            const StatusIcon = statusCfg.icon;

            return (
              <div
                key={item.id || `envio-${index}`}
                id={`card-historico-${item.id}`}
                className={`rounded-2xl border transition-all p-3 sm:p-4 relative overflow-hidden backdrop-blur-xl ${
                  isRepetido
                    ? 'border-amber-500/30 bg-[#032019]/90 hover:border-amber-400/50'
                    : 'border-emerald-500/20 bg-[#032019]/90 hover:border-emerald-400/40'
                }`}
              >
                {/* Faixa lateral indicativa */}
                <div 
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    isRepetido ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />

                <div className="pl-2 space-y-3">
                  {/* Topo: Tags, Status de Envio e Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-emerald-500/10">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Categoria */}
                      <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold bg-[#021813] border border-emerald-500/20 text-slate-200">
                        {getCategoryIcon((item.desafio_categoria || item.categoria || 'Lifestyle 23h') as CategoriaDesafio)}
                        <span>{item.desafio_categoria || item.categoria || 'Lifestyle 23h'}</span>
                      </span>

                      {/* Status de Entrega do Provedor */}
                      <span 
                        title={statusCfg.desc}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold border ${statusCfg.className}`}
                      >
                        <StatusIcon className="h-3 w-3 shrink-0" />
                        <span>{statusCfg.label}</span>
                      </span>

                      {/* Badge de Repetição */}
                      {isRepetido ? (
                        <span 
                          title="Este desafio já foi enviado mais de uma vez para este cliente"
                          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold bg-amber-400/15 border border-amber-400/40 text-amber-300"
                        >
                          <AlertTriangle className="h-3 w-3 text-amber-400" />
                          <span>Repetido ({freq}x no histórico)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                          <Check className="h-3 w-3" />
                          <span>Inédito (1º Envio)</span>
                        </span>
                      )}
                    </div>

                    {/* Data / Horário */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <Clock className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{item.data_formatada || item.tempo_atras || 'Data registrada'}</span>
                    </div>
                  </div>

                  {/* Corpo do Card com Miniatura e Detalhes */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {/* Miniatura da Imagem Demonstrativa */}
                    {primeiraImagem ? (
                      <div 
                        onClick={() => setItemSelecionadoConsulta(item)}
                        className="group/thumb relative h-20 w-28 sm:h-20 sm:w-32 rounded-xl overflow-hidden border border-emerald-500/30 bg-black/60 shrink-0 cursor-pointer shadow-md hover:border-cyan-400 transition-all"
                        title="Clique para ampliar imagens e ver orientações"
                      >
                        <img 
                          src={primeiraImagem.url} 
                          alt={item.desafio_titulo}
                          className="h-full w-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-1">
                          <span className="text-[9px] font-mono text-cyan-300 font-bold bg-black/70 px-1 rounded">
                            {imagens.length > 1 ? `${imagens.length} fotos` : '1 foto'}
                          </span>
                          <span className="text-white bg-cyan-500/80 p-0.5 rounded opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                            <ZoomIn className="h-2.5 w-2.5 text-slate-950" />
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-20 w-28 sm:h-20 sm:w-32 rounded-xl border border-dashed border-emerald-500/20 bg-emerald-950/20 flex flex-col items-center justify-center text-slate-500 shrink-0 text-center p-1">
                        <ImageIcon className="h-5 w-5 mb-0.5 opacity-40 text-emerald-400" />
                        <span className="text-[9px] text-slate-400">Texto WhatsApp</span>
                      </div>
                    )}

                    {/* Informações Centrais */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm sm:text-base font-extrabold text-white truncate">
                        {item.desafio_titulo}
                      </h4>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 mb-1.5 flex-wrap">
                        {item.desafio_dificuldade && (
                          <span>Dificuldade: <strong className="text-slate-300">{item.desafio_dificuldade}</strong></span>
                        )}
                        {item.tempo_estimado && (
                          <>
                            <span>•</span>
                            <span>Tempo: <strong className="text-slate-300">{item.tempo_estimado}</strong></span>
                          </>
                        )}
                        {item.numero_destino && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-cyan-400/90">Destino: {item.numero_destino}</span>
                          </>
                        )}
                      </div>

                      {/* Mensagem enviada prévia */}
                      <div className="rounded-xl border border-emerald-500/15 bg-[#021813] p-2.5 text-xs text-slate-300 relative font-sans leading-relaxed">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pb-1 border-b border-white/5 mb-1">
                          <span className="flex items-center gap-1 font-semibold text-emerald-400">
                            <MessageSquare className="h-3 w-3" />
                            Mensagem disparada
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            {item.origem_disparo === 'radar_alerta' && 'Radar de Retenção'}
                            {item.origem_disparo === 'individual' && 'Disparo Individual'}
                            {item.origem_disparo === 'massa' && 'Disparo em Lote'}
                            {item.origem_disparo === 'card_rapido' && 'Card Rápido'}
                          </span>
                        </div>
                        <p className="italic text-slate-300 line-clamp-2">
                          &quot;{item.mensagem_enviada}&quot;
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ações do Card */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleCopy(item.id, item.mensagem_enviada)}
                        className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-300 font-bold">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copiar texto</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setItemSelecionadoConsulta(item)}
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold transition-colors cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Consultar Conteúdo</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleResend(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 font-bold hover:bg-cyan-400/20 transition-all cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Reenviar no WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CONSULTA DE CONTEÚDO ENVIADO */}
      {itemSelecionadoConsulta && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setItemSelecionadoConsulta(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-cyan-400/30 bg-[#021813] p-5 sm:p-7 shadow-2xl space-y-5 text-slate-200"
          >
            {/* Header da Consulta */}
            <div className="flex items-start justify-between gap-3 border-b border-emerald-500/20 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono text-[10px] font-bold">
                    Desafio de Bolso
                  </span>
                  <span className="text-xs text-slate-400">
                    Enviado para <strong className="text-white">{aluno.nome}</strong>
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white mt-1">
                  {itemSelecionadoConsulta.desafio_titulo}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <Clock className="h-3 w-3 text-cyan-400" />
                  <span>{itemSelecionadoConsulta.data_formatada || itemSelecionadoConsulta.data_envio}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setItemSelecionadoConsulta(null)}
                className="h-8 w-8 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Imagens Demonstrativas Anexas */}
            {(() => {
              const imgs = getImagensDoDesafio(itemSelecionadoConsulta);
              if (imgs.length === 0) return null;

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <ImageIcon className="h-4 w-4" />
                      Imagens Demonstrativas e Biomecânica ({imgs.length})
                    </span>
                    <span className="text-[10px] text-slate-400">Clique para ampliar</span>
                  </div>

                  <DesafioImagemViewer 
                    imagens={imgs}
                    tituloDesafio={itemSelecionadoConsulta.desafio_titulo}
                    adaptacoesSeguranca="Adapte o ritmo de acordo com a tolerância biomecânica individual. Se houver desconforto articular, utilize a versão com apoio."
                  />
                </div>
              );
            })()}

            {/* Mensagem WhatsApp Enviada */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Texto da Mensagem Enviada:
              </label>
              <div className="rounded-2xl border border-emerald-500/25 bg-[#01140f] p-4 text-xs sm:text-sm text-slate-100 whitespace-pre-wrap leading-relaxed font-sans shadow-inner">
                {itemSelecionadoConsulta.mensagem_enviada}
              </div>
            </div>

            {/* Dados de Auditoria e Entrega do Provedor */}
            <div className="rounded-2xl border border-emerald-500/20 bg-[#01140f]/60 p-4 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Auditoria de Transmissão:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-500">Número de Destino:</span>{' '}
                  <strong className="text-white font-mono">{itemSelecionadoConsulta.numero_destino || aluno.telefone}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Status no Provedor:</span>{' '}
                  <strong className="text-cyan-300 uppercase">{itemSelecionadoConsulta.status_envio || 'Enviado'}</strong>
                </div>
                {itemSelecionadoConsulta.provider_message_id && (
                  <div className="sm:col-span-2">
                    <span className="text-slate-500">ID da Mensagem no Gateway:</span>{' '}
                    <code className="text-[10px] font-mono text-emerald-400 bg-black/40 px-1.5 py-0.5 rounded">
                      {itemSelecionadoConsulta.provider_message_id}
                    </code>
                  </div>
                )}
                {itemSelecionadoConsulta.origem_disparo && (
                  <div>
                    <span className="text-slate-500">Origem do Disparo:</span>{' '}
                    <strong className="text-slate-200 capitalize">{itemSelecionadoConsulta.origem_disparo}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Botões do Rodapé */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleCopy(itemSelecionadoConsulta.id, itemSelecionadoConsulta.mensagem_enviada)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-emerald-500/30 bg-[#01140f] text-emerald-300 text-xs font-bold hover:bg-[#021813] transition-all cursor-pointer"
              >
                {copiedId === itemSelecionadoConsulta.id ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar Mensagem</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setItemSelecionadoConsulta(null)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
