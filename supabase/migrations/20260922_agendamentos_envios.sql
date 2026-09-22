-- ==============================================================================
-- MIGRAÇÃO SUPABASE: Tabela de Agendamentos de Envios de Desafios (RadarMove)
-- Execute no SQL Editor do seu projeto Supabase: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Criação da tabela de agendamentos
CREATE TABLE IF NOT EXISTS public.agendamentos_envios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profissional_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    aluno_id TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    data_hora_programada TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'enviado', 'erro')),
    notificar_treinador BOOLEAN NOT NULL DEFAULT true,
    notificacao_treinador_enviada BOOLEAN NOT NULL DEFAULT false,
    tentativas INT NOT NULL DEFAULT 0,
    erro_detalhes TEXT,
    enviado_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Índices de alta performance para a rota de Cron e consultas do Treinador
CREATE INDEX IF NOT EXISTS idx_agendamentos_status_data 
ON public.agendamentos_envios (status, data_hora_programada);

CREATE INDEX IF NOT EXISTS idx_agendamentos_profissional 
ON public.agendamentos_envios (profissional_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agendamentos_aluno 
ON public.agendamentos_envios (aluno_id);

-- 3. Habilitação de Segurança em Nível de Linha (RLS)
ALTER TABLE public.agendamentos_envios ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de RLS para isolamento entre Personal Trainers
DROP POLICY IF EXISTS "Treinadores podem visualizar apenas seus proprios agendamentos" ON public.agendamentos_envios;
CREATE POLICY "Treinadores podem visualizar apenas seus proprios agendamentos"
ON public.agendamentos_envios
FOR SELECT
TO authenticated
USING (auth.uid() = profissional_id);

DROP POLICY IF EXISTS "Treinadores podem inserir seus proprios agendamentos" ON public.agendamentos_envios;
CREATE POLICY "Treinadores podem inserir seus proprios agendamentos"
ON public.agendamentos_envios
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = profissional_id);

DROP POLICY IF EXISTS "Treinadores podem atualizar seus proprios agendamentos" ON public.agendamentos_envios;
CREATE POLICY "Treinadores podem atualizar seus proprios agendamentos"
ON public.agendamentos_envios
FOR UPDATE
TO authenticated
USING (auth.uid() = profissional_id)
WITH CHECK (auth.uid() = profissional_id);

DROP POLICY IF EXISTS "Treinadores podem deletar seus proprios agendamentos" ON public.agendamentos_envios;
CREATE POLICY "Treinadores podem deletar seus proprios agendamentos"
ON public.agendamentos_envios
FOR DELETE
TO authenticated
USING (auth.uid() = profissional_id);

-- 5. Comentários para documentação no schema do Supabase
COMMENT ON TABLE public.agendamentos_envios IS 'Fila de desafios e mensagens com agendamento programado para disparo via WhatsApp';
COMMENT ON COLUMN public.agendamentos_envios.data_hora_programada IS 'Data e hora limite em que o disparo deve ocorrer';
COMMENT ON COLUMN public.agendamentos_envios.notificar_treinador IS 'Flag que define se o Personal recebe confirmação no seu próprio WhatsApp após envio ao aluno';
