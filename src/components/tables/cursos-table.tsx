'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { Plus, Pencil, Users } from 'lucide-react'

import type { Curso, CursoStatus } from '@/types/database'
import { fetchCursos } from '@/hooks/use-cursos'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  CURSO_STATUS_LABELS,
  CURSO_STATUS_COLORS,
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

export function CursosTable() {
  const router = useRouter()
  const [data, setData] = useState<Curso[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CursoStatus | ''>('')
  const selectStatusValue = statusFilter || 'todos'
  const [loading, setLoading] = useState(true)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchCursos({
        page,
        search: debouncedSearch,
        status: statusFilter,
      })
      setData(result.data)
      setCount(result.count)
    } catch (error) {
      console.error('Erro ao carregar cursos:', error)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, statusFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const columns = useMemo<ColumnDef<Curso>[]>(
    () => [
      {
        accessorKey: 'nome',
        header: 'Nome',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.nome}</span>
        ),
      },
      {
        accessorKey: 'data_inicio',
        header: 'Data Início',
        cell: ({ row }) => formatDate(row.original.data_inicio),
      },
      {
        accessorKey: 'data_fim',
        header: 'Data Fim',
        cell: ({ row }) => formatDate(row.original.data_fim),
      },
      {
        accessorKey: 'local_cidade_uf',
        header: 'Local',
      },
      {
        accessorKey: 'valor',
        header: 'Valor',
        cell: ({ row }) => formatCurrency(row.original.valor),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status
          return (
            <Badge className={CURSO_STATUS_COLORS[status]} variant="secondary">
              {CURSO_STATUS_LABELS[status]}
            </Badge>
          )
        },
      },
      {
        id: 'acoes',
        header: 'Ações',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push(`/admin/cursos/${row.original.id}/editar`)
              }
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push(`/admin/participantes?curso=${row.original.id}`)
              }
            >
              <Users className="h-4 w-4" />
            </Button>
          </div>
        ),
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
        <h1 className="text-2xl font-bold">Cursos</h1>
        <Button onClick={() => router.push('/admin/cursos/novo')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Curso
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={selectStatusValue}
          onValueChange={(value) => {
            setStatusFilter(value === 'todos' ? '' : value as CursoStatus)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="encerrado">Encerrado</SelectItem>
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
                  Nenhum curso encontrado.
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
          {count} curso{count !== 1 ? 's' : ''} encontrado{count !== 1 ? 's' : ''}
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
    </div>
  )
}
