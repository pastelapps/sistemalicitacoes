import { createClient } from '@/lib/supabase/client'
import { ITEMS_PER_PAGE } from '@/lib/constants'
import type { Orgao } from '@/types/database'

interface FetchOrgaosParams {
  page?: number
  search?: string
  tipo?: string
  uf?: string
}

interface FetchOrgaosResult {
  data: Orgao[]
  count: number
}

export async function fetchOrgaos({
  page = 1,
  search,
  tipo,
  uf,
}: FetchOrgaosParams = {}): Promise<FetchOrgaosResult> {
  const supabase = createClient()
  const from = (page - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1

  let query = supabase
    .from('orgaos')
    .select('*', { count: 'exact' })

  if (search) {
    const cleaned = search.replace(/\D/g, '')
    if (cleaned.length > 0) {
      query = query.or(`nome.ilike.%${search}%,cnpj.ilike.%${cleaned}%`)
    } else {
      query = query.ilike('nome', `%${search}%`)
    }
  }

  if (tipo) {
    query = query.eq('tipo', tipo)
  }

  if (uf) {
    query = query.eq('uf', uf)
  }

  const { data, count, error } = await query
    .order('nome', { ascending: true })
    .range(from, to) as { data: Orgao[] | null; count: number | null; error: unknown }

  if (error) throw error

  return {
    data: data ?? [],
    count: count ?? 0,
  }
}

export async function fetchOrgao(id: string): Promise<Orgao | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('orgaos')
    .select('*')
    .eq('id', id)
    .single() as { data: Orgao | null; error: unknown }

  if (error) throw error

  return data
}

export async function createOrgao(orgao: Omit<Orgao, 'id' | 'created_at' | 'updated_at'>): Promise<Orgao> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('orgaos')
    .insert(orgao as never)
    .select('*')
    .single() as { data: Orgao | null; error: unknown }

  if (error) throw error
  if (!data) throw new Error('Erro ao criar órgão')

  return data
}

export async function updateOrgao(id: string, orgao: Partial<Omit<Orgao, 'id' | 'created_at' | 'updated_at'>>): Promise<Orgao> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('orgaos')
    .update(orgao as never)
    .eq('id', id)
    .select('*')
    .single() as { data: Orgao | null; error: unknown }

  if (error) throw error
  if (!data) throw new Error('Erro ao atualizar órgão')

  return data
}
