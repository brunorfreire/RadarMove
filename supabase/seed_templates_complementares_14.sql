-- ==============================================================================
-- RadarMove: Migração e Inserção Complementar de Templates (14 Cards por Categoria)
-- Tabela: public.desafios_templates
-- ==============================================================================

-- 1. Garante que as colunas necessárias existam
ALTER TABLE public.desafios_templates ADD COLUMN IF NOT EXISTS mensagem TEXT;
ALTER TABLE public.desafios_templates ADD COLUMN IF NOT EXISTS mensagem_whatsapp TEXT;
ALTER TABLE public.desafios_templates ADD COLUMN IF NOT EXISTS tempo_estimado VARCHAR(50) DEFAULT '5 min';
ALTER TABLE public.desafios_templates ADD COLUMN IF NOT EXISTS dificuldade VARCHAR(20) DEFAULT 'Fácil';

-- 2. Atualiza a restrição de verificação de categorias (suportando nomes curtos e completos)
ALTER TABLE public.desafios_templates DROP CONSTRAINT IF EXISTS desafios_templates_categoria_check;
ALTER TABLE public.desafios_templates ADD CONSTRAINT desafios_templates_categoria_check 
CHECK (categoria IN (
    'Lazer Ativo',
    'Mindset Estoico',
    'Estoicismo',
    'Lifestyle 23h',
    'Desafio de Bolso',
    'Conversão & Leads',
    'Desafio de Conversão',
    'Nutrição & Hidratação',
    'Nutrição',
    'Recuperação & Sono',
    'Recuperação'
));

-- 3. Inserção dos templates complementares exatamente conforme solicitado pelo usuário
INSERT INTO public.desafios_templates (titulo, categoria, mensagem, profissional_id) VALUES

-- ========================================================
-- CATEGORIA: Lifestyle 23h (12 novos)
-- ========================================================
('Pausa Ativa a Cada 90 Minutos', 'Lifestyle 23h', 'Ficar sentado horas seguidas sabota a sua circulação e coluna. Desafio de hoje: a cada 90 minutos de trabalho, levante-se e caminhe durante 2 minutos. Responda com um "Feito" no final da tarde!', NULL),
('Subir de Escadas', 'Lifestyle 23h', 'Hoje o elevador e a escada rolante estão proibidos para trajetos de até 3 andares. Transforme o seu trajeto diário em estímulo cardiovascular!', NULL),
('Garrafa de Água na Secretária', 'Lifestyle 23h', 'Manter a hidratação exige conveniência. Mantenha uma garrafa de pelo menos 1 litro cheia ao seu lado durante todo o expediente de trabalho e termine-a antes do almoço.', NULL),
('Caminhada Pós-Refeição de 10 Min', 'Lifestyle 23h', 'Para otimizar o controlo glicémico e a digestão, faça uma caminhada leve de 10 minutos logo após a sua principal refeição do dia.', NULL),
('Luz Natural nos Olhos ao Acordar', 'Lifestyle 23h', 'Ajuste o seu ciclo circadiano: nos primeiros 20 minutos após sair da cama, apanhe 5 a 10 minutos de claridade natural antes de ligar a televisão ou o computador.', NULL),
('Almoço Longe de Ecrãs', 'Lifestyle 23h', 'Comer a responder a e-mails ou a ver redes sociais prejudica a saciedade. Faça a sua refeição de hoje mastigando com calma e sem qualquer ecrã à frente.', NULL),
('Descer Uma Paragem Antes', 'Lifestyle 23h', 'Adicione passos funcionais ao seu dia: no trajeto de regresso a casa, desça uma paragem antes ou estacione o carro a duas quadras de distância.', NULL),
('Check-in de Postura na Cadeira', 'Lifestyle 23h', 'Coloque um alarme a meio da tarde. Ao tocar, apoie os dois pés no chão, contraia o abdómen e alinhe os ombros para trás.', NULL),
('Banho Frio de Choque (30 Segundos)', 'Lifestyle 23h', 'Ao terminar o banho morno, coloque a água totalmente fria durante os últimos 30 segundos. Ativa a circulação e desperta a mente de imediato.', NULL),
('Alongamento Rápido ao Telefone', 'Lifestyle 23h', 'Sempre que receber uma chamada com duração superior a 3 minutos, fique em pé e aproveite para esticar as pernas e panturrilhas enquanto conversa.', NULL),
('Zero Sentado Após as 20h', 'Lifestyle 23h', 'Após o jantar, evite ficar logo deitado no sofá. Mantenha-se em pé a organizar as tarefas de amanhã durante 15 minutos.', NULL),
('Organizar o Kit de Treino na Véspera', 'Lifestyle 23h', 'Elimine a fricção matinal: deixe as roupas, sapatilhas e garrafa de treino organizadas antes de dormir. O seu compromisso com o treino começa na noite anterior.', NULL),

