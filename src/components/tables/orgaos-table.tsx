'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Pencil, Plus, Users, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

import type { Orgao } from '@/types/database'
import { formatCNPJ } from '@/lib/utils'
import { ITEMS_PER_PAGE, ORGAO_TIPO_OPTIONS, UF_OPTIONS } from '@/lib/constants'
import { fetchOrgaos } from '@/hooks/use-orgaos'

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const columnHelper = createColumnHelper<Orgao>()

export function OrgaosTable() {
  const router = useRouter()
  const [data, setData] = useState<Orgao[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [tipo, setTipo] = useState('')
  const [uf, setUf] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; nome: string } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadData = useCallback(async (params: {
    page: number
    search: string
    tipo: string
    uf: string
  }) => {
    setLoading(true)
    try {
      const result = await fetchOrgaos({
        page: params.page,
        search: params.search || undefined,
        tipo: params.tipo || undefined,
        uf: params.uf || undefined,
      })
      setData(result.data)
      setCount(result.count)
    } catch {
      setData([])
      setCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData({ page, search, tipo, uf })
  }, [page, tipo, uf, loadData]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) return
    const { id } = confirmDelete

    setDeletingId(id)
    try {
      const supabase = createClient()

      // Verifica se há participantes vinculados
      const { count: pCount } = await supabase
        .from('participantes')
        .select('id', { count: 'exact', head: true })
        .eq('orgao_id', id)

      if ((pCount ?? 0) > 0) {
        toast.error(`Existem ${pCount} participantes vinculados a este órgão. Remova-os antes de excluir.`)
        setConfirmDelete(null)
        return
      }

      // Remove notas de empenho vinculadas
      await supabase.from('notas_empenho').delete().eq('orgao_id', id)

      const { error } = await supabase.from('orgaos').delete().eq('id', id)
      if (error) throw error

      toast.success('Órgão excluído com sucesso!')
      setConfirmDelete(null)
      loadData({ page, search, tipo, uf })
    } catch (error) {
      console.error('Erro ao excluir órgão:', error)
      toast.error('Erro ao excluir órgão')
    } finally {
      setDeletingId(null)
    }
  }, [confirmDelete, loadData, page, search, tipo, uf])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      loadData({ page: 1, search: value, tipo, uf })
    }, 300)
  }

  const handleTipoChange = (value: string) => {
    const newTipo = value === '_all' ? '' : value
    setTipo(newTipo)
    setPage(1)
  }

  const handleUfChange = (value: string) => {
    const newUf = value === '_all' ? '' : value
    setUf(newUf)
    setPage(1)
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('nome', {
        header: 'Nome',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('cnpj', {
        header: 'CNPJ',
        cell: (info) => formatCNPJ(info.getValue()),
      }),
      columnHelper.accessor('tipo', {
        header: 'Tipo',
        cell: (info) => <Badge variant="secondary">{info.getValue()}</Badge>,
      }),
      columnHelper.accessor('uf', {
        header: 'UF',
        cell: (info) => info.getValue(),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="text-right">Ações</div>,
        cell: (info) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/orgaos/${info.row.original.id}/editar`)}
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/participantes?orgao=${info.row.original.id}`)}
              title="Ver participantes"
            >
              <Users className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete({ id: info.row.original.id, nome: info.row.original.nome })}
              disabled={deletingId === info.row.original.id}
              title="Excluir"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      }),
    ],
    [router, deletingId]
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Órgãos</h1>
        <Button onClick={() => router.push('/admin/orgaos/novo')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Órgão
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar por nome ou CNPJ..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-sm"
        />
        <Select value={tipo || '_all'} onValueChange={handleTipoChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todos os tipos</SelectItem>
            {ORGAO_TIPO_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={uf || '_all'} onValueChange={handleUfChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="UF" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todas UFs</SelectItem>
            {UF_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Nenhum órgão encontrado.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
            {count} registro{count !== 1 ? 's' : ''} encontrado{count !== 1 ? 's' : ''}
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
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir órgão</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir o órgão{' '}
              <strong>{confirmDelete?.nome}</strong>? Esta ação não pode ser desfeita.
              Se houver participantes vinculados, eles precisam ser removidos antes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(null)}
              disabled={!!deletingId}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={!!deletingId}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingId ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
