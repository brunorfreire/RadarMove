import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Sparkles, 
  MessageSquare, 
  Database, 
  ChevronLeft, 
  ChevronRight, 
  Activity,
  Mic,
  ShieldCheck,
  Zap,
  UserPlus,
  Target
} from 'lucide-react';
import { Profissional } from '../../types';
import { UserProfileDropdown } from './UserProfileDropdown';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface SidebarProps {
  activeTab: 'dashboard' | 'alunos' | 'desafios' | 'leads' | 'supabase';
  setActiveTab: (tab: 'dashboard' | 'alunos' | 'desafios' | 'leads' | 'supabase') => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  profissional: Profissional;
  onOpenVoiceModal: () => void;
  totalAlertas: number;
  totalLeadsPendentes?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  profissional,
  onOpenVoiceModal,
  totalAlertas,
  totalLeadsPendentes = 4,
}) => {
  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard & Radar',
      icon: LayoutDashboard,
      badge: totalAlertas > 0 ? totalAlertas : undefined,
      badgeColor: 'bg-rose-500 text-white',
      tooltip: 'Radar de Relacionamento e Métricas',
    },
    {
      id: 'alunos' as const,
      label: 'Ficha dos Alunos',
      icon: Users,
      badge: '24',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      tooltip: 'Bioimpedância, Evolução e Gráficos',
    },
    {
      id: 'leads' as const,
      label: 'Leads & Conversão',
      icon: UserPlus,
      badge: totalLeadsPendentes > 0 ? String(totalLeadsPendentes) : undefined,
      badgeColor: 'bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-black shadow-sm',
      tooltip: 'Desafios para Leads e Follow-up de Vendas',
    },
    {
      id: 'desafios' as const,
      label: 'Biblioteca de Desafios',
      icon: Sparkles,
      badge: '13',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
      tooltip: 'Lifestyle 23h, Conversão, Bolso, Estoicismo',
    },
    {
      id: 'supabase' as const,
      label: 'Supabase & RLS',
      icon: Database,
      badge: 'Ativo',
      badgeColor: 'bg-emerald-500/10 text-emerald-400',
      tooltip: 'Multi-tenant RLS e Banco de Dados',
    },
  ];

  return (
    <aside
      id="main-sidebar"
      className={`relative z-30 flex flex-col justify-between border-r border-emerald-500/15 bg-[#021813]/95 backdrop-blur-xl transition-all duration-300 ease-in-out select-none ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Glow highlight top edge */}
      <div className="pointer-events-none absolute left-0 top-0 h-32 w-full bg-gradient-to-b from-emerald-500/10 to-transparent blur-xl" />

      {/* Top Brand / Logo */}
      <div>
        <div className="flex h-20 items-center justify-between px-4 border-b border-emerald-500/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-md shadow-emerald-500/25">
              <Activity className="h-6 w-6 text-slate-950 stroke-[2.5]" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400 border border-[#021813]"></span>
              </span>
            </div>

            {!collapsed && (
              <div className="flex flex-col animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold tracking-tight text-white text-lg font-sans">
                    RadarMove
                  </span>
                  <span className="rounded bg-cyan-400/15 px-1.5 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-400/30">
                    CRM
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium truncate">
                  Retenção para Personal
                </span>
              </div>
            )}
          </div>

          {/* Botão Recolher/Expandir */}
          <button
            id="toggle-sidebar-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-[#04241d] text-slate-300 hover:border-cyan-400/50 hover:bg-[#063329] hover:text-white transition-all"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Quick Voice Dictation Trigger - Atende ao pedido do usuário de não ter que digitar */}
        <div className="p-3">
          <button
            id="sidebar-quick-voice-btn"
            onClick={onOpenVoiceModal}
            className={`w-full group relative overflow-hidden rounded-xl border border-cyan-400/30 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/15 p-3 text-left transition-all hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/15 active:scale-98 ${
              collapsed ? 'flex justify-center p-2.5' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-cyan-400 text-slate-950 shadow-md group-hover:scale-105 transition-transform">
                <Mic className="h-5 w-5 fill-slate-950 animate-pulse" />
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                      Gravar Áudio Rápido
                    </span>
                    <span className="rounded bg-cyan-400/20 px-1 py-0.2 text-[9px] font-bold text-cyan-300">
                      NOVO
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Ditado de recado p/ WhatsApp
                  </p>
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Navigation List */}
        <nav className="mt-1 px-3 space-y-1.5" aria-label="Navegação principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                title={collapsed ? item.label : undefined}
                className={`group relative flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-cyan-300 border border-emerald-500/30 shadow-md shadow-emerald-500/10'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                )}

                <Icon
                  className={`h-5 w-5 flex-shrink-0 transition-colors ${
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />

                {!collapsed && (
                  <div className="flex flex-1 items-center justify-between overflow-hidden">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.badgeColor || 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile / Tenant Info com Dropdown Dinâmico Supabase */}
      <div className="border-t border-emerald-500/10 p-3 space-y-2">
        {!collapsed && <PWAInstallButton variant="sidebar" />}
        <UserProfileDropdown collapsed={collapsed} />
      </div>
    </aside>
  );
};