-- ========================================================
-- CATEGORIA: Desafio de Bolso (12 novos)
-- ========================================================
('Cócoras Profundas de 60s', 'Desafio de Bolso', 'Destrave os tornozelos e a lombar: segure num apoio estável e permaneça em posição de agachamento profundo (cócoras) durante 60 segundos contínuos.', NULL),
('Prancha Abdominal no Chão', 'Desafio de Bolso', 'Pausa rápida no escritório ou em casa: sustente 3 séries de 30 segundos de prancha isométrica com 20 segundos de descanso. Corpo firme e abdómen ativado!', NULL),
('Extensão Torácica na Cadeira', 'Desafio de Bolso', 'Entrelace as mãos atrás da cabeça e empurre o peito para cima, apoiando o meio das costas no encosto da cadeira. Repita 12 vezes para aliviar as costas.', NULL),
('Isometria de Parede (Wall Sit 45s)', 'Desafio de Bolso', 'Encoste as costas na parede com os joelhos a 90 graus. Segure a posição durante 45 segundos. As pernas vão tremer e a queimação é garantida!', NULL),
('100 Polichinelos Fracionados', 'Desafio de Bolso', 'Eleve o ritmo cardíaco sem sair do mesmo lugar: complete 4 séries de 25 repetições de polichinelos com intervalos de 15 segundos.', NULL),
('Mobilidade Escapular na Parede', 'Desafio de Bolso', 'Encoste costas, cabeça e cotovelos na parede. Suba e desça os braços mantendo o contacto sem descolar a coluna lombar. 10 repetições controladas.', NULL),
('Equilíbrio Unipodal com Olhos Fechados', 'Desafio de Bolso', 'Fique em apoio de um só pé descalço durante 30 segundos de cada lado. Para dificultar, feche os olhos nos últimos 10 segundos para testar a proprioceção.', NULL),
('Afundos sem Carga (20 Repetições)', 'Desafio de Bolso', 'Faça 10 passos de afundo para cada perna no corredor da sua casa ou do escritório. Ativação de quadríceps e glúteos em menos de 2 minutos.', NULL),
('Mobilidade de Punhos e Antebraços', 'Desafio de Bolso', 'Excelente para quem trabalha muito tempo ao teclado: apoie as palmas no tampo da mesa e faça pequenas rotações aliviando a tensão do antebraço durante 2 minutos.', NULL),
('Flexões de Braço Relâmpago', 'Desafio de Bolso', 'Faça o seu número máximo de repetições de flexões de braço com boa técnica em 60 segundos. Envie-me o resultado de repetições!', NULL),
('Elevação Pélvica Rápida', 'Desafio de Bolso', 'Deite-se no chão ou tapete e faça 20 repetições de elevação de anca contraindo bem os glúteos no topo durante 2 segundos.', NULL),
('Descompressão Cervical', 'Desafio de Bolso', 'Incline suavemente a cabeça lateralmente com o auxílio da mão durante 30 segundos de cada lado, soltando toda a tensão acumulada no trapézio.', NULL),

-- ========================================================
-- CATEGORIA: Conversão & Leads (12 novos)
-- ========================================================
('Degustação: Teste do Espelho (Postura)', 'Conversão & Leads', 'Olá! Olhe-se de perfil ao espelho com roupa confortável: os seus ombros caem para a frente ou a linha da orelha ultrapassa a do peito? Responda aqui para eu analisar o seu alinhamento!', NULL),
('Degustação: Teste de Resistência de 1 Minuto', 'Conversão & Leads', 'Quer saber o seu nível atual de condicionamento? Conte quantos agachamentos consegue fazer em 60 segundos mantendo a postura. Envie-me o número!', NULL),
('Degustação: Autoavaliação da Respiração', 'Conversão & Leads', 'Coloque uma mão no peito e outra na barriga. Respire fundo: qual mão subiu primeiro? Se foi a do peito, a sua respiração pode estar a gerar ansiedade e tensão muscular.', NULL),
('Degustação: Desafio 48h Sem Refrigerante', 'Conversão & Leads', 'Um desafio prático de arranque: elimine qualquer refrigerante ou sumo industrializado pelas próximas 48 horas. Topa iniciar hoje comigo?', NULL),
('Degustação: Mini-Rotina Anti-Dores', 'Conversão & Leads', 'Sente cansaço ou dores no final do dia de trabalho? Assista a este vídeo rápido de 2 minutos e experimente aplicar antes de jantar.', NULL),
('Degustação: Teste do Alcance aos Dedos', 'Conversão & Leads', 'Com as pernas retas, incline o corpo à frente e veja até onde as pontas dos dedos chegam. Passou dos joelhos ou tocou no chão? Envie-me uma foto ou mensagem com o resultado!', NULL),
('Degustação: Desafio Proteico de 3 Dias', 'Conversão & Leads', 'Vamos testar a sua saciedade: garanta 20g a 30g de proteína em cada refeição principal nos próximos 3 dias e veja a vontade de comer doces diminuir.', NULL),
('Degustação: Check-in Energético das 15h', 'Conversão & Leads', 'Costuma sentir aquela quebra brusca de energia por volta das 15h? Responda a esta mensagem com a sua rotina habitual de almoço para descobrirmos a causa.', NULL),
('Degustação: O Teste de Mobilidade de Tornozelo', 'Conversão & Leads', 'Aproxime o joelho da parede sem tirar o calcanhar do chão a 10 cm de distância. Conseguiu encostar? Se não conseguiu, os seus treinos de perna estão a ser limitados.', NULL),
('Degustação: Calculadora do Gasto Diário', 'Conversão & Leads', 'Envie-me a sua idade, peso aproximado e o seu principal objetivo para eu calcular a sua estimativa diária de calorias de manutenção.', NULL),
('Degustação: Desafio Hidratação de Peso', 'Conversão & Leads', 'Multiplique o seu peso corporal por 35 ml. Essa é a sua meta diária de água. Consegue atingir esse volume hoje? Responda com a sua meta calculada!', NULL),
('Degustação: Diagnóstico de Treino Sem Custos', 'Conversão & Leads', 'Treina sozinho e não tem visto evolução nas medidas? Diga-me qual é a sua divisão atual de treinos para eu apontar 2 ajustes imediatos.', NULL),

