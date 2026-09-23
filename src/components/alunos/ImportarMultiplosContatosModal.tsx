import React, { useState } from 'react';
import {
  X,
  Users,
  Check,
  CheckCircle2,
  AlertCircle,
  Phone,
  Trash2,
  Loader2,
  Sparkles,
  Smartphone,
  UserCheck
} from 'lucide-react';
import { Aluno } from '../../types';
import { formatPhoneDisplay } from '../../lib/contactPickerUtils';
import { formatWhatsAppNumber } from '../../lib/whatsappUtils';
import { supabase } from '../../lib/supabaseClient';

export interface ContatoImportadoItem {
  id: string;
  nome: string;
  telefoneOriginal: string;
  telefoneFormatado: string;
  telefoneDigits: string;
  valido: boolean;
  selecionado: boolean;
  plano: string;
  status: 'ativo' | 'em_risco';
  objetivos: string[];
}

interface ImportarMultiplosContatosModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawContacts: any[];
  alunosExistentes: Aluno[];
  onImportSuccess: (novosAlunos: Aluno[]) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
];

const PLANOS_OPCOES = [
  'Presencial VIP 3x/semana',
  'Presencial 2x/semana',
  'Consultoria Híbrida 4x/semana',
  'Consultoria Online'
];

export const ImportarMultiplosContatosModal: React.FC<ImportarMultiplosContatosModalProps> = ({
  isOpen,
  onClose,
  rawContacts,
  alunosExistentes,
  onImportSuccess,
}) => {
  const [contatos, setContatos] = useState<ContatoImportadoItem[]>(() => {
    return processRawContacts(rawContacts, alunosExistentes);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [planoPadrao, setPlanoPadrao] = useState('Presencial VIP 3x/semana');

  // Atualiza contatos se rawContacts mudar
  React.useEffect(() => {
    if (rawContacts && rawContacts.length > 0) {
      setContatos(processRawContacts(rawContacts, alunosExistentes));
    }
  }, [rawContacts, alunosExistentes]);

  function processRawContacts(raws: any[], existing: Aluno[]): ContatoImportadoItem[] {
    const existingPhones = new Set(
      existing.map((a) => a.telefone.replace(/\D/g, '').slice(-8))
    );

    return raws.map((c, idx) => {
      const rawName = Array.isArray(c.name) && c.name.length > 0 ? c.name[0] : (typeof c.name === 'string' ? c.name : `Contato ${idx + 1}`);
      const rawTel = Array.isArray(c.tel) && c.tel.length > 0 ? c.tel[0] : (typeof c.tel === 'string' ? c.tel : '');
      const digitsOnly = String(rawTel).replace(/\D/g, '');
      const formatted = formatPhoneDisplay(digitsOnly);

      const hasMinDigits = digitsOnly.length >= 10;
      const isAlreadyRegistered = digitsOnly.length >= 8 && existingPhones.has(digitsOnly.slice(-8));

      return {
        id: `contact-import-${idx}-${Date.now()}`,
        nome: String(rawName).trim() || `Aluno Contato ${idx + 1}`,
        telefoneOriginal: rawTel,
        telefoneFormatado: formatted || rawTel,
        telefoneDigits: digitsOnly,
        valido: hasMinDigits && !isAlreadyRegistered,
        selecionado: hasMinDigits && !isAlreadyRegistered,
        plano: 'Presencial VIP 3x/semana',
        status: 'ativo',
        objetivos: ['Hipertrofia & Ganho de Força'],
      };
    });
  }

  if (!isOpen) return null;

  const selecionados = contatos.filter((c) => c.selecionado);
  const todosValidosSelecionados = contatos.filter((c) => c.valido).length > 0 && 
    contatos.filter((c) => c.valido).every((c) => c.selecionado);

  const toggleSelectAll = () => {
    if (todosValidosSelecionados) {
      setContatos((prev) => prev.map((c) => ({ ...c, selecionado: false })));
    } else {
      setContatos((prev) => prev.map((c) => ({ ...c, selecionado: c.valido })));
    }
  };

  const toggleSelectContato = (id: string) => {
    setContatos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selecionado: !c.selecionado } : c))
    );
  };

  const handleUpdateNome = (id: string, novoNome: string) => {
    setContatos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, nome: novoNome } : c))
    );
  };

  const handleUpdateTelefone = (id: string, rawVal: string) => {
    const digits = rawVal.replace(/\D/g, '');
    const formatted = formatPhoneDisplay(digits);
    setContatos((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              telefoneFormatado: formatted,
              telefoneDigits: digits,
              valido: digits.length >= 10,
            }
          : c
      )
    );
  };

  const handleRemoverContato = (id: string) => {
    setContatos((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAplicarPlanoATodos = (plano: string) => {
    setPlanoPadrao(plano);
    setContatos((prev) => prev.map((c) => ({ ...c, plano })));
  };

  const handleConfirmarImportacao = async () => {
    if (selecionados.length === 0) {
      setErrorMsg('Selecione pelo menos um contato para importar.');
      return;
    }

    const invalidos = selecionados.filter((c) => !c.nome.trim() || c.telefoneDigits.length < 10);
    if (invalidos.length > 0) {
      setErrorMsg('Todos os contatos selecionados devem ter nome preenchido e WhatsApp com DDD (mínimo 10 dígitos).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      if (!currentUserId) {
        throw new Error('Usuário não autenticado. Faça login para cadastrar alunos.');
      }

      // Preparação dos alunos para inserção em lote conforme solicitado:
      // const alunosParaInserir = contatosValidos.map((c: any) => ({
      //   nome: c.name?.[0]?.trim() || 'Sem Nome',
      //   telefone: c.tel?.[0]?.replace(/\D/g, '') || '',
      //   status: 'ativo',
      //   profissional_id: user.id,
      //   objetivos: ['Geral']
      // }));
      const alunosParaInserir = selecionados.map((item) => ({
        nome: item.nome.trim() || 'Sem Nome',
        telefone: item.telefoneDigits || '',
        status: item.status || 'ativo',
        profissional_id: currentUserId,
        objetivos: item.objetivos && item.objetivos.length > 0 ? item.objetivos : ['Geral'],
        objetivo: (item.objetivos && item.objetivos.length > 0 ? item.objetivos : ['Geral']).join(', '),
        plano: item.plano || planoPadrao,
        altura: 175,
      }));

      // Executa o insert em lote no Supabase
      let { data: insertedData, error } = await supabase
        .from('alunos')
        .insert(alunosParaInserir)
        .select();

      // Tratamento de compatibilidade de schema caso colunas opcionais variem
      if (error && (error.message?.includes('column') || error.message?.includes('schema cache'))) {
        const fallbackAlunos = selecionados.map((item) => ({
          nome: item.nome.trim() || 'Sem Nome',
          telefone: item.telefoneDigits || '',
          status: 'ativo',
          profissional_id: currentUserId,
          objetivo: 'Geral',
        }));

        const retry = await supabase.from('alunos').insert(fallbackAlunos).select();
        if (!retry.error) {
          insertedData = retry.data;
          error = null;
        } else {
          // Último recurso: minimal payload
          const minimalAlunos = selecionados.map((item) => ({
            nome: item.nome.trim() || 'Sem Nome',
            telefone: item.telefoneDigits || '',
            profissional_id: currentUserId,
          }));
          const minRetry = await supabase.from('alunos').insert(minimalAlunos).select();
          insertedData = minRetry.data;
          error = minRetry.error;
        }
      }

      if (error) {
        console.error('Erro ao inserir alunos no Supabase:', error);
        throw new Error(error.message || 'Falha ao salvar alunos no Supabase.');
      }

      const dataCriacaoIso = new Date().toISOString();
      const novosAlunos: Aluno[] = selecionados.map((item, idx) => {
        const dbRecord = insertedData && insertedData[idx] ? insertedData[idx] : null;
        const randomAvatar = AVATAR_PRESETS[idx % AVATAR_PRESETS.length];
        const phoneFormatted = formatWhatsAppNumber(item.telefoneDigits);

        return {
          id: dbRecord?.id || `aluno-import-${Date.now()}-${idx}`,
          profissional_id: currentUserId,
          nome: item.nome.trim() || 'Sem Nome',
          telefone: phoneFormatted,
          data_nascimento: '1995-06-15',
          status: item.status || 'ativo',
          ultimo_checkin: dataCriacaoIso,
          avatar_url: randomAvatar,
          objetivo: item.objetivos?.join(', ') || 'Geral',
          objetivos: item.objetivos || ['Geral'],
          dias_sem_treino: 0,
          plano: item.plano || planoPadrao,
          frequencia_semanal: 3,
          altura_cm: 175,
          created_at: dbRecord?.created_at || dataCriacaoIso,
        };
      });

      onImportSuccess(novosAlunos);
      onClose();
    } catch (err: any) {
      console.error('Erro na importação em lote:', err);
      setErrorMsg(err.message || 'Falha ao importar contatos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-emerald-500/30 bg-[#031d17] text-slate-100 shadow-2xl shadow-black/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-emerald-500/20 bg-[#02140f]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-extrabold text-white">
                  Confirmar Importação de Contatos
                </h2>
                <span className="rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 text-[11px] font-bold">
                  {contatos.length} selecionados
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Revise a lista selecionada da sua agenda antes de cadastrar no RadarMove.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Global Controls & Preset */}
        <div className="p-4 border-b border-emerald-500/15 bg-emerald-950/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#02140f] border border-emerald-500/30 hover:border-emerald-400 text-slate-200 font-bold transition-all text-xs"
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  todosValidosSelecionados
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                    : 'border-slate-500 bg-black/40'
                }`}
              >
                {todosValidosSelecionados && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span>{todosValidosSelecionados ? 'Desmarcar Todos' : 'Selecionar Todos Válidos'}</span>
            </button>

            <span className="text-[11px] text-slate-400">
              {selecionados.length} de {contatos.length} marcados
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Plano padrão:</span>
            <select
              value={planoPadrao}
              onChange={(e) => handleAplicarPlanoATodos(e.target.value)}
              className="rounded-lg bg-[#02140f] border border-emerald-500/30 px-2.5 py-1 text-xs text-white focus:border-cyan-400 focus:outline-none"
            >
              {PLANOS_OPCOES.map((pl) => (
                <option key={pl} value={pl} className="bg-slate-900 text-white">
                  {pl}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="m-4 mb-0 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[50vh]">
          {contatos.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Nenhum contato selecionado.
            </div>
          ) : (
            contatos.map((item, idx) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  item.selecionado
                    ? 'border-emerald-500/40 bg-[#021c15]'
                    : 'border-white/10 bg-[#02140f]/60 opacity-60'
                }`}
              >
                {/* Checkbox + Info */}
                <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                  <button
                    type="button"
                    onClick={() => toggleSelectContato(item.id)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                      item.selecionado
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                        : 'border-slate-500 bg-black/40 hover:border-emerald-400'
                    }`}
                  >
                    {item.selecionado && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                        Nome do Aluno
                      </label>
                      <input
                        type="text"
                        value={item.nome}
                        onChange={(e) => handleUpdateNome(item.id, e.target.value)}
                        className="w-full bg-[#031d17] border border-emerald-500/20 rounded-lg px-2.5 py-1 text-xs text-white font-medium focus:border-cyan-400 focus:outline-none"
                        placeholder="Nome completo"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5 flex items-center justify-between">
                        <span>WhatsApp / DDD</span>
                        {item.telefoneDigits.length < 10 && (
                          <span className="text-rose-400 font-normal lowercase">DDD obrigatório</span>
                        )}
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={item.telefoneFormatado}
                          onChange={(e) => handleUpdateTelefone(item.id, e.target.value)}
                          className={`w-full bg-[#031d17] border rounded-lg pl-8 pr-2.5 py-1 text-xs text-white font-mono focus:outline-none ${
                            item.telefoneDigits.length < 10
                              ? 'border-rose-500/40 text-rose-200'
                              : 'border-emerald-500/20 focus:border-cyan-400'
                          }`}
                          placeholder="(11) 98765-4321"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plano Individual & Remover */}
                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-500/10">
                  <select
                    value={item.plano}
                    onChange={(e) => {
                      const val = e.target.value;
                      setContatos((prev) =>
                        prev.map((c) => (c.id === item.id ? { ...c, plano: val } : c))
                      );
                    }}
                    className="rounded-lg bg-[#031d17] border border-emerald-500/20 px-2 py-1 text-[11px] text-slate-300 focus:border-cyan-400 focus:outline-none"
                  >
                    {PLANOS_OPCOES.map((pl) => (
                      <option key={pl} value={pl} className="bg-slate-900 text-white">
                        {pl}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRemoverContato(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remover este contato da importação"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-emerald-500/20 bg-[#02140f] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <UserCheck className="h-4 w-4 text-emerald-400" />
            <span>
              <strong>{selecionados.length}</strong> {selecionados.length === 1 ? 'aluno será cadastrado' : 'alunos serão cadastrados'}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/40 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirmarImportacao}
              disabled={isSubmitting || selecionados.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Cadastrando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Cadastrar {selecionados.length} Alunos</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
