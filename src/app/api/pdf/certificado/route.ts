import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateCertificado } from '@/lib/pdf/generate-certificado'
import type { Participante, Curso, Certificado } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { participante_id, cor_fonte } = body as { participante_id: string; cor_fonte?: string }

    if (!participante_id) {
      return NextResponse.json(
        { error: 'participante_id e obrigatorio' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Busca participante
    const { data: participante, error: partError } = await supabase
      .from('participantes')
      .select('*')
      .eq('id', participante_id)
      .single() as { data: Participante | null; error: Error | null }

    if (partError || !participante) {
      return NextResponse.json(
        { error: 'Participante nao encontrado' },
        { status: 404 }
      )
    }

    // Verifica se o participante foi credenciado
    if (participante.status_credenciamento !== 'credenciado') {
      return NextResponse.json(
        { error: 'Participante nao foi credenciado. Apenas participantes credenciados podem receber certificado.' },
        { status: 400 }
      )
    }

    // Busca curso
    const { data: curso, error: cursoError } = await supabase
      .from('cursos')
      .select('*')
      .eq('id', participante.curso_id)
      .single() as { data: Curso | null; error: Error | null }

    if (cursoError || !curso) {
      return NextResponse.json(
        { error: 'Curso nao encontrado' },
        { status: 404 }
      )
    }

    // Verifica se ja existe certificado para este participante
    const { data: existingCert } = await supabase
      .from('certificados')
      .select('*')
      .eq('participante_id', participante_id)
      .single() as { data: Certificado | null; error: Error | null }

    let certificadoId: string
    let codigoVerificacao: string

    if (existingCert) {
      // Atualiza o certificado existente
      certificadoId = existingCert.id
      codigoVerificacao = existingCert.codigo_verificacao
    } else {
      // Gera codigo de verificacao
      codigoVerificacao = `CERT-${crypto.randomUUID().substring(0, 8).toUpperCase()}`

      // Cria registro do certificado
      const { data: newCert, error: certError } = await supabase
        .from('certificados')
        .insert({
          participante_id,
          curso_id: participante.curso_id,
          codigo_verificacao: codigoVerificacao,
          status_envio: 'pendente',
        } as never)
        .select('*')
        .single() as { data: Certificado | null; error: Error | null }

      if (certError || !newCert) {
        return NextResponse.json(
          { error: 'Erro ao criar registro do certificado' },
          { status: 500 }
        )
      }

      certificadoId = newCert.id
    }

    // Gera o PDF e faz upload
    const url = await generateCertificado({
      participante,
      curso,
      cor_fonte,
    })

    // Atualiza a URL do PDF no certificado
    const { error: updateError } = await supabase
      .from('certificados')
      .update({ pdf_url: url } as never)
      .eq('id', certificadoId)

    if (updateError) {
      console.error('Erro ao atualizar pdf_url do certificado:', updateError)
    }

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Erro ao gerar certificado:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao gerar certificado' },
      { status: 500 }
    )
  }
}
