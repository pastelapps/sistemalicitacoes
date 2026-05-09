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
    .select('nome, cpf, email, telefone, status_pagamento, tipo_inscricao, observacoes, orgao:orgaos(nome, cnpj, uf, tipo)')
    .order('nome')

  console.log(`\n=== PARTICIPANTES NO BD (${participantes?.length ?? 0}) ===\n`)

  const byOrgao: Record<string, any[]> = {}
  participantes?.forEach((p: any) => {
    const key = p.orgao?.nome ?? 'SEM ÓRGÃO'
    if (!byOrgao[key]) byOrgao[key] = []
    byOrgao[key].push(p)
  })

  for (const [orgao, parts] of Object.entries(byOrgao)) {
    console.log(`\n📌 ${orgao} (${parts[0]?.orgao?.uf ?? '-'})`)
    console.log(`   CNPJ: ${parts[0]?.orgao?.cnpj ?? '-'}`)
    console.log(`   Tipo: ${parts[0]?.orgao?.tipo ?? '-'}`)
    parts.forEach((p) => {
      console.log(`   • ${p.nome}`)
      console.log(`     CPF: ${p.cpf} | Tel: ${p.telefone} | Email: ${p.email}`)
      console.log(`     Status: ${p.status_pagamento} | Obs: ${p.observacoes}`)
    })
  }

  console.log(`\n\n=== TOTAIS ===`)
  console.log(`Total participantes: ${participantes?.length ?? 0}`)
  console.log(`Total órgãos com participantes: ${Object.keys(byOrgao).length}`)

  const byStatus: Record<string, number> = {}
  participantes?.forEach((p: any) => {
    byStatus[p.status_pagamento] = (byStatus[p.status_pagamento] ?? 0) + 1
  })
  console.log(`\nPor status de pagamento:`)
  Object.entries(byStatus).forEach(([k, v]) => console.log(`  ${k}: ${v}`))
})()
