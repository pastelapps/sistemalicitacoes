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
  String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()

const xlsxCpfs = new Set<string>()
const xlsxEmails = new Set<string>()
const xlsxNomes = new Set<string>()

// F1
{
  const wb = XLSX.readFile(F1)
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' }) as string[][]
  for (let i = 3; i < rows.length; i++) {
    const r = rows[i]
    if (!r) continue
    for (const idx of [[1, 3, 5], [8, 10, 12]]) {
      const nome = String(r[idx[0]] ?? '').trim()
      const cpf = cleanCPF(String(r[idx[1]] ?? ''))
      const email = cleanEmail(String(r[idx[2]] ?? ''))
      if (!nome || nome.toLowerCase() === 'nome') continue
      if (cpf.length >= 9) xlsxCpfs.add(cpf.padStart(11, '0'))
      if (email) xlsxEmails.add(email)
      xlsxNomes.add(normalize(nome))
    }
  }
}

// F2
{
  const wb = XLSX.readFile(F2)
  const sheet = wb.Sheets['CongressistasCortesiaIndicados']
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' }) as string[][]
  for (let i = 2; i < rows.length; i++) {
    const r = rows[i]
    if (!r) continue
    const nome = String(r[7] ?? '').trim()
    const cpf = cleanCPF(String(r[8] ?? ''))
    const email = cleanEmail(String(r[10] ?? ''))
    if (!nome || nome === '?' || nome === '????' || nome.startsWith('----')) continue
    if (cpf.length >= 9) xlsxCpfs.add(cpf.padStart(11, '0'))
    if (email) xlsxEmails.add(email)
    xlsxNomes.add(normalize(nome))
  }
}

;(async () => {
  const { data } = await supabase
    .from('participantes')
    .select('id, nome, cpf, email, orgao:orgaos(nome), observacoes')
    .order('nome')

  const dbList = (data ?? []) as Array<{
    id: string
    nome: string
    cpf: string
    email: string
    orgao: { nome: string } | null
    observacoes: string
  }>

  const dbOnly = dbList.filter((p) => {
    const c = cleanCPF(p.cpf)
    const e = cleanEmail(p.email)
    const n = normalize(p.nome)
    const inXlsx =
      (c.length === 11 && c !== '00000000000' && xlsxCpfs.has(c)) ||
      (e && xlsxEmails.has(e)) ||
      xlsxNomes.has(n)
    return !inXlsx
  })

  console.log(`\n📋 ${dbOnly.length} participantes no BD que NÃO estão nas duas planilhas:\n`)
  for (const p of dbOnly) {
    console.log(`  • ${p.nome}`)
    console.log(`    Órgão: ${p.orgao?.nome ?? '-'}`)
    console.log(`    CPF: ${p.cpf} | Email: ${p.email}`)
    console.log(`    Obs: ${p.observacoes}`)
    console.log()
  }
})()
