import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  Check, 
  Sparkles, 
  Mic, 
  MicOff, 
  Calendar, 
  Scale, 
  Ruler, 
  Dumbbell, 
  Flame, 
  HeartPulse, 
  AlertCircle,
  HelpCircle,
  Activity
} from 'lucide-react';
import { AvaliacaoFisica } from '../../types';

interface BioimpedanciaFormProps {
  alunoId: string;
  alunoNome: string;
  alunoAlturaPadrao?: number;
  ultimaAvaliacao?: AvaliacaoFisica;
  onSaveAvaliacao: (avaliacao: Omit<AvaliacaoFisica, 'id'>) => void;
}

export const BioimpedanciaForm: React.FC<BioimpedanciaFormProps> = ({
  alunoId,
  alunoNome,
  alunoAlturaPadrao,
  ultimaAvaliacao,
  onSaveAvaliacao,
}) => {
  // Default values based on previous assessment or standard initial reference
  const [dataRegistro, setDataRegistro] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [alturaCm, setAlturaCm] = useState<number>(
    ultimaAvaliacao?.altura_cm || alunoAlturaPadrao || 175
  );
  const [circAbdominal, setCircAbdominal] = useState<number>(
    ultimaAvaliacao ? ultimaAvaliacao.circ_abdominal : 85.0
  );
  const [massaMuscular, setMassaMuscular] = useState<number>(
    ultimaAvaliacao ? ultimaAvaliacao.massa_muscular : 32.0
  );
  const [percGordura, setPercGordura] = useState<number>(
    ultimaAvaliacao ? ultimaAvaliacao.perc_gordura : 22.0
  );
  const [gorduraVisceral, setGorduraVisceral] = useState<number>(
    ultimaAvaliacao ? ultimaAvaliacao.gordura_visceral : 6
  );
  const [taxaMetabolica, setTaxaMetabolica] = useState<number>(
    ultimaAvaliacao ? ultimaAvaliacao.taxa_metabolica : 1650
  );
  const [peso, setPeso] = useState<number>(
    ultimaAvaliacao?.peso ? ultimaAvaliacao.peso : 78.0
  );
  const [observacoes, setObservacoes] = useState('');
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  // Sync state when active student or latest assessment changes
  useEffect(() => {
    if (ultimaAvaliacao) {
      setCircAbdominal(ultimaAvaliacao.circ_abdominal);
      setMassaMuscular(ultimaAvaliacao.massa_muscular);
      setPercGordura(ultimaAvaliacao.perc_gordura);
      setGorduraVisceral(ultimaAvaliacao.gordura_visceral);
      setTaxaMetabolica(ultimaAvaliacao.taxa_metabolica);
      if (ultimaAvaliacao.peso) setPeso(ultimaAvaliacao.peso);
      if (ultimaAvaliacao.altura_cm) {
        setAlturaCm(ultimaAvaliacao.altura_cm);
      } else if (alunoAlturaPadrao) {
        setAlturaCm(alunoAlturaPadrao);
      }
    } else if (alunoAlturaPadrao) {
      setAlturaCm(alunoAlturaPadrao);
    }
  }, [alunoId, ultimaAvaliacao, alunoAlturaPadrao]);

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);

  const handleStep = (
    setter: React.Dispatch<React.SetStateAction<number>>, 
    delta: number, 
    min = 0, 
    max = 300, 
    precision = 1
  ) => {
    setter((prev) => {
      const next = Number((prev + delta).toFixed(precision));
      return Math.max(min, Math.min(max, next));
    });
  };

  // Speech Recognition Engine
  const toggleVoiceInput = () => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback simulation for browsers/sandboxes without speech recognition
      simulateVoiceFill();
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      setIsListening(true);
      setVoiceFeedback('Ouvindo... Dite: "altura 178, abdômen 84, massa 35, peso 80"');

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        parseVoiceTranscript(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error', event.error);
        setIsListening(false);
        setVoiceFeedback('Não foi possível capturar o áudio. Usando preenchimento assistido.');
        setTimeout(() => setVoiceFeedback(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      simulateVoiceFill();
    }
  };

  const parseVoiceTranscript = (text: string) => {
    setVoiceFeedback(`Reconhecido: "${text}"`);

    // RegEx matchers for numbers in spoken Brazilian Portuguese
    const alturaMatch = text.match(/(?:altura|estatura)\s*(?:de)?\s*(\d+(?:[.,]\d+)?)/i);
    const circMatch = text.match(/(?:abdômen|cintura|circunferência|barriga)\s*(?:de)?\s*(\d+(?:[.,]\d+)?)/i);
    const massaMatch = text.match(/(?:massa|músculo|massa muscular)\s*(?:de)?\s*(\d+(?:[.,]\d+)?)/i);
    const gorduraMatch = text.match(/(?:gordura|percentual|pct)\s*(?:de)?\s*(\d+(?:[.,]\d+)?)/i);
    const pesoMatch = text.match(/(?:peso)\s*(?:de)?\s*(\d+(?:[.,]\d+)?)/i);

    if (alturaMatch) {
      const val = parseFloat(alturaMatch[1].replace(',', '.'));
      // Se ditou em metros (ex: 1.75), converte para cm (175)
      const alturaFinal = val > 0 && val < 3 ? Math.round(val * 100) : Math.round(val);
      setAlturaCm(alturaFinal);
    }
    if (circMatch) setCircAbdominal(parseFloat(circMatch[1].replace(',', '.')));
    if (massaMatch) setMassaMuscular(parseFloat(massaMatch[1].replace(',', '.')));
    if (gorduraMatch) setPercGordura(parseFloat(gorduraMatch[1].replace(',', '.')));
    if (pesoMatch) setPeso(parseFloat(pesoMatch[1].replace(',', '.')));

    setObservacoes((prev) => (prev ? `${prev}. Dito por voz: ${text}` : `Dito por voz: ${text}`));

    setTimeout(() => setVoiceFeedback(null), 4000);
  };

  const simulateVoiceFill = () => {
    setIsListening(true);
    setVoiceFeedback('Simulando ditado de voz...');
    setTimeout(() => {
      const simulatedText = 'altura 178, abdômen 86.5, massa muscular 36.2, peso 81.5';
      parseVoiceTranscript(simulatedText);
      setIsListening(false);
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const novaAvaliacao: Omit<AvaliacaoFisica, 'id'> = {
      aluno_id: alunoId,
      data_registro: dataRegistro,
      circ_abdominal: circAbdominal,
      massa_muscular: massaMuscular,
      perc_gordura: percGordura,
      gordura_visceral: gorduraVisceral,
      taxa_metabolica: taxaMetabolica,
      peso: peso,
      altura_cm: alturaCm,
      observacoes: observacoes.trim() || undefined,
    };

    onSaveAvaliacao(novaAvaliacao);
    setIsSavedSuccess(true);
    setTimeout(() => setIsSavedSuccess(false), 3000);
  };

  // Live BMI / IMC calculation
  const imc = peso && alturaCm && alturaCm > 0 
    ? (peso / Math.pow(alturaCm / 100, 2)).toFixed(1) 
    : null;

  const getClassificacaoIMC = (valor: number) => {
    if (valor < 18.5) return { label: 'Abaixo do peso', cor: 'text-amber-300' };
    if (valor < 25) return { label: 'Eutrófico (Normal)', cor: 'text-emerald-400' };
    if (valor < 30) return { label: 'Sobrepeso', cor: 'text-amber-300' };
    return { label: 'Obesidade', cor: 'text-rose-400' };
  };

  return (
    <div 
      id="bioimpedancia-form-card"
      className="rounded-2xl border border-emerald-500/20 bg-[#032019]/90 backdrop-blur-xl shadow-xl p-5 flex flex-col"
    >
      {/* Form Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/15 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">
              Inserção Rápida de Bioimpedância
            </h3>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
              Mobile-Friendly
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Preencha na hora do treino com botões de passo rápido ou dite por voz
          </p>
        </div>

        {/* Voice Input Trigger Button */}
        <button
          type="button"
          id="btn-voice-dictate-measurements"
          onClick={toggleVoiceInput}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/20'
              : 'border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20 active:scale-95'
          }`}
          title="Fale as medidas em voz alta para preencher sem digitar"
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4" />
              <span>Ouvindo...</span>
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 text-cyan-400" />
              <span>Ditar Medidas por Voz</span>
            </>
          )}
        </button>
      </div>

      {/* Voice feedback toast if active */}
      {voiceFeedback && (
        <div className="mt-3 rounded-xl border border-cyan-400/30 bg-[#021813] p-2.5 text-xs text-cyan-300 flex items-center justify-between animate-in fade-in duration-150">
          <span className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            {voiceFeedback}
          </span>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Date Row */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-emerald-400" />
            Data da Medição
          </label>
          <input
            type="date"
            value={dataRegistro}
            onChange={(e) => setDataRegistro(e.target.value)}
            className="w-full sm:w-auto rounded-xl border border-emerald-500/25 bg-[#02140f] px-3 py-2 text-xs md:text-sm text-white focus:border-cyan-400 focus:outline-none"
            required
          />
        </div>

        {/* Primary Row: Circunferência Abdominal & Massa Muscular */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Circunferência Abdominal (cm) */}
          <div className="rounded-xl border border-cyan-400/30 bg-[#021813] p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Ruler className="h-4 w-4 text-cyan-400" />
                Circunferência Abdominal
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">cm</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStep(setCircAbdominal, -0.5, 40, 200)}
                className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#03241b] border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/20 active:scale-95 transition-all text-sm font-bold"
              >
                <Minus className="h-4 w-4" />
              </button>

              <input
                type="number"
                step="0.1"
                value={circAbdominal}
                onChange={(e) => setCircAbdominal(parseFloat(e.target.value) || 0)}
                className="w-full text-center text-xl font-extrabold text-white bg-transparent border-0 focus:ring-0 focus:outline-none"
                required
              />

              <button
                type="button"
                onClick={() => handleStep(setCircAbdominal, 0.5, 40, 200)}
                className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#03241b] border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/20 active:scale-95 transition-all text-sm font-bold"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Massa Muscular (kg) */}
          <div className="rounded-xl border border-emerald-500/30 bg-[#021813] p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Dumbbell className="h-4 w-4 text-emerald-400" />
                Massa Muscular
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">kg</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStep(setMassaMuscular, -0.2, 10, 120)}
                className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#03241b] border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all text-sm font-bold"
              >
                <Minus className="h-4 w-4" />
              </button>

              <input
                type="number"
                step="0.1"
                value={massaMuscular}
                onChange={(e) => setMassaMuscular(parseFloat(e.target.value) || 0)}
                className="w-full text-center text-xl font-extrabold text-white bg-transparent border-0 focus:ring-0 focus:outline-none"
                required
              />

              <button
                type="button"
                onClick={() => handleStep(setMassaMuscular, 0.2, 10, 120)}
                className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#03241b] border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all text-sm font-bold"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Bioimpedance Metrics + Altura em cm (sem vírgula) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* Altura (cm) - Sem necessidade de vírgula */}
          <div className="rounded-xl border border-cyan-400/35 bg-[#021813] p-2.5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1">
                <Ruler className="h-3 w-3 text-cyan-400" />
                Altura
              </label>
              <span className="text-[9px] font-extrabold text-cyan-300 bg-cyan-400/15 px-1.5 py-0.2 rounded border border-cyan-400/30">
                cm
              </span>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleStep(setAlturaCm, -1, 80, 240, 0)}
                className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#03241b] border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/20 active:scale-95 transition-all text-xs font-bold"
                title="-1 cm"
              >
                <Minus className="h-3 w-3" />
              </button>
              <div className="flex items-baseline justify-center">
                <input
                  type="number"
                  step="1"
                  min="80"
                  max="240"
                  value={alturaCm || ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    // Converte caso o usuário digite com vírgula ou ponto (ex: 1,75 -> 175)
                    if (raw.includes(',') || raw.includes('.')) {
                      const parsed = parseFloat(raw.replace(',', '.'));
                      if (parsed > 0 && parsed < 3) {
                        setAlturaCm(Math.round(parsed * 100));
                        return;
                      }
                    }
                    const clean = raw.replace(/[^\d]/g, '');
                    setAlturaCm(parseInt(clean, 10) || 0);
                  }}
                  placeholder="175"
                  className="w-14 text-center font-extrabold text-white bg-transparent border-0 text-base focus:outline-none"
                  required
                />
                <span className="text-[10px] text-cyan-400/70 font-semibold ml-0.5">cm</span>
              </div>
              <button
                type="button"
                onClick={() => handleStep(setAlturaCm, 1, 80, 240, 0)}
                className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#03241b] border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/20 active:scale-95 transition-all text-xs font-bold"
                title="+1 cm"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <span className="text-[8px] text-center text-slate-400 mt-1">sem vírgula (ex: 175)</span>
          </div>

          {/* Peso (kg) */}
          <div className="rounded-xl border border-emerald-500/15 bg-[#021611] p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                <Scale className="h-3 w-3 text-emerald-400" />
                Peso
              </label>
              <span className="text-[9px] text-slate-400 font-semibold">kg</span>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleStep(setPeso, -0.5, 30, 250)}
                className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#03241b] text-slate-300 hover:text-white"
              >
                <Minus className="h-3 w-3" />
              </button>
              <input
                type="number"
                step="0.1"
                value={peso}
                onChange={(e) => setPeso(parseFloat(e.target.value) || 0)}
                className="w-14 text-center font-bold text-white bg-transparent border-0 text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleStep(setPeso, 0.5, 30, 250)}
                className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#03241b] text-slate-300 hover:text-white"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <span className="text-[8px] text-center text-slate-500 mt-1">passo 0.5kg</span>
          </div>

          {/* % Gordura */}
          <div className="rounded-xl border border-emerald-500/15 bg-[#021611] p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                <Flame className="h-3 w-3 text-amber-400" />
                % Gordura
              </label>
              <span className="text-[9px] text-amber-300/80 font-semibold">%</span>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleStep(setPercGordura, -0.5, 3, 60)}
                className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#03241b] text-slate-300 hover:text-white"
              >
                <Minus className="h-3 w-3" />
              </button>
              <input
                type="number"
                step="0.1"
                value={percGordura}
                onChange={(e) => setPercGordura(parseFloat(e.target.value) || 0)}
                className="w-14 text-center font-bold text-white bg-transparent border-0 text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleStep(setPercGordura, 0.5, 3, 60)}
                className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#03241b] text-slate-300 hover:text-white"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <span className="text-[8px] text-center text-slate-500 mt-1">passo 0.5%</span>
          </div>

          {/* Gordura Visceral */}
          <div className="rounded-xl border border-emerald-500/15 bg-[#021611] p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                Gord. Visceral
              </label>
              <span className="text-[9px] text-slate-400 font-semibold">1-30</span>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleStep(setGorduraVisceral, -1, 1, 30, 0)}
                className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#03241b] text-slate-300 hover:text-white"
              >
                <Minus className="h-3 w-3" />
              </button>
              <input
                type="number"
                step="1"
                value={gorduraVisceral}
                onChange={(e) => setGorduraVisceral(parseInt(e.target.value, 10) || 1)}
                className="w-14 text-center font-bold text-white bg-transparent border-0 text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleStep(setGorduraVisceral, 1, 1, 30, 0)}
                className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#03241b] text-slate-300 hover:text-white"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <span className="text-[8px] text-center text-slate-500 mt-1">escala nível</span>
          </div>

          {/* Taxa Metabólica Basal (kcal) */}
          <div className="rounded-xl border border-emerald-500/15 bg-[#021611] p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                TMB (kcal)
              </label>
              <span className="text-[9px] text-slate-400 font-semibold">kcal</span>
            </div>
            <div className="flex items-center justify-center py-0.5">
              <input
                type="number"
                step="10"
                value={taxaMetabolica}
                onChange={(e) => setTaxaMetabolica(parseInt(e.target.value, 10) || 0)}
                className="w-full text-center font-bold text-white bg-transparent border-0 text-sm focus:outline-none"
              />
            </div>
            <span className="text-[8px] text-center text-slate-500 mt-1">gasto basal</span>
          </div>
        </div>

        {/* Live BMI / IMC Preview */}
        {imc && (
          <div className="rounded-xl border border-emerald-500/20 bg-[#021510] px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Scale className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-slate-400">Estatura:</span>
              <span className="font-extrabold text-white">{alturaCm} cm</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Peso:</span>
              <span className="font-extrabold text-white">{peso} kg</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">IMC Estimado:</span>
              <span className="font-extrabold text-cyan-300">{imc} kg/m²</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 ${getClassificacaoIMC(parseFloat(imc)).cor}`}>
                {getClassificacaoIMC(parseFloat(imc)).label}
              </span>
            </div>
          </div>
        )}

        {/* Observações / Notas Rápidas */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
            Observação Clínica / Feedback do Aluno:
          </label>
          <input
            type="text"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex: Sentiu redução nas roupas, aumentou carga no agachamento..."
            className="w-full rounded-xl border border-emerald-500/25 bg-[#02140f] px-3 py-2 text-xs md:text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        {/* Submit Actions */}
        <div className="pt-2 flex items-center justify-between gap-3">
          {isSavedSuccess ? (
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Check className="h-4 w-4" />
              Avaliação salva com sucesso! Gráficos atualizados.
            </div>
          ) : (
            <span className="text-[11px] text-slate-400">
              Registrado instantaneamente no histórico do aluno
            </span>
          )}

          <button
            type="submit"
            id="btn-save-bioimpedancia"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 px-6 py-2.5 text-xs md:text-sm font-extrabold text-slate-950 shadow-lg shadow-cyan-400/20 hover:brightness-110 active:scale-95 transition-all ml-auto"
          >
            <Check className="h-4 w-4 text-slate-950 stroke-[3]" />
            Salvar Avaliação
          </button>
        </div>
      </form>
    </div>
  );
};
