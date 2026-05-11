import * as XLSX from 'xlsx'

const files = [
  'C:\\Users\\pedro\\Downloads\\Inscrições Compras SEG - Servidores (ATUALIZADO (11.05.26) às 11h.xlsx',
  'C:\\Users\\pedro\\Downloads\\Tratativas COMPRASEG.xlsx',
]

for (const file of files) {
  console.log('\n' + '='.repeat(80))
  console.log(`📂 ${file}`)
  console.log('='.repeat(80))

  const wb = XLSX.readFile(file)

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' }) as string[][]
    if (rows.length === 0) continue

    console.log(`\n📋 ${sheetName} (${rows.length} linhas)`)

    // Mostra primeiras 5 linhas com até 15 colunas cada
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const row = rows[i].slice(0, 15).map((c) => String(c).slice(0, 30))
      console.log(`  L${i}: ${row.join(' | ')}`)
    }
  }
}
