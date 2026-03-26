'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { Plus, Pencil, Check, X, FileDown } from 'lucide-react'
import { toast } from 'sonner'

import type { NotaEmpenhoWithRelations, EmpenhoStatus, Curso } from '@/types/database'
import { fetchEmpenhos, aprovarEmpenho, rejeitarEmpenho } from '@/hooks/use-empenhos'
import { fetchCursos } from '@/hooks/use-cursos'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  EMPENHO_STATUS_LABELS,
  EMPENHO_STATUS_COLORS,
  ITEMS_PER_PAGE,
} from '@/lib/constants'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export function EmpenhosTable() {
  const router = useRouter()
  const [data, setData] = useState<NotaEmpenhoWithRelations[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<EmpenhoStatus | ''>('')
  const [cursoFilter, setCursoFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [cursos, setCursos] = useState<Curso[]>([])

  // Dialog states
  const [aprovarDialogOpen, setAprovarDialogOpen] = useState(false)
  const [rejeitarDialogOpen, setRejeitarDialogOpen] = useState(false)
  const [selectedEmpenhoId, setSelectedEmpenhoId] = useState<string | null>(null)
  const [motivoRejeicao, setMotivoRejeicao] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Load cursos for filter
  useEffect(() => {
    fetchCursos({ page: 1, search: '' }).then((result) => {
      setCursos(result.data)
    })
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchEmpenhos({
        page,
        search: debouncedSearch,
        status: statusFilter,
        curso_id: cursoFilter,
      })
      setData(result.data)
      setCount(result.count)
    } catch (error) {
      console.error('Erro ao carregar empenhos:', error)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, statusFilter, cursoFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAprovar = async () => {
    if (!selectedEmpenhoId) return
    setActionLoading(true)
    try {
      await aprovarEmpenho(selectedEmpenhoId)
      toast.success('Nota de empenho aprovada com sucesso!')
      setAprovarDialogOpen(false)
      loadData()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao aprovar nota de empenho.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejeitar = async () => {
    if (!selectedEmpenhoId || !motivoRejeicao.trim()) return
    setActionLoading(true)
    try {
      await rejeitarEmpenho(selectedEmpenhoId, motivoRejeicao)
      toast.success('Nota de empenho rejeitada.')
      setRejeitarDialogOpen(false)
      setMotivoRejeicao('')
      loadData()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao rejeitar nota de empenho.')
    } finally {
      setActionLoading(false)
    }
  }

  const columns = useMemo<ColumnDef<NotaEmpenhoWithRelations>[]>(
    () => [
      {
        accessorKey: 'numero_nota',
        header: 'Nº Nota',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.numero_nota}</span>
        ),
      },
      {
        id: 'orgao',
        header: 'Órgão',
        cell: ({ row }) => row.original.orgao?.nome ?? '-',
      },
      {
        id: 'curso',
        header: 'Curso',
        cell: ({ row }) => row.original.curso?.nome ?? '-',
      },
      {
        accessorKey: 'valor',
        header: 'Valor',
        cell: ({ row }) => formatCurrency(row.original.valor),
      },
      {
        accessorKey: 'qtd_participantes',
        header: 'Qtd Participantes',
      },
      {
        accessorKey: 'data_envio',
        header: 'Data Envio',
        cell: ({ row }) => formatDate(row.original.data_envio),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status
          return (
            <Badge className={EMPENHO_STATUS_COLORS[status]} variant="secondary">
              {EMPENHO_STATUS_LABELS[status]}
            </Badge>
          )
        },
      },
      {
        id: 'arquivo',
        header: 'Arquivo',
        cell: ({ row }) =>
          row.original.arquivo_url ? (
            <a
              href={row.original.arquivo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              <FileDown className="h-4 w-4" />
              PDF
            </a>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        id: 'acoes',
        header: 'Ações',
        cell: ({ row }) => {
          const empenho = row.original
          const canApprove = empenho.status === 'pendente' || empenho.status === 'recebida'

          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/empenhos/${empenho.id}/editar`)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              {canApprove && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-700"
                    onClick={() => {
                      setSelectedEmpenhoId(empenho.id)
                      setAprovarDialogOpen(true)
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      setSelectedEmpenhoId(empenho.id)
                      setRejeitarDialogOpen(true)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )
        },
      },
    ],
    [router]
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(count / ITEMS_PER_PAGE),
  })

  const totalPages = Math.ceil(count / ITEMS_PER_PAGE)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notas de Empenho</h1>
        <Button onClick={() => router.push('/empenhos/novo')}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Nota
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Buscar por número da nota..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value === 'todos' ? '' : (value as EmpenhoStatus))
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="recebida">Recebida</SelectItem>
            <SelectItem value="aprovada">Aprovada</SelectItem>
            <SelectItem value="rejeitada">Rejeitada</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={cursoFilter}
          onValueChange={(value) => {
            setCursoFilter(value === 'todos' ? '' : value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Todos os cursos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os cursos</SelectItem>
            {cursos.map((curso) => (
              <SelectItem key={curso.id} value={curso.id}>
                {curso.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
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
                  Nenhuma nota de empenho encontrada.
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

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {count} nota{count !== 1 ? 's' : ''} encontrada{count !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Próximo
          </Button>
        </div>
      </div>

      {/* Dialog Aprovar */}
      <Dialog open={aprovarDialogOpen} onOpenChange={setAprovarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Nota de Empenho</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja aprovar esta nota de empenho? Os participantes vinculados
              terão o status de pagamento atualizado para &quot;Confirmado&quot;.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAprovarDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleAprovar} disabled={actionLoading}>
              {actionLoading ? 'Aprovando...' : 'Aprovar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Rejeitar */}
      <Dialog open={rejeitarDialogOpen} onOpenChange={setRejeitarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Nota de Empenho</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição desta nota de empenho.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo da rejeição</Label>
            <Textarea
              id="motivo"
              value={motivoRejeicao}
              onChange={(e) => setMotivoRejeicao(e.target.value)}
              placeholder="Descreva o motivo..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejeitarDialogOpen(false)
                setMotivoRejeicao('')
              }}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejeitar}
              disabled={actionLoading || !motivoRejeicao.trim()}
            >
              {actionLoading ? 'Rejeitando...' : 'Rejeitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
