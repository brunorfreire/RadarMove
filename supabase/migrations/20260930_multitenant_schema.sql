-- ==============================================================================
-- RADARMOVE: ARQUITETURA MULTI-TENANT (WHITE-LABEL PARA PERSONAL TRAINERS)
-- Banco de dados único com isolamento lógico via personal_id e RLS nativo do Postgres.
-- ==============================================================================

-- Habilita extensões para UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. TABELA DE TENANTS: PERSONAIS / TREINADORES (auth.users do Supabase)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.personais (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_completo TEXT NOT NULL,
    nome_empresa TEXT DEFAULT 'RadarMove Studio',
    telefone TEXT,
    email TEXT,
    logo_url TEXT,
    cor_primaria TEXT DEFAULT '#10b981', -- White-label branding
    slug_personalizado TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.personais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Personal gerencia seu proprio perfil" ON public.personais;
CREATE POLICY "Personal gerencia seu proprio perfil"
ON public.personais
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. TABELA DE ALUNOS & CONTATOS (ISOLADA POR personal_id)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personal_id UUID NOT NULL REFERENCES public.personais(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'em_risco')),
    data_nascimento DATE,
    objetivo TEXT,
    dias_sem_treino INT DEFAULT 0,
    ultimo_checkin TIMESTAMPTZ,
    plano TEXT DEFAULT 'Mensal',
    frequencia_semanal INT DEFAULT 3,
    avatar_url TEXT,
    altura_cm NUMERIC,
    peso NUMERIC,
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de isolamento de tenant e buscas frequentes
CREATE INDEX IF NOT EXISTS idx_alunos_personal ON public.alunos (personal_id);
CREATE INDEX IF NOT EXISTS idx_alunos_personal_telefone ON public.alunos (personal_id, telefone);
CREATE INDEX IF NOT EXISTS idx_alunos_personal_status ON public.alunos (personal_id, status);

ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Personal acessa apenas seus proprios alunos" ON public.alunos;
CREATE POLICY "Personal acessa apenas seus proprios alunos"
ON public.alunos
FOR ALL
TO authenticated
USING (personal_id = auth.uid())
WITH CHECK (personal_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 3. TABELA DE TEMPLATES DE MENSAGENS (PERSONALIZADOS OU GLOBAIS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.templates_mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personal_id UUID REFERENCES public.personais(id) ON DELETE CASCADE, -- NULL se for template do sistema
    categoria TEXT NOT NULL, -- 'Desafio', 'Avaliacao', 'Check-in', 'Nutricao'
    titulo TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    is_global BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_templates_personal ON public.templates_mensagens (personal_id);

ALTER TABLE public.templates_mensagens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Personal visualiza templates globais ou seus proprios" ON public.templates_mensagens;
CREATE POLICY "Personal visualiza templates globais ou seus proprios"
ON public.templates_mensagens
FOR SELECT
TO authenticated
USING (is_global = true OR personal_id = auth.uid());

DROP POLICY IF EXISTS "Personal gerencia apenas seus templates criados" ON public.templates_mensagens;
CREATE POLICY "Personal gerencia apenas seus templates criados"
ON public.templates_mensagens
FOR INSERT
TO authenticated
WITH CHECK (personal_id = auth.uid());

CREATE POLICY "Personal edita apenas seus templates criados"
ON public.templates_mensagens
FOR UPDATE
TO authenticated
USING (personal_id = auth.uid())
WITH CHECK (personal_id = auth.uid());

CREATE POLICY "Personal remove apenas seus templates criados"
ON public.templates_mensagens
FOR DELETE
TO authenticated
USING (personal_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 4. HISTÓRICO DE DISPAROS DE WHATSAPP (AUDITORIA E MÉTRICAS POR TENANT)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.historico_disparos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personal_id UUID NOT NULL REFERENCES public.personais(id) ON DELETE CASCADE,
    aluno_id UUID REFERENCES public.alunos(id) ON DELETE SET NULL,
    destinatario_nome TEXT NOT NULL,
    telefone_destinatario TEXT NOT NULL,
    conteudo_mensagem TEXT NOT NULL,
    url_wa_gerada TEXT NOT NULL,
    metodo TEXT NOT NULL DEFAULT 'wa_me_link',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_historico_personal ON public.historico_disparos (personal_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_historico_aluno ON public.historico_disparos (aluno_id);

ALTER TABLE public.historico_disparos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Personal visualiza apenas seu proprio historico" ON public.historico_disparos;
CREATE POLICY "Personal visualiza apenas seu proprio historico"
ON public.historico_disparos
FOR ALL
TO authenticated
USING (personal_id = auth.uid())
WITH CHECK (personal_id = auth.uid());
