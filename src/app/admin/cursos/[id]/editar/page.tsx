'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { CursoForm } from '@/components/forms/curso-form'
import { fetchCurso, updateCurso } from '@/hooks/use-cursos'
import type { CursoFormData } from '@/lib/validators/schemas'
import type { Curso } from '@/types/database'

export default function EditarCursoPage() {
  const params = useParams()
  const id = params.id as string
  const [curso, setCurso] = useState<Curso | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchCurso(id)
        setCurso(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar curso')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleSubmit = async (data: CursoFormData) => {
    await updateCurso(id, data)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !curso) {
    return (
      <div className="py-12 text-center text-red-500">
        {error ?? 'Curso não encontrado'}
      </div>
    )
  }

  const defaultValues: CursoFormData = {
    nome: curso.nome,
    descricao: curso.descricao ?? '',
    ementa: curso.ementa,
    data_inicio: curso.data_inicio,
    data_fim: curso.data_fim,
    horario: curso.horario ?? '',
    local_nome: curso.local_nome,
    local_endereco: curso.local_endereco,
    local_cidade_uf: curso.local_cidade_uf,
    carga_horaria: String(curso.carga_horaria),
    valor: String(curso.valor),
    vagas_totais: curso.vagas_totais ? String(curso.vagas_totais) : '',
    status: curso.status,
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Curso</h1>
      <CursoForm defaultValues={defaultValues} cursoId={id} onSubmit={handleSubmit} />
    </div>
  )
}
