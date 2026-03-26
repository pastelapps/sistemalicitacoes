'use client'

import { useEffect, useState, useCallback } from 'react'
import { Download, Loader2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { formatCPF, formatDate } from '@/lib/utils'
import {
  PAGAMENTO_STATUS_LABELS,
  CERTIFICADO_STATUS_LABELS,
} from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'

import type {
  Curso,
  Orgao,
  PagamentoStatus,
  CertificadoStatus,
} from '@/types/database'

interface ParticipanteRow {
  id: string
  nome: string
  cpf: string
  email: string
  telefone: string
  cargo: string | null
  status_pagamento: PagamentoStatus
  status_credenciamento: string
  data_compra: string
  data_credenciamento: string | null
  curso?: { nome: string }
  orgao?: { nome: string }
}

interface CertificadoRow {
  id: string
  codigo_verificacao: string
  status_envio: CertificadoStatus
  data_emissao: string
  participante?: { nome: string; cpf: string }
  curso?: { nome: string }
}

export default function RelatoriosPage() {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [orgaos, setOrgaos] = useState<Orgao[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Shared filters
  const [cursoFilter, setCursoFilter] = useState('')
  const [orgaoFilter, setOrgaoFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  // Preview data
  const [inscritosData, setInscritosData] = useState<ParticipanteRow[]>([])
  const [pagamentosData, setPagamentosData] = useState<ParticipanteRow[]>([])
  const [credenciamentoData, setCredenciamentoData] = useState<ParticipanteRow[]>([])
  const [certificadosData, setCertificadosData] = useState<CertificadoRow[]>([])
  const [orgaosResumo, setOrgaosResumo] = useState<
    Array<{ nome: string; total: number; confirmados: number; pendentes: number }>
  >([])

  const [activeTab, setActiveTab] = useState('inscritos')

  useEffect(() => {
    async function loadDropdowns() {
      const supabase = createClient()
      const [cursosRes, orgaosRes] = await Promise.all([
        supabase.from('cursos').select('*').order('nome') as unknown as { data: Curso[] | null },
        supabase.from('orgaos').select('*').order('nome') as unknown as { data: Orgao[] | null },
      ])
      setCursos(cursosRes.data ?? [])
      setOrgaos(orgaosRes.data ?? [])
    }
    loadDropdowns()
  }, [])

  const loadPreview = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      if (activeTab === 'inscritos' || activeTab === 'pagamentos' || activeTab === 'credenciamento') {
        let query = supabase
          .from('participantes')
          .select('*, curso:cursos(*), orgao:orgaos(*)')
          .order('nome')
          .limit(50)

        if (cursoFilter && cursoFilter !== 'all') {
          query = query.eq('curso_id', cursoFilter)
        }
        if (orgaoFilter && orgaoFilter !== 'all') {
          query = query.eq('orgao_id', orgaoFilter)
        }
        if (dataInicio) {
          query = query.gte('data_compra', dataInicio)
        }
        if (dataFim) {
          query = query.lte('data_compra', dataFim)
        }

        if (activeTab === 'inscritos' && statusFilter && statusFilter !== 'all') {
          query = query.eq('status_pagamento', statusFilter)
        }
        if (activeTab === 'pagamentos' && statusFilter && statusFilter !== 'all') {
          query = query.eq('status_pagamento', statusFilter)
        }
        if (activeTab === 'credenciamento') {
          // No additional filter beyond curso/orgao
        }

        const { data } = (await query) as { data: ParticipanteRow[] | null }
        const rows = data ?? []

        if (activeTab === 'inscritos') setInscritosData(rows)
        if (activeTab === 'pagamentos') setPagamentosData(rows)
        if (activeTab === 'credenciamento') setCredenciamentoData(rows)
      }

      if (activeTab === 'certificados') {
        let query = supabase
          .from('certificados')
          .select('*, participante:participantes(*), curso:cursos(*)')
          .order('data_emissao', { ascending: false })
          .limit(50)

        if (cursoFilter && cursoFilter !== 'all') {
          query = query.eq('curso_id', cursoFilter)
        }
        if (statusFilter && statusFilter !== 'all') {
          query = query.eq('status_envio', statusFilter)
        }

        const { data } = (await query) as { data: CertificadoRow[] | null }
        setCertificadosData(data ?? [])
      }

      if (activeTab === 'orgaos') {
        let query = supabase
          .from('participantes')
          .select('*, orgao:orgaos(*)')
          .order('nome')

        if (cursoFilter && cursoFilter !== 'all') {
          query = query.eq('curso_id', cursoFilter)
        }

        const { data } = (await query) as {
          data: Array<{ status_pagamento: string; orgao?: { nome: string } }> | null
        }

        const orgaoMap = new Map<
          string,
          { nome: string; total: number; confirmados: number; pendentes: number }
        >()

        ;(data ?? []).forEach((p) => {
          const orgaoNome = p.orgao?.nome ?? 'Individual'
          const existing = orgaoMap.get(orgaoNome)
          if (existing) {
            existing.total++
            if (p.status_pagamento === 'confirmado') existing.confirmados++
            else existing.pendentes++
          } else {
            orgaoMap.set(orgaoNome, {
              nome: orgaoNome,
              total: 1,
              confirmados: p.status_pagamento === 'confirmado' ? 1 : 0,
              pendentes: p.status_pagamento !== 'confirmado' ? 1 : 0,
            })
          }
        })

        setOrgaosResumo(
          Array.from(orgaoMap.values()).sort((a, b) => b.total - a.total)
        )
      }
    } catch (error) {
      console.error('Erro ao carregar preview:', error)
      toast.error('Erro ao carregar dados do relatorio')
    } finally {
      setLoading(false)
    }
  }, [activeTab, cursoFilter, orgaoFilter, statusFilter, dataInicio, dataFim])

  useEffect(() => {
    loadPreview()
  }, [loadPreview])

  // Reset filters when changing tab
  useEffect(() => {
    setStatusFilter('')
  }, [activeTab])

  const handleExport = async (tipo: string) => {
    setExporting(true)
    try {
      const filtros: Record<string, string> = {}
      if (cursoFilter && cursoFilter !== 'all') filtros.curso_id = cursoFilter
      if (orgaoFilter && orgaoFilter !== 'all') filtros.orgao_id = orgaoFilter
      if (statusFilter && statusFilter !== 'all') filtros.status = statusFilter
      if (dataInicio) filtros.data_inicio = dataInicio
      if (dataFim) filtros.data_fim = dataFim

      const response = await fetch('/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, filtros }),
      })

      if (!response.ok) {
        throw new Error('Erro ao exportar relatorio')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-${tipo}-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Relatorio exportado com sucesso!')
    } catch (error) {
      console.error('Erro ao exportar:', error)
      toast.error('Erro ao exportar relatorio')
    } finally {
      setExporting(false)
    }
  }

  const renderFilters = (showOrgao = true, showStatus = true, showPeriodo = true, statusOptions?: Record<string, string>) => (
    <div className="flex flex-wrap items-end gap-3 mb-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Curso</label>
        <Select value={cursoFilter} onValueChange={setCursoFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Todos os cursos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os cursos</SelectItem>
            {cursos.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showOrgao && (
        <div className="space-y-1">
          <label className="text-sm font-medium">Orgao</label>
          <Select value={orgaoFilter} onValueChange={setOrgaoFilter}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Todos os orgaos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os orgaos</SelectItem>
              {orgaos.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showStatus && statusOptions && (
        <div className="space-y-1">
          <label className="text-sm font-medium">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(statusOptions).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showPeriodo && (
        <>
          <div className="space-y-1">
            <label className="text-sm font-medium">Data Inicio</label>
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Data Fim</label>
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-40"
            />
          </div>
        </>
      )}
    </div>
  )

  const renderExportButton = (tipo: string) => (
    <Button onClick={() => handleExport(tipo)} disabled={exporting}>
      {exporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Exportar Excel
    </Button>
  )

  const renderLoading = () => (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Relatorios</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inscritos">Inscritos</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="credenciamento">Credenciamento</TabsTrigger>
          <TabsTrigger value="certificados">Certificados</TabsTrigger>
          <TabsTrigger value="orgaos">Por Orgao</TabsTrigger>
        </TabsList>

        {/* TAB 1 - INSCRITOS */}
        <TabsContent value="inscritos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Relatorio de Inscritos</CardTitle>
              {renderExportButton('inscritos')}
            </CardHeader>
            <CardContent>
              {renderFilters(true, true, true, PAGAMENTO_STATUS_LABELS)}
              {loading ? (
                renderLoading()
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>CPF</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Orgao</TableHead>
                        <TableHead>Curso</TableHead>
                        <TableHead>Data Compra</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inscritosData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            Nenhum registro encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        inscritosData.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">{row.nome}</TableCell>
                            <TableCell>{formatCPF(row.cpf)}</TableCell>
                            <TableCell>{row.email}</TableCell>
                            <TableCell>{row.orgao?.nome ?? '-'}</TableCell>
                            <TableCell>{row.curso?.nome ?? '-'}</TableCell>
                            <TableCell>{formatDate(row.data_compra)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {PAGAMENTO_STATUS_LABELS[row.status_pagamento]}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2 - PAGAMENTOS */}
        <TabsContent value="pagamentos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Relatorio de Pagamentos</CardTitle>
              {renderExportButton('pagamentos')}
            </CardHeader>
            <CardContent>
              {renderFilters(false, true, true, PAGAMENTO_STATUS_LABELS)}

              {!loading && pagamentosData.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Total Confirmados</p>
                      <p className="text-2xl font-bold text-green-600">
                        {pagamentosData.filter((p) => p.status_pagamento === 'confirmado').length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Total Pendentes</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {pagamentosData.filter((p) => p.status_pagamento === 'pendente').length}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {loading ? (
                renderLoading()
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>CPF</TableHead>
                        <TableHead>Curso</TableHead>
                        <TableHead>Data Compra</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagamentosData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            Nenhum registro encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        pagamentosData.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">{row.nome}</TableCell>
                            <TableCell>{formatCPF(row.cpf)}</TableCell>
                            <TableCell>{row.curso?.nome ?? '-'}</TableCell>
                            <TableCell>{formatDate(row.data_compra)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {PAGAMENTO_STATUS_LABELS[row.status_pagamento]}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3 - CREDENCIAMENTO */}
        <TabsContent value="credenciamento">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Relatorio de Credenciamento</CardTitle>
              {renderExportButton('credenciamento')}
            </CardHeader>
            <CardContent>
              {renderFilters(true, false, false)}

              {!loading && credenciamentoData.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Total Credenciados</p>
                      <p className="text-2xl font-bold text-green-600">
                        {credenciamentoData.filter((p) => p.status_credenciamento === 'credenciado').length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Ausentes</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {credenciamentoData.filter((p) => p.status_credenciamento === 'pendente').length}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {loading ? (
                renderLoading()
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>CPF</TableHead>
                        <TableHead>Orgao</TableHead>
                        <TableHead>Curso</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data Credenciamento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {credenciamentoData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            Nenhum registro encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        credenciamentoData.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">{row.nome}</TableCell>
                            <TableCell>{formatCPF(row.cpf)}</TableCell>
                            <TableCell>{row.orgao?.nome ?? '-'}</TableCell>
                            <TableCell>{row.curso?.nome ?? '-'}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={
                                  row.status_credenciamento === 'credenciado'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }
                              >
                                {row.status_credenciamento === 'credenciado'
                                  ? 'Credenciado'
                                  : 'Pendente'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {row.data_credenciamento
                                ? formatDate(row.data_credenciamento)
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4 - CERTIFICADOS */}
        <TabsContent value="certificados">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Relatorio de Certificados</CardTitle>
              {renderExportButton('certificados')}
            </CardHeader>
            <CardContent>
              {renderFilters(false, true, false, CERTIFICADO_STATUS_LABELS)}

              {loading ? (
                renderLoading()
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Participante</TableHead>
                        <TableHead>CPF</TableHead>
                        <TableHead>Curso</TableHead>
                        <TableHead>Data Emissao</TableHead>
                        <TableHead>Codigo Verificacao</TableHead>
                        <TableHead>Status Envio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {certificadosData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            Nenhum registro encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        certificadosData.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">
                              {row.participante?.nome ?? '-'}
                            </TableCell>
                            <TableCell>
                              {row.participante?.cpf
                                ? formatCPF(row.participante.cpf)
                                : '-'}
                            </TableCell>
                            <TableCell>{row.curso?.nome ?? '-'}</TableCell>
                            <TableCell>{formatDate(row.data_emissao)}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {row.codigo_verificacao}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {CERTIFICADO_STATUS_LABELS[row.status_envio]}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5 - POR ORGAO */}
        <TabsContent value="orgaos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Relatorio por Orgao</CardTitle>
              {renderExportButton('orgaos')}
            </CardHeader>
            <CardContent>
              {renderFilters(false, false, false)}

              {loading ? (
                renderLoading()
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Orgao</TableHead>
                        <TableHead className="text-right">Total Inscritos</TableHead>
                        <TableHead className="text-right">Confirmados</TableHead>
                        <TableHead className="text-right">Pendentes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orgaosResumo.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            Nenhum registro encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        orgaosResumo.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{row.nome}</TableCell>
                            <TableCell className="text-right">{row.total}</TableCell>
                            <TableCell className="text-right text-green-600 font-medium">
                              {row.confirmados}
                            </TableCell>
                            <TableCell className="text-right text-yellow-600 font-medium">
                              {row.pendentes}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
