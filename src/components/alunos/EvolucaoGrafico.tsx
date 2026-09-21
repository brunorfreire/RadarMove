import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { TrendingDown, TrendingUp, Activity, Ruler, Dumbbell, Sparkles } from 'lucide-react';
import { AvaliacaoFisica } from '../../types';

interface EvolucaoGraficoProps {
  avaliacoes: AvaliacaoFisica[];
  alunoNome: string;
}

export const EvolucaoGrafico: React.FC<EvolucaoGraficoProps> = ({ avaliacoes, alunoNome }) => {
  const [metricView, setMetricView] = useState<'principal' | 'gordura_peso'>('principal');

  if (!avaliacoes || avaliacoes.length === 0) {
    return (
      <div 
        id="evolucao-grafico-empty" 
        className="rounded-2xl border border-emerald-500/20 bg-[#032019]/90 p-8 text-center backdrop-blur-xl"
      >
        <Activity className="mx-auto h-10 w-10 text-emerald-400 mb-2 opacity-50" />
        <h4 className="text-sm font-bold text-white">Nenhuma avaliação física registrada</h4>
        <p className="text-xs text-slate-400 mt-1">
          Use o formulário rápido de bioimpedância para registrar a primeira medição de {alunoNome}.
        </p>
      </div>
    );
  }

  // Sort by date ascending for chronological plotting
  const sortedData = [...avaliacoes].sort(
    (a, b) => new Date(a.data_registro).getTime() - new Date(b.data_registro).getTime()
  );

  const formattedData = sortedData.map((item) => {
    const parts = item.data_registro.split('-');
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : item.data_registro;
    return {
      ...item,
      dataFormatada: formattedDate,
    };
  });

  const primeira = sortedData[0];
  const ultima = sortedData[sortedData.length - 1];

  const deltaCircAbdominal = Number((ultima.circ_abdominal - primeira.circ_abdominal).toFixed(1));
  const deltaMassaMuscular = Number((ultima.massa_muscular - primeira.massa_muscular).toFixed(1));
  const deltaPercGordura = Number((ultima.perc_gordura - primeira.perc_gordura).toFixed(1));

  // Custom Dark Glassmorphism Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as AvaliacaoFisica & { dataFormatada: string };
      return (
        <div className="rounded-xl border border-emerald-500/30 bg-[#021813]/95 p-3.5 shadow-2xl backdrop-blur-xl text-xs space-y-1.5 min-w-[200px]">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5 font-bold text-slate-200">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
              {dataPoint.data_registro}
            </span>
            {dataPoint.peso && (
              <span className="text-slate-400 font-normal">
                {dataPoint.peso} kg
              </span>
            )}
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-cyan-300 flex items-center gap-1">
                <Ruler className="h-3 w-3" /> Circ. Abdominal:
              </span>
              <span className="font-extrabold text-white">{dataPoint.circ_abdominal} cm</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-emerald-400 flex items-center gap-1">
                <Dumbbell className="h-3 w-3" /> Massa Muscular:
              </span>
              <span className="font-extrabold text-white">{dataPoint.massa_muscular} kg</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-amber-300">% Gordura:</span>
              <span className="font-semibold text-slate-200">{dataPoint.perc_gordura}%</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Gordura Visceral:</span>
              <span className="font-semibold text-slate-200">Nível {dataPoint.gordura_visceral}</span>
            </div>

            {dataPoint.observacoes && (
              <p className="mt-1 pt-1 border-t border-emerald-500/10 text-[11px] text-slate-300 italic">
                "{dataPoint.observacoes}"
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      id="evolucao-grafico-card" 
      className="rounded-2xl border border-emerald-500/20 bg-[#032019]/90 backdrop-blur-xl shadow-xl p-5 flex flex-col"
    >
      {/* Header with Title and Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/15 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">
              Evolução da Bioimpedância & Antropometria
            </h3>
            <span className="rounded-full bg-cyan-400/15 px-2 py-0.5 text-[10px] font-extrabold text-cyan-400 border border-cyan-400/25">
              Recharts Dual-Axis
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cruzamento direto de <span className="text-cyan-300 font-semibold">Circunferência Abdominal (cm)</span> vs <span className="text-emerald-400 font-semibold">Massa Muscular (kg)</span>
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 rounded-xl bg-[#021510] p-1 border border-emerald-500/20">
          <button
            onClick={() => setMetricView('principal')}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
              metricView === 'principal'
                ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Abdômen vs Músculo
          </button>
          <button
            onClick={() => setMetricView('gordura_peso')}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
              metricView === 'gordura_peso'
                ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            % Gordura & Peso
          </button>
        </div>
      </div>

      {/* Delta Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        {/* Abdômen Delta */}
        <div className="rounded-xl border border-cyan-400/20 bg-[#021611] p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Circ. Abdominal
          </span>
          <div className="mt-1 flex items-center justify-center gap-1">
            <span className="text-xl font-extrabold text-cyan-300">
              {ultima.circ_abdominal} cm
            </span>
          </div>
          <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-bold">
            {deltaCircAbdominal <= 0 ? (
              <span className="text-emerald-400 flex items-center gap-0.5">
                <TrendingDown className="h-3 w-3" /> {deltaCircAbdominal} cm
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" /> +{deltaCircAbdominal} cm
              </span>
            )}
          </div>
        </div>

        {/* Massa Muscular Delta */}
        <div className="rounded-xl border border-emerald-500/20 bg-[#021611] p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Massa Muscular
          </span>
          <div className="mt-1 flex items-center justify-center gap-1">
            <span className="text-xl font-extrabold text-emerald-400">
              {ultima.massa_muscular} kg
            </span>
          </div>
          <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-bold">
            {deltaMassaMuscular >= 0 ? (
              <span className="text-emerald-400 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" /> +{deltaMassaMuscular} kg
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-0.5">
                <TrendingDown className="h-3 w-3" /> {deltaMassaMuscular} kg
              </span>
            )}
          </div>
        </div>

        {/* % Gordura Delta */}
        <div className="rounded-xl border border-amber-500/20 bg-[#021611] p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            % de Gordura
          </span>
          <div className="mt-1 flex items-center justify-center gap-1">
            <span className="text-xl font-extrabold text-amber-300">
              {ultima.perc_gordura}%
            </span>
          </div>
          <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-bold">
            {deltaPercGordura <= 0 ? (
              <span className="text-emerald-400 flex items-center gap-0.5">
                <TrendingDown className="h-3 w-3" /> {deltaPercGordura}%
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" /> +{deltaPercGordura}%
              </span>
            )}
          </div>
        </div>

        {/* Gordura Visceral */}
        <div className="rounded-xl border border-emerald-500/20 bg-[#021611] p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Gordura Visceral
          </span>
          <div className="mt-1 flex items-center justify-center gap-1">
            <span className="text-xl font-extrabold text-white">
              Nível {ultima.gordura_visceral}
            </span>
          </div>
          <span className="mt-1 text-[11px] text-slate-400 block">
            TMB: {ultima.taxa_metabolica} kcal
          </span>
        </div>
      </div>

      {/* Main Recharts Graph Container */}
      <div className="h-72 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          {metricView === 'principal' ? (
            <ComposedChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCircAbdominal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMassaMuscular" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#04392b" vertical={false} />
              
              <XAxis 
                dataKey="dataFormatada" 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false}
                axisLine={{ stroke: '#04392b' }}
              />

              {/* Y Axis Left: Circunferência Abdominal */}
              <YAxis 
                yAxisId="left"
                stroke="#22d3ee" 
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#04392b' }}
                domain={['auto', 'auto']}
                unit="cm"
              />

              {/* Y Axis Right: Massa Muscular */}
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#10b981" 
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#04392b' }}
                domain={['auto', 'auto']}
                unit="kg"
              />

              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                align="right" 
                height={30}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
              />

              {/* Linha e Área de Circunferência Abdominal */}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="circ_abdominal"
                name="Circ. Abdominal (cm)"
                stroke="#22d3ee"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorCircAbdominal)"
                dot={{ r: 4, fill: '#22d3ee', stroke: '#021813', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#22d3ee', stroke: '#ffffff', strokeWidth: 2 }}
              />

              {/* Linha e Área de Massa Muscular */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="massa_muscular"
                name="Massa Muscular (kg)"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10b981', stroke: '#021813', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </ComposedChart>
          ) : (
            <ComposedChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#04392b" vertical={false} />
              <XAxis dataKey="dataFormatada" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" stroke="#f59e0b" fontSize={11} tickLine={false} unit="%" />
              <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" fontSize={11} tickLine={false} unit="kg" />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" align="right" height={30} wrapperStyle={{ fontSize: '11px' }} />

              <Line
                yAxisId="left"
                type="monotone"
                dataKey="perc_gordura"
                name="% Gordura Corporal"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 4, fill: '#f59e0b' }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="peso"
                name="Peso Total (kg)"
                stroke="#38bdf8"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 4, fill: '#38bdf8' }}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Insight */}
      <div className="mt-3 pt-3 border-t border-emerald-500/10 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 text-emerald-300">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          Tendência: {deltaCircAbdominal <= 0 && deltaMassaMuscular >= 0 ? 'Excelente recomposição corporal (perda de gordura visceral com hipertrofia)' : 'Ajustar volume de treino e consistência nutricional'}
        </span>
        <span className="text-slate-500">
          {sortedData.length} registros cronológicos
        </span>
      </div>
    </div>
  );
};
