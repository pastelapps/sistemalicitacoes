'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ParticipanteForm } from '@/components/forms/participante-form'
import { ParticipanteLoteForm } from '@/components/forms/participante-lote-form'
import { createParticipante, createParticipantesLote } from '@/hooks/use-participantes'
import type { ParticipanteFormData, ParticipanteLoteFormData } from '@/lib/validators/schemas'

export default function NovoParticipantePage() {
  const router = useRouter()

  async function handleCreateIndividual(data: ParticipanteFormData) {
    try {
      await createParticipante({
        curso_id: data.curso_id,
        orgao_id: data.orgao_id ?? null,
        tipo_inscricao: data.tipo_inscricao,
        nome: data.nome,
        cpf: data.cpf,
        email: data.email,
        telefone: data.telefone,
        cargo: data.cargo ?? null,
        status_pagamento: data.status_pagamento ?? 'pendente',
        status_credenciamento: 'pendente',
        observacoes: data.observacoes ?? null,
      })
      toast.success('Participante criado com sucesso!')
      router.push('/admin/participantes')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao criar participante.')
    }
  }

  async function handleCreateLote(data: ParticipanteLoteFormData) {
    try {
      const participantes = data.participantes.map((p) => ({
        curso_id: data.curso_id,
        orgao_id: data.orgao_id,
        tipo_inscricao: 'orgao' as const,
        nome: p.nome,
        cpf: p.cpf,
        email: p.email,
        telefone: p.telefone,
        cargo: p.cargo ?? null,
        status_pagamento: 'pendente' as const,
        status_credenciamento: 'pendente' as const,
        observacoes: null,
      }))
      await createParticipantesLote(participantes)
      toast.success(`${participantes.length} participante(s) criado(s) com sucesso!`)
      router.push('/admin/participantes')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao criar participantes em lote.')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Novo Participante</h1>

      <Tabs defaultValue="individual">
        <TabsList>
          <TabsTrigger value="individual">Individual</TabsTrigger>
          <TabsTrigger value="lote">Cadastro em Lote</TabsTrigger>
        </TabsList>

        <TabsContent value="individual">
          <Card>
            <CardHeader>
              <CardTitle>Cadastro Individual</CardTitle>
            </CardHeader>
            <CardContent>
              <ParticipanteForm onSubmit={handleCreateIndividual} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lote">
          <Card>
            <CardHeader>
              <CardTitle>Cadastro em Lote</CardTitle>
            </CardHeader>
            <CardContent>
              <ParticipanteLoteForm onSubmit={handleCreateLote} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
