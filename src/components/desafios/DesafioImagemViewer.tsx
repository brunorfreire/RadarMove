import React, { useState } from 'react';
import { 
  X, 
  ZoomIn, 
  Info, 
  AlertCircle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  Layers
} from 'lucide-react';
import { DesafioImagem } from '../../types';

interface DesafioImagemViewerProps {
  imagens: DesafioImagem[];
  tituloDesafio: string;
  adaptacoesSeguranca?: string;
  modoCompacto?: boolean;
}

export const DesafioImagemViewer: React.FC<DesafioImagemViewerProps> = ({
  imagens,
  tituloDesafio,
  adaptacoesSeguranca,
  modoCompacto = false,
}) => {
  const [modalAberta, setModalAberta] = useState(false);
  const [indiceAtivo, setIndiceAtivo] = useState(0);

  if (!imagens || imagens.length === 0) return null;

  const imagemAtiva = imagens[indiceAtivo] || imagens[0];

  const handleProxima = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndiceAtivo((prev) => (prev + 1) % imagens.length);
  };

  const handleAnterior = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndiceAtivo((prev) => (prev - 1 + imagens.length) % imagens.length);
  };

  return (
    <div className="space-y-2 mt-3 select-none">
      {/* Container Principal da Imagem / Sequência */}
      <div 
        onClick={() => setModalAberta(true)}
        className="group relative rounded-2xl overflow-hidden border border-emerald-500/30 bg-[#02130e] cursor-pointer hover:border-cyan-400 transition-all shadow-md"
      >
        <div className="relative aspect-video sm:aspect-[16/9] w-full bg-black/40 flex items-center justify-center overflow-hidden">
          <img 
            src={imagemAtiva.url} 
            alt={imagemAtiva.exercicio_nome || tituloDesafio}
            className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
          />

          {/* Overlay com botão de ampliar */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-90 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5 sm:p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {imagens.length > 1 ? `Quadro ${indiceAtivo + 1} de ${imagens.length}` : 'Demonstração Biomecânica'}
              </span>

              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/60 text-slate-200 border border-white/10 backdrop-blur-md group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                <ZoomIn className="h-3 w-3" />
                <span>Ampliar</span>
              </span>
            </div>

            {/* Legenda do Exercício e Repetições */}
            <div className="space-y-0.5">
              <p className="text-xs font-black text-white truncate drop-shadow-md">
                {imagemAtiva.exercicio_nome || tituloDesafio}
              </p>
              {imagemAtiva.repeticoes_tempo && (
                <p className="text-[10px] font-semibold text-emerald-300 drop-shadow">
                  {imagemAtiva.repeticoes_tempo}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Controles de Próxima/Anterior se houver mais de uma imagem */}
        {imagens.length > 1 && (
          <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none">
            <button
              type="button"
              onClick={handleAnterior}
              className="pointer-events-auto h-7 w-7 rounded-full bg-black/70 hover:bg-emerald-500 text-white hover:text-slate-950 flex items-center justify-center transition-all border border-white/20 active:scale-95 shadow"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleProxima}
              className="pointer-events-auto h-7 w-7 rounded-full bg-black/70 hover:bg-emerald-500 text-white hover:text-slate-950 flex items-center justify-center transition-all border border-white/20 active:scale-95 shadow"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Miniaturas de navegação se houver múltiplos quadros */}
      {imagens.length > 1 && !modoCompacto && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {imagens.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIndiceAtivo(idx);
              }}
              className={`h-11 w-16 rounded-lg overflow-hidden border transition-all shrink-0 cursor-pointer ${
                indiceAtivo === idx
                  ? 'border-cyan-400 ring-1 ring-cyan-400 shadow-md'
                  : 'border-white/10 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Orientações Posturais Resumidas */}
      {imagemAtiva.orientacoes_postura && !modoCompacto && (
        <div className="p-2.5 rounded-xl bg-[#01140e] border border-emerald-500/20 text-[11px] text-slate-300 space-y-1">
          <p className="font-bold text-emerald-400 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            <span>Execução Correta & Postura:</span>
          </p>
          <p className="leading-relaxed text-slate-300">
            {imagemAtiva.orientacoes_postura}
          </p>
          {imagemAtiva.adaptacao_mobilidade && (
            <p className="text-[10px] text-amber-300/90 pt-1 border-t border-white/5 flex items-start gap-1">
              <span className="font-bold shrink-0">💡 Adaptação:</span>
              <span>{imagemAtiva.adaptacao_mobilidade}</span>
            </p>
          )}
        </div>
      )}

      {/* MODAL FULLSCREEN DE ZOOM COM BIOMECÂNICA */}
      {modalAberta && (
        <div 
          onClick={() => setModalAberta(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-emerald-500/40 bg-[#021813] text-slate-100 shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-emerald-500/20 bg-[#01140e]">
              <div className="flex items-center gap-2.5 truncate">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <Shield className="h-4 w-4" />
                </span>
                <div className="truncate">
                  <h4 className="font-black text-sm sm:text-base text-white truncate">
                    {tituloDesafio}
                  </h4>
                  <p className="text-[11px] text-emerald-300 truncate">
                    {imagemAtiva.exercicio_nome || 'Guia Ilustrado de Execução'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalAberta(false)}
                className="h-8 w-8 rounded-xl border border-white/10 hover:border-emerald-400 bg-white/5 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Imagem Ampliada */}
            <div className="relative flex-1 bg-black/60 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
              <img 
                src={imagemAtiva.url} 
                alt={imagemAtiva.exercicio_nome || tituloDesafio}
                className="max-h-[62vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
              />

              {imagens.length > 1 && (
                <div className="absolute inset-y-0 inset-x-3 flex items-center justify-between pointer-events-none">
                  <button
                    type="button"
                    onClick={handleAnterior}
                    className="pointer-events-auto h-10 w-10 rounded-full bg-black/80 hover:bg-emerald-500 text-white hover:text-slate-950 flex items-center justify-center transition-all border border-white/20 active:scale-95 shadow-lg"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleProxima}
                    className="pointer-events-auto h-10 w-10 rounded-full bg-black/80 hover:bg-emerald-500 text-white hover:text-slate-950 flex items-center justify-center transition-all border border-white/20 active:scale-95 shadow-lg"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Painel Inferior de Instruções Biomecânicas */}
            <div className="p-4 sm:p-5 border-t border-emerald-500/20 bg-[#01140e] space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-extrabold text-xs text-white">
                  {imagemAtiva.exercicio_nome}
                </span>
                {imagemAtiva.repeticoes_tempo && (
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                    {imagemAtiva.repeticoes_tempo}
                  </span>
                )}
              </div>

              {imagemAtiva.orientacoes_postura && (
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>Instruções de Postura:</strong> {imagemAtiva.orientacoes_postura}
                </p>
              )}

              {(imagemAtiva.adaptacao_mobilidade || adaptacoesSeguranca) && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300">Adaptação de Mobilidade & Segurança:</span>
                    <p className="text-[11px] text-amber-200/90 mt-0.5 leading-relaxed">
                      {imagemAtiva.adaptacao_mobilidade || adaptacoesSeguranca}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
