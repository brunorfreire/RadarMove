import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  ExternalLink, 
  User, 
  Users, 
  Sparkles, 
  Check, 
  AlertTriangle, 
  Search, 
  MessageSquare, 
  Clock, 
  Phone, 
  Calendar,
  CheckCircle2,
  ChevronRight,
  History,
  ShieldCheck,
  RefreshCw,
  Info
} from 'lucide-react';
import { Aluno, DesafioTemplate, DesafioEnviado } from '../../types';
import { verificarDesafioRepetido, formatDataAmigavel } from '../../lib/historicoDesafiosUtils';
import { formatPhoneDisplay, formatWhatsAppNumber, isValidWhatsAppNumber } from '../../lib/whatsappUtils';
import { salvarHistoricoDesafioSupabase } from '../../lib/historicoDesafiosService';

interface DispararDesafioModalProps {
  isOpen: boolean;
  onClose: () => void;
  desafio: DesafioTemplate | null;
  alunos: Aluno[];
  historico?: DesafioEnviado[];
  onDisparoConcluido: (
    alunoIds: string[], 
    desafio: DesafioTemplate, 
    customMessage: string, 
    abrirWhatsAppWeb: boolean
  ) => void;
  onAbrirAgendamento?: (desafio: DesafioTemplate, aluno?: Aluno) => void;
}