-- ========================================================
-- CATEGORIA: Nutrição & Hidratação (12 novos)
-- ========================================================
('Fotografia do Prato no Almoço', 'Nutrição & Hidratação', 'Desafio de consciência alimentar: tire uma foto ao seu prato de almoço e envie-me. O prato deve ter metade de vegetais e um quarto de proteína magra.', NULL),
('Substituição de Snacks Ultraprocessados', 'Nutrição & Hidratação', 'Troque biscoitos ou barras doces processadas da tarde por uma fruta fresca combinada com um punhado de castanhas ou nozes.', NULL),
('Meta 2L de Água Antes das 16h', 'Nutrição & Hidratação', 'Evite acordar várias vezes à noite para urinar: consuma pelo menos 2 litros de água limpa antes das 16h da tarde.', NULL),
('Salada Crua Antes do Prato Quente', 'Nutrição & Hidratação', 'Controle o pico de apetite: coma uma taça de salada de folhas cruas antes de servir a parte quente da refeição.', NULL),
('Corte de Frituras por 48h', 'Nutrição & Hidratação', 'Durante os próximos 2 dias, prepare ou escolha apenas alimentos grelhados, cozidos, estufados ou assados. Zero óleo de imersão!', NULL),
('Aporte de Fibras no Pequeno-Almoço', 'Nutrição & Hidratação', 'Acrescente 1 colher de sopa de farelo de aveia, sementes de chia ou linhaça na primeira refeição do dia para melhorar o trânsito intestinal.', NULL),
('Troca de Molhos Calóricos', 'Nutrição & Hidratação', 'Substitua molhos prontos, maionese ou condimentos industriais por azeite extra virgem, vinagre e limão espremido.', NULL),
('Jantar Sem Carboidratos Simples', 'Nutrição & Hidratação', 'Esta noite a refeição deve priorizar carnes magras/ovos e vegetais verdes cozidos, evitando açúcares e farinhas refinadas.', NULL),
('Adição de 1 Fruta Cítrica ao Dia', 'Nutrição & Hidratação', 'Consuma uma porção de fruta cítrica (laranja, tangerina, kiwi ou limão) para reforçar o aporte de vitamina C e melhorar a absorção de ferro.', NULL),
('Evitar Repetir o Prato', 'Nutrição & Hidratação', 'Coma devagar e monte uma porção única equilibrada. Espere 15 minutos após terminar antes de pensar em repetir.', NULL),
('Chá Digestivo Noturno Sem Açúcar', 'Nutrição & Hidratação', 'Beba uma chávena morna de chá de camomila, erva-cidreira ou hortelã 45 minutos após o jantar sem adoçar.', NULL),
('Registo de Bebidas do Fim de Semana', 'Nutrição & Hidratação', 'Mantenha a contagem de copos de bebidas alcoólicas ou açucaradas durante o fim de semana e compense cada dose com 1 copo de água mineral.', NULL),

