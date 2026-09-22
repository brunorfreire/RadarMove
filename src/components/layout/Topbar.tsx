import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Mic, 
  MessageSquare, 
  Menu, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { Aluno, RadarAlerta } from '../../types';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface TopbarProps {
  onToggleMobileSidebar: () => void;
  onOpenVoiceModal: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  alunos: Aluno[];
  alertas: RadarAlerta[];
  onSelectAlunoFromSearch: (aluno: Aluno) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleMobileSidebar,
  onOpenVoiceModal,
  searchQuery,
  setSearchQuery,
  alunos,
  alertas,
  onSelectAlunoFromSearch,
}) => {
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filteredAlunos = searchQuery.trim()
    ? alunos.filter((a) =>
        a.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.telefone.includes(searchQuery)
      )
    : [];

  const handleSelectSearchItem = (aluno: Aluno) => {
    onSelectAlunoFromSearch(aluno);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  return (
    <header
      id="main-topbar"
      className="sticky top-0 z-20 flex h-20 w-full items-center justify-between border-b border-emerald-500/15 bg-[#021813]/85 px-4 md:px-8 backdrop-blur-xl"
    >
      {/* Left: Mobile hamburger & Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        {/* Mobile toggle */}
        <button
          id="mobile-menu-toggle-btn"
          onClick={onToggleMobileSidebar}
          aria-label="Abrir menu mobile"
          className="flex h-10 w-10 md:hidden items-center justify-center rounded-xl border border-emerald-500/20 bg-[#04241d] text-slate-300 hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search Bar with Live Instant Results */}
        <div className="relative w-full">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              id="topbar-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="Buscar aluno por nome ou telefone..."
              className="h-11 w-full rounded-xl border border-emerald-500/20 bg-[#031d17] pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:bg-[#04271f] focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
            />
            {searchQuery && (
              <button
                id="clear-search-btn"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-xs text-slate-400 hover:text-white"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchFocused && filteredAlunos.length > 0 && (
            <div
              id="search-results-dropdown"
              className="absolute left-0 right-0 top-13 z-50 rounded-xl border border-emerald-500/25 bg-[#031d17] p-2 shadow-2xl backdrop-blur-xl animate-in fade-in duration-150"
            >
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Alunos Encontrados ({filteredAlunos.length})
              </div>
              <div className="mt-1 space-y-1 max-h-60 overflow-y-auto">
                {filteredAlunos.map((aluno) => (
                  <button
                    key={aluno.id}
                    onClick={() => handleSelectSearchItem(aluno)}
                    className="flex w-full items-center justify-between rounded-lg p-2.5 text-left hover:bg-emerald-500/15 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400">
                        {aluno.nome.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{aluno.nome}</p>
                        <p className="text-xs text-slate-400">{aluno.objetivo}</p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        aluno.status === 'em_risco'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {aluno.status === 'em_risco' ? 'Risco' : 'Ativo'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions, Voice Recording & Status */}
      <div className="flex items-center gap-2.5">
        {/* Botão de Instalação PWA na Tela Inicial */}
        <PWAInstallButton />

        {/* BOTÃO PRINCIPAL DE VOZ (Destaque para a solicitação do usuário) */}
        <button
          id="topbar-voice-record-btn"
          onClick={onOpenVoiceModal}
          className="relative group flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 px-4 py-2.5 text-xs md:text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-950"></span>
          </span>
          <Mic className="h-4 w-4 fill-slate-950" />
          <span className="hidden sm:inline">Gravar Áudio</span>
          <span className="rounded bg-slate-950/20 px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-slate-950">
            Falar
          </span>
        </button>

        {/* WhatsApp Connection Pill */}
        <div
          id="whatsapp-status-pill"
          className="hidden lg:flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-[#031d17] px-3 py-2 text-xs text-slate-300"
        >
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200">WhatsApp Web</span>
          <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-400/20">
            Online
          </span>
        </div>

        {/* Notificações / Radar de Alertas Dropdown */}
        <div className="relative">
          <button
            id="alerts-bell-btn"
            onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
            aria-label="Notificações do Radar de Relacionamento"
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-[#031d17] text-slate-300 hover:border-cyan-400 hover:text-white transition-all"
          >
            <Bell className="h-5 w-5" />
            {alertas.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-md">
                {alertas.length}
              </span>
            )}
          </button>

          {/* Alertas Popover */}
          {showAlertsDropdown && (
            <div
              id="alerts-dropdown-menu"
              className="absolute right-0 top-13 z-50 w-80 md:w-96 rounded-2xl border border-emerald-500/30 bg-[#031e18] p-4 shadow-2xl backdrop-blur-2xl animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between border-b border-emerald-500/15 pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-bold text-white">
                    Radar de Relacionamento
                  </span>
                </div>
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[11px] font-bold text-rose-300">
                  {alertas.length} pendentes
                </span>
              </div>

              <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {alertas.map((alerta) => (
                  <div
                    key={alerta.id}
                    className="rounded-xl border border-emerald-500/15 bg-[#021813] p-3 text-xs hover:border-cyan-400/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100">{alerta.aluno_nome}</span>
                      <span className="text-[10px] text-slate-400">{alerta.tempo_atras}</span>
                    </div>
                    <p className="mt-1 text-slate-300 leading-relaxed">{alerta.descricao}</p>
                    <div className="mt-2 flex items-center justify-end">
                      <span className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1">
                        Ação sugerida pronta no Radar →
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 border-t border-emerald-500/15 pt-2 text-center">
                <button
                  onClick={() => setShowAlertsDropdown(false)}
                  className="text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
