import React, { useState } from 'react';
import { 
  MessageSquare, 
  CheckCheck, 
  Mic, 
  Send, 
  Sparkles, 
  ExternalLink,
  CornerDownRight,
  Smile,
  Volume2
} from 'lucide-react';
import { WhatsAppMensagem, Aluno } from '../../types';
import { openWhatsApp } from '../../lib/whatsappUtils';

interface WhatsAppFeedProps {
  mensagens: WhatsAppMensagem[];
  alunos: Aluno[];
  onOpenVoiceModalForAluno: (aluno: Aluno) => void;
  onSendQuickReply: (alunoId: string, texto: string) => void;
}

export const WhatsAppFeed: React.FC<WhatsAppFeedProps> = ({
  mensagens,
  alunos,
  onOpenVoiceModalForAluno,
  onSendQuickReply,
}) => {
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [quickReplyText, setQuickReplyText] = useState('');

  const handleStartReply = (msg: WhatsAppMensagem) => {
    setReplyingToId(msg.id);
    setQuickReplyText(`Boa ${msg.aluno_nome.split(' ')[0]}! Orgulho demais da sua consistência 💪🔥`);
  };

  const handleSendReply = (msg: WhatsAppMensagem) => {
    if (!quickReplyText.trim()) return;
    onSendQuickReply(msg.aluno_id, quickReplyText);
    
    // Open WhatsApp
    const targetAluno = alunos.find((a) => a.id === msg.aluno_id);
    if (targetAluno) {
      openWhatsApp(targetAluno.telefone, quickReplyText);
    }

    setReplyingToId(null);
    setQuickReplyText('');
  };

  return (
    <div 
      id="whatsapp-feed-container"
      className="flex flex-col h-full rounded-2xl border border-emerald-500/20 bg-[#032019]/90 backdrop-blur-xl shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-500/15 bg-[#021813]/80 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              Feed WhatsApp
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-[11px] text-slate-400">Respostas e check-ins dos alunos</p>
          </div>
        </div>

        <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-400 border border-emerald-500/20">
          Tempo Real
        </span>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-3.5 space-y-3 overflow-y-auto max-h-[580px]">
        {mensagens.map((msg) => {
          const targetAluno = alunos.find((a) => a.id === msg.aluno_id);
          const isPersonal = msg.origem === 'personal';
          const isReplying = replyingToId === msg.id;

          return (
            <div
              key={msg.id}
              id={`whatsapp-msg-${msg.id}`}
              className={`rounded-xl border p-3 text-xs transition-all ${
                isPersonal
                  ? 'border-cyan-500/20 bg-[#032b22]/90 ml-3'
                  : 'border-emerald-500/15 bg-[#021813]/90 hover:border-emerald-500/30'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-300">
                    {msg.aluno_nome.charAt(0)}
                  </div>
                  <span className="font-bold text-slate-200 truncate">
                    {isPersonal ? 'Você (Personal)' : msg.aluno_nome}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span>{msg.data_hora}</span>
                  <CheckCheck className="h-3.5 w-3.5 text-cyan-400" />
                </div>
              </div>

              {/* Message Bubble Text */}
              <p className="text-slate-200 leading-relaxed font-sans">
                {msg.texto}
              </p>

              {/* Quick Actions Footer */}
              {!isPersonal && (
                <div className="mt-2.5 pt-2 border-t border-emerald-500/10 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Desafio cumprido ✅
                  </span>

                  <div className="flex items-center gap-1.5">
                    {targetAluno && (
                      <button
                        id={`btn-voice-reply-${msg.id}`}
                        onClick={() => onOpenVoiceModalForAluno(targetAluno)}
                        title="Responder com Áudio gravado na hora"
                        className="flex items-center gap-1 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-[10px] font-semibold text-cyan-300 hover:bg-cyan-400/20 transition-all"
                      >
                        <Mic className="h-3 w-3 text-cyan-400" />
                        Áudio
                      </button>
                    )}

                    <button
                      id={`btn-text-reply-${msg.id}`}
                      onClick={() => handleStartReply(msg)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 px-2 py-1 text-[10px] font-semibold text-emerald-300 transition-all"
                    >
                      <CornerDownRight className="h-3 w-3" />
                      Responder
                    </button>
                  </div>
                </div>
              )}

              {/* In-feed quick reply input box */}
              {isReplying && (
                <div className="mt-3 pt-2.5 border-t border-cyan-500/20 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={quickReplyText}
                      onChange={(e) => setQuickReplyText(e.target.value)}
                      placeholder="Sua resposta rápida..."
                      className="flex-1 rounded-lg border border-cyan-400/30 bg-[#02130e] px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      onClick={() => handleSendReply(msg)}
                      className="flex items-center justify-center rounded-lg bg-cyan-400 px-2.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-300 active:scale-95 transition-all"
                    >
                      <Send className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Envia via WhatsApp Web</span>
                    <button
                      onClick={() => setReplyingToId(null)}
                      className="text-slate-500 hover:text-slate-300"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="border-t border-emerald-500/15 bg-[#021510]/90 p-3 text-center">
        <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Respostas rápidas mantêm o aluno motivado e engajado</span>
        </p>
      </div>
    </div>
  );
};
