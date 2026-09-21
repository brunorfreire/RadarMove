-- ==============================================================================
-- FitPulse CRM: Schema SQL para Supabase (PostgreSQL) com Row Level Security (RLS)
-- Multi-tenant isolado por Personal Trainer (auth.uid() -> profissionais.id)
-- ==============================================================================

-- 0. Extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. TABELA: profissionais (Tenant / Perfil do Personal Trainer)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profissionais (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_empresa VARCHAR(150) NOT NULL,
    telefone VARCHAR(25),
    logo_url TEXT,
    cor_primaria VARCHAR(10) DEFAULT '#10b981', -- Verde Esmeralda padrão
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Comentários descritivos
COMMENT ON TABLE public.profissionais IS 'Armazena as configurações e identidade do Personal Trainer (Tenant)';

-- ==============================================================================
-- 2. TABELA: alunos (Clientes do Personal Trainer)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.alunos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    telefone VARCHAR(25) NOT NULL,
    data_nascimento DATE,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'em_risco')),
    ultimo_checkin TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
    avatar_url TEXT,
    objetivo TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON TABLE public.alunos IS 'Alunos matriculados sob a tutela do personal trainer';

-- ==============================================================================
-- 3. TABELA: avaliacoes_fisicas (Bioimpedância e Medidas Antropométricas)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.avaliacoes_fisicas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
    data_registro DATE NOT NULL DEFAULT CURRENT_DATE,
    circ_abdominal NUMERIC(5,2) CHECK (circ_abdominal > 0),    -- em cm
    perc_gordura NUMERIC(4,2) CHECK (perc_gordura >= 0),       -- em %
    massa_muscular NUMERIC(5,2) CHECK (massa_muscular > 0),    -- em kg
    gordura_visceral NUMERIC(4,2) CHECK (gordura_visceral >= 0),
    taxa_metabolica INTEGER CHECK (taxa_metabolica > 0),        -- em kcal
    peso NUMERIC(5,2),                                         -- em kg (opcional complementar)
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON TABLE public.avaliacoes_fisicas IS 'Histórico evolutivo de bioimpedância e medidas corporais';

-- ==============================================================================
-- 4. TABELA: desafios_templates (Biblioteca de Micro-Desafios e Gamificação)
-- Se profissional_id for NULL, o desafio é GLOBAL (do sistema).
-- Se tiver profissional_id, é um desafio customizado do personal trainer.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.desafios_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profissional_id UUID REFERENCES public.profissionais(id) ON DELETE CASCADE,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('Lazer Ativo', 'Mindset Estoico', 'Lifestyle 23h', 'Desafio de Bolso', 'Estoicismo', 'Recuperação', 'Nutrição', 'Desafio de Conversão')),
    titulo VARCHAR(150) NOT NULL,
    mensagem_whatsapp TEXT NOT NULL,
    tempo_estimado VARCHAR(50) DEFAULT '5 min',
    dificuldade VARCHAR(20) DEFAULT 'Fácil',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON TABLE public.desafios_templates IS 'Templates de mensagens rápidas e desafios de retenção via WhatsApp';

-- ==============================================================================
-- 5. ÍNDICES PARA ALTA PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_alunos_profissional_id ON public.alunos(profissional_id);
CREATE INDEX IF NOT EXISTS idx_alunos_status ON public.alunos(status);
CREATE INDEX IF NOT EXISTS idx_alunos_ultimo_checkin ON public.alunos(ultimo_checkin);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_aluno_data ON public.avaliacoes_fisicas(aluno_id, data_registro DESC);
CREATE INDEX IF NOT EXISTS idx_desafios_profissional_categoria ON public.desafios_templates(profissional_id, categoria);

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) - ISOLAMENTO MULTI-TENANT
-- ==============================================================================

-- Habilita RLS em todas as tabelas
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_fisicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desafios_templates ENABLE ROW LEVEL SECURITY;

-- 6.1 Políticas para 'profissionais'
CREATE POLICY "Profissional visualiza apenas seu proprio perfil"
    ON public.profissionais
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Profissional atualiza apenas seu proprio perfil"
    ON public.profissionais
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Profissional insere seu proprio perfil"
    ON public.profissionais
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 6.2 Políticas para 'alunos'
CREATE POLICY "Profissional visualiza apenas seus proprios alunos"
    ON public.alunos
    FOR SELECT
    USING (profissional_id = auth.uid());

CREATE POLICY "Profissional cadastra alunos para si mesmo"
    ON public.alunos
    FOR INSERT
    WITH CHECK (profissional_id = auth.uid());

