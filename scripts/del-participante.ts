import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SEARCH = process.argv[2] || 'Herlon'

;(async () => {
  const { data: ps } = await supabase
    .from('participantes')
    .select('id, nome, cpf')
    .ilike('nome', `%${SEARCH}%`)

  if (!ps || ps.length === 0) {
    console.log(`Nenhum encontrado com "${SEARCH}"`)
    return
  }

  console.log(`Encontrados ${ps.length}:`)
  for (const p of ps) {
    const pp = p as { id: string; nome: string; cpf: string }
    console.log(`  - ${pp.nome} (CPF: ${pp.cpf}, id: ${pp.id})`)

    await supabase.from('certificados').delete().eq('participante_id', pp.id)
    await supabase.from('empenho_participantes').delete().eq('participante_id', pp.id)
    const { error } = await supabase.from('participantes').delete().eq('id', pp.id)
    console.log(error ? `    ✗ Erro: ${error.message}` : '    ✓ Apagado')
  }
})()
