import { renderToBuffer } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import { createAdminClient } from '@/lib/supabase/admin'
import { IngressoTemplate, type IngressoData } from '@/components/pdf/ingresso-template'
import type { Participante, Curso, Orgao } from '@/types/database'
import React from 'react'

interface GenerateIngressoParams {
  participante: Pick<Participante, 'id' | 'nome' | 'cpf' | 'email' | 'telefone' | 'cargo' | 'qr_code_uuid'>
  curso: Pick<Curso, 'nome' | 'data_inicio' | 'data_fim' | 'horario' | 'local_nome' | 'local_endereco' | 'local_cidade_uf' | 'carga_horaria'>
  orgao: Pick<Orgao, 'nome'> | null
}

export async function generateIngresso({ participante, curso, orgao }: GenerateIngressoParams): Promise<string> {
  const qrDataUrl = await QRCode.toDataURL(participante.qr_code_uuid, {
    width: 200,
    margin: 1,
  })

  const templateData: IngressoData = {
    participante: {
      nome: participante.nome,
      cpf: participante.cpf,
      email: participante.email,
      telefone: participante.telefone,
      cargo: participante.cargo,
      qr_code_uuid: participante.qr_code_uuid,
    },
    curso: {
      nome: curso.nome,
      data_inicio: curso.data_inicio,
      data_fim: curso.data_fim,
      horario: curso.horario,
      local_nome: curso.local_nome,
      local_endereco: curso.local_endereco,
      local_cidade_uf: curso.local_cidade_uf,
      carga_horaria: curso.carga_horaria,
    },
    orgao,
    qrDataUrl,
  }

  const element = React.createElement(IngressoTemplate, templateData)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any
  )

  const supabase = createAdminClient()
  const fileName = `ingressos/${participante.id}.pdf`

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
