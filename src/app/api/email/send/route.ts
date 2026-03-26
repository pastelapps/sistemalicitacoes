import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/send-email'

// Rate limiting simples em memória
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minuto
const RATE_LIMIT_MAX = 10

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(ip) || []

  // Remove timestamps fora da janela
  const recentTimestamps = timestamps.filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  )

  if (recentTimestamps.length >= RATE_LIMIT_MAX) {
    return true
  }

  recentTimestamps.push(now)
  rateLimitMap.set(ip, recentTimestamps)
  return false
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Limite de envios excedido. Tente novamente em 1 minuto.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { to, subject, html, pdfUrl } = body as {
      to: string
      subject: string
      html: string
      pdfUrl?: string
    }

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Campos obrigatorios: to, subject, html' },
        { status: 400 }
      )
    }

    let attachments: Array<{ filename: string; content: Buffer }> | undefined

    if (pdfUrl) {
      try {
        const pdfResponse = await fetch(pdfUrl)
        if (!pdfResponse.ok) {
          throw new Error(`Falha ao baixar PDF: ${pdfResponse.status}`)
        }
        const pdfArrayBuffer = await pdfResponse.arrayBuffer()
        const pdfBuffer = Buffer.from(pdfArrayBuffer)

        // Extrai o nome do arquivo da URL
        const urlParts = pdfUrl.split('/')
        const filename = urlParts[urlParts.length - 1] || 'documento.pdf'

        attachments = [
          {
            filename,
            content: pdfBuffer,
          },
        ]
      } catch (pdfError) {
        console.error('Erro ao baixar PDF para anexo:', pdfError)
        return NextResponse.json(
          { error: 'Erro ao baixar PDF para anexo ao email' },
          { status: 500 }
        )
      }
    }

    await sendEmail({
      to,
      subject,
      html,
      attachments,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao enviar email' },
      { status: 500 }
    )
  }
}
