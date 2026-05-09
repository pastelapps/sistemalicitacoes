import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

;(async () => {
  const { data: participantes } = await supabase
    .from('participantes')
    .select('id, nome, cpf, curso_id')

  const { data: cursos } = await supabase
    .from('cursos')
    .select('id, nome')

  console.log('\n=== CURSOS ===')
  cursos?.forEach((c: { id: string; nome: string }) =>
    console.log(`  ${c.id}  ${c.nome}`)
  )

  console.log(`\n=== PARTICIPANTES (${participantes?.length ?? 0}) ===`)
  participantes?.forEach((p: { nome: string; curso_id: string }) =>
    console.log(`  ${p.nome}  →  ${p.curso_id}`)
  )
})()
