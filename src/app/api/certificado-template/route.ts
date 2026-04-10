import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Upload de template de certificado para um curso
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const cursoId = formData.get('curso_id') as string | null

    if (!file || !cursoId) {
      return NextResponse.json(
        { error: 'Arquivo e curso_id são obrigatórios' },
        { status: 400 }
      )
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Apenas arquivos PDF são aceitos' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const fileName = `templates/${cursoId}.pdf`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: `Erro ao fazer upload: ${uploadError.message}` },
        { status: 500 }
      )
    }

    const { data: publicUrlData } = supabase.storage
      .from('pdfs')
      .getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrlData.publicUrl })
  } catch (error) {
    console.error('Erro ao fazer upload do template:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer upload do template' },
      { status: 500 }
    )
  }
}

// Verificar se existe template para um curso
export async function GET(request: NextRequest) {
  try {
    const cursoId = request.nextUrl.searchParams.get('curso_id')
    if (!cursoId) {
      return NextResponse.json({ error: 'curso_id é obrigatório' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const fileName = `templates/${cursoId}.pdf`

    const { data } = await supabase.storage
      .from('pdfs')
      .list('templates', { search: `${cursoId}.pdf` })

    const exists = data?.some((f) => f.name === `${cursoId}.pdf`) ?? false

    if (exists) {
      const { data: publicUrlData } = supabase.storage
        .from('pdfs')
        .getPublicUrl(fileName)
      return NextResponse.json({ exists: true, url: publicUrlData.publicUrl })
    }

    return NextResponse.json({ exists: false, url: null })
  } catch (error) {
    console.error('Erro ao verificar template:', error)
    return NextResponse.json({ error: 'Erro ao verificar template' }, { status: 500 })
  }
}
