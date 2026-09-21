import React, { useState, useEffect } from 'react';
import { X, Plus, Sparkles, Check, HelpCircle, Tag, Clock } from 'lucide-react';
import { DesafioTemplate, CategoriaDesafio } from '../../types';

interface NovoDesafioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (desafio: Omit<DesafioTemplate, 'id'>, editId?: string) => void;
  editingTemplate?: DesafioTemplate | null;
}

export const NovoDesafioModal: React.FC<NovoDesafioModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTemplate,
}) => {
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<CategoriaDesafio>('Lifestyle 23h');
  const [dificuldade, setDificuldade] = useState<'Fácil' | 'Médio' | 'Desafiador'>('Fácil');
  const [tempoEstimado, setTempoEstimado] = useState('2 min');
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    if (editingTemplate) {
      setTitulo(editingTemplate.titulo);
      setCategoria(editingTemplate.categoria);
      setDificuldade(editingTemplate.dificuldade);
      setTempoEstimado(editingTemplate.tempo_estimado);
      setMensagem(editingTemplate.mensagem_whatsapp);
    } else {
      setTitulo('');
      setCategoria('Lifestyle 23h');
      setDificuldade('Fácil');
      setTempoEstimado('2 min');
      setMensagem('Fala {aluno}! Desafio rápido do seu personal para hoje: ');
    }
  }, [editingTemplate, isOpen]);

  if (!isOpen) return null;

  const handleInsertTag = (tag: string) => {
    setMensagem((prev) => `${prev} ${tag}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !mensagem.trim()) return;

    onSave(
      {
        profissional_id: 'prof-01',
        categoria,
        titulo: titulo.trim(),
        mensagem_whatsapp: mensagem.trim(),
        tempo_estimado: tempoEstimado.trim() || '2 min',
        dificuldade,
      },
      editingTemplate ? editingTemplate.id : undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        id="modal-novo-desafio"
        className="w-full max-w-lg rounded-2xl border border-emerald-500/30 bg-[#032019]/95 p-5 sm:p-6 shadow-2xl backdrop-blur-xl relative flex flex-col max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 text-slate-950 font-bold">
              <Plus className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                {editingTemplate ? 'Editar Template de Desafio' : 'Novo Micro-Desafio Personalizado'}
              </h3>
              <p className="text-xs text-slate-400">
                Templates com gatilhos de engajamento para seus alunos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Título */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Título do Desafio:
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Alongamento de Peitoral na Parede 1min"
              className="w-full rounded-xl border border-emerald-500/25 bg-[#02140f] px-3.5 py-2 text-xs md:text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              required
            />
          </div>

          {/* Categoria & Dificuldade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Categoria:
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaDesafio)}
                className="w-full rounded-xl border border-emerald-500/25 bg-[#02140f] px-3 py-2 text-xs md:text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="Lazer Ativo">Lazer Ativo</option>
                <option value="Mindset Estoico">Mindset Estoico</option>
                <option value="Lifestyle 23h">Lifestyle 23h</option>
                <option value="Desafio de Bolso">Desafio de Bolso</option>
                <option value="Estoicismo">Estoicismo</option>
                <option value="Nutrição">Nutrição</option>
                <option value="Recuperação">Recuperação</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Dificuldade:
              </label>
              <select
                value={dificuldade}
                onChange={(e) => setDificuldade(e.target.value as 'Fácil' | 'Médio' | 'Desafiador')}
                className="w-full rounded-xl border border-emerald-500/25 bg-[#02140f] px-3 py-2 text-xs md:text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="Fácil">Fácil (1-2 min)</option>
                <option value="Médio">Médio (5-10 min)</option>
                <option value="Desafiador">Desafiador (15+ min)</option>
              </select>
            </div>
          </div>

          {/* Tempo Estimado */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              Tempo Estimado:
            </label>
            <input
              type="text"
              value={tempoEstimado}
              onChange={(e) => setTempoEstimado(e.target.value)}
              placeholder="Ex: 1 min, 5 min, Leitura 30s"
              className="w-full rounded-xl border border-emerald-500/25 bg-[#02140f] px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              required
            />
          </div>

          {/* Mensagem WhatsApp */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Texto para Disparo no WhatsApp:
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleInsertTag('{aluno}')}
                  className="rounded-md bg-cyan-400/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300 hover:bg-cyan-400/30 transition-colors"
                >
                  + {'{aluno}'}
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('{personal}')}
                  className="rounded-md bg-emerald-400/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 hover:bg-emerald-400/30 transition-colors"
                >
                  + {'{personal}'}
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Digite a mensagem motivacional ou instrução do desafio..."
              className="w-full rounded-xl border border-emerald-500/25 bg-[#02140f] p-3 text-xs md:text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none resize-none"
              required
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-emerald-500/20">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 px-5 py-2 text-xs font-extrabold text-slate-950 shadow-lg shadow-cyan-400/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <Check className="h-4 w-4 stroke-[3]" />
              {editingTemplate ? 'Atualizar Template' : 'Salvar Novo Desafio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
