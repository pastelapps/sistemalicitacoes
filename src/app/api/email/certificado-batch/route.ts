import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/send-email'
import type { Curso, Participante } from '@/types/database'

export const maxDuration = 300

interface CertWithJoin {
  id: string
  participante_id: string
  curso_id: string
  pdf_url: string | null
  codigo_verificacao: string
  status_envio: string
  participante: Participante | null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { curso_id, only_pending } = body as {
      curso_id?: string
      only_pending?: boolean
    }

    const supabase = createAdminClient()

    let query = supabase
      .from('certificados')
      .select('id, participante_id, curso_id, pdf_url, codigo_verificacao, status_envio, participante:participantes(*)')

    if (curso_id) query = query.eq('curso_id', curso_id)
    if (only_pending) query = query.neq('status_envio', 'enviado')

    const { data: certs, error: certsErr } = (await query) as {
      data: CertWithJoin[] | null
      error: Error | null
    }

    if (certsErr || !certs) {
      return NextResponse.json(
        { error: 'Erro ao buscar certificados' },
        { status: 500 }
      )
    }

    if (certs.length === 0) {
      return NextResponse.json({
        total: 0,
        success: 0,
        errors: 0,
        skipped: 0,
        message: 'Nenhum certificado para enviar',
      })
    }

    const cursoCache = new Map<string, Curso>()
    let success = 0
    let errors = 0
    let skipped = 0
    const errorList: Array<{ nome: string; email: string; error: string }> = []

    for (const c of certs) {
      const p = c.participante
      if (!p) {
        skipped++
        continue
      }

      if (!p.email || !p.email.includes('@')) {
        skipped++
        continue
      }

      if (!c.pdf_url) {
        skipped++
        continue
      }

      try {
        // Curso (cache)
        let curso = cursoCache.get(c.curso_id)
        if (!curso) {
          const { data } = (await supabase
            .from('cursos')
            .select('*')
            .eq('id', c.curso_id)
            .single()) as { data: Curso | null }
          if (!data) throw new Error('Curso não encontrado')
          curso = data
          cursoCache.set(c.curso_id, curso)
        }

        // Baixa PDF
        const pdfRes = await fetch(c.pdf_url)
        if (!pdfRes.ok) throw new Error(`Falha ao baixar PDF (${pdfRes.status})`)
        const pdfBuf = Buffer.from(await pdfRes.arrayBuffer())

        const subject = `Seu certificado — ${curso.nome}`
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e3a5f;">COMPRASEG 2026</h2>
            <p>Prezado(a) <strong>${p.nome}</strong>,</p>
            <p>Segue em anexo o seu certificado de participação no <strong>${curso.nome}</strong>.</p>
            <p>Código de verificação: <strong>${c.codigo_verificacao}</strong></p>
            <br/>
            <p>Atenciosamente,<br/>Equipe COMPRASEG</p>
          </div>
        `

        await sendEmail({
          to: p.email,
          subject,
          html,
          attachments: [{ filename: `certificado-${p.nome}.pdf`, content: pdfBuf }],
        })

        // Atualiza status
        await supabase
          .from('certificados')
          .update({ status_envio: 'enviado' } as never)
          .eq('id', c.id)

        success++

        // Pequeno delay pra não estourar rate limit do SMTP
        await new Promise((r) => setTimeout(r, 200))
      } catch (err) {
        errors++
        errorList.push({
          nome: p.nome,
          email: p.email,
          error: err instanceof Error ? err.message : String(err),
        })
        await supabase
          .from('certificados')
          .update({ status_envio: 'falha' } as never)
          .eq('id', c.id)
      }
    }

    return NextResponse.json({
      total: certs.length,
      success,
      errors,
      skipped,
      errorList: errorList.slice(0, 20),
    })
  } catch (error) {
    console.error('Erro batch email certificado:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao enviar emails em lote' },
      { status: 500 }
    )
  }
}
