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

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

function getDia(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00').getDate()
}

// Desenha texto com trechos bold e regular intercalados
// segments: array de { text, bold }
function drawMixedText(
  page: ReturnType<PDFDocument['getPages']>[0],
  segments: { text: string; bold: boolean }[],
  fontRegular: Awaited<ReturnType<PDFDocument['embedFont']>>,
  fontBold: Awaited<ReturnType<PDFDocument['embedFont']>>,
  fontSize: number,
  color: ReturnType<typeof rgb>,
  centerX: number,
  y: number,
) {
  // Calcula largura total para centralizar
  let totalWidth = 0
  for (const seg of segments) {
    const font = seg.bold ? fontBold : fontRegular
    totalWidth += font.widthOfTextAtSize(seg.text, fontSize)
  }

  let x = centerX - totalWidth / 2
  for (const seg of segments) {
    const font = seg.bold ? fontBold : fontRegular
    page.drawText(seg.text, { x, y, size: fontSize, font, color })
    x += font.widthOfTextAtSize(seg.text, fontSize)
  }
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

  // Carrega fontes
  const fontGreatVibes = await pdfDoc.embedFont(fs.readFileSync(path.join(templatesDir, 'GreatVibes-Regular.ttf')))
  const fontPoppins = await pdfDoc.embedFont(fs.readFileSync(path.join(templatesDir, 'Poppins-Regular.ttf')))
  const fontPoppinsBold = await pdfDoc.embedFont(fs.readFileSync(path.join(templatesDir, 'Poppins-Bold.ttf')))

  // Cor da fonte (configurável)
  const corTexto = hexToRgb(cor_fonte)

  const centerX = width / 2

  // ============================================
  // NOME DO PARTICIPANTE (Great Vibes)
  // Centralizado acima da linha azul
  // ============================================
  const nomeSize = 45
  const nomeText = participante.nome
  const nomeWidth = fontGreatVibes.widthOfTextAtSize(nomeText, nomeSize)
  page.drawText(nomeText, {
    x: centerX - nomeWidth / 2,
    y: height / 2 + 20,
    size: nomeSize,
    font: fontGreatVibes,
    color: corTexto,
  })

  // ============================================
  // TEXTO DO EVENTO (Poppins Regular + Bold)
  // Dados dinâmicos do banco de dados
  // ============================================
  const textoSize = 15
  const lineHeight = 22
  const textoStartY = height / 2 - 35

  const diaInicio = getDia(curso.data_inicio)
  const diaFim = getDia(curso.data_fim)
  const dataFimDate = new Date(curso.data_fim + 'T00:00:00')
  const mesFim = MESES[dataFimDate.getMonth()]
  const anoFim = dataFimDate.getFullYear()

  // Separar nome do curso em duas partes: antes e depois de "Compras da Segurança"
  const cursoNomeParts = curso.nome.split(' - ')
  const cursoLinha1 = cursoNomeParts[0] // ex: "COMPRASEG 2026"
  const cursoLinha2 = cursoNomeParts.length > 1 ? cursoNomeParts.slice(1).join(' - ') : '' // ex: "Congresso Nacional de Compras da Segurança Pública"

  // Linha 1: Pela participação no "COMPRASEG 2026 - Congresso Nacional de Compras da Segurança
  drawMixedText(
    page,
    [
      { text: 'Pela participação no "', bold: false },
      { text: `${cursoLinha1} - ${cursoLinha2.split('Pública')[0]}`, bold: true },
    ],
    fontPoppins, fontPoppinsBold, textoSize, corTexto,
    centerX, textoStartY,
  )

  // Linha 2: Pública", que se realizou...
  drawMixedText(
    page,
    [
      { text: 'Pública"', bold: true },
      { text: `, que se realizou nos dias ${diaInicio} a ${diaFim} de ${mesFim} de ${anoFim}, na cidade de ${curso.local_cidade_uf}, tendo`, bold: false },
    ],
    fontPoppins, fontPoppinsBold, textoSize, corTexto,
    centerX, textoStartY - lineHeight,
  )

  // Linha 3: carga horária
  const linha3 = `o evento carga horária de ${curso.carga_horaria}h.`
  const linha3Width = fontPoppins.widthOfTextAtSize(linha3, textoSize)
  page.drawText(linha3, {
    x: centerX - linha3Width / 2,
    y: textoStartY - lineHeight * 2,
    size: textoSize,
    font: fontPoppins,
    color: corTexto,
  })

  // Gera o PDF final
  const pdfBytes = await pdfDoc.save()

  // Upload para o Supabase Storage
  const fileName = `certificados/${participante.id}.pdf`

  const { error: uploadError } = await supabase.storage
    .from('pdfs')
    .upload(fileName, Buffer.from(pdfBytes), {
      contentType: 'application/pdf',
      upsert: true,
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