CREATE POLICY "Profissional edita apenas seus alunos"
    ON public.alunos
    FOR UPDATE
    USING (profissional_id = auth.uid());

CREATE POLICY "Profissional remove apenas seus alunos"
    ON public.alunos
    FOR DELETE
    USING (profissional_id = auth.uid());

-- 6.3 Políticas para 'avaliacoes_fisicas'
-- Acesso permitido apenas se o aluno pertencer ao profissional autenticado
CREATE POLICY "Profissional visualiza avaliacoes de seus alunos"
    ON public.avaliacoes_fisicas
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.alunos
            WHERE public.alunos.id = public.avaliacoes_fisicas.aluno_id
              AND public.alunos.profissional_id = auth.uid()
        )
    );

CREATE POLICY "Profissional insere avaliacoes para seus alunos"
    ON public.avaliacoes_fisicas
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.alunos
            WHERE public.alunos.id = public.avaliacoes_fisicas.aluno_id
              AND public.alunos.profissional_id = auth.uid()
        )
    );

CREATE POLICY "Profissional altera avaliacoes de seus alunos"
    ON public.avaliacoes_fisicas
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.alunos
            WHERE public.alunos.id = public.avaliacoes_fisicas.aluno_id
              AND public.alunos.profissional_id = auth.uid()
        )
    );

CREATE POLICY "Profissional remove avaliacoes de seus alunos"
    ON public.avaliacoes_fisicas
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.alunos
            WHERE public.alunos.id = public.avaliacoes_fisicas.aluno_id
              AND public.alunos.profissional_id = auth.uid()
        )
    );

-- 6.4 Políticas para 'desafios_templates'
-- Permite ler templates globais (profissional_id IS NULL) ou do próprio profissional
CREATE POLICY "Visualizar templates globais ou proprios"
    ON public.desafios_templates
    FOR SELECT
    USING (profissional_id IS NULL OR profissional_id = auth.uid());

CREATE POLICY "Criar novos templates proprios"
    ON public.desafios_templates
    FOR INSERT
    WITH CHECK (profissional_id = auth.uid());

CREATE POLICY "Editar templates proprios"
    ON public.desafios_templates
    FOR UPDATE
    USING (profissional_id = auth.uid());

CREATE POLICY "Excluir templates proprios"
    ON public.desafios_templates
    FOR DELETE
    USING (profissional_id = auth.uid());

-- ==============================================================================
-- 7. TRIGGERS AUTOMÁTICOS
-- ==============================================================================

