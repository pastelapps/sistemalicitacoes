import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

;(async () => {
  const { data: cursos } = await supabase.from('cursos').select('id, nome').ilike('nome', '%COMPRASEG%').limit(1)
  const curso = (cursos as { id: string; nome: string }[])[0]

  const { data: parts } = await supabase
    .from('participantes')
    .select('id, status_credenciamento')
    .eq('curso_id', curso.id)

  const list = (parts ?? []) as { id: string; status_credenciamento: string }[]

  const { data: certs } = await supabase
    .from('certificados')
    .select('participante_id, status_envio')
    .eq('curso_id', curso.id)
  const certList = (certs ?? []) as { participante_id: string; status_envio: string }[]

  const byStatus: Record<string, number> = {}
  for (const p of list) {
    byStatus[p.status_credenciamento] = (byStatus[p.status_credenciamento] ?? 0) + 1
  }

  console.log(`\nCurso: ${curso.nome}`)
  console.log(`Total participantes: ${list.length}`)
  console.log(`Por status_credenciamento:`)
  for (const [k, v] of Object.entries(byStatus)) console.log(`  ${k}: ${v}`)

  console.log(`\nCertificados:`)
  console.log(`  Total: ${certList.length}`)
  const certByStatus: Record<string, number> = {}
  for (const c of certList) {
    certByStatus[c.status_envio] = (certByStatus[c.status_envio] ?? 0) + 1
  }
  for (const [k, v] of Object.entries(certByStatus)) console.log(`  ${k}: ${v}`)
})()
