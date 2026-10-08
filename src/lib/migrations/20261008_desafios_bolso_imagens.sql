-- ==============================================================================
-- MIGRATION: DESAFIOS DE BOLSO COM IMAGENS, HISTÓRICO E CONTROLE DE ENVIO
-- Tabelas:
-- 1. pocket_challenges / desafios_templates (ampliada)
-- 2. pocket_challenge_images (imagens demonstrativas anatômicas e sequenciais)
-- 3. student_challenge_deliveries / historico_desafios (ampliada com idempotência e status)
-- 4. Supabase Storage Bucket: 'desafios-bolso'
-- ==============================================================================

-- 1. Ampliação da tabela 'desafios_templates' com campos de imagens e orientações
ALTER TABLE IF EXISTS public.desafios_templates 
ADD COLUMN IF NOT EXISTS imagem_url TEXT,
ADD COLUMN IF NOT EXISTS orientacoes_execucao JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS adaptacoes_seguranca TEXT;

-- 2. Tabela de imagens demonstrativas dos desafios (pocket_challenge_images)
CREATE TABLE IF NOT EXISTS public.pocket_challenge_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    desafio_id TEXT NOT NULL,
    url TEXT NOT NULL,
    quadro_numero INT DEFAULT 1,
    exercicio_nome TEXT,
    repeticoes_tempo TEXT,
    orientacoes_postura TEXT,
    adaptacao_mobilidade TEXT,
    ordem INT DEFAULT 1,
    personal_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_pocket_challenge_images_desafio ON public.pocket_challenge_images(desafio_id);
ALTER TABLE public.pocket_challenge_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos lêem imagens de desafios nativos ou do personal" ON public.pocket_challenge_images;
CREATE POLICY "Todos lêem imagens de desafios nativos ou do personal"
ON public.pocket_challenge_images
FOR SELECT
TO authenticated
USING (personal_id IS NULL OR personal_id = auth.uid());

DROP POLICY IF EXISTS "Personal gerencia imagens de seus desafios" ON public.pocket_challenge_images;
CREATE POLICY "Personal gerencia imagens de seus desafios"
ON public.pocket_challenge_images
FOR ALL
TO authenticated
USING (auth.uid() = personal_id)
WITH CHECK (auth.uid() = personal_id);

-- 3. Tabela 'student_challenge_deliveries' / Atualização da 'historico_desafios'
-- Suporta rastreamento completo de envio, idempotência e bloqueio permanente
ALTER TABLE IF EXISTS public.historico_desafios 
ADD COLUMN IF NOT EXISTS status_envio TEXT DEFAULT 'enviado', -- pendente, processando, aceito, enviado, entregue, lido, falhou
ADD COLUMN IF NOT EXISTS provider_message_id TEXT,
ADD COLUMN IF NOT EXISTS numero_destino TEXT,
ADD COLUMN IF NOT EXISTS imagens_urls JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS erro_envio TEXT,
ADD COLUMN IF NOT EXISTS data_entrega TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS data_leitura TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
ADD COLUMN IF NOT EXISTS origem_envio TEXT DEFAULT 'manual'; -- manual, agendado, automatico

-- Criar View ou tabela student_challenge_deliveries como alias sincronizado
CREATE TABLE IF NOT EXISTS public.student_challenge_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id TEXT NOT NULL,
    personal_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    desafio_id TEXT NOT NULL,
    desafio_titulo TEXT NOT NULL,
    mensagem_enviada TEXT NOT NULL,
    imagens_urls JSONB DEFAULT '[]'::jsonb,
    numero_destino TEXT,
    provider_message_id TEXT,
    status_envio TEXT NOT NULL DEFAULT 'pendente',
    data_envio TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    data_entrega TIMESTAMPTZ,
    data_leitura TIMESTAMPTZ,
    erro_envio TEXT,
    origem_envio TEXT DEFAULT 'manual',
    idempotency_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_aluno_desafio_idempotencia UNIQUE (aluno_id, desafio_id, personal_id)
);

CREATE INDEX IF NOT EXISTS idx_student_deliveries_aluno_desafio ON public.student_challenge_deliveries(aluno_id, desafio_id);
ALTER TABLE public.student_challenge_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Personal lê entregas de seus alunos" ON public.student_challenge_deliveries;
CREATE POLICY "Personal lê entregas de seus alunos"
ON public.student_challenge_deliveries
FOR SELECT
TO authenticated
USING (auth.uid() = personal_id);

DROP POLICY IF EXISTS "Personal insere entregas de seus alunos" ON public.student_challenge_deliveries;
CREATE POLICY "Personal insere entregas de seus alunos"
ON public.student_challenge_deliveries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = personal_id);

DROP POLICY IF EXISTS "Personal atualiza status de entregas de seus alunos" ON public.student_challenge_deliveries;
CREATE POLICY "Personal atualiza status de entregas de seus alunos"
ON public.student_challenge_deliveries
FOR UPDATE
TO authenticated
USING (auth.uid() = personal_id);

-- 4. Supabase Storage Bucket para Imagens Educativas dos Desafios
INSERT INTO storage.buckets (id, name, public)
VALUES ('desafios-bolso', 'desafios-bolso', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Permissões de Leitura Pública para imagens dos desafios
DROP POLICY IF EXISTS "Imagens de desafios são públicas para leitura" ON storage.objects;
CREATE POLICY "Imagens de desafios são públicas para leitura"
ON storage.objects FOR SELECT
USING (bucket_id = 'desafios-bolso');

-- Permissões de Upload para usuários autenticados
DROP POLICY IF EXISTS "Personal faz upload de imagens de desafios" ON storage.objects;
CREATE POLICY "Personal faz upload de imagens de desafios"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'desafios-bolso');
