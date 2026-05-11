import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/send-email'
import type { Participante, Curso } from '@/types/database'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { curso_id, only_with_pdf } = body as {
      curso_id?: string
      only_with_pdf?: boolean
    }

    const supabase = createAdminClient()

    let query = supabase.from('participantes').select('*')
    if (curso_id) query = query.eq('curso_id', curso_id)
    if (only_with_pdf !== false) query = query.not('pdf_ingresso_url', 'is', null)

    const { data: participantes, error: partsErr } = (await query) as {
      data: Participante[] | null
      error: Error | null
    }

    if (partsErr || !participantes) {
      return NextResponse.json(
        { error: 'Erro ao buscar participantes' },
        { status: 500 }
      )
    }

    if (participantes.length === 0) {
      return NextResponse.json({
        total: 0,
        success: 0,
        errors: 0,
        message: 'Nenhum participante para enviar ingresso',
      })
    }

    // Cache de cursos
    const cursoCache = new Map<string, Curso>()
    let success = 0
    let errors = 0
    const errorList: Array<{ id: string; nome: string; email: string; error: string }> = []
    const skipped: Array<{ nome: string; reason: string }> = []

    for (const p of participantes) {
      // Pula sem email válido
      if (!p.email || !p.email.includes('@')) {
        skipped.push({ nome: p.nome, reason: 'sem email válido' })
        continue
      }

      // Pula sem PDF
      if (!p.pdf_ingresso_url) {
        skipped.push({ nome: p.nome, reason: 'sem PDF gerado' })
        continue
      }

      try {
        // Curso
        let curso = cursoCache.get(p.curso_id)
        if (!curso) {
          const { data } = (await supabase
            .from('cursos')
            .select('*')
            .eq('id', p.curso_id)
            .single()) as { data: Curso | null }
          if (!data) throw new Error('Curso não encontrado')
          curso = data
          cursoCache.set(p.curso_id, curso)
        }

        // Baixa PDF
        const pdfRes = await fetch(p.pdf_ingresso_url)
        if (!pdfRes.ok) throw new Error(`Falha ao baixar PDF (${pdfRes.status})`)
        const pdfBuf = Buffer.from(await pdfRes.arrayBuffer())

        const subject = `Seu ingresso — ${curso.nome}`
        const html = `
          <p>Olá, <strong>${p.nome}</strong>!</p>
          <p>Sua inscrição no <strong>${curso.nome}</strong> foi confirmada.</p>
          <p>O ingresso está em anexo com o QR Code para credenciamento no evento.</p>
          <p><strong>Detalhes do evento:</strong></p>
          <ul>
            <li>Data: ${curso.data_inicio} a ${curso.data_fim}</li>
            <li>Local: ${curso.local_nome || ''} — ${curso.local_cidade_uf || ''}</li>
            <li>Horário: ${curso.horario || ''}</li>
          </ul>
          <p>Atenciosamente,<br/>Equipe COMPRASEG</p>
        `

        await sendEmail({
          to: p.email,
          subject,
          html,
          attachments: [{ filename: `ingresso-${p.nome}.pdf`, content: pdfBuf }],
        })

        success++

        // Pequeno delay para não estourar rate limit do SMTP
        await new Promise((r) => setTimeout(r, 200))
      } catch (err) {
        errors++
        errorList.push({
          id: p.id,
          nome: p.nome,
          email: p.email,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    return NextResponse.json({
      total: participantes.length,
      success,
      errors,
      skipped: skipped.length,
      errorList: errorList.slice(0, 20),
      skippedList: skipped.slice(0, 20),
    })
  } catch (error) {
    console.error('Erro batch email ingresso:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao enviar emails em lote' },
      { status: 500 }
    )
  }
}
