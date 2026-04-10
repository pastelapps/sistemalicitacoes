import { createClient } from '@/lib/supabase/client'
import { ITEMS_PER_PAGE } from '@/lib/constants'
import type { CertificadoWithRelations, CertificadoStatus } from '@/types/database'

interface FetchCertificadosParams {
  page?: number
  search?: string
  curso_id?: string
  status_envio?: CertificadoStatus | ''
}

interface FetchCertificadosResult {
  data: CertificadoWithRelations[]
  count: number
}

export async function fetchCertificados({
  page = 1,
  search = '',
  curso_id = '',
  status_envio = '',
}: FetchCertificadosParams = {}): Promise<FetchCertificadosResult> {
  const supabase = createClient()
  const from = (page - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1

  let query = supabase
    .from('certificados')
    .select(
      '*, participante:participantes(*), curso:cursos(*)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (curso_id) {
    query = query.eq('curso_id', curso_id)
  }

  if (status_envio) {
    query = query.eq('status_envio', status_envio)
  }

  // Busca por nome do participante via inner filter
  if (search) {
    query = query.ilike('participante.nome' as never, `%${search}%`)
  }

  const { data, count, error } = await query as {
    data: CertificadoWithRelations[] | null
    count: number | null
    error: Error | null
  }

  if (error) throw error

  // Se buscou por nome, filtra resultados sem participante (inner join effect)
  let filtered = data ?? []
  if (search) {
    filtered = filtered.filter((c) => c.participante != null)
  }

  return {
    data: filtered,
    count: search ? filtered.length : (count ?? 0),
  }
}

export async function gerarCertificadoLote(curso_id: string, cor_fonte?: string): Promise<{
  gerados: number
  erros: number
}> {
  const supabase = createClient()

  // Busca todos os participantes credenciados deste curso que nao tem certificado
  const { data: participantes, error: partError } = await supabase
    .from('participantes')
    .select('id')
    .eq('curso_id', curso_id)
    .eq('status_credenciamento', 'credenciado') as { data: Array<{ id: string }> | null; error: Error | null }

  if (partError) throw partError
  if (!participantes || participantes.length === 0) {
    return { gerados: 0, erros: 0 }
  }

  // Busca certificados ja existentes para este curso
  const { data: certExistentes } = await supabase
    .from('certificados')
    .select('participante_id')
    .eq('curso_id', curso_id) as { data: Array<{ participante_id: string }> | null; error: Error | null }

  const idsComCertificado = new Set(
    (certExistentes ?? []).map((c) => c.participante_id)
  )

  // Filtra participantes sem certificado
  const semCertificado = participantes.filter(
    (p) => !idsComCertificado.has(p.id)
  )

  let gerados = 0
  let erros = 0

  // Gera certificados em sequencia para evitar sobrecarregar a API
  for (const participante of semCertificado) {
    try {
      const response = await fetch('/api/pdf/certificado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participante_id: participante.id, cor_fonte }),
      })

      if (response.ok) {
        gerados++
      } else {
        erros++
      }
    } catch {
      erros++
    }
  }

  return { gerados, erros }
}

export async function reenviarCertificado(participante_id: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = createClient()

  // Busca certificado e participante
  const { data: certData, error: certError } = await supabase
    .from('certificados')
    .select('*, participante:participantes(*)')
    .eq('participante_id', participante_id)
    .single() as { data: CertificadoWithRelations | null; error: unknown }

  if (certError || !certData) {
    return { success: false, error: 'Certificado nao encontrado' }
  }

  const certificado = certData
  const participante = certificado.participante
  if (!participante) {
    return { success: false, error: 'Participante nao encontrado' }
  }

  // Se nao tem PDF, gera primeiro
  let pdfUrl = (certificado as CertificadoWithRelations).pdf_url
  if (!pdfUrl) {
    try {
      const pdfResponse = await fetch('/api/pdf/certificado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participante_id }),
      })

      if (!pdfResponse.ok) {
        return { success: false, error: 'Erro ao gerar PDF do certificado' }
      }

      const pdfData = await pdfResponse.json()
      pdfUrl = pdfData.url
    } catch {
      return { success: false, error: 'Erro ao gerar PDF do certificado' }
    }
  }

  // Envia por email
  try {
    const emailResponse = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: participante.email,
        subject: 'Licitações Inteligentes - Seu Certificado de Participacao',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e3a5f;">Licitações Inteligentes</h2>
            <p>Prezado(a) ${participante.nome},</p>
            <p>Segue em anexo o seu certificado de participacao.</p>
            <p>Codigo de verificacao: <strong>${certificado.codigo_verificacao}</strong></p>
            <br/>
            <p>Atenciosamente,<br/>Equipe Licitações Inteligentes</p>
          </div>
        `,
        pdfUrl,
      }),
    })

    if (!emailResponse.ok) {
      // Atualiza status para falha
      await supabase
        .from('certificados')
        .update({ status_envio: 'falha' } as never)
        .eq('id', certificado.id)

      return { success: false, error: 'Erro ao enviar email' }
    }

    // Atualiza status para enviado
    await supabase
      .from('certificados')
      .update({ status_envio: 'enviado' } as never)
      .eq('id', certificado.id)

    return { success: true }
  } catch {
    await supabase
      .from('certificados')
      .update({ status_envio: 'falha' } as never)
      .eq('id', certificado.id)

    return { success: false, error: 'Erro ao enviar email' }
  }
}
