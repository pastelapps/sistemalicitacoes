import { createClient } from '@/lib/supabase/client'
import { ITEMS_PER_PAGE } from '@/lib/constants'
import type { Curso, CursoStatus } from '@/types/database'
import type { CursoFormData } from '@/lib/validators/schemas'

interface FetchCursosParams {
  page?: number
  search?: string
  status?: CursoStatus | ''
}

interface FetchCursosResult {
  data: Curso[]
  count: number
}

export async function fetchCursos({
  page = 1,
  search = '',
  status = '',
}: FetchCursosParams = {}): Promise<FetchCursosResult> {
  const supabase = createClient()
  const from = (page - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1

  let query = supabase
    .from('cursos')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.ilike('nome', `%${search}%`)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data, count, error } = await query as {
    data: Curso[] | null
    count: number | null
    error: Error | null
  }

  if (error) throw error

  return {
    data: data ?? [],
    count: count ?? 0,
  }
}

export async function fetchCurso(id: string): Promise<Curso> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cursos')
    .select('*')
    .eq('id', id)
    .single() as { data: Curso | null; error: Error | null }

  if (error) throw error
  if (!data) throw new Error('Curso não encontrado')

  return data
}

export async function createCurso(formData: CursoFormData): Promise<Curso> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cursos')
    .insert(formData as never)
    .select('*')
    .single() as { data: Curso | null; error: Error | null }

  if (error) throw error
  if (!data) throw new Error('Erro ao criar curso')

  return data
}

export async function updateCurso(id: string, formData: CursoFormData): Promise<Curso> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('cursos')
    .update(formData as never)
    .eq('id', id)
    .select('*')
    .single() as { data: Curso | null; error: Error | null }

  if (error) throw error
  if (!data) throw new Error('Erro ao atualizar curso')

  return data
}

export async function deleteCurso(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('cursos')
    .delete()
    .eq('id', id)

  if (error) throw error
}
