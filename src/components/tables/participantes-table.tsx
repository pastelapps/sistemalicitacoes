'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { Search, Plus, Eye, Pencil, QrCode, Trash2 } from 'lucide-react'

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

import { fetchParticipantes } from '@/hooks/use-participantes'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatCPF, formatDate } from '@/lib/utils'
import { ITEMS_PER_PAGE } from '@/lib/constants'
import {
  PAGAMENTO_STATUS_LABELS,
  PAGAMENTO_STATUS_COLORS,
  CREDENCIAMENTO_STATUS_LABELS,
  CREDENCIAMENTO_STATUS_COLORS,
} from '@/lib/constants'

import type {
  ParticipanteWithRelations,
  Curso,
  Orgao,
  PagamentoStatus,
  CredenciamentoStatus,
} from '@/types/database'

export function ParticipantesTable() {
  const router = useRouter()
  const [data, setData] = useState<ParticipanteWithRelations[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [cursoFilter, setCursoFilter] = useState('')
  const [orgaoFilter, setOrgaoFilter] = useState('')
  const [pagamentoFilter, setPagamentoFilter] = useState('')
  const [credenciamentoFilter, setCredenciamentoFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [orgaos, setOrgaos] = useState<Orgao[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; nome: string } | null>(null)

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

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

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await fetchParticipantes({
        page,
        search: search || undefined,
        curso_id: cursoFilter && cursoFilter !== 'all' ? cursoFilter : undefined,
        orgao_id: orgaoFilter && orgaoFilter !== 'all' ? orgaoFilter : undefined,
        status_pagamento: pagamentoFilter && pagamentoFilter !== 'all' ? (pagamentoFilter as PagamentoStatus) : undefined,
        status_credenciamento: credenciamentoFilter && credenciamentoFilter !== 'all' ? (credenciamentoFilter as CredenciamentoStatus) : undefined,
      })
      setData(result.data)
      setTotalCount(result.count)
    } catch (error) {
      console.error('Erro ao carregar participantes:', error)
    } finally {
      setLoading(false)
    }
  }, [page, search, cursoFilter, orgaoFilter, pagamentoFilter, credenciamentoFilter])

  const handleDelete = useCallback(async () => {
    if (!confirmDelete) return
    const { id } = confirmDelete

    setDeletingId(id)
    try {
      const supabase = createClient()

      // Remove certificados vinculados primeiro
      await supabase.from('certificados').delete().eq('participante_id', id)

      // Remove o participante
      const { error } = await supabase.from('participantes').delete().eq('id', id)

      if (error) throw error

      toast.success('Participante excluído com sucesso!')
      setConfirmDelete(null)
      loadData()
    } catch (error) {
      console.error('Erro ao excluir participante:', error)
      toast.error('Erro ao excluir participante')
    } finally {
      setDeletingId(null)
    }
  }, [confirmDelete, loadData])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setPage(1)
  }, [search, cursoFilter, orgaoFilter, pagamentoFilter, credenciamentoFilter])

  const columns = useMemo<ColumnDef<ParticipanteWithRelations>[]>(
    () => [
      {
        accessorKey: 'nome',
        header: 'Nome',
        cell: ({ row }) => (
          <div className="max-w-[180px] truncate font-medium" title={row.original.nome}>
            {row.original.nome}
          </div>
        ),
      },
      {
        accessorKey: 'cpf',
        header: 'CPF',
        cell: ({ row }) => <span className="text-xs">{formatCPF(row.original.cpf)}</span>,
      },
      {
        id: 'orgao',
        header: 'Órgão',
        cell: ({ row }) => (
          <div className="max-w-[140px] truncate text-xs" title={row.original.orgao?.nome}>
            {row.original.orgao?.nome ?? '-'}
          </div>
        ),
      },
      {
        id: 'curso',
        header: 'Curso',
        cell: ({ row }) => (
          <div className="max-w-[160px] truncate text-xs" title={row.original.curso?.nome}>
            {row.original.curso?.nome ?? '-'}
          </div>
        ),
      },
      {
        accessorKey: 'data_compra',
        header: 'Compra',
        cell: ({ row }) => <span className="text-xs whitespace-nowrap">{formatDate(row.original.data_compra)}</span>,
      },
      {
        accessorKey: 'status_pagamento',
        header: 'Pagto',
        cell: ({ row }) => {
          const status = row.original.status_pagamento
          return (
            <Badge className={`${PAGAMENTO_STATUS_COLORS[status]} text-xs whitespace-nowrap`}>
              {PAGAMENTO_STATUS_LABELS[status]}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'status_credenciamento',
        header: 'Credenc.',
        cell: ({ row }) => {
          const status = row.original.status_credenciamento
          return (
            <Badge className={`${CREDENCIAMENTO_STATUS_COLORS[status]} text-xs whitespace-nowrap`}>
              {CREDENCIAMENTO_STATUS_LABELS[status]}
            </Badge>
          )
        },
      },
      {
        id: 'acoes',
        header: () => <div className="text-right">Ações</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1 whitespace-nowrap">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/admin/participantes/${row.original.id}`)}
              title="Ver Detalhes"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/admin/participantes/${row.original.id}/editar`)}
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/admin/participantes/${row.original.id}`)}
              title="Gerar Ingresso / QR Code"
            >
              <QrCode className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setConfirmDelete({ id: row.original.id, nome: row.original.nome })}
              disabled={deletingId === row.original.id}
              title="Excluir"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [router, deletingId]
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
        <h1 className="text-2xl font-bold">Participantes</h1>
        <Button onClick={() => router.push('/admin/participantes/novo')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Participante
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={cursoFilter} onValueChange={setCursoFilter}>
          <SelectTrigger className="w-48">
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

        <Select value={orgaoFilter} onValueChange={setOrgaoFilter}>
          <SelectTrigger className="w-48">
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

        <Select value={pagamentoFilter} onValueChange={setPagamentoFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {(Object.entries(PAGAMENTO_STATUS_LABELS) as [PagamentoStatus, string][]).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>

        <Select value={credenciamentoFilter} onValueChange={setCredenciamentoFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Status credenciamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {(
              Object.entries(CREDENCIAMENTO_STATUS_LABELS) as [CredenciamentoStatus, string][]
            ).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-white [&_td]:py-3 [&_td]:px-3 [&_th]:px-3">
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
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum participante encontrado.
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
            Mostrando {(page - 1) * ITEMS_PER_PAGE + 1} a{' '}
            {Math.min(page * ITEMS_PER_PAGE, totalCount)} de {totalCount} resultados
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

      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir participante</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir o participante{' '}
              <strong>{confirmDelete?.nome}</strong>? Esta ação não pode ser desfeita.
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
              variant="destructive"
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
