import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function fmtCPF(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const padded = digits.padStart(11, '0').slice(0, 11)
  return `${padded.slice(0, 3)}.${padded.slice(3, 6)}.${padded.slice(6, 9)}-${padded.slice(9, 11)}`
}

interface Entry {
  instituicao: string
  cnpj: string
  tipo: string
  uf: string
  nome: string
  cpf: string
  telefone: string
  email: string
  observacoes: string
}

const ENTRIES: Entry[] = [
  // SERVIDORES COM INSCRIÇÕES GRATUITAS
  {
    instituicao: 'PROCON/SC',
    cnpj: '80.673.411/0001-87',
    tipo: 'Secretaria de Administração',
    uf: 'SC',
    nome: 'Giulia Kade Luft',
    cpf: fmtCPF('82705194053'),
    telefone: '48 98861-7021',
    email: 'contratos@procon.sc.gov.br',
    observacoes: 'INSCRIÇÃO GRATUITA',
  },
  {
    instituicao: 'PROCON/SC',
    cnpj: '80.673.411/0001-87',
    tipo: 'Secretaria de Administração',
    uf: 'SC',
    nome: 'Amanda Abreu Leal',
    cpf: '052.736.249-24',
    telefone: '48 99692-2909',
    email: 'amanda.leal@procon.sc.gov.br',
    observacoes: 'INSCRIÇÃO GRATUITA',
  },
  {
    instituicao: 'SECRETARIA DE ESTADO DA ADMINISTRAÇÃO DE SANTA CATARINA',
    cnpj: '82.951.351/0001-42',
    tipo: 'Secretaria de Administração',
    uf: 'SC',
    nome: 'Adriano Grams',
    cpf: fmtCPF('88820769972'),
    telefone: '48 99998-4447',
    email: 'adriano.grams@sea.sc.gov.br',
    observacoes: 'INSCRIÇÃO GRATUITA - DGLC/SEA',
  },
  // 50% DESCONTO
  {
    instituicao: 'Corpo de Bombeiros Militar do Estado de Santa Catarina',
    cnpj: '06.096.391/0001-76',
    tipo: 'Corpo de Bombeiros',
    uf: 'SC',
    nome: 'Priscila Casagrande',
    cpf: '057.543.779-08',
    telefone: '48 98843-4598',
    email: 'bm7ch@cbm.sc.gov.br',
    observacoes: '50% DESCONTO',
  },
  {
    instituicao: 'Corpo de Bombeiros Militar do Estado de Santa Catarina',
    cnpj: '06.096.391/0001-76',
    tipo: 'Corpo de Bombeiros',
    uf: 'SC',
    nome: 'Bruno Golin Sprovieri',
    cpf: '059.431.539-50',
    telefone: '48 98823-1953',
    email: 'bm7adj@cbm.sc.gov.br',
    observacoes: '50% DESCONTO',
  },
]

const cleanCNPJ = (cnpj: string) => cnpj.replace(/\D/g, '')
const cleanCPF = (cpf: string) => cpf.replace(/\D/g, '')

async function main() {
  const isCommit = process.argv.includes('--commit')

  const { data: cursos } = await supabase
    .from('cursos')
    .select('id, nome')
    .ilike('nome', '%COMPRASEG%')
    .limit(1)
  const curso = cursos![0] as { id: string; nome: string }
  console.log(`Curso: ${curso.nome}\n`)

  // Buscar órgãos existentes
  const { data: orgaos } = await supabase.from('orgaos').select('id, cnpj')
  const orgaoIdByCnpj = new Map<string, string>()
  for (const o of orgaos ?? []) {
    const oo = o as { id: string; cnpj: string }
    if (oo.cnpj) orgaoIdByCnpj.set(cleanCNPJ(oo.cnpj), oo.id)
  }

  // Buscar participantes existentes
  const { data: existing } = await supabase
    .from('participantes')
    .select('id, cpf, email')
    .eq('curso_id', curso.id)
  const existingCpfs = new Set(
    (existing ?? []).map((p) => cleanCPF((p as { cpf: string }).cpf))
  )

  for (const e of ENTRIES) {
    const cnpjDigits = cleanCNPJ(e.cnpj)
    let orgaoId = orgaoIdByCnpj.get(cnpjDigits)

    // Cria órgão se não existir
    if (!orgaoId) {
      console.log(`+ Criando órgão: ${e.instituicao}`)
      if (isCommit) {
        const { data, error } = await supabase
          .from('orgaos')
          .insert({
            nome: e.instituicao,
            cnpj: e.cnpj,
            tipo: e.tipo,
            uf: e.uf,
            cidade: '',
          })
          .select('id')
          .single()
        if (error) {
          console.error(`  ✗ Erro: ${error.message}`)
          continue
        }
        orgaoId = (data as { id: string }).id
        orgaoIdByCnpj.set(cnpjDigits, orgaoId)
      } else {
        orgaoId = 'DRY-RUN'
      }
    }

    if (existingCpfs.has(cleanCPF(e.cpf))) {
      console.log(`↻ ${e.nome} já existe`)
      continue
    }

    if (!isCommit) {
      console.log(`+ ${e.nome} [${e.observacoes}]`)
      continue
    }

    const { error } = await supabase.from('participantes').insert({
      curso_id: curso.id,
      orgao_id: orgaoId,
      tipo_inscricao: 'orgao',
      nome: e.nome,
      cpf: e.cpf,
      email: e.email,
      telefone: e.telefone,
      status_pagamento: 'confirmado',
      status_credenciamento: 'pendente',
      observacoes: e.observacoes,
    })
    if (error) console.error(`✗ ${e.nome}: ${error.message}`)
    else console.log(`✓ ${e.nome}`)
  }

  console.log(isCommit ? '\n✅ Concluído' : '\n🟡 DRY RUN — use --commit')
}

main().catch(console.error)
