'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { UsuarioForm } from '@/components/forms/usuario-form'
import type { UsuarioFormData } from '@/lib/validators/schemas'

export default function NovoUsuarioPage() {
  const router = useRouter()

  const handleSubmit = async (data: UsuarioFormData) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: data.nome,
        email: data.email,
        password: data.password,
        role: data.role,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao criar usuário')
    }

    toast.success('Usuário criado com sucesso!')
    router.push('/usuarios')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Novo Usuário</h1>
      <UsuarioForm onSubmit={handleSubmit} />
    </div>
  )
}
