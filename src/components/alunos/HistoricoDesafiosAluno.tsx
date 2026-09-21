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
  Compass
} from 'lucide-react';
import { Aluno, DesafioEnviado, CategoriaDesafio } from '../../types';
import { openWhatsApp } from '../../lib/whatsappUtils';

interface HistoricoDesafiosAlunoProps {
  aluno: Aluno;
  historico: DesafioEnviado[];
  onOpenNewChallengeForAluno?: (aluno: Aluno) => void;
  onResendChallengeWhatsApp?: (aluno: Aluno, desafioEnviado: DesafioEnviado) => void;
  onReenviarDesafio?: (aluno: Aluno, desafioTitulo: string, mensagem: string) => void;
}

export const HistoricoDesafiosAluno: React.FC<HistoricoDesafiosAlunoProps> = ({
  aluno,
  historico,
  onOpenNewChallengeForAluno,
  onResendChallengeWhatsApp,
  onReenviarDesafio,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [categoriaFilter, setCategoriaFilter] = useState<string>('Todas');
  const [repeticaoFilter, setRepeticaoFilter] = useState<'todos' | 'ineditos' | 'repetidos'>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter history for this student
  const alunoHistorico = historico.filter((h) => h.aluno_id === aluno.id);

  // Group by challenge ID or title to detect frequency
  const countPorDesafio = alunoHistorico.reduce((acc, curr) => {
    const key = curr.desafio_id || curr.desafio_titulo;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Compute repeated vs unique
  const totalEnvios = alunoHistorico.length;
  const desafiosDistintos = Object.keys(countPorDesafio).length;
  const totalRepetidos = totalEnvios - desafiosDistintos;

  // Filtered list
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

    return matchesCat && matchesSearch && matchesRepeticao;
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

  const getCategoryIcon = (categoria: CategoriaDesafio) => {
    switch (categoria) {
      case 'Lazer Ativo':
        return <Compass className="h-3.5 w-3.5 text-sky-400" />;
      case 'Mindset Estoico':
      case 'Estoicismo':
        return <Shield className="h-3.5 w-3.5 text-violet-400" />;
      case 'Lifestyle 23h':
        return <Zap className="h-3.5 w-3.5 text-cyan-400" />;
      case 'Desafio de Bolso':
        return <Flame className="h-3.5 w-3.5 text-amber-400" />;
      case 'Nutrição':
        return <Apple className="h-3.5 w-3.5 text-emerald-400" />;
      case 'Recuperação':
        return <HeartPulse className="h-3.5 w-3.5 text-rose-400" />;
      default:
        return <Award className="h-3.5 w-3.5 text-cyan-400" />;
    }
  };

  return (
    <div id="historico-desafios-container" className="space-y-4">
      {/* Header Metrics Card */}
      <div className="rounded-2xl border border-emerald-500/20 bg-[#032019]/90 backdrop-blur-xl p-4 md:p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-500/15 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-emerald-500/20 text-cyan-300 border border-cyan-400/30">
                <Award className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm md:text-base font-extrabold text-white flex items-center gap-2">
                  Histórico de Micro-Desafios de {aluno.nome.split(' ')[0]}
                </h3>
                <p className="text-xs text-slate-400">
                  Acompanhe todos os desafios disparados, saiba quais já foram enviados e evite repetições não planejadas.
                </p>
              </div>
            </div>
          </div>

          {onOpenNewChallengeForAluno && (
            <button
              type="button"
              id="btn-enviar-novo-desafio-aluno"
              onClick={() => onOpenNewChallengeForAluno(aluno)}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer self-start md:self-auto"
            >
              <Send className="h-3.5 w-3.5 fill-slate-950 text-slate-950" />
              <span>Disparar Novo Desafio</span>
            </button>
          )}
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3.5">
          <div className="rounded-xl border border-emerald-500/15 bg-[#021813] p-3">
            <span className="text-[11px] font-semibold text-slate-400 block">Total Disparado</span>
            <span className="text-lg font-black text-white">{totalEnvios}</span>
          </div>

          <div className="rounded-xl border border-emerald-500/15 bg-[#021813] p-3">
            <span className="text-[11px] font-semibold text-slate-400 block">Desafios Distintos</span>
            <span className="text-lg font-black text-cyan-300">{desafiosDistintos}</span>
          </div>

          <div className="rounded-xl border border-emerald-500/15 bg-[#021813] p-3">
            <span className="text-[11px] font-semibold text-slate-400 block">Repetições</span>
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

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-emerald-500/20 bg-[#032019]/80 backdrop-blur-xl p-3 md:p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pills */}
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

        {/* Repetition and Search Filter */}
        <div className="flex items-center gap-2">
          {/* Repetition filter dropdown */}
          <select
            value={repeticaoFilter}
            onChange={(e) => setRepeticaoFilter(e.target.value as any)}
            className="rounded-xl border border-emerald-500/25 bg-[#02140f] px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
          >
            <option value="todos">Todos os envios</option>
            <option value="ineditos">Apenas inéditos</option>
            <option value="repetidos">Apenas repetidos</option>
          </select>

          {/* Search box */}
          <div className="relative w-full md:w-44">
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

      {/* History Items List */}
      {filteredList.length === 0 ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-[#032019]/90 p-10 text-center backdrop-blur-xl">
          <Sparkles className="mx-auto h-9 w-9 text-cyan-400 mb-2 opacity-50" />
          <h4 className="text-sm font-bold text-white">Nenhum registro encontrado no histórico</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {totalEnvios === 0
              ? `${aluno.nome.split(' ')[0]} ainda não recebeu nenhum micro-desafio. Dispare o primeiro para começar a construir o histórico de retenção!`
              : 'Nenhum desafio corresponde aos filtros selecionados. Tente limpar os filtros acima.'}
          </p>

          {totalEnvios === 0 && (
            <button
              type="button"
              onClick={() => onOpenNewChallengeForAluno?.(aluno)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 px-4 py-2 text-xs font-black text-slate-950 shadow-lg shadow-cyan-400/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Enviar Primeiro Micro-Desafio</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((item, index) => {
            const freq = countPorDesafio[item.desafio_id || item.desafio_titulo] || 1;
            const isRepetido = freq > 1;

            return (
              <div
                key={item.id || `envio-${index}`}
                id={`card-historico-${item.id}`}
                className={`rounded-2xl border transition-all p-4 relative overflow-hidden backdrop-blur-xl ${
                  isRepetido
                    ? 'border-amber-500/30 bg-[#032019]/90 hover:border-amber-400/50'
                    : 'border-emerald-500/20 bg-[#032019]/90 hover:border-emerald-400/40'
                }`}
              >
                {/* Left accent bar */}
                <div 
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    isRepetido ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />

                <div className="pl-2">
                  {/* Top line: Tags & Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-emerald-500/10">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Category Badge */}
                      <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold bg-[#021813] border border-emerald-500/20 text-slate-200">
                        {getCategoryIcon((item.desafio_categoria || item.categoria || 'Lifestyle 23h') as CategoriaDesafio)}
                        <span>{item.desafio_categoria || item.categoria || 'Lifestyle 23h'}</span>
                      </span>

                      {/* Repetition Status Badge */}
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

                      {/* Difficulty */}
                      <span className="text-[10px] text-slate-400 font-medium">
                        Dificuldade: <strong className="text-slate-300">{item.desafio_dificuldade}</strong>
                      </span>
                    </div>

                    {/* Date / Time */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                      <Clock className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{item.data_formatada || item.tempo_atras || 'Data registrada'}</span>
                    </div>
                  </div>

                  {/* Challenge Title */}
                  <h4 className="text-sm md:text-base font-extrabold text-white mt-2 mb-1.5">
                    {item.desafio_titulo}
                  </h4>

                  {/* WhatsApp Sent Message Box */}
                  <div className="rounded-xl border border-emerald-500/15 bg-[#021813] p-3 text-xs text-slate-200 relative font-sans leading-relaxed my-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pb-1 border-b border-white/5 mb-1.5">
                      <span className="flex items-center gap-1 font-semibold text-emerald-400">
                        <MessageSquare className="h-3 w-3" />
                        Mensagem disparada no WhatsApp
                      </span>
                      <span className="text-slate-400">
                        {item.origem_disparo === 'radar_alerta' && 'Origem: Radar de Retenção'}
                        {item.origem_disparo === 'individual' && 'Origem: Envio Individual'}
                        {item.origem_disparo === 'massa' && 'Origem: Disparo em Massa'}
                        {item.origem_disparo === 'card_rapido' && 'Origem: Card Rápido'}
                      </span>
                    </div>
                    <p className="italic text-slate-300 whitespace-pre-wrap">
                      &quot;{item.mensagem_enviada}&quot;
                    </p>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-1 text-xs">
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
                      onClick={() => handleResend(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 font-bold hover:bg-cyan-400/20 transition-all cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reenviar no WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
