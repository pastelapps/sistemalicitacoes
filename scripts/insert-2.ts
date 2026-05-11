import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

;(async () => {
  // Curso
  const { data: cursos } = await supabase.from('cursos').select('id').ilike('nome', '%COMPRASEG%').limit(1)
  const cursoId = (cursos as { id: string }[])[0].id

  // PMSC orgao (ambos são da PM-SC pelos emails/contexto)
  const { data: orgaos } = await supabase
    .from('orgaos')
    .select('id, nome')
    .ilike('nome', '%polícia militar%santa catarina%')
    .limit(1)
  const pmscId = (orgaos as { id: string }[])[0].id

  const novos = [
    {
      nome: 'Marco Antonio dos Santos Júnior',
      cpf: '066.766.839-03',
      email: 'capmarcoantonio01@gmail.com',
      telefone: '48 99663-8644',
    },
    {
      nome: 'Dante da Costa Chierighini',
      cpf: '003.419.159-39',
      email: 'cmecmt@pm.sc.gov.br',
      telefone: '48 99109-0505',
    },
  ]

  for (const p of novos) {
    const { error } = await supabase.from('participantes').insert({
      curso_id: cursoId,
      orgao_id: pmscId,
      tipo_inscricao: 'orgao',
      nome: p.nome,
      cpf: p.cpf,
      email: p.email,
      telefone: p.telefone,
      status_pagamento: 'confirmado',
      status_credenciamento: 'pendente',
      observacoes: 'CORTESIA',
    })
    console.log(error ? `✗ ${p.nome}: ${error.message}` : `✓ ${p.nome}`)
  }
})()
