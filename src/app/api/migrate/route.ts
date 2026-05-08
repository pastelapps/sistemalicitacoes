import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = createAdminClient()

  const policies = [
    // SELECT policies
    { table: 'cursos', name: 'auth_read_cursos', op: 'SELECT' },
    { table: 'participantes', name: 'auth_read_participantes', op: 'SELECT' },
    { table: 'orgaos', name: 'auth_read_orgaos', op: 'SELECT' },
    { table: 'certificados', name: 'auth_read_certificados', op: 'SELECT' },
    { table: 'notas_empenho', name: 'auth_read_notas_empenho', op: 'SELECT' },
    { table: 'profiles', name: 'auth_read_profiles', op: 'SELECT' },
    // ALL policies
    { table: 'cursos', name: 'auth_all_cursos', op: 'ALL' },
    { table: 'participantes', name: 'auth_all_participantes', op: 'ALL' },
    { table: 'orgaos', name: 'auth_all_orgaos', op: 'ALL' },
    { table: 'certificados', name: 'auth_all_certificados', op: 'ALL' },
    { table: 'notas_empenho', name: 'auth_all_notas_empenho', op: 'ALL' },
    { table: 'profiles', name: 'auth_all_profiles', op: 'ALL' },
  ]

  // Can't run raw SQL via PostgREST, so let's just verify tables are accessible
  const results: Record<string, unknown> = {}

  for (const table of ['cursos', 'participantes', 'orgaos', 'certificados', 'notas_empenho', 'profiles']) {
    const { data, error } = await supabase.from(table).select('id').limit(1)
    results[table] = { count: data?.length ?? 0, error: error?.message ?? null }
  }

  return NextResponse.json({
    message: 'Use the Supabase SQL Editor to create RLS policies. Service role can read all tables.',
    results
  })
}
