import React, { useState, useEffect } from 'react';
import { TopCards } from './TopCards';
import { RadarRelacionamento } from './RadarRelacionamento';
import { WhatsAppFeed } from './WhatsAppFeed';
import { SendChallengeModal } from './SendChallengeModal';
import { Aluno, RadarAlerta, WhatsAppMensagem, DesafioTemplate, DesafioEnviado } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { Sparkles, Mic, PlusCircle } from 'lucide-react';

interface DashboardViewProps {
  alunos: Aluno[];
  alertas: RadarAlerta[];
  setAlertas: React.Dispatch<React.SetStateAction<RadarAlerta[]>>;
  feedWhatsApp: WhatsAppMensagem[];
  setFeedWhatsApp: React.Dispatch<React.SetStateAction<WhatsAppMensagem[]>>;
  templates: DesafioTemplate[];
  historico?: DesafioEnviado[];
  setHistoricoDesafios?: React.Dispatch<React.SetStateAction<DesafioEnviado[]>>;
  onOpenVoiceModalForAluno: (aluno: Aluno) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  alunos,
  alertas,
  setAlertas,
  feedWhatsApp,
  setFeedWhatsApp,
  templates,
  historico = [],
  setHistoricoDesafios,
  onOpenVoiceModalForAluno,
}) => {
  const [selectedAlertaForChallenge, setSelectedAlertaForChallenge] = useState<RadarAlerta | null>(null);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [totalDesafiosEnviadosBanco, setTotalDesafiosEnviadosBanco] = useState<number>(0);

  // Consulta a contagem real no Supabase na tabela de envios/agendamentos
  useEffect(() => {
    async function fetchTotalEnvios() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;

        if (userId) {
          // Consulta tabela agendamentos_envios ou desafios_enviados
          const { count, error } = await supabase
            .from('agendamentos_envios')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'enviado')
            .eq('profissional_id', userId);

          if (!error && typeof count === 'number') {
            setTotalDesafiosEnviadosBanco(count);
          } else {
            // Tenta consultar a tabela alternativa de envios caso exista
            const { count: countAlt, error: errorAlt } = await supabase
              .from('desafios_enviados')
              .select('*', { count: 'exact', head: true })
              .eq('profissional_id', userId);

            if (!errorAlt && typeof countAlt === 'number') {
              setTotalDesafiosEnviadosBanco(countAlt);
            } else {
              setTotalDesafiosEnviadosBanco(0);
            }
          }
        } else {
          setTotalDesafiosEnviadosBanco(0);
        }
      } catch (err) {
        console.warn('Não foi possível obter contagem de envios do Supabase:', err);
        setTotalDesafiosEnviadosBanco(0);
      }
    }

    fetchTotalEnvios();
  }, [historico]);

  // Contagem final: soma do banco de dados + histórico da sessão atual
  const contagemDesafiosEnviados = Math.max(totalDesafiosEnviadosBanco, historico.length);

  const alunosAtivosCount = alunos.filter((a) => a.status === 'ativo').length;
  const alunosEmRiscoCount = alunos.filter((a) => a.status === 'em_risco').length;

  const taxaRetencaoCalculada = alunos.length > 0
    ? Number((((alunos.length - alunosEmRiscoCount) / alunos.length) * 100).toFixed(1))
    : 100;

  const handleOpenSendChallenge = (alerta: RadarAlerta) => {
    setSelectedAlertaForChallenge(alerta);
    setIsChallengeModalOpen(true);
  };

  const handleChallengeSent = (alertaId: string, template: DesafioTemplate, customMessage: string) => {
    // 1. Remove or resolve the alert from the radar
    setAlertas((prev) => prev.filter((a) => a.id !== alertaId));

    // 2. Add an item in the WhatsApp feed indicating the challenge was sent by the personal
    const alerta = alertas.find((a) => a.id === alertaId);
    if (alerta) {
      const novaMsg: WhatsAppMensagem = {
        id: `wpp-${Date.now()}`,
        aluno_id: alerta.aluno_id,
        aluno_nome: alerta.aluno_nome,
        texto: `[Desafio Enviado - ${template.categoria}]: ${customMessage}`,
        data_hora: 'Agora',
        origem: 'personal',
        lida: true,
        status_envio: 'enviado',
      };
      setFeedWhatsApp((prev) => [novaMsg, ...prev]);

      // 3. Register in student's challenge history
      if (setHistoricoDesafios) {
        const anteriores = historico.filter(
          (h) => h.aluno_id === alerta.aluno_id && (h.desafio_id === template.id || h.desafio_titulo.toLowerCase() === template.titulo.toLowerCase())
        );
        const novoRegistro: DesafioEnviado = {
          id: `desafio-env-${Date.now()}`,
          aluno_id: alerta.aluno_id,
          aluno_nome: alerta.aluno_nome,
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
          origem_disparo: 'radar_dashboard',
          vezes_enviado: anteriores.length + 1,
        };
        setHistoricoDesafios((prev) => [novoRegistro, ...prev]);
      }
    }
  };

  const handleResolveAlerta = (alertaId: string) => {
    setAlertas((prev) => prev.filter((a) => a.id !== alertaId));
  };

  const handleSendQuickReply = (alunoId: string, texto: string) => {
    const aluno = alunos.find((a) => a.id === alunoId);
    const novaMsg: WhatsAppMensagem = {
      id: `wpp-${Date.now()}`,
      aluno_id: alunoId,
      aluno_nome: aluno?.nome || 'Aluno',
      texto: `[Resposta Rápida]: ${texto}`,
      data_hora: 'Agora',
      origem: 'personal',
      lida: true,
      status_envio: 'enviado',
    };
    setFeedWhatsApp((prev) => [novaMsg, ...prev]);
  };

  const targetAlunoForModal = selectedAlertaForChallenge
    ? alunos.find((a) => a.id === selectedAlertaForChallenge.aluno_id) || null
    : null;

  return (
    <div id="dashboard-view" className="space-y-6 animate-in fade-in duration-200">
      {/* 1. TOP CARDS (4 Cards Superiores) */}
      <TopCards
        totalAlunos={alunos.length}
        desafiosEnviados={contagemDesafiosEnviados}
        alunosEmRisco={alunosEmRiscoCount}
        taxaRetencao={taxaRetencaoCalculada}
      />

      {/* 2. GRID PRINCIPAL: Central Radar + Right WhatsApp Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Central: Radar de Relacionamento (Col-span 7 or 8) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
          <RadarRelacionamento
            alertas={alertas}
            alunos={alunos}
            onOpenSendChallenge={handleOpenSendChallenge}
            onOpenVoiceModalForAluno={onOpenVoiceModalForAluno}
            onResolveAlerta={handleResolveAlerta}
          />
        </div>

        {/* Lado Direito: Feed Vertical de WhatsApp (Col-span 5 or 4) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
          <WhatsAppFeed
            mensagens={feedWhatsApp}
            alunos={alunos}
            onOpenVoiceModalForAluno={onOpenVoiceModalForAluno}
            onSendQuickReply={handleSendQuickReply}
          />
        </div>
      </div>

      {/* Modal de Disparo Rápido de Desafio */}
      <SendChallengeModal
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
        alerta={selectedAlertaForChallenge}
        aluno={targetAlunoForModal}
        templates={templates}
        historico={historico}
        onChallengeSent={handleChallengeSent}
        onOpenVoiceModalForAluno={onOpenVoiceModalForAluno}
      />
    </div>
  );
};
