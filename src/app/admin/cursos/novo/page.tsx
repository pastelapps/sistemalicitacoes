'use client'

import { CursoForm } from '@/components/forms/curso-form'
import { createCurso } from '@/hooks/use-cursos'
import type { CursoFormData } from '@/lib/validators/schemas'

export default function NovoCursoPage() {
  const handleSubmit = async (data: CursoFormData) => {
    await createCurso(data)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Novo Curso</h1>
      <CursoForm onSubmit={handleSubmit} />
    </div>
  )
}
