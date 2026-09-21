import React from 'react';
import { 
  Calendar, 
  Ruler, 
  Dumbbell, 
  Flame, 
  TrendingDown, 
  TrendingUp, 
  Trash2, 
  FileText,
  Clock
} from 'lucide-react';
import { AvaliacaoFisica } from '../../types';

interface HistoricoAvaliacoesProps {
  avaliacoes: AvaliacaoFisica[];
  onDeleteAvaliacao?: (id: string) => void;
}

export const HistoricoAvaliacoes: React.FC<HistoricoAvaliacoesProps> = ({
  avaliacoes,
  onDeleteAvaliacao,
}) => {
  if (avaliacoes.length === 0) {
    return null;
  }

  // Descending sort for history table (newest first)
  const sortedAvaliacoes = [...avaliacoes].sort(
    (a, b) => new Date(b.data_registro).getTime() - new Date(a.data_registro).getTime()
  );

  return (
    <div 
      id="historico-avaliacoes-card"
      className="rounded-2xl border border-emerald-500/20 bg-[#032019]/90 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col"
    >
      <div className="border-b border-emerald-500/15 bg-[#021813]/80 p-4 md:p-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm md:text-base font-bold text-white tracking-tight">
            Histórico Cronológico de Avaliações ({avaliacoes.length})
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">
          Mais recentes primeiro
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-emerald-500/15 bg-[#021510] text-[10px] uppercase font-bold text-slate-400">
            <tr>
              <th className="py-3 px-4">Data</th>
              <th className="py-3 px-4 text-cyan-300">Altura</th>
              <th className="py-3 px-4 text-cyan-300">Circ. Abdominal</th>
              <th className="py-3 px-4 text-emerald-400">Massa Muscular</th>
              <th className="py-3 px-4 text-amber-300">% Gordura</th>
              <th className="py-3 px-4">Gord. Visceral</th>
              <th className="py-3 px-4">Peso</th>
              <th className="py-3 px-4">Observações</th>
              {onDeleteAvaliacao && <th className="py-3 px-4 text-right">Ação</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-500/10 text-slate-200">
            {sortedAvaliacoes.map((av, index) => {
              const parts = av.data_registro.split('-');
              const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : av.data_registro;
              const isLatest = index === 0;

              return (
                <tr 
                  key={av.id} 
                  className={`hover:bg-emerald-500/5 transition-colors ${
                    isLatest ? 'bg-emerald-500/10' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-bold whitespace-nowrap text-white flex items-center gap-1.5">
                    {isLatest && (
                      <span className="rounded bg-cyan-400/20 px-1.5 py-0.2 text-[9px] font-extrabold text-cyan-300">
                        Atual
                      </span>
                    )}
                    {formattedDate}
                  </td>
                  <td className="py-3 px-4 font-bold text-cyan-300 whitespace-nowrap">
                    {av.altura_cm ? `${av.altura_cm} cm` : '-'}
                  </td>
                  <td className="py-3 px-4 font-extrabold text-cyan-300 whitespace-nowrap">
                    {av.circ_abdominal} cm
                  </td>
                  <td className="py-3 px-4 font-extrabold text-emerald-400 whitespace-nowrap">
                    {av.massa_muscular} kg
                  </td>
                  <td className="py-3 px-4 font-semibold text-amber-300 whitespace-nowrap">
                    {av.perc_gordura}%
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    Nível {av.gordura_visceral}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-300">
                    {av.peso ? `${av.peso} kg` : '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                    {av.observacoes ? (
                      <span title={av.observacoes}>"{av.observacoes}"</span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  {onDeleteAvaliacao && (
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onDeleteAvaliacao(av.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Remover avaliação"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
