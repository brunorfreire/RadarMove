import React, { useState, useMemo } from 'react';
import { 
  Camera, 
  Upload, 
  ArrowRight, 
  ArrowLeftRight, 
  Calendar, 
  Scale, 
  Tag, 
  Share2, 
  MessageSquare, 
  Sparkles, 
  SlidersHorizontal, 
  Columns, 
  Maximize2, 
  Trash2, 
  Check, 
  Clock, 
  ChevronRight, 
  Image as ImageIcon,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Aluno, FotoAngulo, FotoEvolucao } from '../../types';
import { openWhatsApp } from '../../lib/whatsappUtils';
import { UploadFotoModal } from './UploadFotoModal';

interface EvolucaoFotosSectionProps {
  aluno: Aluno;
  fotos: FotoEvolucao[];
  onAddFoto: (fotoData: Omit<FotoEvolucao, 'id'>) => void;
  onDeleteFoto: (fotoId: string) => void;
  onSendWhatsAppCelebration?: (texto: string) => void;
}

const ANGULO_LABELS: Record<FotoAngulo, string> = {
  frente: 'Frente',
  costas: 'Costas',
  perfil_direito: 'Perfil Dir.',
  perfil_esquerdo: 'Perfil Esq.',
  outro: 'Livre / Detalhe',
};

