import React, { useState, useMemo } from 'react';
import { 
  X, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  MessageSquare, 
  Sparkles, 
  Zap, 
  Info,
  Users,
  Search,
  ExternalLink,
  UserCheck
} from 'lucide-react';
import { formatPhoneDisplay, formatWhatsAppNumber, getWhatsAppUrl } from '../../lib/whatsappUtils';
import { sendWhatsAppAction } from './actions';
import { Aluno } from '../../types';

interface MensagemAvulsaModalProps {
  isOpen: boolean;
  onClose: () => void;
  alunos?: Aluno[];
  onSuccess?: (info: { phone: string; message: string; alunoNome?: string }) => void;
}

export const MensagemAvulsaModal: React.FC<MensagemAvulsaModalProps> = ({
  isOpen,
  onClose,
  alunos = [],
  onSuccess,
}) => {
  // Modo de seleção: contato existente do RadarMove ou número avulso digitado
  const [recipientMode, setRecipientMode] = useState<'contato' | 'avulso'>(
    alunos.length > 0 ? 'contato' : 'avulso'
  );
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>('');
  const [searchContact, setSearchContact] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Aluno atualmente selecionado quando no modo contato
  const selectedAluno = useMemo(() => {
    return alunos.find((a) => a.id === selectedAlunoId) || null;
  }, [alunos, selectedAlunoId]);

  // Filtra lista de contatos/alunos por nome ou telefone
  const filteredAlunos = useMemo(() => {
    if (!searchContact.trim()) return alunos;
    const q = searchContact.toLowerCase();
    return alunos.filter(
      (a) =>
        a.nome.toLowerCase().includes(q) ||
        (a.telefone && a.telefone.replace(/\D/g, '').includes(q.replace(/\D/g, '')))
    );
  }, [alunos, searchContact]);

  // Define o telefone ativo conforme o modo selecionado
  const activePhone = recipientMode === 'contato' ? (selectedAluno?.telefone || '') : phone;
  const cleanDigits = activePhone.replace(/\D/g, '');
  const formattedWhatsAppNumber = formatWhatsAppNumber(activePhone);

  // Preset templates rápidos para agilizar o trabalho do personal
  const quickTemplates = [
    {
      label: 'Desafio Rápido',
      text: 'Olá! Passando para te lançar o desafio do dia no RadarMove: 10 minutos de caminhada pós-almoço e meta de 2L de água batida. Topa cumprir hoje?',
    },
    {
      label: 'Convite Avaliação',
      text: 'Olá! Gostaria de te convidar para agendarmos a sua próxima avaliação física e alinharmos as novas metas de treino. Que dia e horário ficam melhores para você?',
    },
    {
      label: 'Check-in e Energia',
      text: 'Olá! Passando para um check-in rápido de treino e recuperação. Como estão suas dores musculares, descanso e disposição hoje?',
    },
    {
      label: 'Feedback Treino',
      text: 'Parabéns pela dedicação no treino de hoje! Manteve uma constância excelente. Continue nesse ritmo!',
    },
  ];

  // Aplica placeholders como {aluno} se selecionado contato
  const applyTemplate = (tplText: string) => {
    if (selectedAluno) {
      const primeiroNome = selectedAluno.nome.split(' ')[0];
      setMessage(tplText.replace(/Olá!/g, `Olá, ${primeiroNome}!`));
    } else {
      setMessage(tplText);
    }
  };

  const handleSelectAluno = (aluno: Aluno) => {
    setSelectedAlunoId(aluno.id);
    setToast(null);
  };

  // Disparo nativo via link universal wa.me
  const handleSend = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setToast(null);

    if (!cleanDigits || cleanDigits.length < 8) {
      setToast({
        type: 'error',
        text: 'Por favor, selecione um contato com telefone cadastrado ou informe um número com DDD.',
      });
      return;
    }

    if (!message.trim()) {
      setToast({
        type: 'error',
        text: 'Por favor, digite o conteúdo da mensagem antes de abrir o WhatsApp.',
      });
      return;
    }

    try {
      const result = await sendWhatsAppAction(activePhone, message.trim());

      if (result.success) {
        setToast({
          type: 'success',
          text: 'WhatsApp aberto com sucesso! Você pode enviar e continuar a conversa nativamente.',
        });

        if (onSuccess) {
          onSuccess({
            phone: activePhone,
            message: message.trim(),
            alunoNome: selectedAluno?.nome,
          });
        }

        setTimeout(() => {
          setPhone('');
          setMessage('');
          setSelectedAlunoId('');
          setToast(null);
          onClose();
        }, 1200);
      } else {
        setToast({
          type: 'error',
          text: result.error || 'Não foi possível gerar o link do WhatsApp.',
        });
      }
    } catch (error: any) {
      setToast({
        type: 'error',
        text: 'Erro ao abrir WhatsApp: ' + error.message,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="modal-mensagem-avulsa-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="modal-mensagem-avulsa"
        className="w-full max-w-lg rounded-2xl border border-emerald-500/30 bg-[#032019] shadow-2xl backdrop-blur-2xl relative flex flex-col max-h-[92vh] overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow decoration */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-500/20 px-5 sm:px-6 py-4 bg-[#021813]/60 relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400">
              <Zap className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">Disparo WhatsApp</h3>
                <span className="rounded bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/30">
                  Link Nativo (wa.me)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Envio direto, seguro e sem limite de API externa
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-fechar-mensagem-avulsa"
            onClick={onClose}
            aria-label="Fechar modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-[#021813] text-slate-400 hover:text-white hover:border-emerald-500/50 transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSend} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 relative z-10">
          {/* Toast / Status Feedback Banner */}
          {toast && (
            <div
              id="toast-mensagem-avulsa"
              role="alert"
              className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs font-semibold shadow-lg transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
                toast.type === 'success'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 shadow-emerald-500/10'
                  : 'bg-rose-500/20 border-rose-500/50 text-rose-200 shadow-rose-500/10'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              )}
              <span className="flex-1 leading-snug">{toast.text}</span>
            </div>
          )}

          {/* Abas seletoras: Contato Existente vs Número Avulso */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              <span>Destinatário</span>
              <span className="text-rose-400">*</span>
            </label>

            <div className="grid grid-cols-2 gap-2 p-1 bg-[#02140f] rounded-xl border border-emerald-500/20">
              <button
                type="button"
                onClick={() => {
                  setRecipientMode('contato');
                  setToast(null);
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  recipientMode === 'contato'
                    ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Contato ({alunos.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRecipientMode('avulso');
                  setToast(null);
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  recipientMode === 'avulso'
                    ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Número Avulso</span>
              </button>
            </div>
          </div>

          {/* Modo 1: Seleção de Contato Existente */}
          {recipientMode === 'contato' && (
            <div className="space-y-2 bg-[#021813]/60 border border-emerald-500/20 rounded-xl p-3">
              {alunos.length === 0 ? (
                <div className="text-center py-3 text-xs text-slate-400">
                  <p>Nenhum aluno cadastrado ainda.</p>
                  <button
                    type="button"
                    onClick={() => setRecipientMode('avulso')}
                    className="text-cyan-400 hover:underline mt-1 font-semibold"
                  >
                    Clique aqui para digitar um número avulso
                  </button>
                </div>
              ) : (
                <>
                  {/* Busca rápida de contato */}
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchContact}
                      onChange={(e) => setSearchContact(e.target.value)}
                      placeholder="Pesquisar contato por nome ou telefone..."
                      className="w-full rounded-lg border border-emerald-500/20 bg-[#02140f] pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  {/* Lista de contatos rolável */}
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 divide-y divide-white/5">
                    {filteredAlunos.length === 0 ? (
                      <p className="text-center py-2 text-[11px] text-slate-400">
                        Nenhum contato encontrado com este filtro.
                      </p>
                    ) : (
                      filteredAlunos.map((aluno) => {
                        const isSelected = selectedAlunoId === aluno.id;
                        return (
                          <div
                            key={aluno.id}
                            onClick={() => handleSelectAluno(aluno)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-emerald-500/20 border border-emerald-500/40 text-white'
                                : 'hover:bg-white/5 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-7 w-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-300 shrink-0">
                                {aluno.nome.charAt(0).toUpperCase()}
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-semibold truncate leading-tight">
                                  {aluno.nome}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  {formatPhoneDisplay(aluno.telefone) || 'Sem telefone'}
                                </p>
                              </div>
                            </div>

                            {isSelected && (
                              <UserCheck className="h-4 w-4 text-emerald-400 shrink-0 ml-2" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {selectedAluno && (
                    <div className="flex items-center justify-between pt-1 text-[11px] text-emerald-300 font-medium border-t border-white/5">
                      <span>Selecionado: <strong>{selectedAluno.nome}</strong></span>
                      <span className="font-mono text-cyan-300">
                        {formatPhoneDisplay(selectedAluno.telefone)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Modo 2: Digitação de Número Avulso */}
          {recipientMode === 'avulso' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Telefone com DDD</span>
                {cleanDigits.length >= 10 && (
                  <span className="text-[11px] font-mono text-cyan-300">
                    Formato: +{formattedWhatsAppNumber}
                  </span>
                )}
              </div>

              <input
                id="input-whatsapp-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 21999999999 ou (11) 98888-7777"
                required
                className="w-full rounded-xl border border-emerald-500/25 bg-[#02140f] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
              />

              <div className="flex items-start gap-1.5 text-[11px] text-slate-400 pt-0.5">
                <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  O DDI <strong>+55 (Brasil)</strong> será aplicado automaticamente caso não digitado.
                </span>
              </div>
            </div>
          )}

          {/* Templates Rápidos (Presets) */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-cyan-400" />
              Preenchimento Rápido com Modelos:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickTemplates.map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyTemplate(tpl.text)}
                  className="rounded-lg border border-emerald-500/20 bg-[#021813] px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 hover:bg-[#03261e] active:scale-95 transition-all cursor-pointer"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Campo: Mensagem */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="textarea-whatsapp-message" className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
                <span>Mensagem</span>
                <span className="text-rose-400">*</span>
              </label>

              <span className="text-[10px] text-slate-400">
                {message.length} caracteres
              </span>
            </div>

            <textarea
              id="textarea-whatsapp-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite aqui o texto do desafio, convite ou aviso..."
              required
              className="w-full rounded-xl border border-emerald-500/25 bg-[#02140f] p-3 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Preview da Mensagem e URL gerada */}
          {message.trim() && (
            <div className="rounded-xl border border-emerald-500/20 bg-[#021611] p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-white/5">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Destino da Mensagem:
                </span>
                <span className="font-mono text-cyan-300">
                  {selectedAluno ? `${selectedAluno.nome} (${formatPhoneDisplay(activePhone)})` : cleanDigits ? formatPhoneDisplay(cleanDigits) : 'A definir'}
                </span>
              </div>
              <p className="text-xs text-slate-200 pt-0.5 italic whitespace-pre-wrap font-sans">
                &quot;{message.trim()}&quot;
              </p>
              {cleanDigits && (
                <div className="pt-1 flex items-center gap-1 text-[10px] text-slate-400 truncate font-mono">
                  <ExternalLink className="h-3 w-3 text-emerald-400 shrink-0" />
                  <span className="truncate">
                    {getWhatsAppUrl(activePhone, message.trim())}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-emerald-500/20">
            <button
              type="button"
              id="btn-cancelar-mensagem-avulsa"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              id="btn-submeter-mensagem-avulsa"
              onClick={handleSend}
              disabled={!cleanDigits || !message.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4 fill-slate-950 text-slate-950" />
              <span>Abrir no WhatsApp</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-950" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MensagemAvulsaModal;
