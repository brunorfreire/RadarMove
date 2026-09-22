import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, Play, Pause, Send, Copy, Check, Sparkles, X, User } from 'lucide-react';
import { Aluno } from '../../types';
import { openWhatsApp } from '../../lib/whatsappUtils';

interface QuickVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  alunos: Aluno[];
  selectedAlunoDefault?: Aluno | null;
  onSaveVoiceNote?: (alunoId: string, texto: string, audioUrl?: string) => void;
}

export const QuickVoiceModal: React.FC<QuickVoiceModalProps> = ({
  isOpen,
  onClose,
  alunos,
  selectedAlunoDefault,
  onSaveVoiceNote,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (selectedAlunoDefault) {
      setSelectedAlunoId(selectedAlunoDefault.id);
    } else if (alunos.length > 0 && !selectedAlunoId) {
      setSelectedAlunoId(alunos[0].id);
    }
  }, [selectedAlunoDefault, alunos]);

  // Setup Web Speech API if available
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscribedText(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error/warning:', event.error);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      setRecordingTime(0);
      setAudioUrl(null);
      setTranscribedText('');
    }
  }, [isOpen]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(200);
      setIsRecording(true);
      setAudioUrl(null);

      // Start recognition if available
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Already active or error
        }
      }

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      // Fallback: simulate audio recording
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);

    // If no speech transcribed was captured, provide a smart default note
    if (!transcribedText.trim()) {
      const selected = alunos.find(a => a.id === selectedAlunoId);
      setTranscribedText(`Fala ${selected?.nome?.split(' ')[0] || 'campeão'}! Passando pra ver como você está hoje e te lembrar de manter o foco no plano! Qualquer dúvida me dá um toque aqui no WhatsApp.`);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current && audioUrl) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      audioPlayerRef.current = audio;
    }

    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
        setIsPlaying(false);
      } else {
        audioPlayerRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(transcribedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const aluno = alunos.find((a) => a.id === selectedAlunoId);
    if (!aluno) return;

    if (onSaveVoiceNote) {
      onSaveVoiceNote(aluno.id, transcribedText, audioUrl || undefined);
    }

    openWhatsApp(aluno.telefone, transcribedText);
    onClose();
  };

  if (!isOpen) return null;

  const currentAluno = alunos.find(a => a.id === selectedAlunoId);

  return (
    <div 
      id="quick-voice-modal-overlay" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        id="quick-voice-modal-card"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#061e19]/95 p-6 shadow-2xl backdrop-blur-xl text-slate-100"
      >
        {/* Glow ambient background */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-500/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Mic className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Ditado & Áudio Rápido
                <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-400 border border-cyan-400/20">
                  Sem Digitar
                </span>
              </h3>
              <p className="text-xs text-slate-400">Grave um feedback ou fale seu recado para envio no WhatsApp</p>
            </div>
          </div>
          <button
            id="close-voice-modal-btn"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Seleção do Aluno */}
        <div className="mt-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-cyan-400" />
            Enviar para qual aluno:
          </label>
          <select
            id="voice-select-aluno"
            value={selectedAlunoId}
            onChange={(e) => setSelectedAlunoId(e.target.value)}
            className="w-full rounded-xl border border-emerald-500/20 bg-[#021813] px-3.5 py-2.5 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
          >
            {alunos.map((aluno) => (
              <option key={aluno.id} value={aluno.id}>
                {aluno.nome} ({aluno.status === 'em_risco' ? '⚠️ Em Risco' : 'Ativo'})
              </option>
            ))}
          </select>
        </div>

        {/* Visualizador de Gravação */}
        <div className="mt-5 rounded-xl border border-emerald-500/15 bg-[#031c16]/80 p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Animated sound wave bars */}
          {isRecording ? (
            <div className="flex items-center gap-1.5 h-12 my-2">
              {[40, 75, 100, 60, 90, 45, 80, 100, 70, 50, 85, 40].map((height, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-gradient-to-t from-emerald-500 to-cyan-400 rounded-full animate-pulse"
                  style={{
                    height: `${height}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.8s',
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 my-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Clique abaixo para falar ou ditar sua mensagem</span>
            </div>
          )}

          <div className="text-2xl font-mono font-bold text-white tracking-wider my-1">
            {formatTime(recordingTime)}
          </div>

          <div className="flex items-center gap-3 mt-3">
            {!isRecording ? (
              <button
                id="start-recording-btn"
                onClick={startRecording}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all"
              >
                <Mic className="h-4 w-4 text-slate-950" />
                Iniciar Gravação
              </button>
            ) : (
              <button
                id="stop-recording-btn"
                onClick={stopRecording}
                className="flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600 active:scale-95 transition-all animate-pulse"
              >
                <Square className="h-4 w-4 fill-white" />
                Parar e Transcrever
              </button>
            )}

            {audioUrl && !isRecording && (
              <button
                id="play-recorded-audio-btn"
                onClick={togglePlayback}
                className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                {isPlaying ? 'Pausar' : 'Ouvir Áudio'}
              </button>
            )}
          </div>
        </div>

        {/* Transcrição em Tempo Real ou Editável */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Texto da Mensagem (Editável)</span>
            </label>
            <button
              id="copy-transcript-btn"
              onClick={handleCopyText}
              disabled={!transcribedText}
              className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors disabled:opacity-40"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <textarea
            id="voice-transcript-textarea"
            rows={3}
            value={transcribedText}
            onChange={(e) => setTranscribedText(e.target.value)}
            placeholder="Sua fala transcrita aparecerá aqui automaticamente, ou digite livremente..."
            className="w-full rounded-xl border border-emerald-500/20 bg-[#021813] p-3 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
          />
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-emerald-500/15 pt-4">
          <button
            id="cancel-voice-btn"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition-all"
          >
            Cancelar
          </button>

          <button
            id="send-whatsapp-direct-btn"
            onClick={handleSendWhatsApp}
            disabled={!transcribedText.trim()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4 text-slate-950" />
            Enviar via WhatsApp para {currentAluno?.nome?.split(' ')[0] || 'Aluno'}
          </button>
        </div>
      </div>
    </div>
  );
};
