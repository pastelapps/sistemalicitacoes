import { createClient } from '@/lib/supabase/client'
import { ITEMS_PER_PAGE } from '@/lib/constants'
import type {
  NotaEmpenho,
  NotaEmpenhoWithRelations,
  EmpenhoParticipante,
  EmpenhoStatus,
} from '@/types/database'
import type { NotaEmpenhoFormData } from '@/lib/validators/schemas'

interface FetchEmpenhosParams {
  page?: number
  search?: string
  status?: EmpenhoStatus | ''
  curso_id?: string
}

interface FetchEmpenhosResult {
  data: NotaEmpenhoWithRelations[]
  count: number
}

export async function fetchEmpenhos({
  page = 1,
  search = '',
  status = '',
  curso_id = '',
}: FetchEmpenhosParams = {}): Promise<FetchEmpenhosResult> {
  const supabase = createClient()
  const from = (page - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1

  let query = supabase
    .from('notas_empenho')
    .select('*, curso:cursos(*), orgao:orgaos(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.or(`numero_nota.ilike.%${search}%,orgao.nome.ilike.%${search}%`)
  }

  if (status) {
    query = query.eq('status', status)
  }

  if (curso_id) {
    query = query.eq('curso_id', curso_id)
  }

  const { data, count, error } = await query as {
    data: NotaEmpenhoWithRelations[] | null
    count: number | null
    error: Error | null
  }

  if (error) throw error

  return {
    data: data ?? [],
    count: count ?? 0,
  }
}

export async function fetchEmpenho(id: string): Promise<NotaEmpenhoWithRelations> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notas_empenho')
    .select('*, curso:cursos(*), orgao:orgaos(*)')
    .eq('id', id)
    .single() as { data: NotaEmpenhoWithRelations | null; error: Error | null }

  if (error) throw error
  if (!data) throw new Error('Nota de empenho não encontrada')

  return data
}

export async function fetchEmpenhoParticipantes(empenhoId: string): Promise<string[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('empenho_participantes')
    .select('*')
    .eq('empenho_id', empenhoId) as {
    data: EmpenhoParticipante[] | null
    error: Error | null
  }

  if (error) throw error

  return (data ?? []).map((ep) => ep.participante_id)
}

interface CreateEmpenhoParams {
  formData: NotaEmpenhoFormData
  arquivo?: File
  participanteIds?: string[]
}

export async function createEmpenho({
  formData,
  arquivo,
  participanteIds = [],
}: CreateEmpenhoParams): Promise<NotaEmpenho> {
  const supabase = createClient()

  let arquivo_url = ''

  if (arquivo) {
    const fileName = `empenhos/${Date.now()}_${arquivo.name}`
    const { error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(fileName, arquivo)

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('documentos')
      .getPublicUrl(fileName)

    arquivo_url = urlData.publicUrl
  }

  const { data, error } = await supabase
    .from('notas_empenho')
    .insert({
      ...formData,
      arquivo_url,
      observacoes: formData.observacoes || null,
    } as never)
    .select('*')
    .single() as { data: NotaEmpenho | null; error: Error | null }

  if (error) throw error
  if (!data) throw new Error('Erro ao criar nota de empenho')

  // Vincular participantes
  if (participanteIds.length > 0) {
    const links = participanteIds.map((participante_id) => ({
      empenho_id: data.id,
      participante_id,
    }))

    const { error: linkError } = await supabase
      .from('empenho_participantes')
      .insert(links as never)

    if (linkError) throw linkError
  }

  return data
}

interface UpdateEmpenhoParams {
  id: string
  formData: NotaEmpenhoFormData
  arquivo?: File
  participanteIds?: string[]
}

export async function updateEmpenho({
  id,
  formData,
  arquivo,
  participanteIds,
}: UpdateEmpenhoParams): Promise<NotaEmpenho> {
  const supabase = createClient()

  const updateData: Record<string, unknown> = {
    ...formData,
    observacoes: formData.observacoes || null,
  }

  if (arquivo) {
    const fileName = `empenhos/${Date.now()}_${arquivo.name}`
    const { error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(fileName, arquivo)

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('documentos')
      .getPublicUrl(fileName)

    updateData.arquivo_url = urlData.publicUrl
  }

  const { data, error } = await supabase
    .from('notas_empenho')
    .update(updateData as never)
    .eq('id', id)
    .select('*')
    .single() as { data: NotaEmpenho | null; error: Error | null }

  if (error) throw error
  if (!data) throw new Error('Erro ao atualizar nota de empenho')

  // Atualizar participantes vinculados
  if (participanteIds !== undefined) {
    // Remover vínculos antigos
    const { error: deleteError } = await supabase
      .from('empenho_participantes')
      .delete()
      .eq('empenho_id', id)

    if (deleteError) throw deleteError

    // Inserir novos vínculos
    if (participanteIds.length > 0) {
      const links = participanteIds.map((participante_id) => ({
        empenho_id: id,
        participante_id,
      }))

      const { error: linkError } = await supabase
        .from('empenho_participantes')
        .insert(links as never)

      if (linkError) throw linkError
    }
  }

  return data
}

export async function aprovarEmpenho(id: string): Promise<void> {
  const supabase = createClient()

  // Atualizar status da nota para aprovada
  const { error } = await supabase
    .from('notas_empenho')
    .update({ status: 'aprovada' } as never)
    .eq('id', id)

  if (error) throw error

  // Buscar participantes vinculados
  const { data: vinculos, error: vinculosError } = await supabase
    .from('empenho_participantes')
    .select('*')
    .eq('empenho_id', id) as {
    data: EmpenhoParticipante[] | null
    error: Error | null
  }

  if (vinculosError) throw vinculosError

  // Atualizar status_pagamento dos participantes vinculados para 'confirmado'
  if (vinculos && vinculos.length > 0) {
    const participanteIds = vinculos.map((v) => v.participante_id)

    const { error: updateError } = await supabase
      .from('participantes')
      .update({ status_pagamento: 'confirmado' } as never)
      .in('id', participanteIds)

    if (updateError) throw updateError
  }
}

export async function rejeitarEmpenho(id: string, motivo: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('notas_empenho')
    .update({
      status: 'rejeitada',
      observacoes: motivo,
    } as never)
    .eq('id', id)

  if (error) throw error
}
