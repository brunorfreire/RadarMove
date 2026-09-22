import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Search, 
  Filter, 
  Sun, 
  Zap, 
  Shield, 
  Send, 
  CheckCircle2, 
  TrendingUp,
  Award,
  Layers,
  ArrowLeft,
  ArrowUp,
  X,
  ChevronDown
} from 'lucide-react';
import { CategoriasExplainer } from './CategoriasExplainer';
import { DesafioCard } from './DesafioCard';
import { DispararDesafioModal } from './DispararDesafioModal';
import { NovoDesafioModal } from './NovoDesafioModal';
import { AgendamentoModal } from './AgendamentoModal';
import { DesafioTemplate, Aluno, WhatsAppMensagem, CategoriaDesafio, DesafioEnviado } from '../../types';

interface DesafiosViewProps {
  templates: DesafioTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<DesafioTemplate[]>>;
  alunos: Aluno[];
  historico?: DesafioEnviado[];
  onDispararDesafio: (
    alunoIds: string[], 
    desafio: DesafioTemplate, 
    customMessage: string, 
    abrirWhatsAppWeb: boolean
  ) => void;
}

export const DesafiosView: React.FC<DesafiosViewProps> = ({
  templates,
  setTemplates,
  alunos,
  historico = [],
  onDispararDesafio,
}) => {
  const [selectedCategoria, setSelectedCategoria] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [dificuldadeFilter, setDificuldadeFilter] = useState<'Todas' | 'Fácil' | 'Médio' | 'Desafiador'>('Todas');

  const topCardsRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [activeDesafioToDispatch, setActiveDesafioToDispatch] = useState<DesafioTemplate | null>(null);
  const [activeDesafioToSchedule, setActiveDesafioToSchedule] = useState<DesafioTemplate | null>(null);
  const [alunoToSchedule, setAlunoToSchedule] = useState<Aluno | null>(null);
  const [isNovoModalOpen, setIsNovoModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DesafioTemplate | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Counts by category
  const categoryCounts = templates.reduce((acc, curr) => {
    acc[curr.categoria] = (acc[curr.categoria] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Auto-scroll when category is selected
  useEffect(() => {
    if (selectedCategoria !== 'Todos' && optionsRef.current) {
      optionsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedCategoria]);

  // Filter logic
  const filteredTemplates = templates.filter((item) => {
    const matchesCategory = 
      selectedCategoria === 'Todos' || 
      item.categoria === selectedCategoria || 
      (selectedCategoria === 'Mindset Estoico' && item.categoria === 'Estoicismo');
    const matchesDificuldade = dificuldadeFilter === 'Todas' || item.dificuldade === dificuldadeFilter;
    const matchesSearch = 
      item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mensagem_whatsapp.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoria.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesDificuldade && matchesSearch;
  });

  const handleSelectCategoria = (cat: string) => {
    setSelectedCategoria(cat);
  };

  const handleResetToAllCards = () => {
    setSelectedCategoria('Todos');
    setSearchTerm('');
    setDificuldadeFilter('Todas');
    if (topCardsRef.current) {
      topCardsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSaveTemplate = (novoData: Omit<DesafioTemplate, 'id'>, editId?: string) => {
    if (editId) {
      setTemplates((prev) =>
        prev.map((t) => (t.id === editId ? { ...novoData, id: editId } : t))
      );
      showToast('Template atualizado com sucesso!');
    } else {
      const novoTemplate: DesafioTemplate = {
        ...novoData,
        id: `des-custom-${Date.now()}`,
      };
      setTemplates((prev) => [novoTemplate, ...prev]);
      showToast('Novo micro-desafio criado com sucesso!');
    }
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    showToast('Template removido com sucesso.');
  };

  const handleOpenEdit = (desafio: DesafioTemplate) => {
    setEditingTemplate(desafio);
    setIsNovoModalOpen(true);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDisparoModalConcluido = (
    alunoIds: string[], 
    desafio: DesafioTemplate, 
    customMessage: string, 
    abrirWhatsAppWeb: boolean
  ) => {
    onDispararDesafio(alunoIds, desafio, customMessage, abrirWhatsAppWeb);
    const count = alunoIds.length;
    showToast(
      count === 1
        ? `Desafio enviado com sucesso para o aluno!`
        : `Desafio disparado em massa para ${count} alunos!`
    );
  };

  const handleQuickSendWhatsApp = (
    aluno: Aluno,
    desafio: DesafioTemplate,
    customMessage: string
  ) => {
    onDispararDesafio([aluno.id], desafio, customMessage, false);
    showToast(`Desafio enviado via WhatsApp para ${aluno.nome.split(' ')[0]}!`);
  };

  return (
    <div id="desafios-view-container" className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 rounded-2xl border border-emerald-400/50 bg-[#021813]/95 px-5 py-3 shadow-2xl backdrop-blur-xl text-xs font-bold text-emerald-300 flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* 1. Header Overview & Gamification Stats */}
      <div className="rounded-2xl border border-emerald-500/20 bg-[#032019]/90 backdrop-blur-xl p-5 md:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/15 border border-cyan-400/30 text-cyan-300 shadow-sm">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                  Biblioteca de Desafios & Gamificação
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Micro-hábitos, estímulos e gatilhos de engajamento para os alunos fora da academia
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Stat Pill 1: Total Templates */}
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-[#021813] px-3.5 py-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Templates</span>
                <span className="text-sm font-extrabold text-white">{templates.length} disponíveis</span>
              </div>
            </div>

            {/* Stat Pill 2: Taxa de Resposta */}
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-[#021813] px-3.5 py-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Aderência 23h</span>
                <span className="text-sm font-extrabold text-emerald-400">88.4% de resposta</span>
              </div>
            </div>

            {/* Create New Challenge Button */}
            <button
              id="btn-criar-novo-desafio"
              onClick={() => {
                setEditingTemplate(null);
                setIsNovoModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-cyan-400/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Novo Micro-Desafio</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Categorias Explainer (Os Cards Principais) */}
      <div ref={topCardsRef} id="secao-cards-categorias" className="scroll-mt-6">
        <CategoriasExplainer
          selectedCategoria={selectedCategoria}
          onSelectCategoria={handleSelectCategoria}
          counts={categoryCounts}
        />
      </div>

      {/* 3. OPÇÕES DOS DESAFIOS LOGO ABAIXO DOS CARDS */}
      <div 
        ref={optionsRef}
        id="secao-desafios-logo-abaixo" 
        className="scroll-mt-6 space-y-4 pt-1"
      >
        {/* Navigation & Fast Filter Bar */}
        <div className="rounded-2xl border border-emerald-500/25 bg-[#032019]/95 backdrop-blur-xl p-4 shadow-xl flex flex-col gap-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-emerald-500/15 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                <Zap className="h-4 w-4 fill-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm md:text-base font-extrabold text-white">
                    {selectedCategoria === 'Todos' ? (
                      'Opções de Micro-Desafios (Todos os Cards)'
                    ) : (
                      <>Opções do Card: <span className="text-cyan-300">{selectedCategoria}</span></>
                    )}
                  </h3>
                  <span className="rounded-full bg-cyan-400/15 px-2 py-0.5 text-[11px] font-bold text-cyan-300 border border-cyan-400/30">
                    {filteredTemplates.length} {filteredTemplates.length === 1 ? 'desafio' : 'desafios'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {selectedCategoria === 'Todos'
                    ? 'Clique em qualquer card acima para filtrar as opções diretamente abaixo dele.'
                    : `Mostrando os desafios configurados logo abaixo do card ${selectedCategoria}.`}
                </p>
              </div>
            </div>

            {/* Quick Action: Voltar os Cards */}
            {selectedCategoria !== 'Todos' && (
              <button
                type="button"
                id="btn-voltar-cards-rapido"
                onClick={handleResetToAllCards}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer self-start md:self-center"
              >
                <ArrowLeft className="h-4 w-4 stroke-[3]" />
                <span>Voltar aos cards</span>
              </button>
            )}
          </div>

          {/* Search, Filter & Quick Category Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
              {['Todos', 'Lazer Ativo', 'Mindset Estoico', 'Lifestyle 23h', 'Desafio de Bolso', 'Nutrição', 'Recuperação'].map((cat) => {
                const isSelected = selectedCategoria === cat;
                const countDisplay = cat === 'Mindset Estoico'
                  ? ((categoryCounts['Mindset Estoico'] || 0) + (categoryCounts['Estoicismo'] || 0))
                  : categoryCounts[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => handleSelectCategoria(cat)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white bg-[#021813] border border-emerald-500/15'
                    }`}
                  >
                    {cat}
                    {cat !== 'Todos' && countDisplay ? (
                      <span className="ml-1.5 opacity-75">({countDisplay})</span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Search and Difficulty Filter */}
            <div className="flex items-center gap-2">
              {/* Difficulty Dropdown */}
              <select
                value={dificuldadeFilter}
                onChange={(e) => setDificuldadeFilter(e.target.value as any)}
                className="rounded-xl border border-emerald-500/25 bg-[#02140f] px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
              >
                <option value="Todas">Dificuldade: Todas</option>
                <option value="Fácil">Fácil</option>
                <option value="Médio">Médio</option>
                <option value="Desafiador">Desafiador</option>
              </select>

              {/* Search Box */}
              <div className="relative w-full md:w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar desafio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-emerald-500/25 bg-[#02140f] pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
                >
                </input>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Challenge Cards Grid (Directly below the cards!) */}
        {filteredTemplates.length === 0 ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-[#032019]/90 p-12 text-center backdrop-blur-xl">
            <Sparkles className="mx-auto h-10 w-10 text-cyan-400 mb-2 opacity-50" />
            <h4 className="text-sm font-bold text-white">Nenhum micro-desafio encontrado</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Tente mudar o termo de busca ou o filtro de categoria para encontrar outros templates.
            </p>
            <button
              onClick={handleResetToAllCards}
              className="mt-4 rounded-xl bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition-all cursor-pointer"
            >
              Voltar aos cards e limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredTemplates.map((item) => (
              <DesafioCard
                key={item.id}
                desafio={item}
                alunos={alunos}
                historico={historico}
                onDisparar={(t) => setActiveDesafioToDispatch(t)}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteTemplate}
                onQuickSendWhatsApp={handleQuickSendWhatsApp}
                onAgendar={(t, a) => {
                  setActiveDesafioToSchedule(t);
                  setAlunoToSchedule(a || null);
                }}
              />
            ))}
          </div>
        )}

        {/* Bottom Fast Action Bar */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-500/20 bg-[#021813] text-xs text-slate-400">
          <span>
            Exibindo {filteredTemplates.length} de {templates.length} desafios
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToAllCards}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 font-bold hover:bg-cyan-400/20 transition-all cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar aos cards</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (topCardsRef.current) {
                  topCardsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 font-bold transition-all cursor-pointer"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              <span>Topo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* 1. Modal de Disparo (Individual ou em Massa) */}
      <DispararDesafioModal
        isOpen={!!activeDesafioToDispatch}
        onClose={() => setActiveDesafioToDispatch(null)}
        desafio={activeDesafioToDispatch}
        alunos={alunos}
        historico={historico}
        onDisparoConcluido={handleDisparoModalConcluido}
        onAbrirAgendamento={(t, a) => {
          setActiveDesafioToSchedule(t);
          setAlunoToSchedule(a || null);
        }}
      />

      {/* 2. Modal de Agendamento Programado de Desafio */}
      <AgendamentoModal
        isOpen={!!activeDesafioToSchedule}
        onClose={() => {
          setActiveDesafioToSchedule(null);
          setAlunoToSchedule(null);
        }}
        desafio={activeDesafioToSchedule}
        alunos={alunos}
        alunoPreSelecionado={alunoToSchedule}
        onAgendamentoCriado={(agendamento) => {
          setToastMessage(`Desafio agendado com sucesso! O RadarMove disparará automaticamente.`);
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />

      {/* 3. Modal de Criação / Edição de Template */}
      <NovoDesafioModal
        isOpen={isNovoModalOpen}
        onClose={() => {
          setIsNovoModalOpen(false);
          setEditingTemplate(null);
        }}
        onSave={handleSaveTemplate}
        editingTemplate={editingTemplate}
      />
    </div>
  );
};
