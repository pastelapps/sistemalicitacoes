import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

;(async () => {
  // Total e quantos têm PDF gerado
  const { data: all } = await supabase
    .from('participantes')
    .select('id, nome, email, pdf_ingresso_url')

  const list = (all ?? []) as { id: string; nome: string; email: string; pdf_ingresso_url: string | null }[]

  const comPdf = list.filter((p) => p.pdf_ingresso_url)
  const semPdf = list.filter((p) => !p.pdf_ingresso_url)
  const comEmail = list.filter((p) => p.email && p.email.includes('@'))

  console.log(`\n📊 ESTATÍSTICAS:`)
  console.log(`  Total participantes: ${list.length}`)
  console.log(`  Com PDF gerado: ${comPdf.length}`)
  console.log(`  Sem PDF: ${semPdf.length}`)
  console.log(`  Com email válido: ${comEmail.length}`)

  // Procura Pedro
  const pedro = list.find((p) => p.email?.toLowerCase().includes('pedroeicke'))
  console.log(`\n🧑 PEDRO EICKE:`)
  if (pedro) {
    console.log(`  ID: ${pedro.id}`)
    console.log(`  Email: ${pedro.email}`)
    console.log(`  PDF gerado: ${pedro.pdf_ingresso_url ? 'SIM ✓' : 'NÃO ✗'}`)
    if (pedro.pdf_ingresso_url) console.log(`  URL: ${pedro.pdf_ingresso_url}`)
  } else {
    console.log(`  ❌ Não encontrado no banco!`)
  }
})()
