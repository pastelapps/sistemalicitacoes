import { createClient } from '@/lib/supabase/client'
import { ITEMS_PER_PAGE } from '@/lib/constants'
import type {
  Participante,
  ParticipanteWithRelations,
  PagamentoStatus,
  CredenciamentoStatus,
} from '@/types/database'

interface FetchParticipantesParams {
  page?: number
  search?: string
  curso_id?: string
  orgao_id?: string
  status_pagamento?: PagamentoStatus
  status_credenciamento?: CredenciamentoStatus
}

interface FetchParticipantesResult {
  data: ParticipanteWithRelations[]
  count: number
}

export async function fetchParticipantes({
  page = 1,
  search,
  curso_id,
  orgao_id,
  status_pagamento,
  status_credenciamento,
}: FetchParticipantesParams = {}): Promise<FetchParticipantesResult> {
  const supabase = createClient()
  const from = (page - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1

  let query = supabase
    .from('participantes')
    .select('*, curso:cursos(*), orgao:orgaos(*)', { count: 'exact' })

  if (search) {
    query = query.or(
      `nome.ilike.%${search}%,cpf.ilike.%${search}%,email.ilike.%${search}%`
    )
  }

  if (curso_id) {
    query = query.eq('curso_id', curso_id)
  }

  if (orgao_id) {
    query = query.eq('orgao_id', orgao_id)
  }

  if (status_pagamento) {
    query = query.eq('status_pagamento', status_pagamento)
  }

  if (status_credenciamento) {
    query = query.eq('status_credenciamento', status_credenciamento)
  }

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, count, error } = await query as {
    data: ParticipanteWithRelations[] | null
    count: number | null
    error: unknown
  }

  if (error) throw error

  return { data: data ?? [], count: count ?? 0 }
}

export async function fetchParticipante(
  id: string
): Promise<ParticipanteWithRelations> {
  const supabase = createClient()

  const { data, error } = (await supabase
    .from('participantes')
    .select('*, curso:cursos(*), orgao:orgaos(*)')
    .eq('id', id)
    .single()) as { data: ParticipanteWithRelations | null; error: unknown }

  if (error) throw error
  if (!data) throw new Error('Participante não encontrado')

  return data
}

export async function createParticipante(
  participante: Omit<
    Participante,
    'id' | 'created_at' | 'updated_at' | 'qr_code_uuid' | 'data_compra' | 'data_credenciamento' | 'operador_credenciamento_id' | 'pdf_ingresso_url'
  >
): Promise<Participante> {
  const supabase = createClient()

  const { data, error } = (await supabase
    .from('participantes')
    .insert(participante as never)
    .select('*')
    .single()) as { data: Participante | null; error: unknown }

  if (error) throw error
  if (!data) throw new Error('Erro ao criar participante')

  return data
}

export async function createParticipantesLote(
  participantes: Omit<
    Participante,
    'id' | 'created_at' | 'updated_at' | 'qr_code_uuid' | 'data_compra' | 'data_credenciamento' | 'operador_credenciamento_id' | 'pdf_ingresso_url'
  >[]
): Promise<Participante[]> {
  const supabase = createClient()

  const { data, error } = (await supabase
    .from('participantes')
    .insert(participantes as never)
    .select('*')) as { data: Participante[] | null; error: unknown }

  if (error) throw error
  if (!data) throw new Error('Erro ao criar participantes em lote')

  return data
}

export async function updateParticipante(
  id: string,
  updates: Partial<Omit<Participante, 'id' | 'created_at' | 'updated_at'>>
): Promise<Participante> {
  const supabase = createClient()

  const { data, error } = (await supabase
    .from('participantes')
    .update(updates as never)
    .eq('id', id)
    .select('*')
    .single()) as { data: Participante | null; error: unknown }

  if (error) throw error
  if (!data) throw new Error('Erro ao atualizar participante')

  return data
}
