import React, { useState, useEffect, useMemo } from 'react';
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
  UserCheck,
  Loader2,
  FileText
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { formatPhoneDisplay } from '../../lib/whatsappUtils';
import { Aluno } from '../../types';

interface TemplateItem {
  id: string;
  titulo: string;
  mensagem: string;
}

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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [dbTemplates, setDbTemplates] = useState<TemplateItem[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
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

  // 1. Busca dinâmica dos templates cadastrados no Supabase (com proteção RLS)
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function carregarTemplates() {
      setLoadingTemplates(true);
      try {
        // Tenta buscar da tabela 'templates' (com fallback para 'templates_mensagens' ou 'desafios_templates')
        let templatesList: TemplateItem[] = [];

        // Tentativa principal: tabela 'templates'
        const { data: dataTemplates, error: errorTemplates } = await supabase
          .from('templates')
          .select('id, titulo, mensagem')
          .order('titulo', { ascending: true });

        if (!errorTemplates && dataTemplates && dataTemplates.length > 0) {
          templatesList = dataTemplates.map((t: any) => ({
            id: String(t.id),
            titulo: t.titulo || 'Template sem título',
            mensagem: t.mensagem || t.conteudo || '',
          }));
        } else {
          // Fallback resiliente: tabela 'templates_mensagens'
          const { data: dataAlt, error: errorAlt } = await supabase
            .from('templates_mensagens')
            .select('id, titulo, conteudo')
            .order('titulo', { ascending: true });

          if (!errorAlt && dataAlt && dataAlt.length > 0) {
            templatesList = dataAlt.map((t: any) => ({
              id: String(t.id),
              titulo: t.titulo || 'Template sem título',
              mensagem: t.conteudo || '',
            }));
          } else {
            // Fallback secundário: tabela 'desafios_templates'
            const { data: dataDesafios } = await supabase
              .from('desafios_templates')
              .select('id, titulo, mensagem_whatsapp')
              .order('titulo', { ascending: true });

            if (dataDesafios && dataDesafios.length > 0) {
              templatesList = dataDesafios.map((t: any) => ({
                id: String(t.id),
                titulo: t.titulo || 'Template de desafio',
                mensagem: t.mensagem_whatsapp || '',
              }));
            }
          }
        }

        // Se ainda não houver nenhum template salvo no banco, fornece padrões rápidos de apoio
        if (templatesList.length === 0) {
          templatesList = [
            {
              id: 'tpl-default-1',
              titulo: 'Check-in de Foco & Treino',
              mensagem: 'Olá, {aluno_nome}! Passando para um check-in rápido de treino e recuperação. Como estão suas dores musculares, sono e disposição hoje?',
            },
            {
              id: 'tpl-default-2',
              titulo: 'Desafio Rápido de Hidratação',
              mensagem: 'Fala, {aluno_nome}! Passando para te lançar o desafio do dia no RadarMove: meta de 3L de água batida e 10 min de caminhada. Topa cumprir hoje?',
            },
            {
              id: 'tpl-default-3',
              titulo: 'Agendamento de Avaliação',
              mensagem: 'Olá, {aluno_nome}! Gostaria de te convidar para agendarmos a sua próxima avaliação física e alinharmos as novas metas de treino. Que dia e horário ficam melhores para você?',
            },
          ];
        }

        if (isMounted) {
          setDbTemplates(templatesList);
        }
      } catch (err) {
        console.warn('[MensagemAvulsaModal] Erro ao carregar templates do Supabase:', err);
      } finally {
        if (isMounted) {
          setLoadingTemplates(false);
        }
      }
    }

    carregarTemplates();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // 2. Preenchimento automático do textarea ao selecionar template
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const tpl = dbTemplates.find((t) => t.id === templateId);
    if (!tpl) return;

    let textoFinal = tpl.mensagem;

    // Substitui {aluno_nome} ou {aluno} se houver aluno selecionado
    if (selectedAluno) {
      const primeiroNome = selectedAluno.nome.split(' ')[0];
      textoFinal = textoFinal
        .replace(/\{aluno_nome\}|\{aluno\}/g, primeiroNome)
        .replace(/\{treinador_nome\}|\{personal\}/g, 'Treinador');
    } else {
      textoFinal = textoFinal
        .replace(/\{aluno_nome\}|\{aluno\}/g, '')
        .replace(/\{treinador_nome\}|\{personal\}/g, 'Treinador')
        .replace(/\s{2,}/g, ' ')
        .trim();
    }

    setMessage(textoFinal);
    setToast(null);
  };

  const handleSelectAluno = (aluno: Aluno) => {
    setSelectedAlunoId(aluno.id);
    setToast(null);

    // Se já tinha selecionado um template antes, atualiza a saudação com o nome do aluno
    if (selectedTemplateId) {
      const tpl = dbTemplates.find((t) => t.id === selectedTemplateId);
      if (tpl) {
        const primeiroNome = aluno.nome.split(' ')[0];
        const textoAtualizado = tpl.mensagem
          .replace(/\{aluno_nome\}|\{aluno\}/g, primeiroNome)
          .replace(/\{treinador_nome\}|\{personal\}/g, 'Treinador');
        setMessage(textoAtualizado);
      }
    }
  };

  // 3. Higieniza o número com código do país (+55 Brasil)
  const formatarNumeroComDDI = (numeroRaw: string): string => {
    const digitos = numeroRaw.replace(/\D/g, '');
    if (!digitos) return '';

    // DDD + Número (10 ou 11 dígitos, ex: 11999998888 ou 2188887777)
    if (digitos.length === 10 || digitos.length === 11) {
      return `55${digitos}`;
    }
    // Já possui 55 no início (12 ou 13 dígitos)
    if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) {
      return digitos;
    }
    return digitos;
  };

  // 4. Lógica de Disparo 100% nativa via wa.me oficial
  const handleSend = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setToast(null);

    if (!cleanDigits || cleanDigits.length < 10) {
      setToast({
        type: 'error',
        text: 'Número incompleto. Digite o DDD + telefone (mínimo 10 dígitos) para abrir o WhatsApp.',
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

    const numeroFormatado = formatarNumeroComDDI(activePhone);
    if (!numeroFormatado || numeroFormatado.length < 10) {
      setToast({
        type: 'error',
        text: 'Número de telefone inválido. Verifique o DDD e os dígitos.',
      });
      return;
    }

    // Codificação de texto segura para URL
    const textoCodificado = encodeURIComponent(message.trim());
    const waUrl = `https://wa.me/${numeroFormatado}?text=${textoCodificado}`;

    // Abertura nativa no WhatsApp Web / WhatsApp Desktop / Celular
    const win = window.open(waUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      window.location.href = waUrl;
    }

    setToast({
      type: 'success',
      text: 'Conversa no WhatsApp aberta com sucesso!',
    });

    if (onSuccess) {
      onSuccess({
        phone: numeroFormatado,
        message: message.trim(),
        alunoNome: selectedAluno?.nome,
      });
    }

    setTimeout(() => {
      setPhone('');
      setMessage('');
      setSelectedAlunoId('');
      setSelectedTemplateId('');
      setToast(null);
      onClose();
    }, 1200);
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
        className="w-full max-w-lg rounded-3xl border border-emerald-500/30 bg-[#032019] shadow-2xl backdrop-blur-2xl relative flex flex-col max-h-[92vh] overflow-hidden text-slate-100"
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
                <h3 className="font-extrabold text-base text-white">Mensagem Avulsa</h3>
                <span className="rounded bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/30">
                  wa.me nativo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dispare mensagens rápidas direto para o WhatsApp sem cadastrar o contato
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
                    Formato WhatsApp: +{formatarNumeroComDDI(cleanDigits)}
                  </span>
                )}
              </div>

              <input
                id="input-whatsapp-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: (11) 98888-7777 ou 21999998888"
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

          {/* Modelos Dinâmicos do Supabase (Tabela 'templates') */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label htmlFor="select-template-dinamico" className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span>Modelos Dinâmicos (Supabase)</span>
              </label>

              {loadingTemplates && (
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
                  Carregando...
                </span>
              )}
            </div>

            {/* Select Estilizado de Templates */}
            <div className="relative">
              <select
                id="select-template-dinamico"
                value={selectedTemplateId}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                className="w-full rounded-xl border border-emerald-500/30 bg-[#02140f] px-3.5 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all cursor-pointer"
              >
                <option value="">-- Selecione um modelo salvo para preencher --</option>
                {dbTemplates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.titulo}
                  </option>
                ))}
              </select>
            </div>

            {/* Chips Rápidos dos 3 primeiros templates */}
            {dbTemplates.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {dbTemplates.slice(0, 4).map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl.id)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                      selectedTemplateId === tpl.id
                        ? 'border-emerald-400/60 bg-emerald-500/25 text-emerald-200'
                        : 'border-emerald-500/20 bg-[#021813] text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 hover:bg-[#03261e]'
                    }`}
                  >
                    <FileText className="h-3 w-3 text-cyan-400 shrink-0" />
                    <span className="truncate max-w-[140px]">{tpl.titulo}</span>
                  </button>
                ))}
              </div>
            )}
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
              placeholder="Digite aqui o texto da mensagem ou selecione um modelo acima..."
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
                    https://wa.me/{formatarNumeroComDDI(activePhone)}?text={encodeURIComponent(message.trim()).slice(0, 40)}...
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
              <span>Enviar WhatsApp</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-950" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MensagemAvulsaModal;
