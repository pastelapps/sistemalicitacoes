'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { Search, RefreshCw, Download, Loader2, Award, Palette, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'

import {
  fetchCertificados,
  gerarCertificadoLote,
  reenviarCertificado,
} from '@/hooks/use-certificados'
import { createClient } from '@/lib/supabase/client'
import { formatCPF, formatDate } from '@/lib/utils'
import { ITEMS_PER_PAGE } from '@/lib/constants'
import {
  CERTIFICADO_STATUS_LABELS,
  CERTIFICADO_STATUS_COLORS,
} from '@/lib/constants'

import type {
  CertificadoWithRelations,
  Curso,
  CertificadoStatus,
} from '@/types/database'

export function CertificadosTable() {
  const [data, setData] = useState<CertificadoWithRelations[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [cursoFilter, setCursoFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [gerandoLote, setGerandoLote] = useState(false)
  const [reenviandoId, setReenviandoId] = useState<string | null>(null)
  const [regenerandoId, setRegenerandoId] = useState<string | null>(null)
  const [corFonte, setCorFonte] = useState('#FFFFFF')

  const CORES_PRESET = [
    { label: 'Branco', value: '#FFFFFF' },
    { label: 'Preto', value: '#000000' },
    { label: 'Azul Escuro', value: '#1E3A5F' },
    { label: 'Dourado', value: '#C5A55A' },
    { label: 'Cinza', value: '#666666' },
  ]

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  useEffect(() => {
    async function loadCursos() {
      const supabase = createClient()
      const { data } = (await supabase
        .from('cursos')
        .select('*')
        .order('nome')) as unknown as { data: Curso[] | null }
      setCursos(data ?? [])
    }
    loadCursos()
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchCertificados({
        page,
        search: search || undefined,
        curso_id: cursoFilter && cursoFilter !== 'all' ? cursoFilter : undefined,
        status_envio:
          statusFilter && statusFilter !== 'all'
            ? (statusFilter as CertificadoStatus)
            : undefined,
      })
      setData(result.data)
      setTotalCount(result.count)
    } catch (error) {
      console.error('Erro ao carregar certificados:', error)
      toast.error('Erro ao carregar certificados')
    } finally {
      setLoading(false)
    }
  }, [page, search, cursoFilter, statusFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setPage(1)
  }, [search, cursoFilter, statusFilter])

  const handleGerarLote = async () => {
    if (!cursoFilter || cursoFilter === 'all') {
      toast.error('Selecione um curso para gerar certificados em lote')
      return
    }

    setGerandoLote(true)
    try {
      const result = await gerarCertificadoLote(cursoFilter, corFonte)
      toast.success(
        `Certificados gerados: ${result.gerados}. Erros: ${result.erros}`
      )
      loadData()
    } catch (error) {
      console.error('Erro ao gerar certificados em lote:', error)
      toast.error('Erro ao gerar certificados em lote')
    } finally {
      setGerandoLote(false)
    }
  }

  const handleReenviar = async (participanteId: string) => {
    setReenviandoId(participanteId)
    try {
      const result = await reenviarCertificado(participanteId)
      if (result.success) {
        toast.success('Certificado reenviado com sucesso')
        loadData()
      } else {
        toast.error(result.error ?? 'Erro ao reenviar certificado')
      }
    } catch (error) {
      console.error('Erro ao reenviar certificado:', error)
      toast.error('Erro ao reenviar certificado')
    } finally {
      setReenviandoId(null)
    }
  }

  const handleRegerar = async (participanteId: string) => {
    setRegenerandoId(participanteId)
    try {
      const res = await fetch('/api/pdf/certificado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participante_id: participanteId, cor_fonte: corFonte }),
      })
      if (res.ok) {
        toast.success('Certificado regenerado com sucesso!')
        loadData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erro ao regerar certificado')
      }
    } catch {
      toast.error('Erro ao regerar certificado')
    } finally {
      setRegenerandoId(null)
    }
  }

  const handleDownload = (cert: CertificadoWithRelations) => {
    if (cert.pdf_url) {
      // Adiciona timestamp para evitar cache
      const url = cert.pdf_url.includes('?')
        ? `${cert.pdf_url}&t=${Date.now()}`
        : `${cert.pdf_url}?t=${Date.now()}`
      window.open(url, '_blank')
    } else {
      toast.error('PDF do certificado nao disponivel')
    }
  }

  const columns = useMemo<ColumnDef<CertificadoWithRelations>[]>(
    () => [
      {
        id: 'participante',
        header: 'Participante',
        cell: ({ row }) => row.original.participante?.nome ?? '-',
      },
      {
        id: 'cpf',
        header: 'CPF',
        cell: ({ row }) =>
          row.original.participante?.cpf
            ? formatCPF(row.original.participante.cpf)
            : '-',
      },
      {
        id: 'orgao',
        header: 'Orgao',
        cell: ({ row }) => {
          const part = row.original.participante as
            | (CertificadoWithRelations['participante'] & { orgao?: { nome: string } })
            | undefined
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const p = part as any
          return p?.orgao?.nome ?? '-'
        },
      },
      {
        id: 'curso',
        header: 'Curso',
        cell: ({ row }) => row.original.curso?.nome ?? '-',
      },
      {
        accessorKey: 'data_emissao',
        header: 'Data Emissao',
        cell: ({ row }) => formatDate(row.original.data_emissao),
      },
      {
        accessorKey: 'status_envio',
        header: 'Status Envio',
        cell: ({ row }) => {
          const status = row.original.status_envio
          return (
            <Badge className={CERTIFICADO_STATUS_COLORS[status]}>
              {CERTIFICADO_STATUS_LABELS[status]}
            </Badge>
          )
        },
      },
      {
        id: 'acoes',
        header: 'Acoes',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRegerar(row.original.participante_id)}
              disabled={regenerandoId === row.original.participante_id}
              title="Regerar Certificado"
            >
              {regenerandoId === row.original.participante_id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                handleReenviar(row.original.participante_id)
              }
              disabled={reenviandoId === row.original.participante_id}
              title="Reenviar por Email"
            >
              {reenviandoId === row.original.participante_id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDownload(row.original)}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [reenviandoId]
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Certificados</h1>
        <Button onClick={handleGerarLote} disabled={gerandoLote}>
          {gerandoLote ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Award className="mr-2 h-4 w-4" />
          )}
          Gerar em Lote
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

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

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status envio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {(
              Object.entries(CERTIFICADO_STATUS_LABELS) as [
                CertificadoStatus,
                string,
              ][]
            ).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 ml-auto">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Cor da fonte:</span>
          <div className="flex items-center gap-1">
            {CORES_PRESET.map((cor) => (
              <button
                key={cor.value}
                title={cor.label}
                onClick={() => setCorFonte(cor.value)}
                className={`h-7 w-7 rounded-full border-2 transition-all ${
                  corFonte === cor.value
                    ? 'border-primary scale-110'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: cor.value }}
              />
            ))}
            <input
              type="color"
              value={corFonte}
              onChange={(e) => setCorFonte(e.target.value)}
              className="h-7 w-7 cursor-pointer rounded border-0 p-0"
              title="Cor personalizada"
            />
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum certificado encontrado.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {(page - 1) * ITEMS_PER_PAGE + 1} a{' '}
            {Math.min(page * ITEMS_PER_PAGE, totalCount)} de {totalCount}{' '}
            resultados
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