export const EvolucaoFotosSection: React.FC<EvolucaoFotosSectionProps> = ({
  aluno,
  fotos,
  onAddFoto,
  onDeleteFoto,
  onSendWhatsAppCelebration,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'comparador' | 'galeria'>('comparador');
  const [comparadorViewMode, setComparadorViewMode] = useState<'lado_a_lado' | 'slider'>('lado_a_lado');
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 to 100
  const [filtroAngulo, setFiltroAngulo] = useState<string>('todos');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [lightboxFoto, setLightboxFoto] = useState<FotoEvolucao | null>(null);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Filter photos for this student
  const alunoFotos = useMemo(() => {
    return fotos
      .filter((f) => f.aluno_id === aluno.id)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [fotos, aluno.id]);

  // Selected photos for Before and After
  const [selectedAntesId, setSelectedAntesId] = useState<string>('');
  const [selectedDepoisId, setSelectedDepoisId] = useState<string>('');

  // Auto initialize Before & After if not selected or invalid
  const { antesFoto, depoisFoto } = useMemo(() => {
    if (alunoFotos.length === 0) {
      return { antesFoto: null, depoisFoto: null };
    }

    let aFoto = alunoFotos.find((f) => f.id === selectedAntesId);
    let dFoto = alunoFotos.find((f) => f.id === selectedDepoisId);

    // If both empty or invalid, pick earliest as "Antes" and latest as "Depois"
    if (!aFoto) {
      aFoto = alunoFotos[0];
    }
    if (!dFoto) {
      // Pick latest if length > 1, else same photo
      dFoto = alunoFotos.length > 1 ? alunoFotos[alunoFotos.length - 1] : alunoFotos[0];
    }

    return { antesFoto: aFoto, depoisFoto: dFoto };
  }, [alunoFotos, selectedAntesId, selectedDepoisId]);

  // Filtered gallery
  const galeriaFiltrada = useMemo(() => {
    if (filtroAngulo === 'todos') return alunoFotos;
    return alunoFotos.filter((f) => f.angulo === filtroAngulo);
  }, [alunoFotos, filtroAngulo]);

  // Calculate days between photos and weight difference
  const diffDias = useMemo(() => {
    if (!antesFoto || !depoisFoto) return 0;
    const tAntes = new Date(antesFoto.data).getTime();
    const tDepois = new Date(depoisFoto.data).getTime();
    const diff = Math.round(Math.abs(tDepois - tAntes) / (1000 * 60 * 60 * 24));
    return diff;
  }, [antesFoto, depoisFoto]);

  const diffPeso = useMemo(() => {
    if (!antesFoto?.peso_kg || !depoisFoto?.peso_kg) return null;
    const diff = depoisFoto.peso_kg - antesFoto.peso_kg;
    return Number(diff.toFixed(1));
  }, [antesFoto, depoisFoto]);

  const handleSwapFotos = () => {
    if (antesFoto && depoisFoto) {
      setSelectedAntesId(depoisFoto.id);
      setSelectedDepoisId(antesFoto.id);
    }
  };

  const handleShareWhatsApp = () => {
    if (!antesFoto || !depoisFoto) return;

    const dataAntesFmt = new Date(antesFoto.data).toLocaleDateString('pt-BR');
    const dataDepoisFmt = new Date(depoisFoto.data).toLocaleDateString('pt-BR');
    const primeiroNome = aluno.nome.split(' ')[0];

    let texto = `🚀 *Evolução Física Sensacional, ${primeiroNome}!* 💪\n\n`;
    texto += `Acabei de comparar suas fotos de progresso aqui no RadarMove:\n`;
    texto += `📸 *Antes:* ${dataAntesFmt}${antesFoto.peso_kg ? ` (${antesFoto.peso_kg}kg)` : ''}\n`;
    texto += `📸 *Depois:* ${dataDepoisFmt}${depoisFoto.peso_kg ? ` (${depoisFoto.peso_kg}kg)` : ''}\n`;
    if (diffDias > 0) {
      texto += `⏳ *Período:* ${diffDias} dias de foco e consistência\n`;
    }
    if (diffPeso !== null) {
      texto += `⚖️ *Variação:* ${diffPeso > 0 ? `+${diffPeso}kg de densidade` : `${diffPeso}kg eliminados`}\n`;
    }
    texto += `\nA mudança visual e a postura estão nítidas! Parabéns pelo resultado, bora continuar construindo essa transformação! 🔥👊`;

    if (onSendWhatsAppCelebration) {
      onSendWhatsAppCelebration(texto);
    } else {
      openWhatsApp(aluno.telefone, texto);
    }

    setCopiedToast('Mensagem de celebração gerada!');
    setTimeout(() => setCopiedToast(null), 3000);
  };

  return (
    <div 
      id="secao-fotos-evolucao" 
      className="rounded-2xl border border-emerald-500/20 bg-[#032019]/90 backdrop-blur-xl p-5 md:p-6 shadow-xl text-slate-100"
    >
      {/* Toast */}
      {copiedToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-[#03241b] px-4 py-3 text-xs font-bold text-emerald-300 shadow-2xl shadow-black/80 animate-in fade-in duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{copiedToast}</span>
        </div>
      )}

      {/* Top Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-emerald-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Camera className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-black text-white uppercase tracking-wider">
              Fotos de Evolução & Antes e Depois
            </h3>
            <span className="rounded-full bg-cyan-500/15 border border-cyan-400/30 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300">
              {alunoFotos.length} {alunoFotos.length === 1 ? 'foto registrada' : 'fotos registradas'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Acompanhamento visual de postura, definição e recomposição corporal do aluno{' '}
            <strong className="text-slate-200">{aluno.nome}</strong>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            id="btn-subir-nova-foto"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-xs font-extrabold text-slate-950 shadow-md shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <Upload className="h-4 w-4" />
            <span>Subir Foto de Evolução</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between gap-3 pt-4 pb-4 border-b border-emerald-500/10 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('comparador')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeSubTab === 'comparador'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>Comparador Antes & Depois</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('galeria')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeSubTab === 'galeria'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span>Histórico & Linha do Tempo ({alunoFotos.length})</span>
          </button>
        </div>

        {/* In Comparador: Switch view mode */}
        {activeSubTab === 'comparador' && alunoFotos.length >= 2 && (
          <div className="flex items-center gap-1.5 rounded-xl bg-[#02140f] p-1 border border-emerald-500/20 text-xs">
            <button
              type="button"
              onClick={() => setComparadorViewMode('lado_a_lado')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                comparadorViewMode === 'lado_a_lado'
                  ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Lado a Lado</span>
            </button>
            <button
              type="button"
              onClick={() => setComparadorViewMode('slider')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                comparadorViewMode === 'slider'
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Cortina Interativa</span>
            </button>
          </div>
        )}

        {/* In Galeria: filter by angle */}
        {activeSubTab === 'galeria' && (
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
            {['todos', 'frente', 'costas', 'perfil_direito', 'perfil_esquerdo'].map((ang) => (
              <button
                key={ang}
                type="button"
                onClick={() => setFiltroAngulo(ang)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all capitalize whitespace-nowrap ${
                  filtroAngulo === ang
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 bg-[#021510]'
                }`}
              >
                {ang === 'todos' ? 'Todos os Ângulos' : ANGULO_LABELS[ang as FotoAngulo]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* STATE 1: Empty state if aluno has no photos yet */}
      {alunoFotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-emerald-500/20 bg-[#02130e] my-4">
          <div className="h-16 w-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300 mb-4 shadow-lg">
            <Camera className="h-8 w-8" />
          </div>
          <h4 className="text-base font-extrabold text-white mb-1">
            Nenhuma foto de evolução cadastrada ainda
          </h4>
          <p className="text-xs text-slate-400 max-w-md mb-5">
            Comece subindo fotos tiradas de frente, costas ou perfil para documentar o histórico visual e montar comparações incríveis de Antes e Depois para seu aluno.
          </p>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>Fazer Upload da Primeira Foto</span>
          </button>
        </div>
      ) : activeSubTab === 'comparador' ? (
        /* TAB COMPARADOR ANTES E DEPOIS */
        <div className="space-y-6 pt-2">
          {/* Photos Selection Controls */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center rounded-2xl bg-[#02130e] border border-emerald-500/20 p-4">
            {/* Seletor Foto Antes */}
            <div className="md:col-span-5">
              <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                📸 Foto "Antes" (Marco Inicial)
              </label>
              <select
                value={antesFoto?.id || ''}
                onChange={(e) => setSelectedAntesId(e.target.value)}
                className="w-full rounded-xl border border-amber-500/30 bg-[#032019] px-3 py-2 text-xs font-semibold text-white focus:border-amber-400 focus:outline-none"
              >
                {alunoFotos.map((f) => (
                  <option key={f.id} value={f.id}>
                    {new Date(f.data).toLocaleDateString('pt-BR')} - {ANGULO_LABELS[f.angulo]} ({f.etiqueta || 'Sem etiqueta'}) {f.peso_kg ? `- ${f.peso_kg}kg` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Central Swap & Period Banner */}
            <div className="md:col-span-2 flex flex-col items-center justify-center gap-1.5 py-1">
              <button
                type="button"
                onClick={handleSwapFotos}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-bold hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                title="Inverter Antes e Depois"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                <span>Inverter</span>
              </button>
              {diffDias > 0 && (
                <span className="text-[10px] font-extrabold text-cyan-300">
                  {diffDias} dias de foco
                </span>
              )}
            </div>

            {/* Seletor Foto Depois */}
            <div className="md:col-span-5">
              <label className="block text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                📸 Foto "Depois" (Evolução / Atual)
              </label>
              <select
                value={depoisFoto?.id || ''}
                onChange={(e) => setSelectedDepoisId(e.target.value)}
                className="w-full rounded-xl border border-cyan-500/30 bg-[#032019] px-3 py-2 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
              >
                {alunoFotos.map((f) => (
                  <option key={f.id} value={f.id}>
                    {new Date(f.data).toLocaleDateString('pt-BR')} - {ANGULO_LABELS[f.angulo]} ({f.etiqueta || 'Sem etiqueta'}) {f.peso_kg ? `- ${f.peso_kg}kg` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparativo Visual */}
          {antesFoto && depoisFoto && (
            <div>
              {/* Variações e Métricas Resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="rounded-xl border border-emerald-500/20 bg-[#021510] p-3 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Tempo Decorrido</div>
                  <div className="text-lg font-black text-cyan-300">
                    {diffDias === 0 ? 'Mesmo dia' : `${diffDias} dias`}
                  </div>
                  <div className="text-[10px] text-slate-400">entre as duas fotos</div>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-[#021510] p-3 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Variação na Balança</div>
                  <div className="text-lg font-black text-emerald-400">
                    {diffPeso === null
                      ? 'N/D'
                      : diffPeso > 0
                      ? `+${diffPeso} kg`
                      : `${diffPeso} kg`}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {diffPeso !== null && diffPeso < 0 ? 'gordura eliminada' : 'massa / densidade'}
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-[#021510] p-3 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Ângulo Comparado</div>
                  <div className="text-lg font-black text-white capitalize">
                    {ANGULO_LABELS[antesFoto.angulo]}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {antesFoto.angulo === depoisFoto.angulo ? 'Alinhamento idêntico' : 'Ângulos diferentes'}
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-[#021510] p-2.5 flex flex-col justify-center items-center">
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="w-full h-full flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 px-3 py-2 text-xs font-black text-slate-950 shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Compartilhar WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* MODO 1: LADO A LADO */}
              {comparadorViewMode === 'lado_a_lado' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Card ANTES */}
                  <div className="rounded-2xl border-2 border-amber-500/30 bg-[#021510] overflow-hidden shadow-2xl flex flex-col">
                    <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[11px] font-black text-slate-950 uppercase tracking-wider">
                          Antes
                        </span>
                        <span className="text-xs font-bold text-amber-200">
                          {new Date(antesFoto.data).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {antesFoto.peso_kg && (
                          <span className="text-xs font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md">
                            {antesFoto.peso_kg} kg
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setLightboxFoto(antesFoto)}
                          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
                          title="Ver ampliado"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="relative aspect-[3/4] w-full bg-black/60 overflow-hidden flex items-center justify-center">
                      <img
                        src={antesFoto.foto_url}
                        alt="Foto Antes"
                        className="h-full w-full object-cover object-top"
                      />
                      {antesFoto.etiqueta && (
                        <div className="absolute top-3 left-3 rounded-md bg-black/75 backdrop-blur-xs border border-white/20 px-2.5 py-1 text-[11px] font-bold text-amber-200">
                          {antesFoto.etiqueta}
                        </div>
                      )}
                      <div className="absolute bottom-3 right-3 rounded-md bg-black/75 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-slate-300">
                        {ANGULO_LABELS[antesFoto.angulo]}
                      </div>
                    </div>

                    {antesFoto.observacoes && (
                      <div className="p-3 bg-[#02130e] text-xs text-slate-300 border-t border-amber-500/15">
                        <span className="font-bold text-amber-300">Nota: </span>
                        {antesFoto.observacoes}
                      </div>
                    )}
                  </div>

                  {/* Card DEPOIS */}
                  <div className="rounded-2xl border-2 border-cyan-400/40 bg-[#021510] overflow-hidden shadow-2xl flex flex-col">
                    <div className="p-3 bg-cyan-500/10 border-b border-cyan-400/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-cyan-400 px-2 py-0.5 text-[11px] font-black text-slate-950 uppercase tracking-wider">
                          Depois / Atual
                        </span>
                        <span className="text-xs font-bold text-cyan-200">
                          {new Date(depoisFoto.data).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {depoisFoto.peso_kg && (
                          <span className="text-xs font-black text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-md">
                            {depoisFoto.peso_kg} kg
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setLightboxFoto(depoisFoto)}
                          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
                          title="Ver ampliado"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="relative aspect-[3/4] w-full bg-black/60 overflow-hidden flex items-center justify-center">
                      <img
                        src={depoisFoto.foto_url}
                        alt="Foto Depois"
                        className="h-full w-full object-cover object-top"
                      />
                      {depoisFoto.etiqueta && (
                        <div className="absolute top-3 left-3 rounded-md bg-black/75 backdrop-blur-xs border border-white/20 px-2.5 py-1 text-[11px] font-bold text-cyan-200">
                          {depoisFoto.etiqueta}
                        </div>
                      )}
                      <div className="absolute bottom-3 right-3 rounded-md bg-black/75 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-slate-300">
                        {ANGULO_LABELS[depoisFoto.angulo]}
                      </div>
                    </div>

                    {depoisFoto.observacoes && (
                      <div className="p-3 bg-[#02130e] text-xs text-slate-300 border-t border-cyan-400/15">
                        <span className="font-bold text-cyan-300">Nota: </span>
                        {depoisFoto.observacoes}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* MODO 2: SLIDER DE CORTINA (SPLIT SLIDER INTERATIVO) */
                <div className="rounded-2xl border-2 border-cyan-400/40 bg-[#02130e] p-4 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      Antes: {new Date(antesFoto.data).toLocaleDateString('pt-BR')} ({antesFoto.peso_kg ? `${antesFoto.peso_kg}kg` : ''})
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Arraste o controle abaixo para revelar o Antes e Depois
                    </span>
                    <span className="text-cyan-400 flex items-center gap-1.5">
                      Depois: {new Date(depoisFoto.data).toLocaleDateString('pt-BR')} ({depoisFoto.peso_kg ? `${depoisFoto.peso_kg}kg` : ''})
                      <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    </span>
                  </div>

                  {/* Interactive Slider Canvas Container */}
                  <div 
                    className="relative w-full max-w-xl mx-auto aspect-[3/4] rounded-2xl overflow-hidden select-none shadow-2xl border border-emerald-500/30"
                  >
                    {/* Background Layer: DEPOIS */}
                    <img
                      src={depoisFoto.foto_url}
                      alt="Depois"
                      className="absolute inset-0 h-full w-full object-cover object-top"
                    />

                    {/* Foreground Layer: ANTES (clipped via clipPath) */}
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{
                        clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
                      }}
                    >
                      <img
                        src={antesFoto.foto_url}
                        alt="Antes"
                        className="absolute inset-0 h-full w-full object-cover object-top"
                      />
                    </div>

                    {/* Vertical Dividing Line */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-cyan-400 shadow-lg"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      {/* Central Handle Button */}
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-9 w-9 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-xl border-2 border-cyan-400">
                        <ArrowLeftRight className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Badges on the canvas */}
                    <div className="absolute top-3 left-3 rounded-md bg-black/80 px-2.5 py-1 text-[11px] font-black text-amber-300 pointer-events-none">
                      ANTES ({new Date(antesFoto.data).toLocaleDateString('pt-BR')})
                    </div>
                    <div className="absolute top-3 right-3 rounded-md bg-black/80 px-2.5 py-1 text-[11px] font-black text-cyan-300 pointer-events-none">
                      DEPOIS ({new Date(depoisFoto.data).toLocaleDateString('pt-BR')})
                    </div>
                  </div>

                  {/* Range Slider Control */}
                  <div className="max-w-xl mx-auto flex items-center gap-3 pt-2">
                    <span className="text-xs font-bold text-amber-400">100% Antes</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderPosition}
                      onChange={(e) => setSliderPosition(Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer h-2 bg-[#021813] rounded-lg"
                    />
                    <span className="text-xs font-bold text-cyan-400">100% Depois</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* TAB GALERIA & HISTÓRICO COMPLETO */
        <div className="pt-3 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Exibindo <strong className="text-white">{galeriaFiltrada.length}</strong> de {alunoFotos.length} fotos do histórico
            </span>
            <span className="text-[11px]">
              Dica: clique em uma foto para ampliar ou definir como Antes/Depois
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Quick Upload Drop Card */}
            <div
              onClick={() => setIsUploadModalOpen(true)}
              className="flex flex-col items-center justify-center aspect-[3/4] rounded-2xl border-2 border-dashed border-cyan-400/40 bg-cyan-500/5 hover:bg-cyan-500/15 hover:border-cyan-400 transition-all cursor-pointer p-4 text-center group"
            >
              <div className="h-12 w-12 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 mb-3 group-hover:scale-110 transition-transform">
                <Upload className="h-6 w-6" />
              </div>
              <div className="text-xs font-extrabold text-white mb-1">
                + Subir Nova Foto
              </div>
              <div className="text-[10px] text-slate-400">
                Frente, Costas ou Perfil
              </div>
            </div>

            {/* Photo Cards */}
            {galeriaFiltrada.map((f) => {
              const isAntes = f.id === antesFoto?.id;
              const isDepois = f.id === depoisFoto?.id;

              return (
                <div
                  key={f.id}
                  className={`group relative rounded-2xl overflow-hidden border bg-[#021510] shadow-md transition-all ${
                    isDepois
                      ? 'border-cyan-400 ring-2 ring-cyan-400/40'
                      : isAntes
                      ? 'border-amber-400 ring-2 ring-amber-400/40'
                      : 'border-emerald-500/20 hover:border-emerald-500/50'
                  }`}
                >
                  {/* Image with aspect 3/4 */}
                  <div 
                    onClick={() => setLightboxFoto(f)}
                    className="aspect-[3/4] w-full bg-black/50 overflow-hidden cursor-pointer relative"
                  >
                    <img
                      src={f.foto_url}
                      alt={f.etiqueta || 'Foto de evolução'}
                      className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Badges on Image */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {isAntes && (
                        <span className="rounded-md bg-amber-500 px-1.5 py-0.5 text-[9px] font-black text-slate-950 uppercase tracking-wider shadow">
                          Marcado: Antes
                        </span>
                      )}
                      {isDepois && (
                        <span className="rounded-md bg-cyan-400 px-1.5 py-0.5 text-[9px] font-black text-slate-950 uppercase tracking-wider shadow">
                          Marcado: Depois
                        </span>
                      )}
                      {f.etiqueta && (
                        <span className="rounded-md bg-black/75 backdrop-blur-xs px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                          {f.etiqueta}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {ANGULO_LABELS[f.angulo]}
                    </div>
                  </div>

                  {/* Card Info & Quick Actions */}
                  <div className="p-2.5 bg-[#02130e] space-y-2 border-t border-emerald-500/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">
                        {new Date(f.data).toLocaleDateString('pt-BR')}
                      </span>
                      {f.peso_kg && (
                        <span className="font-black text-emerald-400">
                          {f.peso_kg} kg
                        </span>
                      )}
                    </div>

                    {/* Quick Setter Buttons */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedAntesId(f.id)}
                        className={`py-1 rounded-lg text-[10px] font-bold border transition-all ${
                          isAntes
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-[#032019] text-amber-300 border-amber-500/30 hover:bg-amber-500/15'
                        }`}
                      >
                        {isAntes ? '✓ É o Antes' : 'Usar Antes'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedDepoisId(f.id)}
                        className={`py-1 rounded-lg text-[10px] font-bold border transition-all ${
                          isDepois
                            ? 'bg-cyan-400 text-slate-950 border-cyan-400'
                            : 'bg-[#032019] text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/15'
                        }`}
                      >
                        {isDepois ? '✓ É o Depois' : 'Usar Depois'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-emerald-500/10 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setLightboxFoto(f)}
                        className="text-cyan-400 hover:underline font-semibold flex items-center gap-0.5"
                      >
                        <Maximize2 className="h-3 w-3" />
                        Ampliar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Deseja realmente excluir esta foto de evolução?')) {
                            onDeleteFoto(f.id);
                          }
                        }}
                        className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-0.5"
                      >
                        <Trash2 className="h-3 w-3" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Lightbox de Foto Ampliada */}
      {lightboxFoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setLightboxFoto(null)}
        >
          <div 
            className="relative max-w-2xl w-full rounded-2xl bg-[#02130e] border border-cyan-400/40 p-4 shadow-2xl overflow-hidden text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20 mb-3">
              <div>
                <h4 className="text-sm font-black text-white">
                  Registro de Evolução - {ANGULO_LABELS[lightboxFoto.angulo]}
                </h4>
                <p className="text-xs text-cyan-300">
                  {new Date(lightboxFoto.data).toLocaleDateString('pt-BR')} {lightboxFoto.peso_kg ? `• ${lightboxFoto.peso_kg} kg` : ''} {lightboxFoto.etiqueta ? `• ${lightboxFoto.etiqueta}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxFoto(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[65vh] overflow-hidden rounded-xl bg-black/80 flex items-center justify-center">
              <img
                src={lightboxFoto.foto_url}
                alt="Foto Ampliada"
                className="max-h-[65vh] w-auto object-contain"
              />
            </div>

            {lightboxFoto.observacoes && (
              <div className="mt-3 p-3 rounded-xl bg-[#032019] border border-emerald-500/20 text-xs text-slate-300">
                <span className="font-bold text-cyan-300">Anotações do Treinador: </span>
                {lightboxFoto.observacoes}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-emerald-500/20">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Deseja excluir esta foto?')) {
                    onDeleteFoto(lightboxFoto.id);
                    setLightboxFoto(null);
                  }
                }}
                className="flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300"
              >
                <Trash2 className="h-4 w-4" />
                Excluir Foto
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAntesId(lightboxFoto.id);
                    setActiveSubTab('comparador');
                    setLightboxFoto(null);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/20 text-xs font-bold text-amber-300 hover:bg-amber-500/30"
                >
                  Definir como "Antes"
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDepoisId(lightboxFoto.id);
                    setActiveSubTab('comparador');
                    setLightboxFoto(null);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/20 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30"
                >
                  Definir como "Depois"
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Upload de Nova Foto */}
      <UploadFotoModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        alunoId={aluno.id}
        alunoNome={aluno.nome}
        pesoSugerido={alunoFotos[alunoFotos.length - 1]?.peso_kg}
        onSave={onAddFoto}
      />
    </div>
  );
};
