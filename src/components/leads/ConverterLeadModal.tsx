import React, { useState } from 'react';
import { 
  X, 
  UserCheck, 
  Sparkles, 
  Trophy, 
  Send, 
  CheckCircle2, 
  Phone, 
  Target, 
  Calendar,
  DollarSign
} from 'lucide-react';
import { Lead, Aluno } from '../../types';
import { openWhatsApp, formatPhoneDisplay } from '../../lib/whatsappUtils';
import { converterLeadParaAluno } from '../../lib/leadsFollowupUtils';

interface ConverterLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onConfirmarConversao: (
    lead: Lead, 
    novoAluno: Aluno, 
    mensagemBoasVindas?: string,
    enviarWhatsApp?: boolean
  ) => void;
}

export const ConverterLeadModal: React.FC<ConverterLeadModalProps> = ({
  isOpen,
  onClose,
  lead,
  onConfirmarConversao,
}) => {
  if (!isOpen || !lead) return null;

  const [plano, setPlano] = useState('Presencial VIP 3x/semana');
  const [frequencia, setFrequencia] = useState('3');
  const [alturaCm, setAlturaCm] = useState('175');
  const [enviarMensagem, setEnviarMensagem] = useState(true);

  const leadFirstName = lead.nome ? lead.nome.split(' ')[0] : 'Campeão';

  const [mensagemBoasVindas, setMensagemBoasVindas] = useState(
    `Parabéns ${leadFirstName}! 🎉 É oficial: você agora é oficialmente meu aluno no RadarMove!\n\nEstou muito feliz com a sua decisão de priorizar sua saúde e resultado. O próximo passo é fazer a sua avaliação física completa e traçar o plano de ação.\n\nSeja muito bem-vindo ao time! Vamos com tudo! 💪🔥`
  );

  const handleConfirmar = (e: React.FormEvent) => {
    e.preventDefault();

    const alturaNum = parseInt(alturaCm, 10) || 175;
    const freqNum = parseInt(frequencia, 10) || 3;

    const novoAluno = converterLeadParaAluno(
      lead,
      lead.profissional_id,
      plano,
      freqNum,
      alturaNum
    );

    if (enviarMensagem) {
      openWhatsApp(lead.telefone, mensagemBoasVindas);
    }

    onConfirmarConversao(lead, novoAluno, mensagemBoasVindas, enviarMensagem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-emerald-500/30 bg-[#031d17] p-6 shadow-2xl shadow-emerald-950/90 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Celebration */}
        <div className="flex items-center justify-between border-b border-emerald-500/15 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 font-bold shadow-lg shadow-emerald-500/30">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">
                  Converter Lead em Aluno Oficial!
                </h2>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  🎉 Sucesso
                </span>
              </div>
              <p className="text-xs text-slate-400">
                O lead completou o funil de degustação e fechou a consultoria
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-500/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lead Identity Summary */}
        <div className="rounded-xl bg-[#02130e] border border-emerald-500/20 p-3 mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{lead.nome}</span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                {formatPhoneDisplay(lead.telefone)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Objetivo: <strong className="text-cyan-300">{lead.objetivo_interesse}</strong>
            </p>
          </div>

          {lead.valor_estimado_plano && (
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Valor Acordado</span>
              <span className="text-xs font-bold text-emerald-400">
                R$ {lead.valor_estimado_plano}/mês
              </span>
            </div>
          )}
        </div>

        {/* Form to configure new student profile */}
        <form onSubmit={handleConfirmar} className="space-y-3.5">
          {/* Plano & Frequência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Plano Contratado
              </label>
              <select
                value={plano}
                onChange={(e) => setPlano(e.target.value)}
                className="w-full rounded-xl border border-emerald-500/20 bg-[#02140f] px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="Presencial VIP 3x/semana">Presencial VIP 3x/semana</option>
                <option value="Consultoria Híbrida 4x/semana">Consultoria Híbrida 4x/semana</option>
                <option value="Presencial 2x/semana">Presencial 2x/semana</option>
                <option value="Consultoria 100% Online">Consultoria 100% Online</option>
                <option value="Personal Duo / Casal">Personal Duo / Casal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Frequência Semanal
              </label>
              <select
                value={frequencia}
                onChange={(e) => setFrequencia(e.target.value)}
                className="w-full rounded-xl border border-emerald-500/20 bg-[#02140f] px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="2">2x por semana</option>
                <option value="3">3x por semana</option>
                <option value="4">4x por semana</option>
                <option value="5">5x por semana</option>
              </select>
            </div>
          </div>

          {/* Altura em cm (para bioimpedância) */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">
              Altura do Novo Aluno (cm)
            </label>
            <input
              type="number"
              value={alturaCm}
              onChange={(e) => setAlturaCm(e.target.value)}
              placeholder="Ex: 175"
              className="w-full rounded-xl border border-emerald-500/20 bg-[#02140f] px-3 py-2 text-xs text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Enviar WhatsApp de Boas-Vindas */}
          <div className="rounded-xl border border-emerald-500/20 bg-[#02130e] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                <input
                  type="checkbox"
                  checked={enviarMensagem}
                  onChange={(e) => setEnviarMensagem(e.target.checked)}
                  className="rounded border-emerald-500/30 text-emerald-500 focus:ring-0 bg-[#021813]"
                />
                <span>Enviar Boas-Vindas Oficiais no WhatsApp</span>
              </label>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded">
                +55 automático
              </span>
            </div>

            {enviarMensagem && (
              <textarea
                rows={3}
                value={mensagemBoasVindas}
                onChange={(e) => setMensagemBoasVindas(e.target.value)}
                className="w-full rounded-xl border border-emerald-500/30 bg-[#021813] p-2.5 text-xs text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none resize-none font-sans"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-emerald-500/10 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 px-6 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirmar & Matricular Aluno</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
