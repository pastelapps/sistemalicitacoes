'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  Award,
  Plus,
  UserPlus,
  FileText,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MetricCard } from '@/components/dashboard/metric-card'
import { InscricoesChart } from '@/components/dashboard/inscricoes-chart'
import { StatusChart } from '@/components/dashboard/status-chart'
import { TopOrgaos } from '@/components/dashboard/top-orgaos'

import type { Curso, Participante } from '@/types/database'

interface DashboardStats {
  total_inscritos: number
  pagamentos_confirmados: number
  pagamentos_pendentes: number
  credenciados: number
  certificados_emitidos: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [cursos, setCursos] = useState<Curso[]>([])
  const [cursoId, setCursoId] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [inscricoesData, setInscricoesData] = useState<
    Array<{ date: string; count: number }>
  >([])
  const [statusData, setStatusData] = useState<
    Array<{ name: string; value: number; color: string }>
  >([])
  const [topOrgaosData, setTopOrgaosData] = useState<
    Array<{ nome: string; count: number }>
  >([])
  const [loading, setLoading] = useState(true)

  // Load cursos for dropdown
  useEffect(() => {
    async function loadCursos() {
      const supabase = createClient()
      const { data } = (await supabase
        .from('cursos')
        .select('*')
        .order('nome')) as { data: Curso[] | null }
      setCursos(data ?? [])
      if (data && data.length > 0) {
        setCursoId(data[0].id)
      }
    }
    loadCursos()
  }, [])

  const loadDashboardData = useCallback(async () => {
    if (!cursoId) return
    setLoading(true)

    try {
      const supabase = createClient()

      // 1. RPC stats
      const { data: rpcStats } = (await supabase.rpc(
        'get_dashboard_stats' as never,
        { p_curso_id: cursoId } as never,
      )) as { data: DashboardStats | null }
      setStats(rpcStats)

      // 2. Fetch participantes for charts
      let query = supabase
        .from('participantes')
        .select('*, orgao:orgaos(*)')
        .eq('curso_id', cursoId)
        .order('data_compra', { ascending: true })

      if (dataInicio) {
        query = query.gte('data_compra', dataInicio)
      }
      if (dataFim) {
        query = query.lte('data_compra', dataFim)
      }

      const { data: participantes } = (await query) as {
        data: (Participante & { orgao?: { id: string; nome: string } })[] | null
      }

      const parts = participantes ?? []

      // Inscricoes ao longo do tempo (acumulado)
      const dateMap = new Map<string, number>()
      parts.forEach((p) => {
        const date = p.data_compra?.split('T')[0] ?? ''
        if (date) {
          dateMap.set(date, (dateMap.get(date) ?? 0) + 1)
        }
      })

      const sortedDates = Array.from(dateMap.entries()).sort(
        ([a], [b]) => a.localeCompare(b)
      )

      let cumulative = 0
      const inscricoesTimeline = sortedDates.map(([date, count]) => {
        cumulative += count
        return { date, count: cumulative }
      })
      setInscricoesData(inscricoesTimeline)

      // Status dos participantes
      const statusCounts = {
        pendente: 0,
        empenho_enviado: 0,
        confirmado: 0,
        credenciado: 0,
      }
      parts.forEach((p) => {
        if (p.status_credenciamento === 'credenciado') {
          statusCounts.credenciado++
        } else {
          const s = p.status_pagamento
          if (s in statusCounts) {
            statusCounts[s as keyof typeof statusCounts]++
          }
        }
      })

      setStatusData([
        { name: 'Pendente', value: statusCounts.pendente, color: '#EAB308' },
        {
          name: 'Empenho Enviado',
          value: statusCounts.empenho_enviado,
          color: '#3B82F6',
        },
        { name: 'Confirmado', value: statusCounts.confirmado, color: '#22C55E' },
        { name: 'Credenciado', value: statusCounts.credenciado, color: '#8B5CF6' },
      ])

      // Top 10 orgaos
      const orgaoMap = new Map<string, { nome: string; count: number }>()
      parts.forEach((p) => {
        if (p.orgao) {
          const existing = orgaoMap.get(p.orgao.id)
          if (existing) {
            existing.count++
          } else {
            orgaoMap.set(p.orgao.id, { nome: p.orgao.nome, count: 1 })
          }
        }
      })

      const topOrgaos = Array.from(orgaoMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
      setTopOrgaosData(topOrgaos)
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [cursoId, dataInicio, dataFim])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Curso</label>
          <Select value={cursoId} onValueChange={setCursoId}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Selecione um curso" />
            </SelectTrigger>
            <SelectContent>
              {cursos.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Data Inicio</label>
          <Input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="w-44"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Data Fim</label>
          <Input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="w-44"
          />
        </div>
      </div>

      {/* Metricas */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Total Inscritos"
            value={stats?.total_inscritos ?? 0}
            icon={Users}
          />
          <MetricCard
            title="Pagamentos Confirmados"
            value={stats?.pagamentos_confirmados ?? 0}
            icon={DollarSign}
          />
          <MetricCard
            title="Pagamentos Pendentes"
            value={stats?.pagamentos_pendentes ?? 0}
            icon={Clock}
          />
          <MetricCard
            title="Credenciados"
            value={stats?.credenciados ?? 0}
            icon={CheckCircle}
          />
          <MetricCard
            title="Certificados Emitidos"
            value={stats?.certificados_emitidos ?? 0}
            icon={Award}
          />
        </div>
      )}

      {/* Graficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InscricoesChart data={inscricoesData} />
        <StatusChart data={statusData} />
      </div>

      {/* Top orgaos */}
      <TopOrgaos data={topOrgaosData} />

      <Separator />

      {/* Acoes rapidas */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Acoes Rapidas</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => router.push('/admin/cursos/novo')}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Curso
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/participantes/novo')}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Cadastrar Participante
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/relatorios')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Exportar Relatorio
          </Button>
        </div>
      </div>
    </div>
  )
}
