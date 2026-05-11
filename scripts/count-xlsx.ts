import * as XLSX from 'xlsx'

const F1 = 'C:\\Users\\pedro\\Downloads\\Inscrições Compras SEG - Servidores (ATUALIZADO (11.05.26) às 11h.xlsx'
const F2 = 'C:\\Users\\pedro\\Downloads\\Tratativas COMPRASEG.xlsx'

const cleanCPF = (cpf: string) => String(cpf || '').replace(/\D/g, '')
const cleanEmail = (email: string) => String(email || '').toLowerCase().trim()
const normalize = (s: string) =>
  String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()

let totalDesconto = 0
let totalGratuitos = 0
let totalCortesia = 0

const uniqueKeys = new Set<string>()

function makeKey(nome: string, cpf: string, email: string) {
  const c = cleanCPF(cpf)
  if (c.length === 11 && c !== '00000000000') return `cpf:${c}`
  if (email) return `email:${cleanEmail(email)}`
  return `nome:${normalize(nome)}`
}

// Arquivo 1
{
  const wb = XLSX.readFile(F1)
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' }) as string[][]

  for (let i = 3; i < rows.length; i++) {
    const r = rows[i]
    if (!r) continue

    const nomeL = String(r[1] ?? '').trim()
    const cpfL = String(r[3] ?? '').trim()
    const emailL = String(r[5] ?? '').trim()
    if (nomeL && nomeL.toLowerCase() !== 'nome' && (cpfL || emailL)) {
      totalDesconto++
      uniqueKeys.add(makeKey(nomeL, cpfL, emailL))
    }

    const nomeR = String(r[8] ?? '').trim()
    const cpfR = String(r[10] ?? '').trim()
    const emailR = String(r[12] ?? '').trim()
    if (nomeR && nomeR.toLowerCase() !== 'nome' && (cpfR || emailR)) {
      totalGratuitos++
      uniqueKeys.add(makeKey(nomeR, cpfR, emailR))
    }
  }
}

// Arquivo 2
{
  const wb = XLSX.readFile(F2)
  const sheet = wb.Sheets['CongressistasCortesiaIndicados']
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' }) as string[][]

  for (let i = 2; i < rows.length; i++) {
    const r = rows[i]
    if (!r) continue

    const nome = String(r[7] ?? '').trim()
    const cpf = String(r[8] ?? '').trim()
    const email = String(r[10] ?? '').trim()

    if (!nome || nome === '?' || nome === '????' || nome.startsWith('----')) continue
    if (!cpf && !email) continue

    totalCortesia++
    uniqueKeys.add(makeKey(nome, cpf === '?' ? '' : cpf, email))
  }
}

console.log('\n📊 CONTAGEM POR PLANILHA:\n')
console.log(`  📄 Inscrições Compras SEG (Servidores)`)
console.log(`     • 50% DESCONTO: ${totalDesconto}`)
console.log(`     • GRATUITOS:    ${totalGratuitos}`)
console.log(`  📄 Tratativas COMPRASEG`)
console.log(`     • CongressistasCortesiaIndicados: ${totalCortesia}`)
console.log()
console.log(`  ➕ Soma (com possíveis duplicatas): ${totalDesconto + totalGratuitos + totalCortesia}`)
console.log(`  🔢 Únicos (dedup por CPF/email/nome): ${uniqueKeys.size}`)
