import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateIngresso } from '@/lib/pdf/generate-ingresso'
import type { Participante, Curso, Orgao } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { participante_id } = body as { participante_id: string }

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

    // Busca orgao (opcional)
    let orgao: Pick<Orgao, 'nome'> | null = null
    if (participante.orgao_id) {
      const { data: orgaoData } = await supabase
        .from('orgaos')
        .select('nome')
        .eq('id', participante.orgao_id)
        .single() as { data: Pick<Orgao, 'nome'> | null; error: Error | null }

      orgao = orgaoData
    }

    // Gera o PDF e faz upload
    const url = await generateIngresso({
      participante,
      curso,
      orgao,
    })

    // Atualiza a URL do ingresso no participante
    const { error: updateError } = await supabase
      .from('participantes')
      .update({ pdf_ingresso_url: url } as never)
      .eq('id', participante_id)

    if (updateError) {
      console.error('Erro ao atualizar pdf_ingresso_url:', updateError)
    }

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Erro ao gerar ingresso:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao gerar ingresso' },
      { status: 500 }
    )
  }
}
