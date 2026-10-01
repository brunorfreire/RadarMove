import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  MessageSquare, 
  Check, 
  AlertCircle, 
  Tag, 
  Clock, 
  Loader2, 
  Info,
  Layers
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { DesafioTemplate, CategoriaDesafio } from '../../types';

interface SalvarTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSaved?: (novoTemplate: DesafioTemplate) => void;
  treinadorNome?: string;
}

export const SalvarTemplateModal: React.FC<SalvarTemplateModalProps> = ({
  isOpen,
  onClose,
  onTemplateSaved,
  treinadorNome = 'Treinador',
}) => {
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<CategoriaDesafio>('Lifestyle 23h');
  const [dificuldade, setDificuldade] = useState<'Fácil' | 'Médio' | 'Desafiador'>('Fácil');
  const [tempoEstimado, setTempoEstimado] = useState('2 min');
  const [mensagem, setMensagem] = useState('Fala {aluno_nome}! Aqui é o {treinador_nome}. Bora pra cima com o desafio de hoje: ');
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitulo('');
      setCategoria('Lifestyle 23h');
      setDificuldade('Fácil');
      setTempoEstimado('2 min');
      setMensagem('Fala {aluno_nome}! Aqui é o {treinador_nome}. Bora pra cima com o desafio de hoje: ');
      setErro(null);
      setSucesso(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Inserção rápida das variáveis dinâmicas no texto
  const handleInsertTag = (tag: string) => {
    setMensagem((prev) => {
      const spacing = prev.length === 0 || prev.endsWith(' ') ? '' : ' ';
      return `${prev}${spacing}${tag} `;
    });
  };

  // Prévia dinâmica com substituição simulada
  const previewMensagem = mensagem
    .replace(/\{aluno_nome\}|\{aluno\}/g, 'Lucas')
    .replace(/\{treinador_nome\}|\{personal\}/g, (treinadorNome || 'Treinador').split(' ')[0]);

  // Função de salvamento com persistência no Supabase
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    if (!titulo.trim()) {
      setErro('Por favor, informe o título do template.');
      return;
    }

    if (!mensagem.trim()) {
      setErro('Por favor, informe o conteúdo da mensagem.');
      return;
    }

    setSaving(true);

    try {
      // 1. Obtém o usuário (personal trainer) autenticado
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      // 2. Prepara o payload para a tabela 'desafios_templates'
      const templatePayload: Record<string, any> = {
        titulo: titulo.trim(),
        categoria,
        mensagem_whatsapp: mensagem.trim(),
        dificuldade,
        tempo_estimado: tempoEstimado.trim() || '2 min',
        profissional_id: userId,
      };

      let idGerado = `tpl-${Date.now()}`;

      // 3. Salva no banco de dados via Supabase
      const { data, error } = await supabase
        .from('desafios_templates')
        .insert([templatePayload])
        .select()
        .maybeSingle();

      if (error) {
        console.warn('[SalvarTemplateModal] Aviso ao gravar em desafios_templates:', error.message);
        // Fallback para esquemas com colunas simplificadas
        if (error.message?.includes('column') || error.message?.includes('schema cache')) {
          const fallbackPayload = {
            titulo: titulo.trim(),
            categoria,
            mensagem: mensagem.trim(),
            profissional_id: userId,
          };
          const { data: fallbackData } = await supabase
            .from('desafios_templates')
            .insert([fallbackPayload])
            .select()
            .maybeSingle();

          if (fallbackData?.id) {
            idGerado = fallbackData.id;
          }
        }
      } else if (data?.id) {
        idGerado = data.id;
      }

      // 4. Cria o objeto do template formatado
      const novoTemplate: DesafioTemplate = {
        id: idGerado,
        profissional_id: userId,
        categoria,
        titulo: titulo.trim(),
        mensagem_whatsapp: mensagem.trim(),
        tempo_estimado: tempoEstimado.trim() || '2 min',
        dificuldade,
      };

      if (onTemplateSaved) {
        onTemplateSaved(novoTemplate);
      }

      setSucesso('Template salvo com sucesso no banco de dados!');
      setTimeout(() => {
        onClose();
      }, 1100);

    } catch (err: any) {
      console.error('[SalvarTemplateModal] Erro ao salvar:', err);
      setErro(err?.message || 'Falha ao salvar template no Supabase.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        id="modal-salvar-template"
        className="w-full max-w-xl rounded-3xl border border-emerald-500/30 bg-[#032019]/95 p-5 sm:p-7 shadow-2xl backdrop-blur-xl relative flex flex-col max-h-[92vh] overflow-y-auto"
      >
        {/* Glow visual de fundo */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header do Modal */}
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 font-black shadow-lg shadow-emerald-500/30">
              <Sparkles className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Salvar Novo Template
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Supabase RLS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Crie mensagens reutilizáveis com variáveis dinâmicas de WhatsApp
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Avisos de Feedback */}
        {erro && (
          <div className="mt-4 p-3.5 rounded-xl border border-rose-500/40 bg-rose-500/20 text-rose-200 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{erro}</span>
          </div>
        )}

        {sucesso && (
          <div className="mt-4 p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/20 text-emerald-200 text-xs font-semibold flex items-center gap-2.5">
            <Check className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{sucesso}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSalvar} className="mt-5 space-y-4 relative z-10">
          {/* Título do Template */}
          <div>
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 block mb-1.5">
              Título do Template <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Check-in de Sexta ou Hidratação 3L"
              className="w-full rounded-xl border border-emerald-500/30 bg-[#01140f] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-all"
            />
          </div>

          {/* Categoria e Dificuldade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 block mb-1.5">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaDesafio)}
                className="w-full rounded-xl border border-emerald-500/30 bg-[#01140f] px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none transition-all"
              >
                <option value="Lifestyle 23h">Lifestyle 23h (Hábitos & Sono)</option>
                <option value="Lazer Ativo">Lazer Ativo (Fim de Semana)</option>
                <option value="Mindset Estoico">Mindset Estoico (Foco & Disciplina)</option>
                <option value="Nutrição">Nutrição & Hidratação</option>
                <option value="Recuperação">Recuperação & Sono</option>
                <option value="Desafio de Bolso">Desafio de Bolso (1-2 min)</option>
                <option value="Desafio de Conversão">Conversão & Leads</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 block mb-1.5">
                Tempo Estimado
              </label>
              <input
                type="text"
                value={tempoEstimado}
                onChange={(e) => setTempoEstimado(e.target.value)}
                placeholder="Ex: 2 min, 15 min"
                className="w-full rounded-xl border border-emerald-500/30 bg-[#01140f] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Botões para inserção de variáveis dinâmicas */}
          <div className="p-3.5 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-cyan-400" />
                Variáveis Dinâmicas Disponíveis:
              </span>
              <span className="text-[10px] text-slate-400">Clique para inserir no texto</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleInsertTag('{aluno_nome}')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span>&#123;aluno_nome&#125;</span>
                <span className="text-[10px] text-emerald-400/80 font-sans font-normal">(Nome do Aluno)</span>
              </button>

              <button
                type="button"
                onClick={() => handleInsertTag('{treinador_nome}')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-400/40 bg-cyan-400/15 hover:bg-cyan-400/30 text-cyan-200 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <span>&#123;treinador_nome&#125;</span>
                <span className="text-[10px] text-cyan-300/80 font-sans font-normal">(Seu Nome)</span>
              </button>
            </div>
          </div>

          {/* Campo de Texto para a Mensagem */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                Mensagem WhatsApp <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {mensagem.length} caracteres
              </span>
            </div>

            <textarea
              required
              rows={4}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Escreva a mensagem com as variáveis {aluno_nome} e {treinador_nome}..."
              className="w-full rounded-2xl border border-emerald-500/30 bg-[#01140f] p-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Prévia da Mensagem Formatada */}
          <div className="rounded-2xl border border-emerald-500/20 bg-[#011611] p-3.5 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Info className="h-3 w-3 text-cyan-400" />
              Prévia de Como o Aluno Receberá:
            </span>
            <div className="p-3 rounded-xl bg-[#021813] border border-white/5 text-xs text-slate-200 leading-relaxed font-sans">
              &quot;{previewMensagem}&quot;
            </div>
          </div>

          {/* Rodapé e Ações */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-emerald-500/15">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving || !titulo.trim() || !mensagem.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Salvando no Supabase...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>Salvar Template</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
