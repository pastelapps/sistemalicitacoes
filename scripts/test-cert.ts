import { generateCertificado } from '../src/lib/pdf/generate-certificado'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

;(async () => {
  const { data: cursos } = await supabase
    .from('cursos')
    .select('*')
    .ilike('nome', '%COMPRASEG%')
    .limit(1)
  const curso = (cursos as Array<Record<string, unknown>>)[0] as never

  const participante = {
    id: 'test-' + Date.now(),
    nome: 'Oliene Isabel Sarmento Corrêa',
    cpf: '693.099.652-15',
  }

  console.log('Gerando certificado de teste...')
  const url = await generateCertificado({ participante, curso, cor_fonte: '#FFFFFF' })
  console.log(`✓ Gerado: ${url}`)

  const res = await fetch(url)
  const buf = Buffer.from(await res.arrayBuffer())
  const out = path.resolve(__dirname, 'certificado-teste.pdf')
  fs.writeFileSync(out, buf)
  console.log(`✓ Salvo em: ${out}`)
})()
