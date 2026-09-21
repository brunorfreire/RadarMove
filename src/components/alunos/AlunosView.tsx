import React, { useState } from 'react';
import { AlunoProfileHeader } from './AlunoProfileHeader';
import { EvolucaoGrafico } from './EvolucaoGrafico';
import { BioimpedanciaForm } from './BioimpedanciaForm';
import { HistoricoAvaliacoes } from './HistoricoAvaliacoes';
import { AlunoFormModal } from './AlunoFormModal';
import { EvolucaoFotosSection } from './EvolucaoFotosSection';
import { HistoricoDesafiosAluno } from './HistoricoDesafiosAluno';
import { SendChallengeModal } from '../dashboard/SendChallengeModal';
import { Aluno, AvaliacaoFisica, DesafioTemplate, RadarAlerta, FotoEvolucao, DesafioEnviado } from '../../types';
import { calcularBadgesDoAluno } from '../../lib/badges';
import { 
  Users, 
  Search, 
  PlusCircle, 
  Filter, 
  ChevronRight, 
  UserCheck, 
  Flame, 
  Shield, 
  Activity, 
  Award, 
  Sparkles, 
  Trophy,
  UserPlus,
  Plus,
  CheckCircle2,
  Camera,
  LineChart,
  Layers,
  History
} from 'lucide-react';

interface AlunosViewProps {
  alunos: Aluno[];
  selectedAluno: Aluno | null;
  onSelectAluno: (aluno: Aluno) => void;
  onAddAluno?: (aluno: Omit<Aluno, 'id'>) => void;
  onUpdateAluno?: (aluno: Aluno) => void;
  onUpdateAvatar?: (alunoId: string, newAvatarUrl: string) => void;
  fotos: FotoEvolucao[];
  onAddFoto: (fotoData: Omit<FotoEvolucao, 'id'>) => void;
  onDeleteFoto: (fotoId: string) => void;
  avaliacoes: AvaliacaoFisica[];
  setAvaliacoes: React.Dispatch<React.SetStateAction<AvaliacaoFisica[]>>;
  templates: DesafioTemplate[];
  historico?: DesafioEnviado[];
  onOpenVoiceModalForAluno: (aluno: Aluno) => void;
  onSendChallengeDirect: (alertaId: string, template: DesafioTemplate, customMessage: string) => void;
  onSendCelebrationMessage?: (alunoId: string, texto: string) => void;
  onReenviarDesafio?: (aluno: Aluno, desafioTitulo: string, mensagem: string) => void;
}

