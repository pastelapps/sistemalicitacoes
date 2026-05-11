import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as XLSX from 'xlsx'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const XLSX_PATH = 'C:\\Users\\pedro\\Downloads\\Tratativas COMPRASEG.xlsx'

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

;(async () => {
  const wb = XLSX.readFile(XLSX_PATH)

  // Focar nas abas que tem participantes
  const targetSheets = ['CongressistasCortesiaIndicados', 'Controle de Inscrições ']

  type Row = string[]
  const xlsxPeople: Array<{ sheet: string; nome: string; cpf: string; email: string; instituicao: string }> = []

  for (const sheetName of targetSheets) {
    const sheet = wb.Sheets[sheetName]
    if (!sheet) continue

    // Lê tudo como array de arrays
    const rows = XLSX.utils.sheet_to_json<Row>(sheet, { header: 1, defval: '' }) as Row[]
    if (rows.length === 0) continue

    console.log(`\n📋 [${sheetName}] ${rows.length} linhas. Primeira linha (título):`)
    console.log(`  ${rows[0]?.slice(0, 5).join(' | ')}`)
    console.log(`  Segunda linha (possíveis headers):`)
    console.log(`  ${rows[1]?.slice(0, 13).join(' | ')}`)

    // Header é a linha 1 (segunda linha). Dados começam na linha 2.
    const headers = (rows[1] || []).map((h) => normalize(String(h)))

    // Mapear índices
    const nomeIdx = headers.findIndex((h) => h.includes('participante') || h.startsWith('nome') || h.includes('inscrito'))
    const cpfIdx = headers.findIndex((h) => h === 'cpf' || h.includes('cpf'))
    const emailIdx = headers.findIndex((h) => h.includes('email') && !h.includes('responsavel'))
    const instIdx = headers.findIndex((h) => h.includes('instituicao') || h.includes('orgao'))

    console.log(`  Índices: nome=${nomeIdx}, cpf=${cpfIdx}, email=${emailIdx}, inst=${instIdx}`)

    if (nomeIdx === -1 && cpfIdx === -1 && emailIdx === -1) continue

    for (let i = 2; i < rows.length; i++) {
      const row = rows[i]
      const nome = String(row[nomeIdx] ?? '').trim()
      const cpf = String(row[cpfIdx] ?? '').trim()
      const email = String(row[emailIdx] ?? '').trim()
      const inst = String(row[instIdx] ?? '').trim()

      if (!nome && !cpf && !email) continue
      xlsxPeople.push({ sheet: sheetName, nome, cpf, email, instituicao: inst })
    }
  }

  console.log(`\n\n📊 Total pessoas extraídas do XLSX: ${xlsxPeople.length}`)

  // 4. Lê BD
  const { data: dbParts } = await supabase
    .from('participantes')
    .select('id, nome, cpf, email')
  const dbList = (dbParts ?? []) as { id: string; nome: string; cpf: string; email: string }[]

  console.log(`📊 Total no BD: ${dbList.length}\n`)

  // 5. Indexes do BD
  const dbByCpf = new Map<string, string>()
  const dbByEmail = new Map<string, string>()
  const dbByNome = new Map<string, string>()
  for (const p of dbList) {
    const cpf = cleanCPF(p.cpf)
    if (cpf && cpf !== '00000000000' && cpf.length === 11) dbByCpf.set(cpf, p.nome)
    if (p.email) dbByEmail.set(cleanEmail(p.email), p.nome)
    dbByNome.set(normalize(p.nome), p.nome)
  }

  // 6. Comparar
  const xlsxOnly: typeof xlsxPeople = []
  const xlsxCpfs = new Set<string>()
  const xlsxEmails = new Set<string>()
  const xlsxNomes = new Set<string>()

  for (const x of xlsxPeople) {
    const cpfClean = cleanCPF(x.cpf)
    const emailClean = cleanEmail(x.email)
    const nomeNorm = normalize(x.nome)

    if (cpfClean && cpfClean.length === 11) xlsxCpfs.add(cpfClean)
    if (emailClean) xlsxEmails.add(emailClean)
    if (nomeNorm) xlsxNomes.add(nomeNorm)

    const inBdByCpf = cpfClean.length === 11 && dbByCpf.has(cpfClean)
    const inBdByEmail = emailClean && dbByEmail.has(emailClean)
    const inBdByNome = nomeNorm && dbByNome.has(nomeNorm)

    if (!inBdByCpf && !inBdByEmail && !inBdByNome) {
      xlsxOnly.push(x)
    }
  }

  // 7. No BD mas não no XLSX
  const dbOnly: typeof dbList = []
  for (const p of dbList) {
    const cpfClean = cleanCPF(p.cpf)
    const emailClean = cleanEmail(p.email)
    const nomeNorm = normalize(p.nome)

    const inXlsx =
      (cpfClean.length === 11 && cpfClean !== '00000000000' && xlsxCpfs.has(cpfClean)) ||
      (emailClean && xlsxEmails.has(emailClean)) ||
      xlsxNomes.has(nomeNorm)

    if (!inXlsx) dbOnly.push(p)
  }

  const matched = xlsxPeople.length - xlsxOnly.length

  console.log(`${'='.repeat(70)}`)
  console.log(`✅ Coincidem: ${matched}`)
  console.log(`🔴 NO XLSX mas FALTA no BD: ${xlsxOnly.length}`)
  console.log(`🟡 No BD mas NÃO está no XLSX: ${dbOnly.length}`)
  console.log(`${'='.repeat(70)}\n`)

  if (xlsxOnly.length > 0) {
    console.log(`\n🔴 PARTICIPANTES DO XLSX QUE FALTAM NO BD:\n`)
    for (const x of xlsxOnly) {
      console.log(`  [${x.sheet}]`)
      console.log(`    Nome: ${x.nome || '(sem nome)'}`)
      console.log(`    CPF: ${x.cpf || '-'}`)
      console.log(`    Email: ${x.email || '-'}`)
      console.log(`    Instituição: ${x.instituicao || '-'}`)
      console.log()
    }
  }

  if (dbOnly.length > 0) {
    console.log(`\n🟡 NO BD MAS NÃO NA PLANILHA (${dbOnly.length}):\n`)
    for (const p of dbOnly) {
      console.log(`  ${p.nome.padEnd(45)} | CPF: ${p.cpf.padEnd(15)} | Email: ${p.email}`)
    }
  }
})()
