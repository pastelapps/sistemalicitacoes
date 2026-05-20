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

function getMes(dateStr: string): string {
  return MESES[new Date(dateStr + 'T00:00:00').getMonth()]
}

function getAno(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00').getFullYear()
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

  // Fontes
  const fontGreatVibes = await pdfDoc.embedFont(fs.readFileSync(path.join(templatesDir, 'GreatVibes-Regular.ttf')))
  const fontPoppins = await pdfDoc.embedFont(fs.readFileSync(path.join(templatesDir, 'Poppins-Regular.ttf')))
  const fontPoppinsBold = await pdfDoc.embedFont(fs.readFileSync(path.join(templatesDir, 'Poppins-Bold.ttf')))

  // Cor da fonte (configurável)
  const corTexto = hexToRgb(cor_fonte)

  const centerX = width / 2

  // NOME DO PARTICIPANTE (Great Vibes) — entre "ESTE CERTIFICADO É CONFERIDO A" e a linha azul
  const nomeSize = 60
  const nomeText = participante.nome
  const nomeWidth = fontGreatVibes.widthOfTextAtSize(nomeText, nomeSize)
  page.drawText(nomeText, {
    x: centerX - nomeWidth / 2,
    y: height * 0.56,
    size: nomeSize,
    font: fontGreatVibes,
    color: corTexto,
  })

  // TEXTO DO EVENTO (Poppins) — abaixo da linha azul, antes da assinatura
  // Exemplo: "Pela participação no Congresso Nacional de Compras da Segurança Pública (COMPRASEG),
  //          nos dias 12 a 14 de maio de 2026, na cidade de Florianópolis/SC,
  //          com carga horária de 24 horas."
  const diaInicio = getDia(curso.data_inicio)
  const diaFim = getDia(curso.data_fim)
  const mes = getMes(curso.data_fim)
  const ano = getAno(curso.data_fim)
  const cidade = curso.local_cidade_uf || ''
  const cargaH = curso.carga_horaria
  // Limpa o nome do curso: remove sigla " - " no final se houver, e " - Congresso..." prefixo
  // Mantém só "Congresso Nacional de Compras da Segurança Pública (COMPRASEG)"
  let cursoTitulo = curso.nome
  // Se vier "COMPRASEG 2026 - Congresso Nacional ..." mantém só o nome longo + sigla
  const partes = curso.nome.split(' - ')
  if (partes.length > 1) {
    const sigla = partes[0].replace(/\s+\d+$/, '').trim() // "COMPRASEG 2026" → "COMPRASEG"
    cursoTitulo = `${partes.slice(1).join(' - ')} (${sigla})`
  }

  const textoSize = 14
  const lineHeight = 20
  // Linha 1: "Pela participação no <CURSO>,"
  // Linha 2: "nos dias X a Y de MÊS de ANO, na cidade de CIDADE,"
  // Linha 3: "com carga horária de N horas."
  type Seg = { text: string; bold: boolean }
  const linhas: Seg[][] = [
    [
      { text: 'Pela participação no ', bold: false },
      { text: cursoTitulo + ',', bold: true },
    ],
    [
      { text: 'nos dias ', bold: false },
      { text: `${diaInicio} a ${diaFim} de ${mes} de ${ano}`, bold: true },
      { text: ', na cidade de ', bold: false },
      { text: cidade, bold: true },
      { text: ',', bold: false },
    ],
    [
      { text: 'com carga horária de ', bold: false },
      { text: `${cargaH} horas`, bold: true },
      { text: '.', bold: false },
    ],
  ]

  const textoStartY = height * 0.36 // logo abaixo da linha azul (50%) com algum espaço

  linhas.forEach((segs, idx) => {
    let totalWidth = 0
    for (const seg of segs) {
      const f = seg.bold ? fontPoppinsBold : fontPoppins
      totalWidth += f.widthOfTextAtSize(seg.text, textoSize)
    }
    let x = centerX - totalWidth / 2
    const y = textoStartY - idx * lineHeight
    for (const seg of segs) {
      const f = seg.bold ? fontPoppinsBold : fontPoppins
      page.drawText(seg.text, { x, y, size: textoSize, font: f, color: corTexto })
      x += f.widthOfTextAtSize(seg.text, textoSize)
    }
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
