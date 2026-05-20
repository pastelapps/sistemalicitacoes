import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

;(async () => {
  const { data } = await supabase
    .from('participantes')
    .select('id, nome')
    .ilike('nome', '%anna elayse%')

  const list = (data ?? []) as { id: string; nome: string }[]

  for (const p of list) {
    console.log(`\nNome: "${p.nome}"`)
    console.log(`Length: ${p.nome.length}`)
    console.log(`Bytes (hex):`)
    const buf = Buffer.from(p.nome, 'utf-8')
    let line = ''
    for (let i = 0; i < buf.length; i++) {
      line += buf[i].toString(16).padStart(2, '0') + ' '
      if ((i + 1) % 16 === 0) {
        console.log(`  ${line}`)
        line = ''
      }
    }
    if (line) console.log(`  ${line}`)

    console.log(`Code points:`)
    for (let i = 0; i < p.nome.length; i++) {
      const cp = p.nome.codePointAt(i)
      const ch = p.nome[i]
      if (cp && cp > 127) {
        console.log(`  pos ${i}: '${ch}' (U+${cp.toString(16).toUpperCase().padStart(4, '0')})`)
      } else if (cp && cp < 32) {
        console.log(`  pos ${i}: [control char] (U+${cp.toString(16).toUpperCase().padStart(4, '0')})`)
      }
    }
  }
})()
