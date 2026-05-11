/**
 * Lê AMBAS as planilhas, extrai todos os participantes únicos,
 * compara com o BD e adiciona os que faltam.
 *
 * Uso:
 *   npx tsx scripts/sync-all-xlsx.ts          (dry-run)
 *   npx tsx scripts/sync-all-xlsx.ts --commit (inserir)
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as XLSX from 'xlsx'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const F1 = 'C:\\Users\\pedro\\Downloads\\Inscrições Compras SEG - Servidores (ATUALIZADO (11.05.26) às 11h.xlsx'
const F2 = 'C:\\Users\\pedro\\Downloads\\Tratativas COMPRASEG.xlsx'

const cleanCPF = (cpf: string) => String(cpf || '').replace(/\D/g, '')
const cleanEmail = (email: string) => String(email || '').toLowerCase().trim()
const normalize = (s: string) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

function fmtCPF(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits || digits.length < 9) return ''
  const padded = digits.padStart(11, '0').slice(0, 11)
  return `${padded.slice(0, 3)}.${padded.slice(3, 6)}.${padded.slice(6, 9)}-${padded.slice(9, 11)}`
}

interface XPart {
  source: string
  nome: string
  cpf: string
  email: string
  telefone: string
  instituicao: string
  observacoes: string
}

const collected: XPart[] = []

// ===== Arquivo 1: Servidores 50% DESC + GRATUITOS =====
{
  const wb = XLSX.readFile(F1)
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' }) as string[][]

  // Headers na linha 1 — duas tabelas lado a lado
  // Col B-F: 50% desconto. Col I-M: gratuita.
  for (let i = 3; i < rows.length; i++) {
    const r = rows[i]
    if (!r) continue

    // Lado esquerdo (índices 1-5): Nome | Instituição | CPF | Telefone | E-mail
    const nomeL = String(r[1] ?? '').trim()
    const instL = String(r[2] ?? '').trim()
    const cpfL = String(r[3] ?? '').trim()
    const telL = String(r[4] ?? '').trim()
    const emailL = String(r[5] ?? '').trim()

    if (nomeL && (cpfL || emailL) && nomeL.toLowerCase() !== 'nome') {
      collected.push({
        source: 'F1-50%DESC',
        nome: nomeL,
        cpf: fmtCPF(cpfL),
        email: emailL,
        telefone: telL,
        instituicao: instL,
        observacoes: '50% DESCONTO',
      })
    }

    // Lado direito (índices 8-12): Nome | Instituição | CPF | Telefone | E-mail
    const nomeR = String(r[8] ?? '').trim()
    const instR = String(r[9] ?? '').trim()
    const cpfR = String(r[10] ?? '').trim()
    const telR = String(r[11] ?? '').trim()
    const emailR = String(r[12] ?? '').trim()

    if (nomeR && (cpfR || emailR) && nomeR.toLowerCase() !== 'nome') {
      collected.push({
        source: 'F1-GRATUITO',
        nome: nomeR,
        cpf: fmtCPF(cpfR),
        email: emailR,
        telefone: telR,
        instituicao: instR,
        observacoes: 'INSCRIÇÃO GRATUITA',
      })
    }
  }
}

// ===== Arquivo 2: CongressistasCortesiaIndicados =====
{
  const wb = XLSX.readFile(F2)
  const sheet = wb.Sheets['CongressistasCortesiaIndicados']
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' }) as string[][]

  // Header linha 1: Instituição | CNPJ | Tipo | UF | Resp | NºResp | EmailResp | PARTICIPANTES | CPF | Telefone | E-mail | Observações
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i]
    if (!r) continue

    const inst = String(r[0] ?? '').trim()
    const nome = String(r[7] ?? '').trim()
    const cpf = String(r[8] ?? '').trim()
    const tel = String(r[9] ?? '').trim()
    const email = String(r[10] ?? '').trim()
    const obs = String(r[11] ?? '').trim()

    // Pula entradas inválidas
    if (!nome || nome === '?' || nome === '????' || nome.startsWith('----')) continue
    if (!cpf && !email) continue
    // Pula Herlon (removido a pedido)
    if (nome.toLowerCase().includes('herlon martins')) continue

    collected.push({
      source: 'F2-CongressistasCortesia',
      nome,
      cpf: cpf === '?' ? '' : fmtCPF(cpf),
      email,
      telefone: tel,
      instituicao: inst,
      observacoes: obs.replace(/[⚠️\s]+$/g, '').trim() || 'CORTESIA',
    })
  }
}

;(async () => {
  const isCommit = process.argv.includes('--commit')
  console.log(`\n${isCommit ? '🟢 COMMIT MODE' : '🟡 DRY RUN'}\n`)
  console.log(`📊 Total extraído das planilhas: ${collected.length}\n`)

  // 1. Buscar curso
  const { data: cursos } = await supabase.from('cursos').select('id').ilike('nome', '%COMPRASEG%').limit(1)
  const cursoId = (cursos as { id: string }[])[0].id

  // 2. Buscar BD
  const { data: dbParts } = await supabase
    .from('participantes')
    .select('id, nome, cpf, email')
  const dbList = (dbParts ?? []) as { id: string; nome: string; cpf: string; email: string }[]

  const dbByCpf = new Map<string, string>()
  const dbByEmail = new Map<string, string>()
  const dbByNome = new Map<string, string>()
  for (const p of dbList) {
    const c = cleanCPF(p.cpf)
    if (c && c !== '00000000000' && c.length === 11) dbByCpf.set(c, p.nome)
    if (p.email) dbByEmail.set(cleanEmail(p.email), p.nome)
    dbByNome.set(normalize(p.nome), p.nome)
  }

  // 3. Buscar órgãos
  const { data: orgaos } = await supabase.from('orgaos').select('id, nome, cnpj')
  const orgaoByCnpj = new Map<string, string>()
  const orgaoByNome = new Map<string, string>()
  for (const o of orgaos ?? []) {
    const oo = o as { id: string; nome: string; cnpj: string }
    const c = oo.cnpj?.replace(/\D/g, '')
    if (c) orgaoByCnpj.set(c, oo.id)
    orgaoByNome.set(normalize(oo.nome), oo.id)
  }

  // 4. Detectar duplicatas internas da própria planilha + faltantes no BD
  const seen = new Set<string>()
  const toInsert: XPart[] = []
  const skipped: XPart[] = []

  for (const x of collected) {
    const cpfK = cleanCPF(x.cpf)
    const emailK = cleanEmail(x.email)
    const nomeK = normalize(x.nome)

    const dedupeKey = (cpfK && cpfK.length === 11) ? `cpf:${cpfK}` : emailK ? `email:${emailK}` : `nome:${nomeK}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    const inDb =
      (cpfK.length === 11 && dbByCpf.has(cpfK)) ||
      (emailK && dbByEmail.has(emailK)) ||
      (nomeK && dbByNome.has(nomeK))

    if (inDb) {
      skipped.push(x)
    } else {
      toInsert.push(x)
    }
  }

  console.log(`✅ Já existem no BD: ${skipped.length}`)
  console.log(`➕ Faltam adicionar: ${toInsert.length}\n`)

  if (toInsert.length === 0) {
    console.log('🎉 Banco já está sincronizado!')
    return
  }

  console.log(`\n${'='.repeat(70)}`)
  console.log(`PARTICIPANTES A SEREM ADICIONADOS:`)
  console.log(`${'='.repeat(70)}\n`)

  let placeholderCounter = 50 // 000.000.000-50 em diante
  let inserted = 0
  let errors = 0

  for (const x of toInsert) {
    // Resolver órgão: por nome ou cria
    let orgaoId = orgaoByNome.get(normalize(x.instituicao))
    if (!orgaoId) {
      // Tenta match parcial
      for (const [k, v] of orgaoByNome) {
        if (k.includes(normalize(x.instituicao).slice(0, 20)) || normalize(x.instituicao).includes(k.slice(0, 20))) {
          orgaoId = v
          break
        }
      }
    }

    if (!orgaoId) {
      console.log(`  ⚠️  Órgão não encontrado: "${x.instituicao}" — usando "Outros"`)
      // Procura ou cria "Outros"
      orgaoId = orgaoByNome.get('outros')
      if (!orgaoId && isCommit) {
        const { data } = await supabase
          .from('orgaos')
          .insert({ nome: 'Outros', cnpj: '', tipo: 'Outro', uf: '', cidade: '' })
          .select('id')
          .single()
        orgaoId = (data as { id: string }).id
        orgaoByNome.set('outros', orgaoId)
      }
    }

    // CPF final
    let cpfFinal = x.cpf
    if (!cpfFinal) {
      cpfFinal = `000.000.000-${String(placeholderCounter).padStart(2, '0').slice(-2)}`
      placeholderCounter++
    }

    if (!isCommit) {
      console.log(`  + [${x.source}] ${x.nome}`)
      console.log(`    CPF: ${cpfFinal} | Email: ${x.email || '-'} | Inst: ${x.instituicao}`)
      inserted++
      continue
    }

    const { error } = await supabase.from('participantes').insert({
      curso_id: cursoId,
      orgao_id: orgaoId,
      tipo_inscricao: 'orgao',
      nome: x.nome,
      cpf: cpfFinal,
      email: x.email || '',
      telefone: x.telefone || '',
      status_pagamento: 'confirmado',
      status_credenciamento: 'pendente',
      observacoes: x.observacoes,
    })

    if (error) {
      console.error(`  ✗ ${x.nome}: ${error.message}`)
      errors++
    } else {
      console.log(`  ✓ ${x.nome} [${x.observacoes}]`)
      inserted++
    }
  }

  console.log(`\n${'='.repeat(70)}`)
  console.log(`Inseridos: ${inserted}`)
  console.log(`Erros: ${errors}`)
  console.log(`${'='.repeat(70)}`)
  if (!isCommit) console.log('\n🟡 DRY RUN — use --commit\n')
})()
