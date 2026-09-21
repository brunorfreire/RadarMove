import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { AlunosView } from './components/alunos/AlunosView';
import { DesafiosView } from './components/desafios/DesafiosView';
import { LeadsView } from './components/leads/LeadsView';
import { QuickVoiceModal } from './components/audio/QuickVoiceModal';
import { 
  mockProfissional, 
  mockAlunos, 
  mockAvaliacoes, 
  mockDesafiosTemplates, 
  mockAlertasRadar, 
  mockWhatsAppFeed,
  mockFotosEvolucao,
  mockDesafiosEnviados,
  mockLeads
} from './lib/mockData';
import { Aluno, AvaliacaoFisica, RadarAlerta, WhatsAppMensagem, DesafioTemplate, FotoEvolucao, DesafioEnviado, Lead } from './types';
import { openWhatsApp } from './lib/whatsappUtils';
import { 
  Sparkles, 
  Mic, 
  Send, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Calendar,
  MessageCircle,
  Database
} from 'lucide-react';

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alunos' | 'desafios' | 'leads' | 'supabase'>('dashboard');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // App state
  const [alunos, setAlunos] = useState<Aluno[]>(mockAlunos);
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoFisica[]>(mockAvaliacoes);
  const [alertas, setAlertas] = useState<RadarAlerta[]>(mockAlertasRadar);
  const [feedWhatsApp, setFeedWhatsApp] = useState<WhatsAppMensagem[]>(mockWhatsAppFeed);
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(mockAlunos[0]);
  const [templates, setTemplates] = useState<DesafioTemplate[]>(mockDesafiosTemplates);
  const [fotosEvolucao, setFotosEvolucao] = useState<FotoEvolucao[]>(mockFotosEvolucao);
  const [desafiosEnviados, setDesafiosEnviados] = useState<DesafioEnviado[]>(mockDesafiosEnviados);

  const handleAlunoConvertido = (novoAluno: Aluno, lead: Lead) => {
    // Add converted student to Alunos list
    setAlunos((prev) => [novoAluno, ...prev]);
    setSelectedAluno(novoAluno);
  };

  const handleAddFotoEvolucao = (novaFotoData: Omit<FotoEvolucao, 'id'>) => {
    const novaFoto: FotoEvolucao = {
      ...novaFotoData,
      id: `foto-${Date.now()}`,
    };
    setFotosEvolucao((prev) => [novaFoto, ...prev]);
  };

  const handleDeleteFotoEvolucao = (fotoId: string) => {
    setFotosEvolucao((prev) => prev.filter((f) => f.id !== fotoId));
  };

  const handleUpdateAvatar = (alunoId: string, newAvatarUrl: string) => {
    setAlunos((prev) =>
      prev.map((a) => (a.id === alunoId ? { ...a, avatar_url: newAvatarUrl } : a))
    );
    setSelectedAluno((prev) =>
      prev?.id === alunoId ? { ...prev, avatar_url: newAvatarUrl } : prev
    );
  };

  const handleSelectAlunoFromSearch = (aluno: Aluno) => {
    setSelectedAluno(aluno);
    setActiveTab('alunos');
  };

  const handleAddAluno = (novoData: Omit<Aluno, 'id'>) => {
    const novoAluno: Aluno = {
      ...novoData,
      id: `aluno-${Date.now()}`,
    };
    setAlunos((prev) => [novoAluno, ...prev]);
    setSelectedAluno(novoAluno);
  };

  const handleUpdateAluno = (alunoAtualizado: Aluno) => {
    setAlunos((prev) => prev.map((a) => (a.id === alunoAtualizado.id ? alunoAtualizado : a)));
    setSelectedAluno((prev) => (prev?.id === alunoAtualizado.id ? alunoAtualizado : prev));
  };

  const handleOpenVoiceForAluno = (aluno: Aluno) => {
    setSelectedAluno(aluno);
    setIsVoiceModalOpen(true);
  };

  const handleSendChallengeDirect = (alertaId: string, template: DesafioTemplate, customMessage: string) => {
    if (selectedAluno) {
      const anteriores = desafiosEnviados.filter(
        (h) => h.aluno_id === selectedAluno.id && (h.desafio_id === template.id || h.desafio_titulo.toLowerCase() === template.titulo.toLowerCase())
      );

      const novoEnvio: DesafioEnviado = {
        id: `desafio-env-${Date.now()}`,
        aluno_id: selectedAluno.id,
        aluno_nome: selectedAluno.nome,
        desafio_id: template.id,
        desafio_titulo: template.titulo,
        categoria: template.categoria,
        dificuldade: template.dificuldade,
        tempo_estimado: template.tempo_estimado,
        mensagem_enviada: customMessage,
        data_envio: new Date().toISOString(),
        data_formatada: 'Hoje, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tempo_atras: 'Agora',
        status_resposta: 'pendente',
        origem_disparo: 'individual',
        vezes_enviado: anteriores.length + 1,
      };
      setDesafiosEnviados((prev) => [novoEnvio, ...prev]);

      const novaMsg: WhatsAppMensagem = {
        id: `wpp-${Date.now()}`,
        aluno_id: selectedAluno.id,
        aluno_nome: selectedAluno.nome,
        texto: `[Desafio ${template.categoria}]: ${customMessage}`,
        data_hora: 'Agora',
        origem: 'personal',
        lida: true,
        status_envio: 'enviado',
      };
      setFeedWhatsApp((prev) => [novaMsg, ...prev]);
    }
  };

  const handleDispararDesafio = (
    alunoIds: string[], 
    desafio: DesafioTemplate, 
    customMessage: string, 
    abrirWhatsAppWeb: boolean
  ) => {
    const novasMensagens: WhatsAppMensagem[] = [];
    const novosDesafiosEnviados: DesafioEnviado[] = [];

    alunoIds.forEach((id) => {
      const targetAluno = alunos.find(a => a.id === id);
      if (targetAluno) {
        const formattedText = customMessage
          .replace(/\{aluno\}/g, targetAluno.nome.split(' ')[0])
          .replace(/\{personal\}/g, mockProfissional.nome_profissional.split(' ')[0]);

        novasMensagens.push({
          id: `wpp-${Date.now()}-${id}`,
          aluno_id: id,
          aluno_nome: targetAluno.nome,
          aluno_avatar: targetAluno.avatar_url,
          texto: `[Desafio ${desafio.categoria}]: ${formattedText}`,
          data_hora: 'Agora',
          origem: 'personal',
          lida: true,
          status_envio: 'enviado',
        });

        const anteriores = desafiosEnviados.filter(
          (h) => h.aluno_id === id && (h.desafio_id === desafio.id || h.desafio_titulo.toLowerCase() === desafio.titulo.toLowerCase())
        );

        novosDesafiosEnviados.push({
          id: `desafio-env-${Date.now()}-${id}`,
          aluno_id: id,
          aluno_nome: targetAluno.nome,
          desafio_id: desafio.id,
          desafio_titulo: desafio.titulo,
          categoria: desafio.categoria,
          dificuldade: desafio.dificuldade,
          tempo_estimado: desafio.tempo_estimado,
          mensagem_enviada: formattedText,
          data_envio: new Date().toISOString(),
          data_formatada: 'Hoje, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tempo_atras: 'Agora',
          status_resposta: 'pendente',
          origem_disparo: alunoIds.length > 1 ? 'massa' : 'individual',
          vezes_enviado: anteriores.length + 1,
        });

        if (abrirWhatsAppWeb && alunoIds.length === 1) {
          openWhatsApp(targetAluno.telefone, formattedText);
        }
      }
    });

    if (novasMensagens.length > 0) {
      setFeedWhatsApp((prev) => [...novasMensagens, ...prev]);
    }

    if (novosDesafiosEnviados.length > 0) {
      setDesafiosEnviados((prev) => [...novosDesafiosEnviados, ...prev]);
    }

    // Also resolve any pending radar alerts for these students if related to training / retention
    setAlertas((prev) => prev.filter((al) => !alunoIds.includes(al.aluno_id) || al.tipo === 'aniversario'));
  };

  const handleReenviarDesafioHistorico = (aluno: Aluno, desafioTitulo: string, mensagem: string) => {
    openWhatsApp(aluno.telefone, mensagem);

    const anteriores = desafiosEnviados.filter(
      (h) => h.aluno_id === aluno.id && h.desafio_titulo.toLowerCase() === desafioTitulo.toLowerCase()
    );

    const novoEnvio: DesafioEnviado = {
      id: `desafio-env-${Date.now()}`,
      aluno_id: aluno.id,
      aluno_nome: aluno.nome,
      desafio_titulo: desafioTitulo,
      categoria: 'Lifestyle 23h',
      mensagem_enviada: mensagem,
      data_envio: new Date().toISOString(),
      data_formatada: 'Hoje, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tempo_atras: 'Agora',
      status_resposta: 'pendente',
      origem_disparo: 'individual',
      vezes_enviado: anteriores.length + 1,
    };
    setDesafiosEnviados((prev) => [novoEnvio, ...prev]);

    const novaMsg: WhatsAppMensagem = {
      id: `wpp-reenvio-${Date.now()}`,
      aluno_id: aluno.id,
      aluno_nome: aluno.nome,
      texto: `[Reenvio de Desafio]: ${mensagem}`,
      data_hora: 'Agora',
      origem: 'personal',
      lida: true,
      status_envio: 'enviado',
    };
    setFeedWhatsApp((prev) => [novaMsg, ...prev]);
  };

  const handleSaveVoiceNote = (alunoId: string, texto: string, audioUrl?: string) => {
    const targetAluno = alunos.find(a => a.id === alunoId);
    if (!targetAluno) return;

    const novaMensagem: WhatsAppMensagem = {
      id: `wpp-${Date.now()}`,
      aluno_id: alunoId,
      aluno_nome: targetAluno.nome,
      texto: `[Áudio/Ditado do Personal]: ${texto}`,
      data_hora: 'Agora',
      origem: 'personal',
      lida: true,
      status_envio: 'enviado',
    };

    setFeedWhatsApp(prev => [novaMensagem, ...prev]);

    // Also resolve any pending alert for this student
    setAlertas(prev => prev.filter(a => a.aluno_id !== alunoId));
  };

  const handleSendCelebration = (alunoId: string, texto: string) => {
    const targetAluno = alunos.find(a => a.id === alunoId);
    if (!targetAluno) return;

    const novaMsg: WhatsAppMensagem = {
      id: `wpp-selo-${Date.now()}`,
      aluno_id: alunoId,
      aluno_nome: targetAluno.nome,
      aluno_avatar: targetAluno.avatar_url,
      texto: `[Selo de Conquista]: ${texto}`,
      data_hora: 'Agora',
      origem: 'personal',
      lida: true,
      status_envio: 'enviado',
    };
    setFeedWhatsApp(prev => [novaMsg, ...prev]);
  };

  return (
    <div className="flex min-h-screen bg-[#021813] text-slate-100 font-sans selection:bg-cyan-400 selection:text-slate-950">
      {/* Background Ambient Lights / Glassmorphism Base */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-600/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-cyan-500/10 blur-[130px]" />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-shrink-0 z-30">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          profissional={mockProfissional}
          onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
          totalAlertas={alertas.length}
          totalLeadsPendentes={leads.filter(l => l.status === 'em_followup' || l.proximo_followup === 'Hoje').length}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-72 h-full bg-[#021813] border-r border-emerald-500/20">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setMobileSidebarOpen(false);
              }}
              collapsed={false}
              setCollapsed={() => setMobileSidebarOpen(false)}
              profissional={mockProfissional}
              onOpenVoiceModal={() => {
                setIsVoiceModalOpen(true);
                setMobileSidebarOpen(false);
              }}
              totalAlertas={alertas.length}
              totalLeadsPendentes={leads.filter(l => l.status === 'em_followup' || l.proximo_followup === 'Hoje').length}
            />
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="relative z-10 flex flex-1 flex-col min-w-0 overflow-y-auto">
        {/* Topbar */}
        <Topbar
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          alunos={alunos}
          alertas={alertas}
          onSelectAlunoFromSearch={handleSelectAlunoFromSearch}
        />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {/* Active Tab Routing */}
          {activeTab === 'dashboard' && (
            <DashboardView
              alunos={alunos}
              alertas={alertas}
              setAlertas={setAlertas}
              feedWhatsApp={feedWhatsApp}
              setFeedWhatsApp={setFeedWhatsApp}
              templates={templates}
              historico={desafiosEnviados}
              setHistoricoDesafios={setDesafiosEnviados}
              onOpenVoiceModalForAluno={handleOpenVoiceForAluno}
            />
          )}

          {activeTab === 'alunos' && (
            <AlunosView
              alunos={alunos}
              selectedAluno={selectedAluno}
              onSelectAluno={setSelectedAluno}
              onAddAluno={handleAddAluno}
              onUpdateAluno={handleUpdateAluno}
              onUpdateAvatar={handleUpdateAvatar}
              fotos={fotosEvolucao}
              onAddFoto={handleAddFotoEvolucao}
              onDeleteFoto={handleDeleteFotoEvolucao}
              avaliacoes={avaliacoes}
              setAvaliacoes={setAvaliacoes}
              templates={templates}
              historico={desafiosEnviados}
              onOpenVoiceModalForAluno={handleOpenVoiceForAluno}
              onSendChallengeDirect={handleSendChallengeDirect}
              onSendCelebrationMessage={handleSendCelebration}
              onReenviarDesafio={handleReenviarDesafioHistorico}
            />
          )}

          {activeTab === 'leads' && (
            <LeadsView
              leads={leads}
              setLeads={setLeads}
              templates={templates}
              onAlunoConvertido={handleAlunoConvertido}
            />
          )}

          {activeTab === 'desafios' && (
            <DesafiosView
              templates={templates}
              setTemplates={setTemplates}
              alunos={alunos}
              historico={desafiosEnviados}
              onDispararDesafio={handleDispararDesafio}
            />
          )}

          {activeTab === 'supabase' && (
            <div className="rounded-2xl border border-emerald-500/20 bg-[#031d17]/90 p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4">
                <Database className="h-6 w-6 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Schema Supabase & Políticas RLS</h3>
              </div>
              <p className="text-sm text-slate-300 mb-4">
                O arquivo <code className="text-cyan-300 bg-[#021813] px-2 py-0.5 rounded font-mono text-xs">/supabase/schema.sql</code> foi gerado no Passo 1 com isolamento multi-tenant por Personal Trainer via <code className="text-cyan-300 bg-[#021813] px-2 py-0.5 rounded font-mono text-xs">auth.uid()</code>.
              </p>
              <div className="p-4 rounded-xl bg-[#02140f] border border-emerald-500/15 text-xs font-mono text-slate-300 overflow-x-auto space-y-1">
                <p className="text-emerald-400">✓ public.profissionais (RLS ativo: auth.uid() = id)</p>
                <p className="text-emerald-400">✓ public.alunos (RLS ativo: profissional_id = auth.uid())</p>
                <p className="text-emerald-400">✓ public.avaliacoes_fisicas (RLS ativo via alunos.profissional_id)</p>
                <p className="text-emerald-400">✓ public.desafios_templates (RLS ativo: templates globais e personalizados)</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Quick Voice / Ditado de Áudio Modal */}
      <QuickVoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        alunos={alunos}
        selectedAlunoDefault={selectedAluno}
        onSaveVoiceNote={handleSaveVoiceNote}
      />
    </div>
  );
}

