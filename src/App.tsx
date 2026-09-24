import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { AlunosView } from './components/alunos/AlunosView';
import { DesafiosView } from './components/desafios/DesafiosView';
import { LeadsView } from './components/leads/LeadsView';
import { QuickVoiceModal } from './components/audio/QuickVoiceModal';
import { MensagemAvulsaModal } from './components/layout/MensagemAvulsaModal';
import { SupabaseConnectionView } from './components/supabase/SupabaseConnectionView';
import { AuthPage } from './components/auth/AuthPage';
import { supabase } from './lib/supabaseClient';
import { DESAFIOS_NATIVOS_RADARMOVE } from './lib/seeds/desafiosSeed';
import { 
  Aluno, 
  AvaliacaoFisica, 
  RadarAlerta, 
  WhatsAppMensagem, 
  DesafioTemplate, 
  FotoEvolucao, 
  DesafioEnviado, 
  Lead,
  Profissional 
} from './types';
import { openWhatsApp } from './lib/whatsappUtils';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alunos' | 'desafios' | 'leads' | 'supabase'>('dashboard');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isMensagemAvulsaOpen, setIsMensagemAvulsaOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Auth state
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  // Perfil do Treinador Logado
  const [profissional, setProfissional] = useState<Profissional>({
    id: '',
    nome_empresa: 'RadarMove Studio',
    nome_profissional: 'Treinador',
    telefone: '',
    cor_primaria: '#10b981',
    total_alunos: 0,
  });

  // Database State - Inicializado vazio (desvinculado de seeds mock fixas)
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoFisica[]>([]);
  const [alertas, setAlertas] = useState<RadarAlerta[]>([]);
  const [feedWhatsApp, setFeedWhatsApp] = useState<WhatsAppMensagem[]>([]);
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);
  const [templates, setTemplates] = useState<DesafioTemplate[]>([]);
  const [fotosEvolucao, setFotosEvolucao] = useState<FotoEvolucao[]>([]);
  const [desafiosEnviados, setDesafiosEnviados] = useState<DesafioEnviado[]>([]);

  // 1. Monitora e inicializa a sessão com Supabase Auth
  useEffect(() => {
    async function initAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
      } catch (err) {
        console.error('Erro ao verificar sessão Supabase:', err);
      } finally {
        setAuthLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2. Carrega dados do Supabase filtrando pelo auth.uid() do usuário autenticado
  useEffect(() => {
    if (!session?.user?.id) {
      // Usuário sem sessão ativa: limpa os dados
      setAlunos([]);
      setLeads([]);
      setAvaliacoes([]);
      setAlertas([]);
      setFeedWhatsApp([]);
      setSelectedAluno(null);
      setFotosEvolucao([]);
      setDesafiosEnviados([]);
      return;
    }

    const userId = session.user.id;

    async function loadUserData() {
      setDataLoading(true);
      try {
        // A. Carrega perfil do profissional
        const { data: profData } = await supabase
          .from('profissionais')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profData) {
          setProfissional({
            id: profData.id,
            nome_empresa: profData.nome_empresa || 'RadarMove Studio',
            nome_profissional: profData.nome_profissional || session.user.user_metadata?.nome || 'Treinador',
            telefone: profData.telefone || '',
            cor_primaria: profData.cor_primaria || '#10b981',
            total_alunos: profData.total_alunos || 0,
            logo_url: profData.avatar_url || profData.logo_url,
          });
        } else {
          // Cria o registro base se ainda não existir
          const novoProf = {
            id: userId,
            nome_profissional: session.user.user_metadata?.nome || session.user.email?.split('@')[0] || 'Treinador',
            nome_empresa: 'RadarMove Studio',
            telefone: '',
            cor_primaria: '#10b981',
            total_alunos: 0,
          };
          setProfissional(novoProf);
          try {
            await supabase.from('profissionais').insert(novoProf);
          } catch (e) {
            // ignore
          }
        }

        // B. Carrega Alunos do treinador logado (filtrado por profissional_id)
        const { data: alunosData } = await supabase
          .from('alunos')
          .select('*')
          .eq('profissional_id', userId)
          .order('nome', { ascending: true });

        const alunosList: Aluno[] = (alunosData || []).map((a: any) => {
          let objetivosArr: string[] = [];
          if (Array.isArray(a.objetivos) && a.objetivos.length > 0) {
            objetivosArr = a.objetivos;
          } else if (a.objetivo) {
            objetivosArr = a.objetivo.split(',').map((s: string) => s.trim()).filter(Boolean);
          } else {
            objetivosArr = ['Hipertrofia & Ganho de Força'];
          }

          return {
            id: a.id,
            profissional_id: a.profissional_id,
            nome: a.nome,
            telefone: a.telefone || '',
            data_nascimento: a.data_nascimento || '',
            status: a.status || 'ativo',
            ultimo_checkin: a.ultimo_checkin || new Date().toISOString(),
            avatar_url: a.foto_url || a.avatar_url || '',
            objetivo: a.objetivo || objetivosArr.join(', ') || 'Saúde e Performance',
            objetivos: objetivosArr,
            dias_sem_treino: typeof a.dias_sem_treino === 'number' ? a.dias_sem_treino : 0,
            plano: a.plano || 'Presencial',
            frequencia_semanal: a.frequencia_semanal || 3,
            altura_cm: a.altura !== undefined && a.altura !== null ? Number(a.altura) : (a.altura_cm ? Number(a.altura_cm) : 175),
            peso: a.peso !== undefined && a.peso !== null ? Number(a.peso) : undefined,
            genero: a.genero || undefined,
            observacoes: a.observacoes || undefined,
            created_at: a.created_at || undefined,
          };
        });

        setAlunos(alunosList);
        setSelectedAluno(alunosList.length > 0 ? alunosList[0] : null);

        // C. Carrega Leads do treinador
        const { data: leadsData } = await supabase
          .from('leads')
          .select('*')
          .eq('profissional_id', userId)
          .order('created_at', { ascending: false });

        if (leadsData) {
          setLeads(leadsData);
        } else {
          setLeads([]);
        }

        // D. Carrega Desafios Templates (globais do sistema ou criados pelo profissional)
        const { data: templatesData } = await supabase
          .from('desafios_templates')
          .select('*')
          .or(`profissional_id.is.null,profissional_id.eq.${userId}`)
          .order('categoria', { ascending: true });

        if (templatesData && templatesData.length > 0) {
          const dbTemplates: DesafioTemplate[] = templatesData.map((t: any) => ({
            id: t.id,
            profissional_id: t.profissional_id,
            categoria: t.categoria,
            titulo: t.titulo,
            mensagem_whatsapp: t.mensagem_whatsapp || t.mensagem || '',
            tempo_estimado: t.tempo_estimado || '5 min',
            dificuldade: t.dificuldade || 'Fácil',
          }));

          // Adiciona templates nativos se alguma categoria ainda não estiver presente no banco
          const existingTitles = new Set(dbTemplates.map((t) => t.titulo.toLowerCase().trim()));
          const missingNatives: DesafioTemplate[] = DESAFIOS_NATIVOS_RADARMOVE
            .filter((t) => !existingTitles.has(t.titulo.toLowerCase().trim()))
            .map((t, idx) => ({
              ...t,
              id: `seed-native-${idx + 1}`,
            }));

          setTemplates([...dbTemplates, ...missingNatives]);
        } else {
          // Usa os templates nativos do sistema se o banco ainda não os tiver populado
          const defaultTemplates: DesafioTemplate[] = DESAFIOS_NATIVOS_RADARMOVE.map((t, idx) => ({
            ...t,
            id: `seed-tpl-${idx + 1}`,
          }));
          setTemplates(defaultTemplates);
        }

        // E. Gera alertas do Radar dinamicamente com base nos alunos reais
        const novosAlertas: RadarAlerta[] = [];
        alunosList.forEach((aluno) => {
          if (aluno.status === 'em_risco' || aluno.dias_sem_treino >= 4) {
            novosAlertas.push({
              id: `alerta-${aluno.id}`,
              aluno_id: aluno.id,
              aluno_nome: aluno.nome,
              aluno_telefone: aluno.telefone,
              aluno_avatar: aluno.avatar_url,
              tipo: 'sem_treino',
              urgencia: aluno.dias_sem_treino >= 6 ? 'alta' : 'media',
              descricao: `${aluno.nome.split(' ')[0]} está há ${aluno.dias_sem_treino} dias sem registrar presença. Envie um micro-desafio de resgate!`,
              tempo_atras: `${aluno.dias_sem_treino}d atrás`,
              desafio_sugerido_id: templates[0]?.id || 'des-01',
            });
          }
        });
        setAlertas(novosAlertas);

      } catch (err) {
        console.error('Erro ao sincronizar tabelas do Supabase:', err);
      } finally {
        setDataLoading(false);
      }
    }

    loadUserData();
  }, [session]);

  const handleAlunoConvertido = async (novoAluno: Aluno, lead: Lead) => {
    // Adiciona na lista local e salva no Supabase
    const alunoComUser: Aluno = {
      ...novoAluno,
      profissional_id: session?.user?.id || 'demo-user',
    };

    setAlunos((prev) => [alunoComUser, ...prev]);
    setSelectedAluno(alunoComUser);

    if (session?.user?.id) {
      try {
        const payload: Record<string, any> = {
          profissional_id: session.user.id,
          nome: alunoComUser.nome,
          telefone: alunoComUser.telefone,
          status: alunoComUser.status || 'ativo',
          objetivo: alunoComUser.objetivo,
          altura: alunoComUser.altura_cm ? Number(alunoComUser.altura_cm) : null,
        };
        if (alunoComUser.avatar_url) payload.avatar_url = alunoComUser.avatar_url;
        if (alunoComUser.data_nascimento) payload.data_nascimento = alunoComUser.data_nascimento;

        let currentPayload: Record<string, any> = { ...payload };
        let { error } = await supabase.from('alunos').insert([currentPayload]);

        let attempts = 0;
        while (error && (error.message?.includes('column') || error.message?.includes('schema cache')) && attempts < 8) {
          attempts++;
          const colMatch = error.message.match(/['"]([a-zA-Z0-9_]+)['"]\s*column/i) ||
                           error.message.match(/column\s*['"]([a-zA-Z0-9_]+)['"]/i) ||
                           error.message.match(/find the ['"]([a-zA-Z0-9_]+)['"]/i);

          if (colMatch && colMatch[1] && colMatch[1] in currentPayload) {
            delete currentPayload[colMatch[1]];
          } else {
            const optionalKeys = ['altura', 'objetivos', 'peso', 'genero', 'observacoes', 'data_nascimento', 'foto_url', 'avatar_url', 'plano', 'status', 'objetivo'];
            const keyToDrop = optionalKeys.find((k) => k in currentPayload);
            if (keyToDrop) {
              delete currentPayload[keyToDrop];
            } else {
              break;
            }
          }

          const retry = await supabase.from('alunos').insert([currentPayload]);
          error = retry.error;
        }

        if (error && (error.message?.includes('column') || error.message?.includes('schema cache'))) {
          const minimalPayload = {
            profissional_id: session.user.id,
            nome: alunoComUser.nome,
            telefone: alunoComUser.telefone,
          };
          await supabase.from('alunos').insert([minimalPayload]);
        }
      } catch (err) {
        console.error('Erro ao persistir novo aluno no Supabase:', err);
      }
    }
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

  const handleUpdateAvatar = async (alunoId: string, newAvatarUrl: string) => {
    setAlunos((prev) =>
      prev.map((a) => (a.id === alunoId ? { ...a, avatar_url: newAvatarUrl } : a))
    );
    setSelectedAluno((prev) =>
      prev?.id === alunoId ? { ...prev, avatar_url: newAvatarUrl } : prev
    );

    if (session?.user?.id) {
      try {
        await supabase
          .from('alunos')
          .update({ avatar_url: newAvatarUrl })
          .eq('id', alunoId)
          .eq('profissional_id', session.user.id);
      } catch (e) {
        // ignore
      }
    }
  };

  const handleSelectAlunoFromSearch = (aluno: Aluno) => {
    setSelectedAluno(aluno);
    setActiveTab('alunos');
  };

  const handleAddAluno = async (novoData: Omit<Aluno, 'id'> | Aluno) => {
    // Se o objeto já veio com ID persistido pelo Supabase (ex: gerado no AlunoFormModal)
    if ('id' in novoData && novoData.id && !novoData.id.startsWith('aluno-')) {
      const alunoCompleto = novoData as Aluno;
      setAlunos((prev) => {
        const jaExiste = prev.some((a) => a.id === alunoCompleto.id);
        if (jaExiste) {
          return prev.map((a) => (a.id === alunoCompleto.id ? alunoCompleto : a));
        }
        return [alunoCompleto, ...prev];
      });
      setSelectedAluno(alunoCompleto);
      return;
    }

    const novoId = 'id' in novoData && novoData.id ? novoData.id : `aluno-${Date.now()}`;
    const novoAluno: Aluno = {
      ...novoData,
      id: novoId,
      profissional_id: session?.user?.id || '',
    };
    setAlunos((prev) => [novoAluno, ...prev]);
    setSelectedAluno(novoAluno);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || session?.user?.id;

      if (currentUserId) {
        const objArray = novoAluno.objetivos && novoAluno.objetivos.length > 0 ? novoAluno.objetivos : (novoAluno.objetivo ? [novoAluno.objetivo] : ['Hipertrofia & Ganho de Força']);
        const payload: Record<string, any> = {
          nome: novoAluno.nome,
          telefone: novoAluno.telefone,
          altura: novoAluno.altura_cm ? Number(novoAluno.altura_cm) : null,
          objetivo: novoAluno.objetivo || objArray.join(', '),
          objetivos: objArray,
          status: novoAluno.status || 'ativo',
          plano: novoAluno.plano || 'Presencial VIP 3x/semana',
          profissional_id: currentUserId,
        };
        if (novoAluno.avatar_url) {
          payload.avatar_url = novoAluno.avatar_url;
          payload.foto_url = novoAluno.avatar_url;
        }
        if (novoAluno.data_nascimento) payload.data_nascimento = novoAluno.data_nascimento;
        if (novoAluno.peso !== undefined && novoAluno.peso !== null) payload.peso = Number(novoAluno.peso);
        if (novoAluno.genero) payload.genero = novoAluno.genero;
        if (novoAluno.observacoes) payload.observacoes = novoAluno.observacoes;

        let currentPayload: Record<string, any> = { ...payload };
        let { data, error } = await supabase.from('alunos').insert([currentPayload]).select().maybeSingle();

        let attempts = 0;
        while (error && (error.message?.includes('column') || error.message?.includes('schema cache')) && attempts < 10) {
          attempts++;
          const colMatch = error.message.match(/['"]([a-zA-Z0-9_]+)['"]\s*column/i) ||
                           error.message.match(/column\s*['"]([a-zA-Z0-9_]+)['"]/i) ||
                           error.message.match(/find the ['"]([a-zA-Z0-9_]+)['"]/i);

          if (colMatch && colMatch[1] && colMatch[1] in currentPayload) {
            delete currentPayload[colMatch[1]];
          } else {
            const optionalKeys = ['altura', 'objetivos', 'peso', 'genero', 'observacoes', 'data_nascimento', 'foto_url', 'avatar_url', 'plano', 'status', 'objetivo'];
            const keyToDrop = optionalKeys.find((k) => k in currentPayload);
            if (keyToDrop) {
              delete currentPayload[keyToDrop];
            } else {
              break;
            }
          }

          const retry = await supabase.from('alunos').insert([currentPayload]).select().maybeSingle();
          data = retry.data;
          error = retry.error;
        }

        if (error && (error.message?.includes('column') || error.message?.includes('schema cache'))) {
          const minimalPayload = {
            nome: novoAluno.nome,
            telefone: novoAluno.telefone,
            profissional_id: currentUserId,
          };
          const minRetry = await supabase.from('alunos').insert([minimalPayload]).select().maybeSingle();
          data = minRetry.data;
          error = minRetry.error;
        }

        if (error) {
          console.error('Erro ao inserir aluno no Supabase:', error);
        } else if (data?.id) {
          setAlunos((prev) => prev.map((a) => (a.id === novoId ? { ...a, id: data.id } : a)));
        }
      }
    } catch (err) {
      console.error('Erro ao persistir novo aluno no Supabase:', err);
    }
  };

  const handleAddMultiplosAlunos = (novos: Aluno[]) => {
    if (!novos || novos.length === 0) return;
    setAlunos((prev) => [...novos, ...prev]);
    setSelectedAluno(novos[0]);
  };

  const handleUpdateAluno = async (alunoAtualizado: Aluno) => {
    setAlunos((prev) => prev.map((a) => (a.id === alunoAtualizado.id ? alunoAtualizado : a)));
    setSelectedAluno((prev) => (prev?.id === alunoAtualizado.id ? alunoAtualizado : prev));

    if (session?.user?.id) {
      try {
        const objArray = alunoAtualizado.objetivos && alunoAtualizado.objetivos.length > 0 ? alunoAtualizado.objetivos : (alunoAtualizado.objetivo ? [alunoAtualizado.objetivo] : ['Hipertrofia & Ganho de Força']);
        const updatePayload: Record<string, any> = {
          nome: alunoAtualizado.nome,
          telefone: alunoAtualizado.telefone,
          status: alunoAtualizado.status,
          objetivo: alunoAtualizado.objetivo || objArray.join(', '),
          objetivos: objArray,
          plano: alunoAtualizado.plano,
          altura: alunoAtualizado.altura_cm ? Number(alunoAtualizado.altura_cm) : null,
        };
        if (alunoAtualizado.avatar_url) {
          updatePayload.avatar_url = alunoAtualizado.avatar_url;
          updatePayload.foto_url = alunoAtualizado.avatar_url;
        }
        if (alunoAtualizado.data_nascimento) updatePayload.data_nascimento = alunoAtualizado.data_nascimento;
        if (alunoAtualizado.peso !== undefined && alunoAtualizado.peso !== null) updatePayload.peso = Number(alunoAtualizado.peso);
        if (alunoAtualizado.genero) updatePayload.genero = alunoAtualizado.genero;
        if (alunoAtualizado.observacoes) updatePayload.observacoes = alunoAtualizado.observacoes;

        let currentUpdate: Record<string, any> = { ...updatePayload };
        let { error: updateError } = await supabase
          .from('alunos')
          .update(currentUpdate)
          .eq('id', alunoAtualizado.id)
          .eq('profissional_id', session.user.id);

        let updateAttempts = 0;
        while (updateError && (updateError.message?.includes('column') || updateError.message?.includes('schema cache')) && updateAttempts < 10) {
          updateAttempts++;
          const colMatch = updateError.message.match(/['"]([a-zA-Z0-9_]+)['"]\s*column/i) ||
                           updateError.message.match(/column\s*['"]([a-zA-Z0-9_]+)['"]/i) ||
                           updateError.message.match(/find the ['"]([a-zA-Z0-9_]+)['"]/i);

          if (colMatch && colMatch[1] && colMatch[1] in currentUpdate) {
            delete currentUpdate[colMatch[1]];
          } else {
            const optionalKeys = ['altura', 'objetivos', 'peso', 'genero', 'observacoes', 'data_nascimento', 'foto_url', 'avatar_url', 'plano', 'status', 'objetivo'];
            const keyToDrop = optionalKeys.find((k) => k in currentUpdate);
            if (keyToDrop) {
              delete currentUpdate[keyToDrop];
            } else {
              break;
            }
          }

          const retryUpdate = await supabase
            .from('alunos')
            .update(currentUpdate)
            .eq('id', alunoAtualizado.id)
            .eq('profissional_id', session.user.id);
          updateError = retryUpdate.error;
        }

        if (updateError && (updateError.message?.includes('column') || updateError.message?.includes('schema cache'))) {
          const safeUpdate = {
            nome: alunoAtualizado.nome,
            telefone: alunoAtualizado.telefone,
          };
          await supabase
            .from('alunos')
            .update(safeUpdate)
            .eq('id', alunoAtualizado.id)
            .eq('profissional_id', session.user.id);
        }
      } catch (e) {
        // ignore
      }
    }
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
          .replace(/\{personal\}/g, profissional.nome_profissional.split(' ')[0]);

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

    // Resolve alertas para os alunos atendidos
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

  const handleSaveVoiceNote = (alunoId: string, texto: string) => {
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

  // Se estiver carregando sessão
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#021813] flex flex-col items-center justify-center text-emerald-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <span className="text-sm font-semibold tracking-wider text-slate-300">Carregando RadarMove...</span>
      </div>
    );
  }

  // Se não estiver autenticado ou rota for #login, exibe a tela de login/cadastro
  if (!session || window.location.hash === '#login') {
    return (
      <AuthPage 
        onAuthSuccess={() => {
          window.location.hash = '';
        }} 
      />
    );
  }

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
          profissional={profissional}
          onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
          onOpenMensagemAvulsa={() => setIsMensagemAvulsaOpen(true)}
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
              profissional={profissional}
              onOpenVoiceModal={() => {
                setIsVoiceModalOpen(true);
                setMobileSidebarOpen(false);
              }}
              onOpenMensagemAvulsa={() => {
                setIsMensagemAvulsaOpen(true);
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
          onOpenMensagemAvulsa={() => setIsMensagemAvulsaOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          alunos={alunos}
          alertas={alertas}
          onSelectAlunoFromSearch={handleSelectAlunoFromSearch}
        />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {dataLoading && (
            <div className="mb-4 flex items-center gap-2 text-xs text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-3 py-2 rounded-xl">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Sincronizando dados com o banco Supabase...</span>
            </div>
          )}

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
              onAddMultiplosAlunos={handleAddMultiplosAlunos}
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
            <SupabaseConnectionView />
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

      {/* Mensagem Avulsa / Envio Rápido WhatsApp Modal */}
      <MensagemAvulsaModal
        isOpen={isMensagemAvulsaOpen}
        onClose={() => setIsMensagemAvulsaOpen(false)}
        onSuccess={({ phone, message }) => {
          // Adiciona ao feed de WhatsApp para histórico visual imediato
          setFeedWhatsApp((prev) => [
            {
              id: `avulsa-${Date.now()}`,
              aluno_id: 'avulso',
              aluno_nome: `Destinatário Avulso (+${phone})`,
              texto: message,
              origem: 'personal',
              data_hora: 'Agora',
              lida: true,
              status_envio: 'enviado',
            },
            ...prev,
          ]);
        }}
      />
    </div>
  );
}
