import { renderToBuffer } from '@react-pdf/renderer'
import { createAdminClient } from '@/lib/supabase/admin'
import { CertificadoTemplate, type CertificadoData } from '@/components/pdf/certificado-template'
import type { Participante, Curso } from '@/types/database'
import React from 'react'

interface GenerateCertificadoParams {
  participante: Pick<Participante, 'id' | 'nome' | 'cpf'>
  curso: Pick<Curso, 'nome' | 'data_inicio' | 'data_fim' | 'local_nome' | 'local_cidade_uf' | 'carga_horaria'>
  codigo_verificacao: string
  data_emissao: string
}

export async function generateCertificado({
  participante,
  curso,
  codigo_verificacao,
  data_emissao,
}: GenerateCertificadoParams): Promise<string> {
  const templateData: CertificadoData = {
    participante: {
      nome: participante.nome,
      cpf: participante.cpf,
    },
    curso: {
      nome: curso.nome,
      data_inicio: curso.data_inicio,
      data_fim: curso.data_fim,
      local_nome: curso.local_nome,
      local_cidade_uf: curso.local_cidade_uf,
      carga_horaria: curso.carga_horaria,
    },
    codigo_verificacao,
    data_emissao,
  }

  const element = React.createElement(CertificadoTemplate, templateData)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any)

  const supabase = createAdminClient()
  const fileName = `certificados/${participante.id}.pdf`

  const { error: uploadError } = await supabase.storage
    .from('pdfs')
    .upload(fileName, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Erro ao fazer upload do PDF: ${uploadError.message}`)
  }

  const { data: publicUrlData } = supabase.storage
    .from('pdfs')
    .getPublicUrl(fileName)

  return publicUrlData.publicUrl
}
