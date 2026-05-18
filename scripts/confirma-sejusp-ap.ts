import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

;(async () => {
  // Buscar órgãos do AP
  const { data: orgaos } = await supabase
    .from('orgaos')
    .select('id, nome, uf')
    .eq('uf', 'AP')

  const orgaoList = (orgaos ?? []) as { id: string; nome: string }[]
  console.log(`Órgãos encontrados (${orgaoList.length}):`)
  for (const o of orgaoList) console.log(`  ${o.nome}`)

  if (orgaoList.length === 0) {
    console.log('Nenhum órgão SEJUSP-AP encontrado')
    return
  }

  const ids = orgaoList.map((o) => o.id)

  // Buscar participantes
  const { data: parts } = await supabase
    .from('participantes')
    .select('id, nome, status_pagamento')
    .in('orgao_id', ids)

  const partList = (parts ?? []) as { id: string; nome: string; status_pagamento: string }[]
  console.log(`\nParticipantes encontrados: ${partList.length}`)

  // Atualizar
  const { error } = await supabase
    .from('participantes')
    .update({ status_pagamento: 'confirmado' })
    .in('orgao_id', ids)

  if (error) {
    console.error(`✗ Erro: ${error.message}`)
    return
  }

  console.log(`\n✓ ${partList.length} participantes da SEJUSP-AP atualizados para 'confirmado'`)
  for (const p of partList) {
    console.log(`  • ${p.nome} (era: ${p.status_pagamento})`)
  }
})()