-- ========================================================
-- CATEGORIA: Recuperação & Sono (12 novos)
-- ========================================================
('Respiração Caixa 4x4', 'Recuperação & Sono', 'Antes de adormecer: inspire durante 4 segundos, segure o ar por 4 segundos, expire em 4 segundos e mantenha os pulmões vazios por 4 segundos. Repita 5 ciclos.', NULL),
('Quarto Totalmente Escuro', 'Recuperação & Sono', 'Cubra luzes de standby de aparelhos eletrónicos e use cortinas opacas. O menor ponto de luz no quarto diminui a produção natural de melatonina.', NULL),
('Alongamento de Isquiotibiais Noturno', 'Recuperação & Sono', 'Sentado no chão, estenda uma toalha na sola dos pés e tracione as pernas retas por 60 segundos de cada lado para descomprimir a cadeia posterior.', NULL),
('Janela de 2h Sem Cafeína Antes de Deitar', 'Recuperação & Sono', 'Corte qualquer estimulante (café, chá preto, chocolate ou pré-treinos) pelo menos 6 horas antes da hora planeada para dormir.', NULL),
('Elevação de Pernas na Parede (5 Minutos)', 'Recuperação & Sono', 'Deite-se no chão e encoste os calcanhares e as pernas elevadas na parede a 90 graus por 5 minutos. Excelente para drenar as pernas cansadas.', NULL),
('Temperatura do Quarto Agradável', 'Recuperação & Sono', 'O corpo precisa de baixar a sua temperatura interna para entrar em sono profundo. Mantenha o quarto fresco e bem ventilado esta noite.', NULL),
('Despejo Mental no Papel', 'Recuperação & Sono', 'Se a cabeça não para com tarefas pendentes, escreva numa folha tudo o que tem de resolver amanhã antes de ir para a cama. Esvazie a mente.', NULL),
('Massagem com Bola de Ténis nos Pés', 'Recuperação & Sono', 'Passe a sola dos pés sobre uma bola de ténis durante 2 minutos de cada lado. Relaxa a fáscia plantar e diminui a tensão muscular corporal.', NULL),
('Zero Notícias ou Conteúdo Agressivo à Noite', 'Recuperação & Sono', 'Evite ver telejornais sensacionalistas ou redes sociais com discussões 1 hora antes de deitar para prevenir picos de cortisol.', NULL),
('Automassagem com Foam Roller', 'Recuperação & Sono', 'Dedique 5 minutos para rolar a coxa e as costas no rolo de libertação miofascial com movimentos lentos e controlados.', NULL),
('Manter o Horário de Dormir Fixo', 'Recuperação & Sono', 'Tente ir para a cama e acordar exatamente no mesmo horário nos próximos 3 dias, consolidando o ritmo biológico natural.', NULL),
('Pés Aquecidos para Estimular o Sono', 'Recuperação & Sono', 'Coloque meias confortáveis se os pés estiverem frios: o aquecimento das extremidades facilita a vasodilatação e induz o sono com mais rapidez.', NULL),

-- ========================================================
-- CATEGORIA: Mindset Estoico (4 complementares para fechar 14)
-- ========================================================
('Dicotomia do Controlo Matinal', 'Mindset Estoico', '"Das coisas, algumas dependem de nós, outras não." Comece o dia a listar mentalmente 1 preocupação que não controla e decida ignorá-la hoje.', NULL),
('Visualização Antecipada dos Obstáculos', 'Mindset Estoico', 'Antes de sair de casa, imagine o que pode correr mal no seu dia (trânsito, reuniões atrasadas) e defina antecipadamente que a sua calma não será abalada.', NULL),
('A Vitória Silenciosa do Esforço', 'Mindset Estoico', 'Não busque validação ou elogios pelo treino de hoje. Cumpra as séries com rigor e celebre internamente o compromisso honrado com a sua disciplina.', NULL),
('Amor Fati: Aceite as Mudanças de Plano', 'Mindset Estoico', 'Se imprevistos alterarem o horário do treino, não reclame. Adapte a sessão para 20 minutos com intensidade máxima e faça o melhor possível com os recursos que tem.', NULL);

-- 4. Sincroniza mensagens entre colunas de compatibilidade
UPDATE public.desafios_templates 
SET mensagem_whatsapp = mensagem 
WHERE (mensagem_whatsapp IS NULL OR mensagem_whatsapp = '') AND mensagem IS NOT NULL;

UPDATE public.desafios_templates 
SET mensagem = mensagem_whatsapp 
WHERE (mensagem IS NULL OR mensagem = '') AND mensagem_whatsapp IS NOT NULL;

-- 5. Atualiza tempo estimado e dificuldade padrão se estiverem nulos
UPDATE public.desafios_templates 
SET tempo_estimado = '5 min' 
WHERE tempo_estimado IS NULL;

UPDATE public.desafios_templates 
SET dificuldade = 'Fácil' 
WHERE dificuldade IS NULL;

-- 6. Notifica PostgREST para recarregar o schema cache
NOTIFY pgrst, 'reload config';
