'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { Search, Plus, Eye, Pencil, QrCode } from 'lucide-react'

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

import { fetchParticipantes } from '@/hooks/use-participantes'
import { createClient } from '@/lib/supabase/client'
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
      },
      {
        accessorKey: 'cpf',
        header: 'CPF',
        cell: ({ row }) => formatCPF(row.original.cpf),
      },
      {
        id: 'orgao',
        header: 'Orgao',
        cell: ({ row }) => row.original.orgao?.nome ?? '-',
      },
      {
        id: 'curso',
        header: 'Curso',
        cell: ({ row }) => row.original.curso?.nome ?? '-',
      },
      {
        accessorKey: 'telefone',
        header: 'Telefone',
      },
      {
        accessorKey: 'data_compra',
        header: 'Data Compra',
        cell: ({ row }) => formatDate(row.original.data_compra),
      },
      {
        accessorKey: 'status_pagamento',
        header: 'Status Pagamento',
        cell: ({ row }) => {
          const status = row.original.status_pagamento
          return (
            <Badge className={PAGAMENTO_STATUS_COLORS[status]}>
              {PAGAMENTO_STATUS_LABELS[status]}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'status_credenciamento',
        header: 'Status Credenciamento',
        cell: ({ row }) => {
          const status = row.original.status_credenciamento
          return (
            <Badge className={CREDENCIAMENTO_STATUS_COLORS[status]}>
              {CREDENCIAMENTO_STATUS_LABELS[status]}
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

      <div className="rounded-md border bg-white">
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
              Pagina {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Proximo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
