import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as nodemailer from 'nodemailer'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

;(async () => {
  console.log('🔧 Configurando SMTP...')
  console.log(`  HOST: ${process.env.SMTP_HOST}`)
  console.log(`  PORT: ${process.env.SMTP_PORT}`)
  console.log(`  USER: ${process.env.SMTP_USER}`)
  console.log(`  PASS: ${process.env.SMTP_PASS ? '****' + (process.env.SMTP_PASS || '').slice(-4) : 'MISSING'}`)

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  console.log('\n🔌 Verificando conexão...')
  try {
    await transporter.verify()
    console.log('  ✓ SMTP conectado com sucesso!')
  } catch (err) {
    console.error('  ✗ SMTP erro:', err)
    return
  }

  // Busca Pedro
  const { data: pedro } = await supabase
    .from('participantes')
    .select('id, nome, email, pdf_ingresso_url')
    .ilike('email', '%pedroeicke%')
    .single() as { data: { id: string; nome: string; email: string; pdf_ingresso_url: string } | null }

  if (!pedro) {
    console.log('Pedro não encontrado')
    return
  }

  console.log(`\n📧 Enviando teste para ${pedro.email}...`)

  // Baixa PDF
  const pdfRes = await fetch(pedro.pdf_ingresso_url)
  if (!pdfRes.ok) {
    console.error(`  ✗ Falha ao baixar PDF: ${pdfRes.status}`)
    return
  }
  const pdfBuf = Buffer.from(await pdfRes.arrayBuffer())
  console.log(`  ✓ PDF baixado (${pdfBuf.length} bytes)`)

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: pedro.email,
    subject: '[TESTE] Seu ingresso COMPRASEG 2026',
    html: `<p>Olá Pedro,</p><p>Este é um email de teste do sistema de ingressos.</p><p>Seu ingresso está em anexo.</p>`,
    attachments: [{ filename: 'ingresso-teste.pdf', content: pdfBuf }],
  })

  console.log(`  ✓ Email enviado!`)
  console.log(`  MessageId: ${info.messageId}`)
  console.log(`  Response: ${info.response}`)
})()
