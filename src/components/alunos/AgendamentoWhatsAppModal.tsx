import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Calendar, 
  Clock, 
  Send, 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone,
  Bot,
  Flame,
  Droplets,
  Dumbbell,
  HeartHandshake
} from 'lucide-react';
import { Aluno, AgendamentoWhatsApp } from '../../types';
import { criarAgendamentoWhatsApp, dispararImediatamenteServidor } from '../../lib/agendamentoWhatsAppService';
import { formatPhoneDisplay } from '../../lib/whatsappUtils';

interface AgendamentoWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  aluno: Aluno;
  alunosList?: Aluno[];
  onAgendamentoCriado?: (item: AgendamentoWhatsApp) => void;
}

const TEMPLATES_PADRAO = [
  {
    id: 'lembrete-treino',
    titulo: 'Lembrete de Treino de Amanhã',
    icone: Dumbbell,
    cor: 'text-amber-400',
    texto: 'Fala {aluno}! Amanhã nosso treino já está montado e focado no seu objetivo. Tudo pronto pra comparecer no horário combinado? Me confirma aqui com um 💪!',
  },
  {
    id: 'hidratacao-3l',
    titulo: 'Meta de Hidratação 3L (23h)',
    icone: Droplets,
    cor: 'text-cyan-400',
    texto: 'Fala {aluno}! Como tá a garrafa do lado da mesa? A meta de hoje é completar os 3L de água para acelerar seus resultados. Se já estiver na metade, me responde aqui com a foto!',
  },
  {
    id: 'desafio-bolso',
    titulo: 'Desafio de Bolso: 30s Prancha',
    icone: Flame,
    cor: 'text-rose-400',
    texto: 'Opa {aluno}! Desafio de bolso do dia: levanta da cadeira agora, 30 segundos de prancha isométrica para acordar o core e a postura. Fez? Me manda um check ✅!',
  },
  {
    id: 'checkin-consistencia',
    titulo: 'Check-in de Frequência e Sono',
    icone: HeartHandshake,
    cor: 'text-emerald-400',
    texto: 'E aí {aluno}! Passando pra checar como foi seu descanso essa noite e garantir que o foco da semana continua 100%. Qualquer ajuste na rotina, me avisa por aqui!',
  },
];

