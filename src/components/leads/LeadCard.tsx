import React from 'react';
import { 
  Flame, 
  Sparkles, 
  Phone, 
  Send, 
  UserCheck, 
  MoreVertical, 
  Clock, 
  Calendar, 
  DollarSign, 
  Target, 
  ExternalLink,
  MessageSquare,
  Award,
  Edit2
} from 'lucide-react';
import { Lead } from '../../types';
import { openWhatsApp, formatPhoneDisplay } from '../../lib/whatsappUtils';

interface LeadCardProps {
  lead: Lead;
  onOpenEnviarDesafio: (lead: Lead) => void;
  onOpenFollowup: (lead: Lead) => void;
  onOpenConverter: (lead: Lead) => void;
  onOpenEdit: (lead: Lead) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onOpenEnviarDesafio,
  onOpenFollowup,
  onOpenConverter,
  onOpenEdit,
}) => {
  const getTemperaturaBadge = () => {
    switch (lead.temperatura) {
      case 'quente':
        return (
          <span className="flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/25">
            <Flame className="h-3 w-3 text-rose-400" />
            <span>Quente</span>
          </span>
        );
      case 'morno':
        return (
          <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/25">
            <Sparkles className="h-3 w-3 text-amber-400" />
            <span>Morno</span>
          </span>
        );
      case 'frio':
        return (
          <span className="flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-500/25">
            <span>❄️ Frio</span>
          </span>
        );
    }
  };

  const getOrigemLabel = () => {
    switch (lead.origem) {
      case 'instagram': return '📸 Instagram';
      case 'indicacao': return '🤝 Indicação';
      case 'whatsapp': return '💬 WhatsApp';
      case 'presencial_academia': return '🏋️ Academia';
      case 'trafego_pago': return '🚀 Anúncio';
      default: return '🌐 Outro';
    }
  };

  const isConvertido = lead.status === 'convertido';

  return (
    <div 
      id={`lead-card-${lead.id}`}
      className={`rounded-2xl border transition-all duration-200 p-4 flex flex-col justify-between ${
        isConvertido
          ? 'bg-[#03231a]/80 border-emerald-500/40 shadow-lg shadow-emerald-950/40'
          : 'bg-[#021813]/90 border-emerald-500/20 hover:border-emerald-500/40 shadow-md shadow-emerald-950/30'
      }`}
    >
      {/* Top row: Avatar, Info, Temperature */}
      <div>
        <div className="flex items-start justify-between gap-2.5 mb-2.5">
          <div className="flex items-center gap-3">
            {lead.avatar_url ? (
              <img
                src={lead.avatar_url}
                alt={lead.nome}
                className="h-10 w-10 rounded-xl object-cover border border-emerald-500/30 shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-extrabold text-sm shrink-0">
                {lead.nome.charAt(0)}
              </div>
            )}

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-white text-sm leading-tight hover:text-cyan-300 transition-colors">
                  {lead.nome}
                </h3>
              </div>
              
              <div className="flex items-center gap-2 mt-0.5">
                <button
                  type="button"
                  onClick={() => openWhatsApp(lead.telefone, `Fala ${lead.nome.split(' ')[0]}!`)}
                  className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
                  title="Abrir WhatsApp direto"
                >
                  <Phone className="h-3 w-3" />
                  <span>{formatPhoneDisplay(lead.telefone)}</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {getTemperaturaBadge()}
            <button
              type="button"
              onClick={() => onOpenEdit(lead)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-emerald-500/10 transition-colors"
              title="Editar Lead"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Tags row: Origem & Objetivo */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-[10px] font-semibold text-slate-300 bg-[#02130e] px-2 py-0.5 rounded-md border border-emerald-500/15">
            {getOrigemLabel()}
          </span>

          <span className="text-[10px] text-cyan-300 bg-cyan-400/10 px-2 py-0.5 rounded-md border border-cyan-400/20 truncate max-w-[200px]" title={lead.objetivo_interesse}>
            🎯 {lead.objetivo_interesse}
          </span>
        </div>

        {/* Desafio Ativo Section */}
        <div className="rounded-xl bg-[#02130e] border border-emerald-500/15 p-2.5 mb-3">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Target className="h-3 w-3 text-emerald-400" />
              Desafio Degustação:
            </span>
            {lead.desafio_ativo_titulo ? (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                Ativo {lead.dias_desafio_decorridos !== undefined ? `(${lead.dias_desafio_decorridos}d)` : ''}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">
                Pendente
              </span>
            )}
          </div>

          {lead.desafio_ativo_titulo ? (
            <p className="text-xs font-bold text-white line-clamp-1">
              {lead.desafio_ativo_titulo}
            </p>
          ) : (
            <div className="flex items-center justify-between mt-1">
              <span className="text-[11px] text-slate-400 italic">
                Nenhum desafio enviado
              </span>
              <button
                type="button"
                onClick={() => onOpenEnviarDesafio(lead)}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                <Send className="h-3 w-3" />
                <span>Enviar agora</span>
              </button>
            </div>
          )}
        </div>

        {/* Valor Estimado & Notas */}
        {lead.notas && (
          <p className="text-[11px] text-slate-400 line-clamp-2 mb-3 bg-[#02140f]/60 p-2 rounded-lg border border-emerald-500/10">
            💬 {lead.notas}
          </p>
        )}
      </div>

      {/* Action Buttons Footer */}
      <div className="border-t border-emerald-500/10 pt-3 mt-1 flex flex-wrap items-center gap-2">
        {/* Follow-up button */}
        <button
          type="button"
          onClick={() => onOpenFollowup(lead)}
          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/30 text-xs font-bold transition-all active:scale-95 cursor-pointer"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Follow-up</span>
        </button>

        {/* Enviar / Trocar Desafio */}
        <button
          type="button"
          onClick={() => onOpenEnviarDesafio(lead)}
          className="flex items-center justify-center p-2 rounded-xl bg-[#02140f] hover:bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          title="Disparar novo desafio"
        >
          <Send className="h-3.5 w-3.5" />
        </button>

        {/* Converter em Aluno */}
        {!isConvertido ? (
          <button
            type="button"
            onClick={() => onOpenConverter(lead)}
            className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Virou Aluno 🎉</span>
          </button>
        ) : (
          <span className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <Award className="h-3.5 w-3.5" />
            <span>Aluno Ativo</span>
          </span>
        )}
      </div>
    </div>
  );
};
