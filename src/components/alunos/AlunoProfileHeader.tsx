import React, { useRef, useState } from 'react';
import { 
  User, 
  Phone, 
  Calendar, 
  Target, 
  Dumbbell, 
  MessageSquare, 
  Mic, 
  Zap, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Clock,
  Ruler,
  Edit3,
  Camera,
  Upload
} from 'lucide-react';
import { Aluno, AvaliacaoFisica } from '../../types';
import { openWhatsApp } from '../../lib/whatsappUtils';
import { AlunoBadgesList } from './AlunoBadgesList';

interface AlunoProfileHeaderProps {
  aluno: Aluno;
  avaliacoes: AvaliacaoFisica[];
  onOpenVoiceModal: (aluno: Aluno) => void;
  onOpenChallengeModal: (aluno: Aluno) => void;
  onSendWhatsAppCelebration?: (texto: string) => void;
  onEditAluno?: (aluno: Aluno) => void;
  onUpdateAvatar?: (alunoId: string, newAvatarUrl: string) => void;
}

export const AlunoProfileHeader: React.FC<AlunoProfileHeaderProps> = ({
  aluno,
  avaliacoes,
  onOpenVoiceModal,
  onOpenChallengeModal,
  onSendWhatsAppCelebration,
  onEditAluno,
  onUpdateAvatar,
}) => {
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingOverAvatar, setIsDraggingOverAvatar] = useState(false);

  const handleAvatarFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result && onUpdateAvatar) {
        onUpdateAvatar(aluno.id, result);
      }
    };
    reader.readAsDataURL(file);
  };
  const sortedAvaliacoes = [...avaliacoes].sort(
    (a, b) => new Date(b.data_registro).getTime() - new Date(a.data_registro).getTime()
  );
  const ultimaAvaliacao = sortedAvaliacoes[0];
  const alturaDisplay = aluno.altura_cm || ultimaAvaliacao?.altura_cm;

  const getStatusBadge = () => {
    switch (aluno.status) {
      case 'ativo':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/25">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Aluno Ativo
          </span>
        );
      case 'em_risco':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-300 border border-rose-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
            Em Risco ({aluno.dias_sem_treino}d sem treino)
          </span>
        );
      case 'inativo':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/20 px-2.5 py-0.5 text-xs font-bold text-slate-400 border border-slate-500/30">
            Inativo
          </span>
        );
    }
  };

  const handleOpenWhatsApp = () => {
    const text = `Olá ${aluno.nome.split(' ')[0]}! Tudo bem? Passando para checar seus treinos e evolução desta semana 💪`;
    openWhatsApp(aluno.telefone, text);
  };

  return (
    <div 
      id={`aluno-profile-header-${aluno.id}`}
      className="rounded-2xl border border-emerald-500/20 bg-[#032019]/90 backdrop-blur-xl shadow-xl p-5 md:p-6 text-slate-100"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Avatar + Identity */}
        <div className="flex items-start sm:items-center gap-4">
          <div 
            id={`avatar-container-${aluno.id}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOverAvatar(true);
            }}
            onDragLeave={() => setIsDraggingOverAvatar(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingOverAvatar(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleAvatarFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => avatarInputRef.current?.click()}
            className={`group relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition-all cursor-pointer bg-emerald-950 shadow-lg shadow-cyan-500/10 ${
              isDraggingOverAvatar
                ? 'border-cyan-400 ring-4 ring-cyan-400/40 scale-105'
                : 'border-cyan-400/40 hover:border-cyan-400'
            }`}
            title="Clique ou arraste uma foto para trocar a imagem de perfil"
          >
            {aluno.avatar_url ? (
              <img src={aluno.avatar_url} alt={aluno.nome} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-cyan-300">
                {aluno.nome.charAt(0)}
              </div>
            )}

            {/* Hover overlay with Camera icon to change photo */}
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
              <Camera className="h-5 w-5 text-cyan-300 mb-0.5" />
              <span className="text-[9px] font-bold text-cyan-200">Trocar</span>
            </div>

            <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs py-0.5 text-[9px] text-center font-bold text-cyan-300 group-hover:hidden">
              {aluno.plano.split(' ')[0]}
            </div>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleAvatarFile(e.target.files[0]);
                }
              }}
            />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                {aluno.nome}
              </h2>
              {getStatusBadge()}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-xs text-cyan-300/90 flex items-center gap-1 font-medium mr-1">
                <Target className="h-3.5 w-3.5 text-cyan-400" />
                {aluno.objetivos && aluno.objetivos.length > 1 ? 'Objetivos:' : 'Objetivo:'}
              </span>
              {aluno.objetivos && aluno.objetivos.length > 0 ? (
                aluno.objetivos.map((obj, i) => (
                  <span key={i} className="text-[11px] font-semibold text-cyan-200 bg-cyan-500/15 border border-cyan-400/30 px-2 py-0.5 rounded-md">
                    {obj}
                  </span>
                ))
              ) : (
                <span className="text-xs text-cyan-200 font-medium">
                  {aluno.objetivo}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
              {alturaDisplay && (
                <>
                  <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                    <Ruler className="h-3.5 w-3.5 text-cyan-400" />
                    {alturaDisplay} cm
                  </span>
                  <span>•</span>
                </>
              )}
              <span className="flex items-center gap-1">
                <Dumbbell className="h-3.5 w-3.5 text-emerald-400" />
                {aluno.frequencia_semanal}x / semana
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Último check-in: {new Date(aluno.ultimo_checkin).toLocaleDateString('pt-BR')}
              </span>
              <span>•</span>
              <span>{aluno.plano}</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Editar Informações / Dados do Aluno */}
          {onEditAluno && (
            <button
              id="btn-profile-edit-aluno"
              type="button"
              onClick={() => onEditAluno(aluno)}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-[#021813] px-3.5 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-[#03241c] hover:border-cyan-400/50 active:scale-95 transition-all shadow-sm"
              title="Editar dados cadastrais, objetivos e metas do aluno"
            >
              <Edit3 className="h-4 w-4 text-cyan-400" />
              <span>Editar Dados</span>
            </button>
          )}

          {/* Audio Quick Note (Sem Digitar) */}
          <button
            id="btn-profile-voice-note"
            onClick={() => onOpenVoiceModal(aluno)}
            className="flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-400/20 active:scale-95 transition-all shadow-sm"
          >
            <Mic className="h-4 w-4 text-cyan-400" />
            <span>Gravar Áudio</span>
          </button>

          {/* Enviar WhatsApp Direct */}
          <button
            id="btn-profile-whatsapp"
            onClick={handleOpenWhatsApp}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-[#021813] px-4 py-2.5 text-xs font-bold text-emerald-300 hover:bg-[#03241c] hover:border-emerald-400/50 active:scale-95 transition-all"
          >
            <Phone className="h-4 w-4 text-emerald-400" />
            <span>WhatsApp</span>
          </button>

          {/* Enviar Desafio Retention */}
          <button
            id="btn-profile-challenge"
            onClick={() => onOpenChallengeModal(aluno)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-cyan-400/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Zap className="h-4 w-4 text-slate-950 fill-slate-950" />
            <span>Desafio de Bolso</span>
          </button>
        </div>
      </div>

      {/* Gamification & Retention Badges Section */}
      <div className="mt-5 pt-4 border-t border-emerald-500/15">
        <AlunoBadgesList
          aluno={aluno}
          avaliacoes={avaliacoes}
          onSendWhatsAppCelebration={onSendWhatsAppCelebration}
        />
      </div>
    </div>
  );
};