export const AgendamentoWhatsAppModal: React.FC<AgendamentoWhatsAppModalProps> = ({
  isOpen,
  onClose,
  aluno,
  alunosList = [],
  onAgendamentoCriado,
}) => {
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>(aluno.id);
  const currentAluno = alunosList.find((a) => a.id === selectedAlunoId) || aluno;

  // Data e hora padrão: Amanhã às 08:00
  const getAmanha8h = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return { data: `${yyyy}-${mm}-${dd}`, hora: '08:00' };
  };

  const [dataEnvio, setDataEnvio] = useState<string>(getAmanha8h().data);
  const [horaEnvio, setHoraEnvio] = useState<string>(getAmanha8h().hora);
  const [mensagem, setMensagem] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [disparandoAgora, setDisparandoAgora] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Inicializa mensagem personalizada com o nome do aluno
  useEffect(() => {
    if (isOpen && currentAluno) {
      setSelectedAlunoId(currentAluno.id);
      const primeiroNome = currentAluno.nome.split(' ')[0];
      const templateInicial = TEMPLATES_PADRAO[0].texto.replace(/\{aluno\}/g, primeiroNome);
      setMensagem(templateInicial);
      setFeedback(null);
    }
  }, [isOpen, currentAluno.id]);

  const aplicarTemplate = (texto: string) => {
    const primeiroNome = currentAluno.nome.split(' ')[0];
    const msg = texto.replace(/\{aluno\}/g, primeiroNome);
    setMensagem(msg);
  };

  // Presets rápidos de data e horário
  const aplicarPreset = (tipo: 'hoje_19' | 'amanha_08' | 'segunda_07' | 'em_2h') => {
    const agora = new Date();
    if (tipo === 'hoje_19') {
      const yyyy = agora.getFullYear();
      const mm = String(agora.getMonth() + 1).padStart(2, '0');
      const dd = String(agora.getDate()).padStart(2, '0');
      setDataEnvio(`${yyyy}-${mm}-${dd}`);
      setHoraEnvio('19:00');
    } else if (tipo === 'amanha_08') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setDataEnvio(`${yyyy}-${mm}-${dd}`);
      setHoraEnvio('08:00');
    } else if (tipo === 'segunda_07') {
      const d = new Date();
      const diaSemana = d.getDay();
      const diasAteSegunda = diaSemana === 1 ? 7 : (8 - diaSemana) % 7 || 7;
      d.setDate(d.getDate() + diasAteSegunda);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setDataEnvio(`${yyyy}-${mm}-${dd}`);
      setHoraEnvio('07:30');
    } else if (tipo === 'em_2h') {
      const d = new Date();
      d.setHours(d.getHours() + 2);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      setDataEnvio(`${yyyy}-${mm}-${dd}`);
      setHoraEnvio(`${hh}:${min}`);
    }
  };

  // 1. Agendamento Automático (Piloto Automático pelo Servidor)
  const handleAgendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensagem.trim()) {
      setFeedback({ type: 'error', text: 'Por favor, escreva o texto da mensagem.' });
      return;
    }

    const dataHoraIso = new Date(`${dataEnvio}T${horaEnvio}:00`).toISOString();
    if (isNaN(new Date(dataHoraIso).getTime())) {
      setFeedback({ type: 'error', text: 'Data ou hora inválida.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const item = await criarAgendamentoWhatsApp({
        aluno_id: currentAluno.id,
        aluno_nome: currentAluno.nome,
        telefone: currentAluno.telefone,
        mensagem: mensagem.trim(),
        data_hora_envio: dataHoraIso,
      });

      setFeedback({
        type: 'success',
        text: `Agendado no piloto automático para ${new Date(dataHoraIso).toLocaleDateString('pt-BR')} às ${horaEnvio}! O servidor fará o disparo sem precisar de confirmação.`,
      });

      if (onAgendamentoCriado) {
        onAgendamentoCriado(item);
      }

      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Erro ao agendar envio automático.' });
    } finally {
      setSaving(false);
    }
  };

  // 2. Disparar Agora pelo Servidor (sem abrir WhatsApp Web)
  const handleDispararAgora = async () => {
    if (!mensagem.trim()) {
      setFeedback({ type: 'error', text: 'Por favor, escreva o texto da mensagem.' });
      return;
    }

    setDisparandoAgora(true);
    setFeedback(null);

    try {
      const res = await dispararImediatamenteServidor({
        aluno_id: currentAluno.id,
        aluno_nome: currentAluno.nome,
        telefone: currentAluno.telefone,
        mensagem: mensagem.trim(),
      });

      setFeedback({
        type: 'success',
        text: res.message || 'Mensagem enviada com sucesso no piloto automático!',
      });

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Erro ao disparar mensagem pelo servidor.' });
    } finally {
      setDisparandoAgora(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="modal-agendamento-whatsapp-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl rounded-2xl border border-emerald-500/30 bg-[#022c22] p-5 sm:p-6 shadow-2xl text-zinc-100 z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25">
                <Bot className="h-6 w-6 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Agendar WhatsApp Automático
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-300 border border-emerald-500/40 animate-pulse">
                    Piloto Automático
                  </span>
                </h2>
                <p className="text-xs text-emerald-200/70">
                  Envio 100% pelo servidor via API • Sem abrir WhatsApp Web
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-500/20 hover:text-white transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {feedback && (
            <div
              className={`mb-4 flex items-center gap-2 rounded-xl p-3 text-xs font-semibold ${
                feedback.type === 'success'
                  ? 'border border-emerald-500/40 bg-emerald-950/80 text-emerald-300'
                  : 'border border-rose-500/40 bg-rose-950/80 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          <form onSubmit={handleAgendar} className="space-y-4">
            {/* Aluno e Destinatário */}
            <div className="rounded-xl border border-emerald-500/20 bg-[#011a14] p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {currentAluno.avatar_url ? (
                  <img
                    src={currentAluno.avatar_url}
                    alt={currentAluno.nome}
                    className="h-10 w-10 rounded-full object-cover border border-emerald-500/30"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 text-sm">
                    {currentAluno.nome.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-white">{currentAluno.nome}</div>
                  <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                    <Smartphone className="h-3 w-3" />
                    {formatPhoneDisplay(currentAluno.telefone)}
                  </div>
                </div>
              </div>

              {alunosList.length > 1 && (
                <div className="w-full sm:w-auto">
                  <select
                    value={selectedAlunoId}
                    onChange={(e) => {
                      setSelectedAlunoId(e.target.value);
                      const al = alunosList.find((a) => a.id === e.target.value);
                      if (al) {
                        const primeiroNome = al.nome.split(' ')[0];
                        setMensagem((prev) => prev.replace(/^[A-Za-z]+,?\s?/, `${primeiroNome}, `));
                      }
                    }}
                    className="w-full rounded-lg border border-emerald-500/30 bg-[#02241b] px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  >
                    {alunosList.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Presets Rápidos de Data e Hora */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Quando disparar automaticamente?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2.5">
                <button
                  type="button"
                  onClick={() => aplicarPreset('hoje_19')}
                  className="rounded-lg border border-emerald-500/20 bg-[#011a14] px-2 py-1.5 text-[11px] font-bold text-slate-300 hover:border-emerald-400 hover:text-white transition-all text-center"
                >
                  Hoje às 19:00
                </button>
                <button
                  type="button"
                  onClick={() => aplicarPreset('amanha_08')}
                  className="rounded-lg border border-emerald-500/20 bg-[#011a14] px-2 py-1.5 text-[11px] font-bold text-slate-300 hover:border-emerald-400 hover:text-white transition-all text-center"
                >
                  Amanhã às 08:00
                </button>
                <button
                  type="button"
                  onClick={() => aplicarPreset('segunda_07')}
                  className="rounded-lg border border-emerald-500/20 bg-[#011a14] px-2 py-1.5 text-[11px] font-bold text-slate-300 hover:border-emerald-400 hover:text-white transition-all text-center"
                >
                  Segunda às 07:30
                </button>
                <button
                  type="button"
                  onClick={() => aplicarPreset('em_2h')}
                  className="rounded-lg border border-emerald-500/20 bg-[#011a14] px-2 py-1.5 text-[11px] font-bold text-slate-300 hover:border-emerald-400 hover:text-white transition-all text-center"
                >
                  Daqui a 2 horas
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
                    <Calendar className="h-3 w-3 text-emerald-400" />
                    <span>Data do Disparo</span>
                  </div>
                  <input
                    type="date"
                    value={dataEnvio}
                    onChange={(e) => setDataEnvio(e.target.value)}
                    required
                    className="w-full rounded-lg border border-emerald-500/30 bg-[#011a14] px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
                    <Clock className="h-3 w-3 text-cyan-400" />
                    <span>Horário do Disparo</span>
                  </div>
                  <input
                    type="time"
                    value={horaEnvio}
                    onChange={(e) => setHoraEnvio(e.target.value)}
                    required
                    className="w-full rounded-lg border border-emerald-500/30 bg-[#011a14] px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Templates Rápidos de Mensagem */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  Templates Recomendados
                </label>
                <span className="text-[10px] text-slate-400">Clique para aplicar</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {TEMPLATES_PADRAO.map((tpl) => {
                  const Icon = tpl.icone;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => aplicarTemplate(tpl.texto)}
                      className="flex items-center gap-2 p-2 rounded-xl border border-emerald-500/15 bg-[#011a14] text-left hover:border-emerald-400/50 hover:bg-emerald-500/10 transition-all group"
                    >
                      <Icon className={`h-3.5 w-3.5 ${tpl.cor} shrink-0 group-hover:scale-110 transition-transform`} />
                      <span className="text-[11px] font-semibold text-slate-300 truncate">
                        {tpl.titulo}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Texto da Mensagem */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">
                  Texto da Mensagem (WhatsApp)
                </label>
                <span className="text-[10px] text-emerald-400/80 font-mono">
                  {mensagem.length} caracteres
                </span>
              </div>
              <textarea
                rows={4}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Escreva a mensagem..."
                className="w-full rounded-xl border border-emerald-500/30 bg-[#011a14] p-3 text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none leading-relaxed resize-none"
              />
              <div className="text-[10px] text-slate-400 mt-1">
                Dica: O nome do aluno será inserido automaticamente onde houver <code className="text-cyan-300 font-mono">&#123;aluno&#125;</code>.
              </div>
            </div>

            {/* Destaque de Automação */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-3 text-[11px] text-emerald-200 flex items-start gap-2.5">
              <Zap className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-300">Envio 100% Autônomo pelo Servidor:</strong>{' '}
                Ao agendar, o RadarMove executa o envio direto pela API na data e hora selecionada. Você não precisa estar com o aplicativo aberto nem confirmar o envio no WhatsApp Web.
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={handleDispararAgora}
                disabled={disparandoAgora || saving}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 px-3.5 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 active:scale-95 transition-all cursor-pointer"
                title="Dispara agora mesmo via API do servidor sem esperar a hora marcada"
              >
                <Send className={`h-3.5 w-3.5 ${disparandoAgora ? 'animate-pulse text-cyan-400' : ''}`} />
                <span>{disparandoAgora ? 'Disparando...' : 'Disparar Agora (Servidor)'}</span>
              </button>

              <div className="w-full sm:w-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 sm:w-auto rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-all text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || disparandoAgora}
                  className="w-1/2 sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 px-5 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  <Bot className="h-4 w-4 stroke-[2.5]" />
                  <span>{saving ? 'Agendando...' : 'Agendar no Piloto Automático'}</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