export const DispararDesafioModal: React.FC<DispararDesafioModalProps> = ({
  isOpen,
  onClose,
  desafio,
  alunos,
  historico = [],
  onDisparoConcluido,
  onAbrirAgendamento,
}) => {
  if (!isOpen || !desafio) return null;

  const [mode, setMode] = useState<'individual' | 'massa'>('individual');
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>(alunos[0]?.id || '');
  const [selectedMassaIds, setSelectedMassaIds] = useState<string[]>(
    alunos.filter(a => a.status === 'em_risco').map(a => a.id)
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [customMessage, setCustomMessage] = useState(desafio.mensagem_whatsapp);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSavingSupabase, setIsSavingSupabase] = useState(false);

  // Controle de disparos nativos já realizados na lista em lote durante a sessão
  const [alunosEnviadosSet, setAlunosEnviadosSet] = useState<Set<string>>(new Set());

  // Atualiza a mensagem ao trocar o template
  useEffect(() => {
    if (desafio) {
      setCustomMessage(desafio.mensagem_whatsapp);
    }
  }, [desafio]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const selectedAluno = alunos.find((a) => a.id === selectedAlunoId) || alunos[0] || {
    id: 'placeholder',
    nome: 'Aluno Exemplo',
    telefone: '11999999999',
    status: 'ativo' as const,
  };

  // Verifica repetição no histórico (seja por ID ou por título)
  const repeticaoIndividual = verificarDesafioRepetido(
    historico,
    selectedAluno.id,
    desafio.id,
    desafio.titulo
  );

  const handleSelectApenasIneditos = () => {
    const ineditosIds = alunos
      .filter(a => !verificarDesafioRepetido(historico, a.id, desafio.id, desafio.titulo).repetido)
      .map(a => a.id);
    setSelectedMassaIds(ineditosIds);
  };

  // Substitui dinamicamente {aluno_nome} e {treinador_nome}
  const getPreviewText = (templateText: string, alunoNome: string) => {
    const firstName = alunoNome ? alunoNome.split(' ')[0] : 'Aluno';
    return templateText
      .replace(/\{aluno_nome\}|\{aluno\}/g, firstName)
      .replace(/\{treinador_nome\}|\{personal\}/g, 'Treinador');
  };

  const handleToggleMassaAluno = (id: string) => {
    setSelectedMassaIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllEmRisco = () => {
    const emRiscoIds = alunos.filter(a => a.status === 'em_risco').map(a => a.id);
    setSelectedMassaIds(emRiscoIds);
  };

  const handleSelectAllAtivos = () => {
    setSelectedMassaIds(alunos.map(a => a.id));
  };

  // Disparo Individual Nativo: Salva no Supabase e abre o WhatsApp wa.me
  const handleDispararIndividualNativo = async () => {
    if (!selectedAluno.telefone) {
      showToast('O aluno selecionado não possui telefone cadastrado.');
      return;
    }

    const clean = formatWhatsAppNumber(selectedAluno.telefone);
    if (!isValidWhatsAppNumber(clean)) {
      showToast('Telefone inválido ou sem DDD. Atualize o cadastro do aluno.');
      return;
    }

    const personalizedText = getPreviewText(customMessage, selectedAluno.nome);
    const waUrl = `https://wa.me/${clean}?text=${encodeURIComponent(personalizedText)}`;

    // 1. Abre a aba do wa.me nativamente
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    // 2. Persiste imediatamente no Supabase (tabela historico_desafios com personal_id)
    setIsSavingSupabase(true);
    try {
      await salvarHistoricoDesafioSupabase({
        alunoId: selectedAluno.id,
        alunoNome: selectedAluno.nome,
        desafioId: desafio.id,
        desafioTitulo: desafio.titulo,
        categoria: desafio.categoria,
        dificuldade: desafio.dificuldade,
        tempoEstimado: desafio.tempo_estimado,
        mensagemEnviada: personalizedText,
      });
    } catch (err) {
      console.warn('[DispararDesafioModal] Erro ao persistir historico_desafios:', err);
    } finally {
      setIsSavingSupabase(false);
    }

    // 3. Atualiza estado global do app e fecha modal
    onDisparoConcluido([selectedAluno.id], desafio, customMessage, false);
    showToast(`WhatsApp aberto e histórico registrado no Supabase para ${selectedAluno.nome.split(' ')[0]}!`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  // Disparo Individual para cada item da lista em Lote
  const handleDispararAlunoDaFila = async (alunoItem: Aluno) => {
    const clean = formatWhatsAppNumber(alunoItem.telefone);
    if (!isValidWhatsAppNumber(clean)) {
      showToast(`Telefone de ${alunoItem.nome} está sem DDD ou incompleto.`);
      return;
    }

    const personalizedText = getPreviewText(customMessage, alunoItem.nome);
    const waUrl = `https://wa.me/${clean}?text=${encodeURIComponent(personalizedText)}`;

    // Abre wa.me
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    // Salva no Supabase
    salvarHistoricoDesafioSupabase({
      alunoId: alunoItem.id,
      alunoNome: alunoItem.nome,
      desafioId: desafio.id,
      desafioTitulo: desafio.titulo,
      categoria: desafio.categoria,
      dificuldade: desafio.dificuldade,
      tempoEstimado: desafio.tempo_estimado,
      mensagemEnviada: personalizedText,
    });

    setAlunosEnviadosSet(prev => new Set(prev).add(alunoItem.id));
    onDisparoConcluido([alunoItem.id], desafio, customMessage, false);
    showToast(`WhatsApp aberto para ${alunoItem.nome.split(' ')[0]}!`);
  };

  // Salvar no histórico sem abrir WhatsApp (ex: quando o personal já mandou manualmente)
  const handleApenasRegistrar = async () => {
    setIsSavingSupabase(true);
    const personalizedText = getPreviewText(customMessage, selectedAluno.nome);
    try {
      await salvarHistoricoDesafioSupabase({
        alunoId: selectedAluno.id,
        alunoNome: selectedAluno.nome,
        desafioId: desafio.id,
        desafioTitulo: desafio.titulo,
        categoria: desafio.categoria,
        dificuldade: desafio.dificuldade,
        tempoEstimado: desafio.tempo_estimado,
        mensagemEnviada: personalizedText,
      });
    } finally {
      setIsSavingSupabase(false);
    }

    onDisparoConcluido([selectedAluno.id], desafio, customMessage, false);
    showToast('Desafio registrado no histórico do Supabase!');
    setTimeout(() => onClose(), 1000);
  };

  // Marcar todos os selecionados em lote como registrados no histórico
  const handleRegistrarHistoricoLote = async () => {
    if (selectedMassaIds.length === 0) return;

    for (const aId of selectedMassaIds) {
      const a = alunos.find(x => x.id === aId);
      if (a) {
        salvarHistoricoDesafioSupabase({
          alunoId: a.id,
          alunoNome: a.nome,
          desafioId: desafio.id,
          desafioTitulo: desafio.titulo,
          categoria: desafio.categoria,
          dificuldade: desafio.dificuldade,
          tempoEstimado: desafio.tempo_estimado,
          mensagemEnviada: getPreviewText(customMessage, a.nome),
        });
      }
    }

    onDisparoConcluido(selectedMassaIds, desafio, customMessage, false);
    showToast(`${selectedMassaIds.length} desafios registrados no histórico com sucesso!`);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div 
      id="modal-disparar-desafio-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div 
        id="modal-disparar-desafio" 
        className="w-full max-w-2xl rounded-3xl border border-emerald-500/30 bg-[#032019] shadow-2xl backdrop-blur-2xl relative flex flex-col max-h-[92vh] overflow-hidden text-slate-100"
      >
        {/* Glow ambient background */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-emerald-500/10 blur-3xl" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-emerald-500/20 px-5 sm:px-6 py-4 bg-[#021813]/90 flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">Disparar Micro-Desafio</h3>
                <span className="rounded bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/30">
                  wa.me + Supabase RLS
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-md">
                Desafio: <span className="text-slate-200 font-semibold">{desafio.titulo}</span> ({desafio.categoria})
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-fechar-disparar-desafio"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-[#021813] text-slate-400 hover:text-white hover:border-emerald-500/50 transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Seletor de Modo: Individual vs Em Lote */}
          <div className="flex items-center justify-between bg-[#01140f] p-1.5 rounded-2xl border border-emerald-500/20">
            <button
              type="button"
              onClick={() => setMode('individual')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'individual'
                  ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Envio Individual</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('massa')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'massa'
                  ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Envio em Lote / Fila ({selectedMassaIds.length} selecionados)</span>
            </button>
          </div>

          {/* MODO INDIVIDUAL */}
          {mode === 'individual' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Selecione o Aluno:
                  </label>
                  {repeticaoIndividual.repetido ? (
                    <span className="flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                      <History className="h-3 w-3" />
                      Já enviado em {repeticaoIndividual.ultimoEnvio?.data_formatada || formatDataAmigavel(repeticaoIndividual.ultimoEnvio?.data_envio || '')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <ShieldCheck className="h-3 w-3" />
                      Desafio Inédito para este Aluno
                    </span>
                  )}
                </div>

                <select
                  value={selectedAlunoId}
                  onChange={(e) => setSelectedAlunoId(e.target.value)}
                  className="w-full rounded-xl border border-emerald-500/30 bg-[#01140f] px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-cyan-400 focus:outline-none transition-all cursor-pointer"
                >
                  {alunos.map((a) => {
                    const checkRepetido = verificarDesafioRepetido(historico, a.id, desafio.id, desafio.titulo);
                    return (
                      <option key={a.id} value={a.id}>
                        {a.nome} {checkRepetido.repetido ? `[Enviado ${checkRepetido.totalEnvios}x]` : '[Inédito]'} - {formatPhoneDisplay(a.telefone)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Alerta Visual de Repetição Amigável */}
              {repeticaoIndividual.repetido && (
                <div className="rounded-2xl border border-amber-500/35 bg-gradient-to-r from-amber-500/15 via-amber-950/20 to-transparent p-4 flex items-start gap-3.5 text-xs text-amber-200 shadow-md">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-amber-100 text-sm">Aviso de Desafio Repetido</p>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/30 text-amber-200 font-bold text-[10px]">
                        {repeticaoIndividual.totalEnvios} {repeticaoIndividual.totalEnvios === 1 ? 'envio anterior' : 'envios anteriores'}
                      </span>
                    </div>
                    <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                      {selectedAluno.nome.split(' ')[0]} já recebeu este mesmo desafio em <strong>{repeticaoIndividual.ultimoEnvio?.data_formatada || formatDataAmigavel(repeticaoIndividual.ultimoEnvio?.data_envio || '')}</strong>.
                    </p>
                    <p className="text-[11px] text-amber-300/80 mt-1">
                      💡 <em>Dica:</em> Você pode reenviar caso o objetivo do aluno seja reforçar o hábito, ou selecionar outro micro-desafio inédito para manter a novidade.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODO EM LOTE / FILA NATIVA */}
          {mode === 'massa' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Selecione os Alunos para a Fila de Disparo:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAllEmRisco}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all font-semibold cursor-pointer"
                  >
                    Apenas Em Risco
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectApenasIneditos}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all font-semibold cursor-pointer"
                  >
                    Apenas Inéditos
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectAllAtivos}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all font-semibold cursor-pointer"
                  >
                    Todos ({alunos.length})
                  </button>
                </div>
              </div>

              {/* Lista Selecionável */}
              <div className="max-h-48 overflow-y-auto rounded-2xl border border-emerald-500/20 bg-[#01140f] p-2 space-y-1 divide-y divide-white/5">
                {alunos.map((aluno) => {
                  const isChecked = selectedMassaIds.includes(aluno.id);
                  const isSentInSession = alunosEnviadosSet.has(aluno.id);
                  const checkRepetido = verificarDesafioRepetido(historico, aluno.id, desafio.id, desafio.titulo);

                  return (
                    <div
                      key={aluno.id}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs transition-all ${
                        isChecked ? 'bg-emerald-500/10 text-white' : 'text-slate-400'
                      }`}
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleMassaAluno(aluno.id)}
                          className="h-4 w-4 rounded border-emerald-500/40 text-emerald-500 focus:ring-0 bg-[#021813] cursor-pointer"
                        />
                        <div className="min-w-0 truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold truncate">{aluno.nome}</span>
                            {checkRepetido.repetido && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold shrink-0">
                                Repetido ({checkRepetido.totalEnvios}x)
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {formatPhoneDisplay(aluno.telefone)}
                          </p>
                        </div>
                      </label>

                      {/* Botão de Envio 1-Clique Nativo para este aluno */}
                      {isChecked && (
                        <button
                          type="button"
                          onClick={() => handleDispararAlunoDaFila(aluno)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-sm ${
                            isSentInSession
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 active:scale-95'
                          }`}
                        >
                          {isSentInSession ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              <span>Enviado</span>
                            </>
                          ) : (
                            <>
                              <span>Abrir wa.me</span>
                              <ChevronRight className="h-3 w-3" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-cyan-400 shrink-0" />
                <span>
                  O navegador abre o WhatsApp apenas no clique direto. Cada envio grava automaticamente o evento no Supabase.
                </span>
              </p>
            </div>
          )}

          {/* Campo da Mensagem */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                Mensagem a Ser Disparada:
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {customMessage.length} caracteres
              </span>
            </div>

            <textarea
              rows={3}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full rounded-2xl border border-emerald-500/30 bg-[#01140f] p-3 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Prévia da Mensagem */}
          <div className="rounded-2xl border border-emerald-500/20 bg-[#011611] p-3 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Prévia com Nome Dinâmico ({mode === 'individual' ? selectedAluno.nome.split(' ')[0] : 'Nome do Aluno'}):
            </span>
            <p className="text-xs text-slate-200 italic font-sans leading-relaxed">
              &quot;{getPreviewText(customMessage, mode === 'individual' ? selectedAluno.nome : 'Lucas')}&quot;
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-emerald-500/20 bg-[#021813]/90 px-5 sm:px-6 py-4 flex-shrink-0 z-10">
          <div className="flex items-center gap-2">
            {onAbrirAgendamento && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAbrirAgendamento(desafio, mode === 'individual' ? selectedAluno : undefined);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-cyan-500/30 bg-cyan-950/30 text-xs font-bold text-cyan-300 hover:bg-cyan-900/40 transition-all cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                <span>Agendar Desafio</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {mode === 'individual' ? (
              <>
                <button
                  type="button"
                  onClick={handleApenasRegistrar}
                  disabled={isSavingSupabase}
                  className="px-3.5 py-2.5 rounded-xl border border-emerald-500/30 bg-[#021813] text-xs font-bold text-emerald-300 hover:bg-[#03241c] hover:border-emerald-400 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  Apenas Registrar
                </button>

                <button
                  type="button"
                  id="btn-disparar-whatsapp-individual-nativo"
                  onClick={handleDispararIndividualNativo}
                  disabled={isSavingSupabase}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg active:scale-95 transition-all cursor-pointer ${
                    repeticaoIndividual.repetido
                      ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 shadow-amber-500/20 hover:brightness-110'
                      : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-emerald-500/30 hover:brightness-110'
                  }`}
                >
                  <Send className="h-4 w-4" />
                  <span>
                    {repeticaoIndividual.repetido
                      ? `Reenviar via WhatsApp (${selectedAluno.nome.split(' ')[0]})`
                      : `Abrir WhatsApp (${selectedAluno.nome.split(' ')[0]})`}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleRegistrarHistoricoLote}
                disabled={selectedMassaIds.length === 0}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Salvar Histórico no Supabase ({selectedMassaIds.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-[#021813] px-4 py-3 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <Check className="h-3 w-3 stroke-[3]" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
