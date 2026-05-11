import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateIngresso } from '@/lib/pdf/generate-ingresso'
import type { Participante, Curso, Orgao } from '@/types/database'

export const maxDuration = 300 // 5 minutos para processar muitos PDFs

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { curso_id, only_missing } = body as {
      curso_id?: string
      only_missing?: boolean
    }

    const supabase = createAdminClient()

    // Busca participantes (opcionalmente filtrando por curso e/ou só os sem ingresso)
    let query = supabase.from('participantes').select('*')
    if (curso_id) query = query.eq('curso_id', curso_id)
    if (only_missing) query = query.is('pdf_ingresso_url', null)

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
        message: 'Nenhum participante para gerar ingresso',
      })
    }

    // Cache de cursos e órgãos pra evitar consultas repetidas
    const cursoCache = new Map<string, Curso>()
    const orgaoCache = new Map<string, Pick<Orgao, 'nome'>>()

    let success = 0
    let errors = 0
    const errorList: Array<{ id: string; nome: string; error: string }> = []

    for (const p of participantes) {
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

        // Órgão (opcional)
        let orgao: Pick<Orgao, 'nome'> | null = null
        if (p.orgao_id) {
          let cached = orgaoCache.get(p.orgao_id)
          if (!cached) {
            const { data } = (await supabase
              .from('orgaos')
              .select('nome')
              .eq('id', p.orgao_id)
              .single()) as { data: Pick<Orgao, 'nome'> | null }
            if (data) {
              cached = data
              orgaoCache.set(p.orgao_id, cached)
            }
          }
          orgao = cached ?? null
        }

        // Gera PDF
        const url = await generateIngresso({ participante: p, curso, orgao })

        // Atualiza no banco
        await supabase
          .from('participantes')
          .update({ pdf_ingresso_url: url } as never)
          .eq('id', p.id)

        success++
      } catch (err) {
        errors++
        errorList.push({
          id: p.id,
          nome: p.nome,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    return NextResponse.json({
      total: participantes.length,
      success,
      errors,
      errorList: errorList.slice(0, 20), // primeiros 20 erros
    })
  } catch (error) {
    console.error('Erro batch ingresso:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao gerar ingressos em lote',
      },
      { status: 500 }
    )
  }
}