export const AlunosView: React.FC<AlunosViewProps> = ({
  alunos,
  selectedAluno,
  onSelectAluno,
  onAddAluno,
  onUpdateAluno,
  onUpdateAvatar,
  fotos,
  onAddFoto,
  onDeleteFoto,
  avaliacoes,
  setAvaliacoes,
  templates,
  historico = [],
  onOpenVoiceModalForAluno,
  onSendChallengeDirect,
  onSendCelebrationMessage,
  onReenviarDesafio,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ativo' | 'em_risco' | 'badges'>('todos');
  const [mainSectionTab, setMainSectionTab] = useState<'fotos' | 'bioimpedancia' | 'desafios' | 'tudo'>('fotos');
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [alunoToEdit, setAlunoToEdit] = useState<Aluno | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveCreate = (novoData: Omit<Aluno, 'id'> | Aluno) => {
    if (onAddAluno) {
      onAddAluno(novoData as Omit<Aluno, 'id'>);
    }
    showToast(`Cliente "${novoData.nome}" cadastrado com sucesso!`);
  };

  const handleSaveEdit = (alunoData: Omit<Aluno, 'id'> | Aluno) => {
    if (onUpdateAluno && 'id' in alunoData) {
      onUpdateAluno(alunoData as Aluno);
    }
    showToast(`Dados de "${alunoData.nome}" atualizados com sucesso!`);
  };

  const handleOpenEdit = (aluno: Aluno) => {
    setAlunoToEdit(aluno);
    setIsEditModalOpen(true);
  };

  const activeAluno = selectedAluno || alunos[0];

  // Filter students for the selector strip
  const filteredAlunos = alunos.filter((a) => {
    const matchesSearch = a.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const aBadges = calcularBadgesDoAluno(a, avaliacoes.filter(av => av.aluno_id === a.id));
    
    let matchesStatus = true;
    if (filterStatus === 'ativo') matchesStatus = a.status === 'ativo';
    if (filterStatus === 'em_risco') matchesStatus = a.status === 'em_risco';
    if (filterStatus === 'badges') matchesStatus = aBadges.length > 0;

    return matchesSearch && matchesStatus;
  });

  // Assessments belonging to the selected student
  const alunoAvaliacoes = avaliacoes.filter((av) => av.aluno_id === activeAluno.id);

  // Latest assessment
  const sortedAvaliacoes = [...alunoAvaliacoes].sort(
    (a, b) => new Date(b.data_registro).getTime() - new Date(a.data_registro).getTime()
  );
  const ultimaAvaliacao = sortedAvaliacoes[0];

  const handleSaveNovaAvaliacao = (nova: Omit<AvaliacaoFisica, 'id'>) => {
    const novaComId: AvaliacaoFisica = {
      ...nova,
      id: `av-${Date.now()}`,
    };
    setAvaliacoes((prev) => [novaComId, ...prev]);
  };

  const handleDeleteAvaliacao = (id: string) => {
    setAvaliacoes((prev) => prev.filter((av) => av.id !== id));
  };

  // Convert student to synthetic alert to open the send challenge modal
  const syntheticAlert: RadarAlerta | null = activeAluno
    ? {
        id: `direct-challenge-${activeAluno.id}`,
        aluno_id: activeAluno.id,
        aluno_nome: activeAluno.nome,
        aluno_telefone: activeAluno.telefone,
        aluno_avatar: activeAluno.avatar_url,
        tipo: 'meta_batida',
        urgencia: 'baixa',
        descricao: `Envio direto de micro-desafio de evolução para ${activeAluno.nome}`,
        tempo_atras: 'Agora',
        desafio_sugerido_id: 'des-01',
      }
    : null;

  return (
    <div id="alunos-view-container" className="space-y-6 animate-in fade-in duration-200 relative">
      {/* Toast de Sucesso */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-[#03241b] px-4 py-3 text-xs font-bold text-emerald-300 shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Aluno Selector Strip (Mobile-friendly horizontal selector + search) */}
      <div className="rounded-2xl border border-emerald-500/20 bg-[#032019]/90 backdrop-blur-xl p-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Users className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Selecionar Aluno para Evolução
            </h3>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.2 text-[10px] font-bold text-emerald-400">
              {alunos.length} cadastrados
            </span>

            {/* BOTÃO ADICIONAR CLIENTE (SIMPLES, FÁCIL E RÁPIDO) */}
            <button
              id="btn-adicionar-cliente-header"
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 px-3.5 py-1.5 text-xs font-extrabold text-slate-950 shadow-md shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
              title="Adicionar um novo aluno/cliente ao sistema"
            >
              <UserPlus className="h-4 w-4" />
              <span>Adicionar Cliente</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Status & Badges Filter */}
            <div className="flex items-center gap-1 bg-[#02140f] p-1 rounded-xl border border-emerald-500/20 text-[11px]">
              <button
                type="button"
                onClick={() => setFilterStatus('todos')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                  filterStatus === 'todos'
                    ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('ativo')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                  filterStatus === 'ativo'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Ativos
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('em_risco')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                  filterStatus === 'em_risco'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Em Risco
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('badges')}
                className={`px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  filterStatus === 'badges'
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Trophy className="h-3 w-3 text-amber-400" />
                Com Selos
              </button>
            </div>

            {/* Search box */}
            <div className="relative w-full md:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-emerald-500/25 bg-[#02140f] pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Horizontal scrollable pills */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
          {/* Quick Add Pill at start */}
          <button
            id="btn-adicionar-cliente-pill"
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-dashed border-cyan-400/50 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-400/20 hover:border-cyan-400 active:scale-95 transition-all flex-shrink-0 cursor-pointer"
            title="Cadastrar novo aluno rapidamente"
          >
            <div className="h-8 w-8 rounded-lg border border-cyan-400/40 bg-cyan-500/20 flex items-center justify-center">
              <Plus className="h-4 w-4 text-cyan-300" />
            </div>
            <div className="text-left">
              <div className="font-extrabold text-cyan-200 leading-tight">+ Novo Aluno</div>
              <div className="text-[10px] text-cyan-400/80">Rápido e fácil</div>
            </div>
          </button>

          {filteredAlunos.map((a) => {
            const isSelected = a.id === activeAluno.id;
            const aBadges = calcularBadgesDoAluno(a, avaliacoes.filter((av) => av.aluno_id === a.id));

            return (
              <button
                key={a.id}
                id={`btn-select-aluno-${a.id}`}
                onClick={() => onSelectAluno(a)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  isSelected
                    ? 'border-2 border-cyan-400 bg-cyan-400/15 text-white shadow-md shadow-cyan-500/10'
                    : 'border border-emerald-500/20 bg-[#021813] text-slate-300 hover:border-emerald-500/40 hover:bg-[#03241c]'
                }`}
              >
                <div className="relative h-8 w-8 rounded-lg overflow-hidden border border-emerald-500/30 flex-shrink-0 bg-emerald-950">
                  {a.avatar_url ? (
                    <img src={a.avatar_url} alt={a.nome} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center font-bold text-xs text-cyan-300">
                      {a.nome.charAt(0)}
                    </div>
                  )}
                  {a.status === 'em_risco' && (
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-black" />
                  )}
                </div>

                <div className="text-left">
                  <div className="font-bold truncate max-w-[140px] leading-tight flex items-center gap-1.5">
                    <span>{a.nome}</span>
                    {aBadges.length > 0 && (
                      <span 
                        title={`${aBadges.length} selos conquistados`}
                        className="flex items-center gap-0.5 rounded px-1 py-0.2 text-[9px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30"
                      >
                        🏆 {aBadges.length}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight flex items-center gap-1.5">
                    <span>{a.plano.split(' ')[0]}</span>
                    <span>•</span>
                    <span className={a.dias_sem_treino <= 1 ? 'text-amber-400 font-bold' : ''}>
                      {a.dias_sem_treino === 0 ? 'Treinou hoje' : `${a.dias_sem_treino}d sem treino`}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Selected Student Profile Header Card */}
      {activeAluno ? (
        <>
          <AlunoProfileHeader
            aluno={activeAluno}
            avaliacoes={alunoAvaliacoes}
            onOpenVoiceModal={onOpenVoiceModalForAluno}
            onOpenChallengeModal={() => setIsChallengeModalOpen(true)}
            onEditAluno={handleOpenEdit}
            onUpdateAvatar={onUpdateAvatar}
            onSendWhatsAppCelebration={(texto) => {
              if (onSendCelebrationMessage) {
                onSendCelebrationMessage(activeAluno.id, texto);
              }
            }}
          />

          {/* Section Navigation Switcher */}
          <div className="flex items-center justify-between gap-3 flex-wrap pt-2">
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#02140f] border border-emerald-500/20">
              <button
                type="button"
                id="tab-fotos-evolucao"
                onClick={() => setMainSectionTab('fotos')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  mainSectionTab === 'fotos'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="h-4 w-4" />
                <span>Fotos de Evolução & Antes e Depois</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  mainSectionTab === 'fotos'
                    ? 'bg-black/30 text-white'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {fotos.filter((f) => f.aluno_id === activeAluno.id).length}
                </span>
              </button>

              <button
                type="button"
                id="tab-bioimpedancia"
                onClick={() => setMainSectionTab('bioimpedancia')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  mainSectionTab === 'bioimpedancia'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LineChart className="h-4 w-4" />
                <span>Bioimpedância & Gráficos</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  mainSectionTab === 'bioimpedancia'
                    ? 'bg-black/30 text-white'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {alunoAvaliacoes.length}
                </span>
              </button>

              <button
                type="button"
                id="tab-historico-desafios"
                onClick={() => setMainSectionTab('desafios')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  mainSectionTab === 'desafios'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <History className="h-4 w-4" />
                <span>Histórico de Desafios</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  mainSectionTab === 'desafios'
                    ? 'bg-black/30 text-white'
                    : 'bg-cyan-500/20 text-cyan-300'
                }`}>
                  {historico.filter((h) => h.aluno_id === activeAluno.id).length}
                </span>
              </button>

              <button
                type="button"
                id="tab-visao-completa"
                onClick={() => setMainSectionTab('tudo')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  mainSectionTab === 'tudo'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="h-4 w-4" />
                <span className="hidden sm:inline">Visão Completa</span>
              </button>
            </div>

            <div className="text-xs text-slate-400">
              Visualizando dados de: <strong className="text-cyan-300">{activeAluno.nome}</strong>
            </div>
          </div>

          {/* Section 1: Evolution Photos & Before / After */}
          {(mainSectionTab === 'fotos' || mainSectionTab === 'tudo') && (
            <EvolucaoFotosSection
              aluno={activeAluno}
              fotos={fotos}
              onAddFoto={onAddFoto}
              onDeleteFoto={onDeleteFoto}
              onSendWhatsAppCelebration={(texto) => {
                if (onSendCelebrationMessage) {
                  onSendCelebrationMessage(activeAluno.id, texto);
                }
              }}
            />
          )}

          {/* Section 2: Bioimpedance Graph + Quick Entry + Table */}
          {(mainSectionTab === 'bioimpedancia' || mainSectionTab === 'tudo') && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Recharts Evolution Graph (Col-span 7) */}
                <div className="lg:col-span-7 xl:col-span-7 flex flex-col">
                  <EvolucaoGrafico
                    avaliacoes={alunoAvaliacoes}
                    alunoNome={activeAluno.nome}
                  />
                </div>

                {/* Right: Quick Mobile-friendly Form (Col-span 5) */}
                <div className="lg:col-span-5 xl:col-span-5 flex flex-col">
                  <BioimpedanciaForm
                    key={activeAluno.id}
                    alunoId={activeAluno.id}
                    alunoNome={activeAluno.nome}
                    alunoAlturaPadrao={activeAluno.altura_cm}
                    ultimaAvaliacao={ultimaAvaliacao}
                    onSaveAvaliacao={handleSaveNovaAvaliacao}
                  />
                </div>
              </div>

              {/* Historical Table of Assessments */}
              <HistoricoAvaliacoes
                avaliacoes={alunoAvaliacoes}
                onDeleteAvaliacao={handleDeleteAvaliacao}
              />
            </>
          )}

          {/* Section 3: Challenge History & Repetition Control */}
          {(mainSectionTab === 'desafios' || mainSectionTab === 'tudo') && (
            <HistoricoDesafiosAluno
              aluno={activeAluno}
              historico={historico}
              onOpenNewChallengeForAluno={() => setIsChallengeModalOpen(true)}
              onReenviarDesafio={onReenviarDesafio}
            />
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-emerald-500/20 bg-[#032019] p-8 text-center">
          <p className="text-slate-300 font-semibold mb-3">Nenhum aluno encontrado.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-2 text-xs font-bold text-slate-950"
          >
            <UserPlus className="h-4 w-4" />
            Cadastrar Primeiro Aluno
          </button>
        </div>
      )}

      {/* Modal for Direct Challenge Trigger */}
      {syntheticAlert && (
        <SendChallengeModal
          isOpen={isChallengeModalOpen}
          onClose={() => setIsChallengeModalOpen(false)}
          alerta={syntheticAlert}
          aluno={activeAluno}
          templates={templates}
          historico={historico}
          onChallengeSent={(alertaId, template, msg) => {
            onSendChallengeDirect(alertaId, template, msg);
            setIsChallengeModalOpen(false);
          }}
          onOpenVoiceModalForAluno={onOpenVoiceModalForAluno}
        />
      )}

      {/* Modal para Adicionar Novo Aluno (Simples, Fácil e Rápido) */}
      <AlunoFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
        onSave={handleSaveCreate}
      />

      {/* Modal para Editar Aluno Cadastrado */}
      <AlunoFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        mode="edit"
        alunoToEdit={alunoToEdit}
        onSave={handleSaveEdit}
      />
    </div>
  );
};
