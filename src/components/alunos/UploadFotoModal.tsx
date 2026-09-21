import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  Calendar, 
  Scale, 
  Tag, 
  FileText, 
  Check, 
  AlertCircle,
  Sparkles,
  Trash2
} from 'lucide-react';
import { FotoAngulo, FotoEvolucao } from '../../types';

interface UploadFotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  alunoId: string;
  alunoNome: string;
  pesoSugerido?: number;
  onSave: (fotoData: Omit<FotoEvolucao, 'id'>) => void;
}

const ETIQUETAS_PRESETS = [
  'Início da Consultoria',
  '30 Dias',
  '60 Dias',
  '90 Dias',
  '120 Dias',
  'Fase de Hipertrofia',
  'Fase de Definição',
  'Foto Atual'
];

const ANGULOS_CONFIG: { id: FotoAngulo; label: string }[] = [
  { id: 'frente', label: 'Frente' },
  { id: 'costas', label: 'Costas' },
  { id: 'perfil_direito', label: 'Perfil Dir.' },
  { id: 'perfil_esquerdo', label: 'Perfil Esq.' },
  { id: 'outro', label: 'Livre / Detalhe' },
];

export const UploadFotoModal: React.FC<UploadFotoModalProps> = ({
  isOpen,
  onClose,
  alunoId,
  alunoNome,
  pesoSugerido,
  onSave,
}) => {
  const [fotoUrl, setFotoUrl] = useState<string>('');
  const [data, setData] = useState<string>(new Date().toISOString().split('T')[0]);
  const [angulo, setAngulo] = useState<FotoAngulo>('frente');
  const [pesoKg, setPesoKg] = useState<string>(pesoSugerido ? String(pesoSugerido) : '');
  const [etiqueta, setEtiqueta] = useState<string>('Foto Atual');
  const [observacoes, setObservacoes] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('A imagem é muito grande. O limite máximo é 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setFotoUrl(result);
        setErrorMsg(null);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Erro ao ler a imagem. Tente outro arquivo.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fotoUrl) {
      setErrorMsg('Por favor, selecione ou envie uma foto de evolução.');
      return;
    }

    const pesoNum = pesoKg.trim() ? parseFloat(pesoKg.replace(',', '.')) : undefined;

    onSave({
      aluno_id: alunoId,
      data,
      foto_url: fotoUrl,
      angulo,
      peso_kg: pesoNum && !isNaN(pesoNum) ? pesoNum : undefined,
      etiqueta: etiqueta.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl border border-emerald-500/30 bg-[#031d17] p-5 md:p-6 text-slate-100 shadow-2xl shadow-black/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-emerald-500/20 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">
                Subir Foto de Evolução
              </h2>
              <p className="text-xs text-slate-400">
                Aluno: <span className="font-semibold text-cyan-300">{alunoNome}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload Dropzone (Supports Drag & Drop and Click) */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Foto de Evolução / Progresso Físico *
            </label>

            {fotoUrl ? (
              <div className="relative rounded-2xl border-2 border-cyan-400/40 bg-black/40 p-3 overflow-hidden">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative h-44 w-36 rounded-xl overflow-hidden bg-black/70 border border-emerald-500/30 flex-shrink-0 shadow-lg">
                    <img
                      src={fotoUrl}
                      alt="Prévia da evolução"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-1 right-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
                      {ANGULOS_CONFIG.find((a) => a.id === angulo)?.label}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div className="flex items-center gap-1.5 justify-center sm:justify-start text-xs font-bold text-emerald-300">
                      <Check className="h-4 w-4 text-emerald-400" />
                      Foto carregada com sucesso!
                    </div>
                    <p className="text-xs text-slate-400">
                      A imagem está pronta para ser salva no histórico e comparada no Antes e Depois.
                    </p>
                    <div className="flex items-center gap-2 justify-center sm:justify-start pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-400/40 bg-cyan-500/10 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Trocar Imagem
                      </button>
                      <button
                        type="button"
                        onClick={() => setFotoUrl('')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                id="dropzone-foto-evolucao"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-500/15 scale-[0.99]'
                    : 'border-emerald-500/30 bg-[#02140f] hover:border-cyan-400/60 hover:bg-[#021813]'
                }`}
              >
                <div className="h-12 w-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 mb-3 shadow-md">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-white mb-1">
                  Arraste e solte a foto aqui, ou <span className="text-cyan-400 underline">clique para selecionar</span>
                </p>
                <p className="text-xs text-slate-400">
                  Suporta arquivos JPG, PNG ou WebP (fotos tiradas no celular ou câmera)
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />
          </div>

          {/* Ângulo da Foto (Frente, Costas, Perfil) */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Posição / Ângulo da Foto
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {ANGULOS_CONFIG.map((ang) => (
                <button
                  key={ang.id}
                  type="button"
                  onClick={() => setAngulo(ang.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                    angulo === ang.id
                      ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400 shadow-md shadow-cyan-500/10'
                      : 'bg-[#02130e] text-slate-400 border-emerald-500/20 hover:text-slate-200'
                  }`}
                >
                  {ang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Data da Foto e Peso na Época */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Data do Registro
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full rounded-xl border border-emerald-500/30 bg-[#02130e] pl-9 pr-4 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Peso na Época (kg) <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                <input
                  type="text"
                  value={pesoKg}
                  onChange={(e) => setPesoKg(e.target.value)}
                  placeholder="Ex: 82.5"
                  className="w-full rounded-xl border border-emerald-500/30 bg-[#02130e] pl-9 pr-4 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Etiqueta / Marco */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-200">
                Etiqueta / Marco Temporal
              </label>
              <span className="text-[10px] text-slate-400">
                Ajuda na comparação do Antes e Depois
              </span>
            </div>
            <div className="relative mb-2">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
              <input
                type="text"
                value={etiqueta}
                onChange={(e) => setEtiqueta(e.target.value)}
                placeholder="Ex: Início da Consultoria, 60 Dias..."
                className="w-full rounded-xl border border-emerald-500/30 bg-[#02130e] pl-9 pr-4 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ETIQUETAS_PRESETS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setEtiqueta(tag)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    etiqueta === tag
                      ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/40'
                      : 'bg-[#021813] text-slate-400 hover:text-slate-200 border border-emerald-500/20'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Observações do Treinador */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">
              Anotações do Treinador <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-emerald-400" />
              <textarea
                rows={2}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: Melhora visível na postura e afinamento da cintura escapular..."
                className="w-full rounded-xl border border-emerald-500/30 bg-[#02130e] pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-emerald-500/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-emerald-500/20 bg-[#02140f] text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <Check className="h-4 w-4" />
              <span>Salvar no Histórico</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
