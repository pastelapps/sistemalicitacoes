// Script para executar a migration e criar o admin padrão
// Uso: node scripts/setup-db.mjs

const SUPABASE_URL = 'https://mqlfrxsvpignldfljkfu.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xbGZyeHN2cGlnbmxkZmxqa2Z1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzk2NjAwMCwiZXhwIjoyMDg5NTQyMDAwfQ.96L8OkEE84vh-6efSbO6F3BzZwLmeEbRRR_06npowMw'

async function runSQL(sql) {
  // Use the pg_query endpoint via Supabase Management API
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'GET',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
  })
  console.log('Connection test status:', res.status)
}

async function createAdmin() {
  // Create admin user via Supabase Auth Admin API
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@compraseg.com.br',
      password: 'Compraseg@2026',
      email_confirm: true,
      user_metadata: {
        nome: 'Administrador',
      },
    }),
  })

  const data = await res.json()

  if (res.ok) {
    console.log('Admin user created! ID:', data.id)

    // Now create the profile
    const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        id: data.id,
        nome: 'Administrador',
        email: 'admin@compraseg.com.br',
        role: 'admin',
        ativo: true,
      }),
    })

    const profileData = await profileRes.json()
    if (profileRes.ok) {
      console.log('Admin profile created!')
    } else {
      console.error('Error creating profile:', profileData)
    }
  } else {
    console.error('Error creating admin:', data)
  }
}

async function createStorageBuckets() {
  const buckets = [
    { id: 'documentos', name: 'documentos', public: false },
    { id: 'pdfs', name: 'pdfs', public: true },
    { id: 'imagens', name: 'imagens', public: true },
  ]

  for (const bucket of buckets) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bucket),
    })

    const data = await res.json()
    if (res.ok) {
      console.log(`Bucket '${bucket.id}' created!`)
    } else {
      console.log(`Bucket '${bucket.id}':`, data.message || data.error)
    }
  }
}

async function main() {
  console.log('=== COMPRASEG - Database Setup ===\n')

  console.log('1. Creating storage buckets...')
  await createStorageBuckets()

  console.log('\n2. Creating admin user...')
  await createAdmin()

  console.log('\n=== Setup complete! ===')
  console.log('\nIMPORTANT: You need to run the SQL migration manually!')
  console.log('Go to: https://supabase.com/dashboard/project/mqlfrxsvpignldfljkfu/sql/new')
  console.log('Copy and paste the contents of: supabase/migrations/001_initial_schema.sql')
}

main().catch(console.error)
