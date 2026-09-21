import React from 'react';
import { 
  Sparkles, 
  Sun, 
  Zap, 
  Shield, 
  Apple, 
  HeartPulse, 
  ChevronRight, 
  ArrowLeft, 
  ChevronDown, 
  X,
  Target,
  Compass
} from 'lucide-react';
import { CategoriaDesafio } from '../../types';

interface CategoriasExplainerProps {
  selectedCategoria: string;
  onSelectCategoria: (cat: string) => void;
  counts: Record<string, number>;
}

export const CategoriasExplainer: React.FC<CategoriasExplainerProps> = ({
  selectedCategoria,
  onSelectCategoria,
  counts,
}) => {
  const pilares = [
    {
      id: 'Lazer Ativo',
      title: 'Lazer Ativo',
      subtitle: 'Movimento ao Ar Livre & Fim de Semana',
      description: 'Pedal com vento no rosto, caminhadas em parques ou trilhas, esportes em grupo e explorações ativas de fim de semana.',
      badge: 'Lazer & Vitalidade',
      icon: Compass,
      colorBorder: 'border-sky-400/30',
      colorBg: 'bg-sky-500/10',
      colorText: 'text-sky-300',
      activeGradient: 'from-sky-500/25 via-teal-500/20 to-emerald-500/15 border-sky-400',
      tagColor: 'bg-sky-400/20 text-sky-300',
    },
    {
      id: 'Mindset Estoico',
      title: 'Mindset Estoico',
      subtitle: 'Força Mental, Foco & Disciplina',
      description: 'Marco Aurélio, foco no que você controla, disciplina que supera a motivação e micro-vitórias do dia a dia.',
      badge: 'Mindset & Aderência',
      icon: Shield,
      colorBorder: 'border-amber-500/30',
      colorBg: 'bg-amber-500/10',
      colorText: 'text-amber-300',
      activeGradient: 'from-amber-500/20 to-orange-500/15 border-amber-400',
      tagColor: 'bg-amber-400/20 text-amber-300',
    },
    {
      id: 'Lifestyle 23h',
      title: 'Lifestyle 23h',
      subtitle: 'O Resultado Fora da Academia',
      description: 'O aluno passa 1 hora com você e 23 horas no mundo. Água ao acordar, higiene do sono e passos diários.',
      badge: 'Retenção & Hábito',
      icon: Sun,
      colorBorder: 'border-emerald-400/30',
      colorBg: 'bg-emerald-500/10',
      colorText: 'text-emerald-300',
      activeGradient: 'from-emerald-500/20 to-teal-500/15 border-emerald-400',
      tagColor: 'bg-emerald-400/20 text-emerald-300',
    },
    {
      id: 'Desafio de Bolso',
      title: 'Desafio de Bolso',
      subtitle: 'Micro-Ações de 1 a 3 Minutos',
      description: 'Ideal para alunos que cancelaram o treino ou estão na correria do trabalho. Destrava o corpo em qualquer lugar.',
      badge: 'Anti-Cancelamento',
      icon: Zap,
      colorBorder: 'border-teal-500/30',
      colorBg: 'bg-teal-500/10',
      colorText: 'text-teal-400',
      activeGradient: 'from-teal-500/20 to-emerald-500/15 border-teal-400',
      tagColor: 'bg-teal-400/20 text-teal-300',
    },
    {
      id: 'Desafio de Conversão',
      title: 'Conversão & Leads',
      subtitle: 'Degustação para Prospectos',
      description: 'Micro-desafios irresistíveis de 3 a 5 dias para enviar a possíveis clientes no WhatsApp e gerar valor antes da matrícula.',
      badge: 'Aquisição & Vendas',
      icon: Target,
      colorBorder: 'border-cyan-400/30',
      colorBg: 'bg-cyan-500/10',
      colorText: 'text-cyan-300',
      activeGradient: 'from-cyan-500/25 via-teal-500/20 to-emerald-500/15 border-cyan-400',
      tagColor: 'bg-cyan-400/20 text-cyan-300',
    },
    {
      id: 'Nutrição',
      title: 'Nutrição & Hidratação',
      subtitle: 'Aderência Alimentar Realista',
      description: 'Micro-metas de proteína na primeira refeição, corte de açúcar líquido e fotos do prato no almoço.',
      badge: 'Nutrição Consciente',
      icon: Apple,
      colorBorder: 'border-rose-500/30',
      colorBg: 'bg-rose-500/10',
      colorText: 'text-rose-300',
      activeGradient: 'from-rose-500/20 to-pink-500/15 border-rose-400',
      tagColor: 'bg-rose-400/20 text-rose-300',
    },
    {
      id: 'Recuperação',
      title: 'Recuperação & Sono',
      subtitle: 'Descanso e Longevidade Ativa',
      description: 'Alongamento de quadril noturno, respiração diafragmática, descompressão lombar e relaxamento.',
      badge: 'Anti-Overreaching',
      icon: HeartPulse,
      colorBorder: 'border-purple-500/30',
      colorBg: 'bg-purple-500/10',
      colorText: 'text-purple-300',
      activeGradient: 'from-purple-500/20 to-indigo-500/15 border-purple-400',
      tagColor: 'bg-purple-400/20 text-purple-300',
    },
  ];

  return (
    <div id="categorias-explainer-section" className="space-y-3">
      {/* Top indicator bar when a card is selected */}
      {selectedCategoria !== 'Todos' && (
        <div className="flex items-center justify-between gap-2 p-2.5 px-4 rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-slate-300">
              Visualizando opções de: <strong className="text-white">{selectedCategoria}</strong>
            </span>
          </div>

          <button
            type="button"
            id="btn-voltar-todos-os-cards-top"
            onClick={() => onSelectCategoria('Todos')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-300 font-bold transition-all text-xs cursor-pointer active:scale-95 border border-cyan-400/30"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Voltar aos cards (Ver todos)</span>
          </button>
        </div>
      )}

      {/* Cards Grid */}
      <div id="categorias-explainer-cards" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7 gap-3.5">
        {pilares.map((pilar) => {
          const Icon = pilar.icon;
          const isSelected = selectedCategoria === pilar.id;
          const count = pilar.id === 'Mindset Estoico'
            ? ((counts['Mindset Estoico'] || 0) + (counts['Estoicismo'] || 0))
            : (counts[pilar.id] || 0);

          return (
            <div
              key={pilar.id}
              id={`card-pilar-${pilar.id.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => onSelectCategoria(isSelected ? 'Todos' : pilar.id)}
              role="button"
              tabIndex={0}
              className={`cursor-pointer rounded-2xl border p-4 backdrop-blur-xl transition-all duration-200 text-left flex flex-col justify-between relative overflow-hidden group ${
                isSelected
                  ? `bg-gradient-to-b ${pilar.activeGradient} shadow-2xl shadow-cyan-500/10 ring-2 ring-cyan-400/40 border-cyan-400`
                  : `bg-[#032019]/90 ${pilar.colorBorder} hover:border-emerald-400/50 hover:bg-[#042820]`
              }`}
            >
              {/* Background Glow */}
              <div className={`absolute -right-8 -bottom-8 h-28 w-28 rounded-full blur-2xl opacity-15 pointer-events-none ${pilar.colorBg}`} />

              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center border ${pilar.colorBorder} ${pilar.colorBg} ${pilar.colorText} group-hover:scale-105 transition-transform`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-300 bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                      {count} {count === 1 ? 'card' : 'cards'}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-extrabold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                  {pilar.title}
                </h3>
                <p className={`text-[11px] font-semibold ${pilar.colorText} mb-1.5 line-clamp-1`}>
                  {pilar.subtitle}
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
                  {pilar.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-emerald-500/10 flex items-center justify-between text-xs font-bold">
                {isSelected ? (
                  <span className="text-cyan-300 flex items-center gap-1 text-[11px]">
                    <ChevronDown className="h-3.5 w-3.5 animate-bounce" />
                    <span>Aberto abaixo</span>
                  </span>
                ) : (
                  <span className="text-slate-400 group-hover:text-slate-200 text-[11px]">
                    Ver opções
                  </span>
                )}

                {isSelected ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCategoria('Todos');
                    }}
                    title="Fechar e voltar aos cards"
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition-all"
                  >
                    <X className="h-3 w-3" />
                    <span>Voltar</span>
                  </button>
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
