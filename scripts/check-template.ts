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
  // Curso COMPRASEG
  const { data: cursos } = await supabase.from('cursos').select('id, nome').ilike('nome', '%COMPRASEG%').limit(1)
  const curso = (cursos as { id: string; nome: string }[])[0]
  console.log(`Curso: ${curso.nome}`)
  console.log(`ID: ${curso.id}`)

  // Lista templates
  const { data: list } = await supabase.storage.from('pdfs').list('templates')
  console.log(`\nArquivos em /templates:`)
  for (const f of list ?? []) {
    const ff = f as { name: string; updated_at: string; metadata?: { size: number } }
    console.log(`  ${ff.name} | size: ${ff.metadata?.size ?? '?'} | updated: ${ff.updated_at}`)
  }

  // Baixa o template do curso
  const { data: dl, error } = await supabase.storage.from('pdfs').download(`templates/${curso.id}.pdf`)
  if (error || !dl) {
    console.log(`\n❌ Template não encontrado: ${error?.message}`)
    return
  }

  const buf = Buffer.from(await dl.arrayBuffer())
  const outPath = path.resolve(__dirname, `template-atual.pdf`)
  fs.writeFileSync(outPath, buf)
  console.log(`\n✓ Template baixado: ${outPath} (${buf.length} bytes)`)
})()
