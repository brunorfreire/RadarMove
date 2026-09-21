-- ==============================================================================
-- RadarMove: Migração e Seed da Biblioteca Nativa de Desafios
-- Tabela: public.desafios_templates
-- Categorias: "Lazer Ativo" e "Mindset Estoico"
-- ==============================================================================

-- 1. AJUSTE DE SCHEMA: Atualização da constraint de categorias
-- Remove a verificação antiga para permitir as novas categorias
ALTER TABLE public.desafios_templates 
DROP CONSTRAINT IF EXISTS desafios_templates_categoria_check;

-- Adiciona a nova constraint com todas as categorias do RadarMove
ALTER TABLE public.desafios_templates 
ADD CONSTRAINT desafios_templates_categoria_check 
CHECK (categoria IN (
    'Lazer Ativo',
    'Mindset Estoico',
    'Lifestyle 23h',
    'Desafio de Bolso',
    'Estoicismo',
    'Recuperação',
    'Nutrição',
    'Desafio de Conversão'
));

-- Garante suporte a colunas complementares se aplicável
ALTER TABLE public.desafios_templates 
ADD COLUMN IF NOT EXISTS tempo_estimado VARCHAR(50) DEFAULT '5 min',
ADD COLUMN IF NOT EXISTS dificuldade VARCHAR(20) DEFAULT 'Fácil';

-- ==============================================================================
-- 2. INSERT: 10 Templates Globais (profissional_id = NULL)
-- ==============================================================================
INSERT INTO public.desafios_templates (
    profissional_id, 
    categoria, 
    titulo, 
    mensagem_whatsapp,
    tempo_estimado,
    dificuldade
)
VALUES
    -- -------------------------------------------------------------------------
    -- CATEGORIA: Lazer Ativo (1 a 5)
    -- -------------------------------------------------------------------------
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

    -- -------------------------------------------------------------------------
    -- CATEGORIA: Mindset Estoico (6 a 10)
    -- -------------------------------------------------------------------------
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
    );
