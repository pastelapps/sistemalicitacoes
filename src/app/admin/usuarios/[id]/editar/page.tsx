'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { UsuarioForm } from '@/components/forms/usuario-form'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import type { UsuarioFormData } from '@/lib/validators/schemas'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditarUsuarioPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single() as { data: Profile | null; error: Error | null }

        if (error) throw error
        if (!data) throw new Error('Usu\u00e1rio n\u00e3o encontrado')

        setProfile(data)
      } catch (error) {
        console.error(error)
        toast.error('Erro ao carregar usu\u00e1rio.')
        router.push('/usuarios')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full max-w-lg" />
      </div>
    )
  }

  if (!profile) return null

  const handleSubmit = async (data: UsuarioFormData) => {
    const body: Record<string, unknown> = {
      nome: data.nome,
      email: data.email,
      role: data.role,
      ativo: data.ativo,
    }

    if (data.password) {
      body.password = data.password
    }

    const response = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao atualizar usu\u00e1rio')
    }

    toast.success('Usu\u00e1rio atualizado com sucesso!')
    router.push('/usuarios')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Usu\u00e1rio</h1>
      <UsuarioForm
        defaultValues={{
          nome: profile.nome,
          email: profile.email,
          role: profile.role,
          ativo: profile.ativo,
        }}
        onSubmit={handleSubmit}
        isEditing
      />
    </div>
  )
}
