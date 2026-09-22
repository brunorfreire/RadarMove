import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Força execução dinâmica no Next.js App Router
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // até 60 segundos de processamento

/**
 * Função utilitária para envio de mensagem via WhatsApp API Gateway
 * Suporta Evolution API, Z-API, Baileys, WhatsApp Cloud API ou Webhook HTTP.
 */
async function enviarMensagemWhatsApp(telefone: string, mensagem: string): Promise<{ success: boolean; error?: string }> {
  const apiUrl = process.env.WHATSAPP_API_URL
  const apiKey = process.env.WHATSAPP_API_KEY

  // Higieniza o número (deixa apenas números)
  const telefoneLimpo = telefone.replace(/\D/g, '')

  // Se não houver gateway configurado no .env, registra no log em modo simulação/desenvolvimento
  if (!apiUrl) {
    console.log(`[SIMULAÇÃO WHATSAPP] Para: ${telefoneLimpo} | Texto: ${mensagem.slice(0, 80)}...`)
    return { success: true }
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}`, apikey: apiKey } : {}),
      },
      body: JSON.stringify({
        number: telefoneLimpo,
        phone: telefoneLimpo,
        message: mensagem,
        text: mensagem,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return { success: false, error: `Status ${response.status}: ${errText}` }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Falha de conexão com a API de WhatsApp' }
  }
}

/**
 * Handler principal executado pelo Cron Job
 * Aceita GET e POST para máxima compatibilidade com Hostinger Cron, Vercel Cron e Supabase pg_cron.
 */
export async function GET(request: NextRequest) {
  return handleProcessarAgendamentos(request)
}

export async function POST(request: NextRequest) {
  return handleProcessarAgendamentos(request)
}

async function handleProcessarAgendamentos(request: NextRequest) {
  const startTime = Date.now()

  // 1. Validação de segurança opcional via CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const searchParams = request.nextUrl.searchParams
  const secretParam = searchParams.get('secret') || searchParams.get('key')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret) {
    const isAuthorized = 
      authHeader === `Bearer ${cronSecret}` || 
      secretParam === cronSecret

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Não autorizado. Token de segurança do CRON inválido ou ausente.' },
        { status: 401 }
      )
    }
  }

  // 2. Instanciação do Supabase com Service Role Key (para contornar RLS no backend do cron)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://nekjixiplijorvqaeini.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_QB3EuqGRIUQEfMEpuok7GQ_P-gyj9oP'

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  try {
    const nowIso = new Date().toISOString()

    // 3. Busca agendamentos pendentes cuja data/hora programada já foi atingida
    const { data: agendamentos, error: fetchError } = await supabase
      .from('agendamentos_envios')
      .select('*')
      .eq('status', 'pendente')
      .lte('data_hora_programada', nowIso)
      .order('data_hora_programada', { ascending: true })
      .limit(50)

    if (fetchError) {
      console.error('[CRON RadarMove] Erro ao buscar agendamentos:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!agendamentos || agendamentos.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum agendamento pendente para execução no momento.',
        processados: 0,
        duracaoMs: Date.now() - startTime,
      })
    }

    let sucessos = 0
    let falhas = 0
    const relatorioEnvios: Array<{ id: string; aluno: string; status: string; erro?: string }> = []

    // 4. Itera e processa cada agendamento
    for (const item of agendamentos) {
      try {
        // Bloqueia com status 'processando' para evitar reentrância em múltiplos workers
        await supabase
          .from('agendamentos_envios')
          .update({ status: 'processando', updated_at: new Date().toISOString() })
          .eq('id', item.id)

        // Busca dados do aluno
        const { data: aluno } = await supabase
          .from('alunos')
          .select('id, nome, telefone')
          .eq('id', item.aluno_id)
          .maybeSingle()

        const telefoneAluno = aluno?.telefone
        const nomeAluno = aluno?.nome || 'Aluno'

        if (!telefoneAluno) {
          throw new Error(`Telefone do aluno ID "${item.aluno_id}" não encontrado para envio.`)
        }

        // a) Envia a mensagem do desafio para o aluno
        const resultadoEnvioAluno = await enviarMensagemWhatsApp(telefoneAluno, item.mensagem)

        if (!resultadoEnvioAluno.success) {
          throw new Error(`Falha no envio para o aluno: ${resultadoEnvioAluno.error}`)
        }

        let notificacaoTreinadorEnviada = false

        // b) Se ativado, envia notificação de confirmação para o WhatsApp do Personal Trainer
        if (item.notificar_treinador) {
          // Busca o telefone do treinador no perfil
          const { data: profissional } = await supabase
            .from('profissionais')
            .select('nome_profissional, telefone')
            .eq('id', item.profissional_id)
            .maybeSingle()

          const telefoneTreinador = profissional?.telefone

          if (telefoneTreinador) {
            const mensagemTreinador = `[RadarMove] ✅ Desafio entregue com sucesso para ${nomeAluno}!\n\n📋 *Mensagem disparada:*\n"${item.mensagem.slice(0, 140)}${item.mensagem.length > 140 ? '...' : ''}"\n\n⏰ Horário: ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`

            const resultadoEnvioTreinador = await enviarMensagemWhatsApp(telefoneTreinador, mensagemTreinador)
            notificacaoTreinadorEnviada = resultadoEnvioTreinador.success
          }
        }

        // c) Atualiza o agendamento para 'enviado' com timestamps
        await supabase
          .from('agendamentos_envios')
          .update({
            status: 'enviado',
            enviado_em: new Date().toISOString(),
            notificacao_treinador_enviada: notificacaoTreinadorEnviada,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id)

        sucessos++
        relatorioEnvios.push({ id: item.id, aluno: nomeAluno, status: 'enviado' })
      } catch (itemErr: any) {
        falhas++
        console.error(`[CRON RadarMove] Erro no agendamento ${item.id}:`, itemErr)

        // Registra o erro no agendamento
        await supabase
          .from('agendamentos_envios')
          .update({
            status: 'erro',
            erro_detalhes: itemErr.message || 'Erro desconhecido durante o disparo',
            tentativas: (item.tentativas || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id)

        relatorioEnvios.push({ id: item.id, aluno: item.aluno_id, status: 'erro', erro: itemErr.message })
      }
    }

    return NextResponse.json({
      success: true,
      totalEncontrados: agendamentos.length,
      processados: sucessos + falhas,
      sucessos,
      falhas,
      duracaoMs: Date.now() - startTime,
      detalhes: relatorioEnvios,
    })
  } catch (err: any) {
    console.error('[CRON RadarMove] Erro geral na execução:', err)
    return NextResponse.json({ error: err.message || 'Erro interno no processamento' }, { status: 500 })
  }
}
