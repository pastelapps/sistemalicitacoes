import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Participante, Curso } from '@/types/database'
import fs from 'fs'
import path from 'path'

interface GenerateCertificadoParams {
  participante: Pick<Participante, 'id' | 'nome' | 'cpf'>
  curso: Pick<Curso, 'id' | 'nome' | 'data_inicio' | 'data_fim' | 'local_nome' | 'local_cidade_uf' | 'carga_horaria'>
  cor_fonte?: string // hex color, ex: "#FFFFFF"
}

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16) / 255
  const g = parseInt(clean.substring(2, 4), 16) / 255
  const b = parseInt(clean.substring(4, 6), 16) / 255
  return rgb(r, g, b)
}

export async function generateCertificado({
  participante,
  curso,
  cor_fonte = '#FFFFFF',
}: GenerateCertificadoParams): Promise<string> {
  // Tenta carregar template customizado do Storage, senão usa o padrão local
  const supabase = createAdminClient()
  const templatesDir = path.join(process.cwd(), 'public', 'templates')
  let templateBytes: Buffer

  const { data: storageList } = await supabase.storage
    .from('pdfs')
    .list('templates', { search: `${curso.id}.pdf` })

  const hasCustomTemplate = storageList?.some((f) => f.name === `${curso.id}.pdf`)

  if (hasCustomTemplate) {
    const { data: downloadData } = await supabase.storage
      .from('pdfs')
      .download(`templates/${curso.id}.pdf`)
    if (downloadData) {
      templateBytes = Buffer.from(await downloadData.arrayBuffer())
    } else {
      templateBytes = fs.readFileSync(path.join(templatesDir, 'certificado-template.pdf'))
    }
  } else {
    templateBytes = fs.readFileSync(path.join(templatesDir, 'certificado-template.pdf'))
  }

  const pdfDoc = await PDFDocument.load(templateBytes)

  // Registra fontkit para fontes customizadas
  pdfDoc.registerFontkit(fontkit)

  const page = pdfDoc.getPages()[0]
  const { width, height } = page.getSize()

  // Mantém frente e verso do template

  // Carrega só Great Vibes (template novo já tem o texto fixo impresso)
  const fontGreatVibes = await pdfDoc.embedFont(fs.readFileSync(path.join(templatesDir, 'GreatVibes-Regular.ttf')))

  // Cor da fonte (configurável)
  const corTexto = hexToRgb(cor_fonte)

  const centerX = width / 2

  // NOME DO PARTICIPANTE (Great Vibes) — entre "ESTE CERTIFICADO É CONFERIDO A" e a linha azul
  const nomeSize = 60
  const nomeText = participante.nome
  const nomeWidth = fontGreatVibes.widthOfTextAtSize(nomeText, nomeSize)
  page.drawText(nomeText, {
    x: centerX - nomeWidth / 2,
    y: height * 0.56, // ~44% do topo, entre o texto fixo e a linha azul
    size: nomeSize,
    font: fontGreatVibes,
    color: corTexto,
  })

  // Curso mantido na interface pra compat. com chamadores, mesmo não sendo usado no PDF
  void curso

  // Gera o PDF final
  const pdfBytes = await pdfDoc.save()

  // Upload para o Supabase Storage
  const fileName = `certificados/${participante.id}.pdf`

  const { error: uploadError } = await supabase.storage
    .from('pdfs')
    .upload(fileName, Buffer.from(pdfBytes), {
      contentType: 'application/pdf',
      upsert: true,
      cacheControl: '0', // evita cache do CDN
    })

  if (uploadError) {
    throw new Error(`Erro ao fazer upload do PDF: ${uploadError.message}`)
  }

  const { data: publicUrlData } = supabase.storage
    .from('pdfs')
    .getPublicUrl(fileName)

  // Adiciona timestamp para evitar cache do CDN
  return `${publicUrlData.publicUrl}?t=${Date.now()}`
}
