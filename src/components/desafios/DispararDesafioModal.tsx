import React, { useState } from 'react';
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
  Calendar
} from 'lucide-react';
import { Aluno, DesafioTemplate, WhatsAppMensagem, DesafioEnviado } from '../../types';
import { verificarDesafioRepetido } from '../../lib/historicoDesafiosUtils';
import { formatPhoneDisplay } from '../../lib/whatsappUtils';

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
  const [sentSuccess, setSentSuccess] = useState(false);

  const selectedAluno = alunos.find(a => a.id === selectedAlunoId) || alunos[0];

  const repeticaoIndividual = verificarDesafioRepetido(
    historico,
    selectedAluno?.id || '',
    desafio.id,
    desafio.titulo
  );

  const alunosRepetidosMassa = alunos.filter(a => {
    if (!selectedMassaIds.includes(a.id)) return false;
    return verificarDesafioRepetido(historico, a.id, desafio.id, desafio.titulo).repetido;
  });

  const handleSelectApenasIneditos = () => {
    const ineditosIds = alunos
      .filter(a => !verificarDesafioRepetido(historico, a.id, desafio.id, desafio.titulo).repetido)
      .map(a => a.id);
    setSelectedMassaIds(ineditosIds);
  };

  // Helper to replace {aluno} placeholder with the actual student first name
  const getPreviewText = (templateText: string, alunoNome: string) => {
    const firstName = alunoNome ? alunoNome.split(' ')[0] : 'Aluno';
    return templateText.replace(/\{aluno\}/g, firstName).replace(/\{personal\}/g, 'Personal');
  };

  const filteredAlunos = alunos.filter(a => 
    a.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleSend = (abrirWhatsAppWeb: boolean) => {
    const targetIds = mode === 'individual' ? [selectedAluno.id] : selectedMassaIds;
    if (targetIds.length === 0) return;

    onDisparoConcluido(targetIds, desafio, customMessage, abrirWhatsAppWeb);
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div 
      id="modal-disparar-desafio-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div 
        id="modal-disparar-desafio" 
        className="w-full max-w-2xl rounded-2xl border border-emerald-500/30 bg-[#032019] shadow-2xl backdrop-blur-2xl relative flex flex-col max-h-[92vh] overflow-hidden text-slate-100"
      >
        {/* Glow ambient background */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-emerald-500/10 blur-3xl" />

        {/* Modal Header (Fixed at top) */}
        <div className="flex items-center justify-between border-b border-emerald-500/20 px-5 sm:px-6 py-4 bg-[#021813]/90 flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Disparar: {desafio.titulo}
              </h3>
              <p className="text-xs text-slate-400">
                Categoria: <span className="text-cyan-300 font-semibold">{desafio.categoria}</span> • {desafio.dificuldade}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-2 p-1 bg-[#021510] rounded-xl border border-emerald-500/20">
            <button
              type="button"
              onClick={() => setMode('individual')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'individual'
                  ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              Disparo Individual (1 Aluno)
            </button>
            <button
              type="button"
              onClick={() => setMode('massa')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'massa'
                  ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Disparo em Massa / Transmissão
            </button>
          </div>

          {/* Target Selection */}
          {mode === 'individual' ? (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Selecione o Aluno de Destino:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                {alunos.map((a) => {
                  const isSelected = a.id === selectedAluno?.id;
                  const st = verificarDesafioRepetido(historico, a.id, desafio.id, desafio.titulo);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelectedAlunoId(a.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'border-2 border-cyan-400 bg-cyan-400/15 text-white font-bold shadow-sm'
                          : 'border border-emerald-500/20 bg-[#021813] text-slate-300 hover:border-emerald-500/40'
                      }`}
                    >
                      <div className="relative h-6 w-6 rounded-md overflow-hidden bg-emerald-950 flex-shrink-0">
                        {a.avatar_url ? (
                          <img src={a.avatar_url} alt={a.nome} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-cyan-300">
                            {a.nome.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="truncate flex-1">
                        <div className="truncate">{a.nome}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {st.repetido ? (
                            <span className="text-[9px] text-amber-300 font-bold bg-amber-400/15 px-1 rounded">
                              ⚠️ Já enviado ({st.totalEnvios}x)
                            </span>
                          ) : (
                            <span className="text-[9px] text-emerald-400 font-medium">
                              ✓ Inédito
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Status Warning for Individual Selected Student */}
              {repeticaoIndividual.repetido ? (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-2.5 flex items-start gap-2.5 text-amber-200 animate-in fade-in">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold text-amber-300">
                      Atenção: Desafio Já Enviado para {selectedAluno.nome.split(' ')[0]} ({repeticaoIndividual.totalEnvios}x no histórico)
                    </span>
                    <p className="text-[11px] text-amber-200/90 mt-0.5">
                      Último envio em {repeticaoIndividual.ultimoEnvio?.data_formatada || 'data anterior'} ({repeticaoIndividual.diasDesdeUltimoEnvio === 0 ? 'hoje' : `há ${repeticaoIndividual.diasDesdeUltimoEnvio} dia(s)`}). Você pode reenviar para reforçar ou selecionar outro aluno/desafio.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-2 text-xs text-emerald-300 flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Desafio inédito para {selectedAluno.nome.split(' ')[0]} (nunca enviado anteriormente).</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Selecione os Alunos ({selectedMassaIds.length} selecionados):
                </label>
                <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
                  <button
                    type="button"
                    onClick={handleSelectApenasIneditos}
                    className="text-emerald-400 hover:underline font-semibold cursor-pointer"
                  >
                    Apenas inéditos
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={handleSelectAllEmRisco}
                    className="text-rose-400 hover:underline font-semibold cursor-pointer"
                  >
                    Todos em risco
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={handleSelectAllAtivos}
                    className="text-cyan-300 hover:underline font-semibold cursor-pointer"
                  >
                    Selecionar todos
                  </button>
                </div>
              </div>

              {/* Repetition Warning in Mass Mode */}
              {alunosRepetidosMassa.length > 0 && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300">
                      {alunosRepetidosMassa.length} dos {selectedMassaIds.length} selecionados já receberam este desafio:
                    </span>
                    <p className="text-[11px] text-amber-200/90 mt-0.5">
                      {alunosRepetidosMassa.map(a => a.nome.split(' ')[0]).join(', ')}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                {alunos.map((a) => {
                  const isSelected = selectedMassaIds.includes(a.id);
                  const st = verificarDesafioRepetido(historico, a.id, desafio.id, desafio.titulo);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handleToggleMassaAluno(a.id)}
                      className={`flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'border-2 border-emerald-400 bg-emerald-500/15 text-white font-bold'
                          : 'border border-emerald-500/20 bg-[#021813] text-slate-400 hover:border-emerald-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="h-6 w-6 rounded-md overflow-hidden bg-emerald-950 flex-shrink-0">
                          {a.avatar_url ? (
                            <img src={a.avatar_url} alt={a.nome} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-cyan-300">
                              {a.nome.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="truncate">
                          <span className="truncate block">{a.nome.split(' ')[0]}</span>
                          {st.repetido && (
                            <span className="text-[9px] text-amber-300 font-bold block">
                              ⚠️ Já recebeu
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Message Editor with Tag Replacement */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
                Editar Mensagem antes de enviar:
              </label>
              <span className="text-[10px] text-slate-400">
                Use <code className="text-cyan-300 font-mono">{'{aluno}'}</code> para personalizar
              </span>
            </div>

            <textarea
              rows={3}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full rounded-xl border border-emerald-500/25 bg-[#02140f] p-3 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none resize-none"
            />
          </div>

          {/* WhatsApp Preview Bubble */}
          <div className="rounded-xl border border-emerald-500/20 bg-[#021611] p-3 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-500 pb-1 border-b border-white/5">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Prévia real que {mode === 'individual' ? selectedAluno.nome.split(' ')[0] : 'o aluno'} receberá:
              </span>
              <span>WhatsApp Web</span>
            </div>
            <p className="text-xs text-slate-200 pt-1 italic whitespace-pre-wrap font-sans">
              "{getPreviewText(customMessage, mode === 'individual' ? selectedAluno.nome : 'João')}"
            </p>
          </div>
        </div>

        {/* ALWAYS VISIBLE / STICKY ACTION FOOTER (PINNED AT THE BOTTOM) */}
        <div 
          id="modal-disparar-desafio-footer" 
          className="px-5 sm:px-6 py-3.5 border-t border-emerald-500/30 bg-[#02140f] flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl z-20"
        >
          {/* Recipient status info */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {sentSuccess ? (
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs animate-in fade-in">
                <Check className="h-4 w-4" />
                <span>Desafio disparado com sucesso!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                {mode === 'individual' ? (
                  <span className="truncate">
                    Destinatário: <strong className="text-white">{selectedAluno.nome}</strong> ({formatPhoneDisplay(selectedAluno.telefone)})
                  </span>
                ) : (
                  <span>
                    Destino: <strong className="text-cyan-300">{selectedMassaIds.length} alunos</strong> selecionados
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action buttons (Always clearly visible and prominent) */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              id="btn-cancelar-disparo"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Cancelar
            </button>

            {onAbrirAgendamento && (
              <button
                type="button"
                id="btn-abrir-agendamento-modal"
                onClick={() => {
                  onClose();
                  onAbrirAgendamento(desafio, selectedAluno);
                }}
                title="Programar data e hora para disparo automático via WhatsApp"
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400 active:scale-95 transition-all cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Agendar Envio</span>
              </button>
            )}

            {mode === 'individual' ? (
              <>
                <button
                  type="button"
                  id="btn-registrar-apenas"
                  onClick={() => handleSend(false)}
                  title="Salva o envio no histórico do aluno sem abrir o WhatsApp Web"
                  className="px-3.5 py-2.5 rounded-xl border border-emerald-500/30 bg-[#021813] text-xs font-bold text-emerald-300 hover:bg-[#03241c] hover:border-emerald-400 active:scale-95 transition-all cursor-pointer"
                >
                  Registrar no Sistema
                </button>

                <button
                  type="button"
                  id="btn-enviar-whatsapp-direto"
                  onClick={() => handleSend(true)}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg active:scale-95 transition-all cursor-pointer ${
                    repeticaoIndividual.repetido
                      ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 shadow-amber-500/20 hover:brightness-110'
                      : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-emerald-500/30 hover:brightness-110'
                  }`}
                >
                  <Send className="h-4 w-4 text-slate-950 fill-slate-950" />
                  <span>
                    {repeticaoIndividual.repetido
                      ? `Reenviar via WhatsApp (${selectedAluno.nome.split(' ')[0]})`
                      : `Enviar via WhatsApp (${selectedAluno.nome.split(' ')[0]})`}
                  </span>
                </button>
              </>
            ) : (
              <button
                type="button"
                id="btn-disparar-em-massa"
                onClick={() => handleSend(false)}
                disabled={selectedMassaIds.length === 0}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 px-6 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 text-slate-950 fill-slate-950" />
                <span>Disparar para {selectedMassaIds.length} Alunos</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
