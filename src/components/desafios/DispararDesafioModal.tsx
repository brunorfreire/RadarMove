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
  Info,
  Lock,
  Loader2,
  ImageIcon,
  Eye,
  CheckCheck,
  Smartphone
} from 'lucide-react';
import { Aluno, DesafioTemplate, DesafioEnviado, DesafioImagem } from '../../types';
import { verificarDesafioRepetido, formatDataAmigavel } from '../../lib/historicoDesafiosUtils';
import { formatPhoneDisplay, formatWhatsAppNumber, isValidWhatsAppNumber, openWhatsApp } from '../../lib/whatsappUtils';
import { salvarHistoricoDesafioSupabase, travarEnvio, liberarTravaEnvio } from '../../lib/historicoDesafiosService';
import { obterImagensDesafio } from '../../lib/pocketChallengesImagesService';
import { DesafioImagemViewer } from './DesafioImagemViewer';

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
  const [isProcessingDelivery, setIsProcessingDelivery] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<'pendente' | 'processando' | 'aceito' | 'enviado' | 'falhou'>('pendente');
  const [imagensDemonstrativas, setImagensDemonstrativas] = useState<DesafioImagem[]>(desafio.imagens || []);
  const [mostrarPreviaConjunta, setMostrarPreviaConjunta] = useState(false);
  const [feedbackStatusEnvio, setFeedbackStatusEnvio] = useState<{
    status: 'aceito' | 'pendente' | 'falhou';
    titulo: string;
    msg: string;
  } | null>(null);

  // Controle de disparos nativos já realizados na lista em lote durante a sessão
  const [alunosEnviadosSet, setAlunosEnviadosSet] = useState<Set<string>>(new Set());

  // Atualiza mensagem e busca imagens associadas
  useEffect(() => {
    let isMounted = true;
    if (desafio) {
      const currentDesafio = desafio;
      setCustomMessage(currentDesafio.mensagem_whatsapp);
      setDeliveryStatus('pendente');
      setFeedbackStatusEnvio(null);

      async function carregarImagens() {
        if (currentDesafio.imagens && currentDesafio.imagens.length > 0) {
          setImagensDemonstrativas(currentDesafio.imagens);
          return;
        }
        const imgs = await obterImagensDesafio(currentDesafio.id, currentDesafio.titulo);
        if (isMounted && imgs && imgs.length > 0) {
          setImagensDemonstrativas(imgs);
        }
      }
      carregarImagens();
    }
    return () => { isMounted = false; };
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

  // Verificação estrita de bloqueio contra reenvio
  const repeticaoIndividual = verificarDesafioRepetido(
    historico,
    selectedAluno.id,
    desafio.id,
    desafio.titulo
  );

  const jaEnviado = repeticaoIndividual.repetido;

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

  // Disparo Individual com Bloqueio, Proteção contra Duplo Clique e Rastreio
  const handleDispararIndividual = async () => {
    if (jaEnviado) {
      showToast(`Este desafio já foi enviado para ${selectedAluno.nome.split(' ')[0]} em ${repeticaoIndividual.dataEnvioFormatada}. Reenvio bloqueado.`);
      return;
    }

    if (!selectedAluno.telefone) {
      showToast('O aluno selecionado não possui telefone cadastrado.');
      return;
    }

    const clean = formatWhatsAppNumber(selectedAluno.telefone);
    if (!isValidWhatsAppNumber(clean)) {
      showToast('Telefone inválido ou sem DDD. Atualize o cadastro do aluno.');
      return;
    }

    // Trava contra cliques repetidos / requisições simultâneas
    const travado = travarEnvio(selectedAluno.id, desafio.id);
    if (!travado) {
      showToast('Envio já em andamento. Aguarde...');
      return;
    }

    setIsProcessingDelivery(true);
    setDeliveryStatus('processando');
    setFeedbackStatusEnvio(null);

    const personalizedText = getPreviewText(customMessage, selectedAluno.nome);
    const mediaUrl = imagensDemonstrativas[0]?.url;

    try {
      // 1. Tenta envio pelo provedor (Node.js Express / WhatsApp Gateway)
      let providerConfirmed = false;
      let providerMessageId = '';

      try {
        const response = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: clean,
            message: personalizedText,
            mediaUrl: mediaUrl,
            imageUrl: mediaUrl,
          }),
        });

        const data = await response.json();
        if (response.ok && data.success) {
          providerConfirmed = true;
          providerMessageId = data.messageId || `prov-${Date.now()}`;
          setDeliveryStatus('aceito');
          setFeedbackStatusEnvio({
            status: 'aceito',
            titulo: 'Desafio Aceito pelo Provedor',
            msg: `O WhatsApp Gateway confirmou a aceitação do disparo para ${selectedAluno.nome}. A entrega e imagens estão registradas.`,
          });
        }
      } catch (fetchErr) {
        // Gateway indisponível ou offline -> recurso manual sem mascarar status
      }

      // 2. Se o provedor não aceitou automaticamente, aciona abertura manual
      // NUNCA marcar como "enviado", e sim como "pendente" (ação manual requerida)
      if (!providerConfirmed) {
        openWhatsApp(clean, personalizedText);
        setDeliveryStatus('pendente');
        setFeedbackStatusEnvio({
          status: 'pendente',
          titulo: 'WhatsApp Web Aberto (Ação Manual)',
          msg: `A janela do WhatsApp foi aberta. Ação manual necessária no aplicativo para envio definitivo do texto e anexação da imagem demonstrativa.`,
        });
      }

      // 3. Persistência mandatória no Supabase (student_challenge_deliveries / historico_desafios)
      await salvarHistoricoDesafioSupabase({
        alunoId: selectedAluno.id,
        alunoNome: selectedAluno.nome,
        desafioId: desafio.id,
        desafioTitulo: desafio.titulo,
        categoria: desafio.categoria,
        dificuldade: desafio.dificuldade,
        tempoEstimado: desafio.tempo_estimado,
        mensagemEnviada: personalizedText,
        imagensUrls: imagensDemonstrativas.map(i => i.url),
        numeroDestino: clean,
        providerMessageId: providerMessageId || undefined,
        statusEnvio: providerConfirmed ? 'aceito' : 'pendente',
        origemEnvio: 'individual',
      });

      onDisparoConcluido([selectedAluno.id], desafio, customMessage, false);
      showToast(`Desafio registrado e bloqueado para ${selectedAluno.nome.split(' ')[0]}!`);
      
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      setDeliveryStatus('falhou');
      setFeedbackStatusEnvio({
        status: 'falhou',
        titulo: 'Falha no Disparo',
        msg: `Ocorreu um erro ao processar o envio: ${err.message || 'Erro de rede'}. Tente novamente.`,
      });
      showToast(`Falha no envio: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsProcessingDelivery(false);
      liberarTravaEnvio(selectedAluno.id, desafio.id);
    }
  };

  // Disparo Individual para cada item da lista em Lote
  const handleDispararAlunoDaFila = async (alunoItem: Aluno) => {
    const checkRep = verificarDesafioRepetido(historico, alunoItem.id, desafio.id, desafio.titulo);
    if (checkRep.repetido) {
      showToast(`Desafio já enviado anteriormente para ${alunoItem.nome}.`);
      return;
    }

    const clean = formatWhatsAppNumber(alunoItem.telefone);
    const personalizedText = getPreviewText(customMessage, alunoItem.nome);
    const mediaUrl = imagensDemonstrativas[0]?.url;

    const travado = travarEnvio(alunoItem.id, desafio.id);
    if (!travado) return;

    try {
      let providerConfirmed = false;
      let providerMessageId = '';

      try {
        const response = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: clean,
            message: personalizedText,
            mediaUrl: mediaUrl,
            imageUrl: mediaUrl,
          }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          providerConfirmed = true;
          providerMessageId = data.messageId || `prov-${Date.now()}`;
        }
      } catch (e) {
        // fallback
      }

      if (!providerConfirmed) {
        openWhatsApp(clean, personalizedText);
      }

      await salvarHistoricoDesafioSupabase({
        alunoId: alunoItem.id,
        alunoNome: alunoItem.nome,
        desafioId: desafio.id,
        desafioTitulo: desafio.titulo,
        categoria: desafio.categoria,
        dificuldade: desafio.dificuldade,
        tempoEstimado: desafio.tempo_estimado,
        mensagemEnviada: personalizedText,
        imagensUrls: imagensDemonstrativas.map(i => i.url),
        numeroDestino: clean,
        providerMessageId: providerMessageId || undefined,
        statusEnvio: providerConfirmed ? 'aceito' : 'pendente',
        origemEnvio: 'massa',
      });

      setAlunosEnviadosSet(prev => new Set(prev).add(alunoItem.id));
      showToast(`Desafio encaminhado para ${alunoItem.nome.split(' ')[0]}!`);
    } finally {
      liberarTravaEnvio(alunoItem.id, desafio.id);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-3xl border border-emerald-500/30 bg-[#021813] text-slate-100 shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-emerald-500/20 bg-[#021813]/90 px-5 sm:px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                  Desafio de Bolso
                </span>
                <span className="text-[10px] text-slate-400">• Anti-Duplicação Ativo</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Disparar: {desafio.titulo}
              </h3>
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
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
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
              <span>Envio em Lote / Fila ({selectedMassaIds.length})</span>
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
                  {jaEnviado ? (
                    <span className="flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Lock className="h-3 w-3" />
                      Já enviado em {repeticaoIndividual.dataEnvioFormatada}
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
                        {a.nome} {checkRepetido.repetido ? `[Já enviado em ${checkRepetido.dataEnvioFormatada}]` : '[Inédito]'} - {formatPhoneDisplay(a.telefone)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Alerta Visual Obrigatório de Bloqueio por Idempotência */}
              {jaEnviado && (
                <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-950/20 to-transparent p-4 flex items-start gap-3.5 text-xs text-amber-200 shadow-md">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-amber-100 text-sm">Desafio Já Enviado para este Aluno</p>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/30 text-amber-200 font-bold text-[10px]">
                        Bloqueado
                      </span>
                    </div>
                    <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                      Este desafio já foi enviado para este aluno em <strong>{repeticaoIndividual.dataEnvioFormatada}</strong>. 
                      O botão de disparo está desabilitado para evitar duplicidade acidental.
                    </p>
                  </div>
                </div>
              )}

              {/* Confirmação do Destinatário */}
              {!jaEnviado && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-400" />
                    <span>
                      Destinatário confirmado: <strong className="text-white">{selectedAluno.nome}</strong> ({formatPhoneDisplay(selectedAluno.telefone)})
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-md font-mono text-emerald-300 font-bold">
                    WhatsApp
                  </span>
                </div>
              )}
            </div>
          )}

          {/* MODO EM MASSA */}
          {mode === 'massa' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Fila de Disparo Individualizado:
                </span>
                <div className="flex items-center gap-1.5">
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
                                Já enviado ({checkRepetido.dataEnvioFormatada})
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {formatPhoneDisplay(aluno.telefone)}
                          </p>
                        </div>
                      </label>

                      {isChecked && (
                        <button
                          type="button"
                          onClick={() => handleDispararAlunoDaFila(aluno)}
                          disabled={checkRepetido.repetido || isSentInSession}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-sm ${
                            checkRepetido.repetido || isSentInSession
                              ? 'bg-slate-800 text-slate-400 border border-white/5 cursor-not-allowed opacity-60'
                              : 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 active:scale-95'
                          }`}
                        >
                          {isSentInSession ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              <span>Enviado</span>
                            </>
                          ) : checkRepetido.repetido ? (
                            <>
                              <Lock className="h-3 w-3" />
                              <span>Já enviado</span>
                            </>
                          ) : (
                            <>
                              <span>Disparar</span>
                              <ChevronRight className="h-3 w-3" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Botão de Alternar Prévia Conjunta (Mensagem + Imagem Juntas) */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setMostrarPreviaConjunta(!mostrarPreviaConjunta)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-xl"
            >
              <Eye className="h-3.5 w-3.5 text-cyan-400" />
              <span>{mostrarPreviaConjunta ? 'Ocultar Prévia Simulada' : 'Visualizar Mensagem e Imagem Juntas'}</span>
            </button>

            <span className="text-[10px] text-slate-400">
              {imagensDemonstrativas.length} {imagensDemonstrativas.length === 1 ? 'imagem' : 'imagens'} anexadas
            </span>
          </div>

          {/* Simulador de Envio WhatsApp (Mensagem + Imagem Juntas) */}
          {mostrarPreviaConjunta && (
            <div className="rounded-2xl border-2 border-emerald-500/40 bg-[#0b141a] p-3.5 space-y-2.5 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-white/10 pb-2">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <Smartphone className="h-3.5 w-3.5" />
                  Simulador WhatsApp: {selectedAluno.nome}
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Balão de Mensagem Estilo WhatsApp */}
              <div className="max-w-[92%] sm:max-w-[85%] rounded-2xl rounded-tl-sm bg-[#005c4b] p-3 text-slate-100 text-xs shadow space-y-2">
                {/* Imagem demonstrativa no topo do balão */}
                {imagensDemonstrativas[0] && (
                  <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40">
                    <img 
                      src={imagensDemonstrativas[0].url} 
                      alt="Exercício" 
                      className="w-full max-h-48 object-cover"
                    />
                    <div className="p-1.5 bg-black/60 text-[10px] text-slate-300">
                      <strong>{imagensDemonstrativas[0].exercicio_nome || desafio.titulo}</strong>
                      {imagensDemonstrativas[0].repeticoes_tempo && (
                        <span> • {imagensDemonstrativas[0].repeticoes_tempo}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Texto da Mensagem */}
                <p className="whitespace-pre-wrap leading-relaxed">
                  {getPreviewText(customMessage, selectedAluno.nome)}
                </p>

                <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-200/80 pt-1">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <CheckCheck className="h-3.5 w-3.5 text-cyan-300" />
                </div>
              </div>
            </div>
          )}

          {/* Mensagem a Ser Disparada (Edição livre) */}
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

          {/* Imagens Demonstrativas Vinculadas ao Desafio */}
          {imagensDemonstrativas.length > 0 && !mostrarPreviaConjunta && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-cyan-400" />
                Imagens Demonstrativas Anexas ({imagensDemonstrativas.length}):
              </span>
              <DesafioImagemViewer 
                imagens={imagensDemonstrativas}
                tituloDesafio={desafio.titulo}
                adaptacoesSeguranca={desafio.adaptacoes_seguranca}
              />
            </div>
          )}

          {/* Feedback de Status Pós-Disparo */}
          {feedbackStatusEnvio && (
            <div className={`rounded-2xl border p-4 text-xs space-y-1 animate-in fade-in duration-200 ${
              feedbackStatusEnvio.status === 'aceito' 
                ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-200' 
                : feedbackStatusEnvio.status === 'pendente'
                ? 'bg-yellow-500/15 border-yellow-400/40 text-yellow-200'
                : 'bg-rose-500/15 border-rose-400/40 text-rose-200'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {feedbackStatusEnvio.status === 'aceito' ? (
                  <CheckCheck className="h-4 w-4 text-cyan-400" />
                ) : feedbackStatusEnvio.status === 'pendente' ? (
                  <Clock className="h-4 w-4 text-yellow-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                )}
                <span>{feedbackStatusEnvio.titulo}</span>
              </div>
              <p className="leading-relaxed opacity-90">
                {feedbackStatusEnvio.msg}
              </p>
            </div>
          )}
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
                disabled={jaEnviado}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-cyan-500/30 bg-cyan-950/30 text-xs font-bold text-cyan-300 hover:bg-cyan-900/40 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                <span>Agendar Desafio</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {mode === 'individual' ? (
              <button
                type="button"
                id="btn-disparar-desafio-modal-action"
                onClick={handleDispararIndividual}
                disabled={isProcessingDelivery || jaEnviado}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black shadow-lg transition-all ${
                  jaEnviado
                    ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 shadow-emerald-500/30 hover:brightness-110 active:scale-95 cursor-pointer'
                }`}
              >
                {isProcessingDelivery ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                    <span>Enviando...</span>
                  </>
                ) : jaEnviado ? (
                  <>
                    <Lock className="h-4 w-4 text-slate-500" />
                    <span>Já enviado</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 fill-slate-950" />
                    <span>Disparar Desafio ({selectedAluno.nome.split(' ')[0]})</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all cursor-pointer"
              >
                Concluir Fila
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