-- 7.1 Atualizador de updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profissionais_updated_at
    BEFORE UPDATE ON public.profissionais
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_update_alunos_updated_at
    BEFORE UPDATE ON public.alunos
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7.2 Criação automática de registro em profissionais ao criar conta no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profissionais (id, nome_empresa, telefone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nome_empresa', 'Personal Studio'),
        NEW.raw_user_meta_data->>'telefone'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 8. SEED DATA INICIAL (Templates Globais de Desafios para WhatsApp)
-- ==============================================================================
INSERT INTO public.desafios_templates (profissional_id, categoria, titulo, mensagem_whatsapp, tempo_estimado, dificuldade)
VALUES
    -- Categoria: Lazer Ativo (Movimento ao ar livre, esportes e descanso ativo)
    (
        NULL,
        'Lazer Ativo',
        'Oxigenar a mente (Sexta-feira)',
        'Sextou! O asfalto já deu o que tinha que dar. O desafio RadarMove deste fim de semana é oxigenar a mente. Escolha uma rota nova: uma trilha, uma caminhada na areia ou um parque que você não visita faz tempo. Vá curtir e me mande uma foto do visual!',
        'Fim de semana',
        'Fácil'
    ),
    (
        NULL,
        'Lazer Ativo',
        'Esporte em Grupo',
        'Treinar não precisa ser solitário. O desafio de hoje é o movimento em grupo! Chame os amigos para uma partida de vôlei de praia, altinha ou um esporte ao ar livre. O importante é suar, se divertir e desestressar. Bom jogo!',
        '1h',
        'Médio'
    ),
    (
        NULL,
        'Lazer Ativo',
        'Vento no rosto (Bike)',
        'Que tal trocar quatro rodas por duas hoje? O desafio é alugar uma bike ou pegar a sua e pedalar ao ar livre. Sinta o vento, mude a rota e faça do seu exercício um momento de lazer. Manda um ''Feito 💪'' quando terminar a rota.',
        '30-45 min',
        'Fácil'
    ),
    (
        NULL,
        'Lazer Ativo',
        'Equilíbrio e Recuperação',
        'O descanso faz parte do treino. Seu desafio para este fim de semana é o equilíbrio: faça uma caminhada leve de 30 minutos ao ar livre e, à noite, relaxe com uma boa taça de vinho tinto. Recarregue as energias, segunda-feira tem mais!',
        '30 min',
        'Fácil'
    ),
    (
        NULL,
        'Lazer Ativo',
        'Exploração de fim de semana',
        'Vai pegar a moto ou o carro no fim de semana? Aproveite a viagem para explorar! Estacione, encontre um mirante ou uma ladeira nova e faça uma caminhada exploratória. O corpo foi feito para se mover em todos os terrenos. Aproveite!',
        '20 min',
        'Fácil'
    ),

    -- Categoria: Mindset Estoico (Foco, disciplina e micro-vitórias)
    (
        NULL,
        'Mindset Estoico',
        'Foco no que você controla',
        'Começando mais uma semana! Lembre-se do princípio estoico: não controlamos o trânsito, as urgências do trabalho ou o clima. Mas controlamos o que colocamos no prato e a energia que deixamos no treino. Foco no que está nas suas mãos hoje!',
        'Leitura 30s',
        'Fácil'
    ),
    (
        NULL,
        'Mindset Estoico',
        'O obstáculo é o caminho',
        'Imprevistos acontecem. Faltou tempo para o treino completo hoje? Não tem problema, o obstáculo é o caminho. Adapte. O desafio de hoje é fazer 15 minutos de exercícios com o peso do corpo na sala de casa. Feito é melhor que perfeito. Me avise quando terminar!',
        '15 min',
        'Médio'
    ),
    (
        NULL,
        'Mindset Estoico',
        'Disciplina supera motivação',
        'A motivação te faz começar, mas é o hábito que te faz continuar. Hoje pode ser um daqueles dias em que a vontade é zero. É exatamente hoje que o treino vale o dobro para a sua disciplina. Deixe a roupa separada. Te espero mais tarde!',
        'Leitura 30s',
        'Desafiador'
    ),
    (
        NULL,
        'Mindset Estoico',
        'O poder do agora',
        'Não sofra pelo treino que você perdeu ontem, nem pela dieta que vai furar amanhã. A filosofia nos ensina a viver o agora. O que você pode fazer pela sua saúde NESTE momento? Beba um copão de água agora e garanta o treino de hoje.',
        'Imediato',
        'Fácil'
    ),
    (
        NULL,
        'Mindset Estoico',
        'Micro-vitórias diárias',
        'Grandes resultados são apenas a soma de pequenas vitórias diárias. O desafio RadarMove de hoje é simples, mas poderoso: durma 30 minutos mais cedo e bata sua meta de água. O corpo se constrói no descanso. Vamos juntos!',
        'Diário',
        'Fácil'
    ),

    -- Categoria: Lifestyle 23h (O que você faz nas 23h fora do treino)
    (
        NULL,
        'Lifestyle 23h',
        'Regra do Copo Cheio ao Acordar',
        'Fala {aluno}! Passando pra te lembrar da nossa regra das 23h: 500ml de água antes de qualquer café ou celular logo ao levantar. Já bateu esse micro-hábito hoje? Me manda um 💧 quando fizer!',
        '1 min',
        'Fácil'
    ),
    (
        NULL,
        'Lifestyle 23h',
        'Caminhada Pós-Almoço de 10 min',
        'E aí {aluno}! Desafio Lifestyle 23h de hoje: 10 minutinhos de caminhada leve logo após o almoço para controlar o pico de glicose e digestão. Topa esse combinado comigo hoje?',
        '10 min',
        'Fácil'
    ),
    -- Categoria: Desafio de Bolso (Ação imediata rápida)
    (
        NULL,
        'Desafio de Bolso',
        'Micro-Pausa Postural: 30s Prancha',
        'Opa {aluno}! Desafio de bolso do dia: levanta da cadeira agora, 30 segundinhos de prancha ou 20 agachamentos livres para acordar os glúteos e aliviar a lombar. Fez? Me dá um check ✅!',
        '1 min',
        'Fácil'
    ),
    (
        NULL,
        'Desafio de Bolso',
        'Meta de Hidratação 3L',
        'Fala {aluno}! Como tá a garrafa do lado da mesa? A meta de hoje é completar a 3ª garrafa antes das 18h. Se já estiver na metade, me responde aqui com a foto da garrafa!',
        'Imediato',
        'Fácil'
    )
ON CONFLICT DO NOTHING;
