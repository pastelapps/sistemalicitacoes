'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { Plus, Pencil, UserX } from 'lucide-react'
import { toast } from 'sonner'

import type { Profile, UserRole } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { formatDateTime } from '@/lib/utils'
import { USER_ROLE_LABELS, ITEMS_PER_PAGE } from '@/lib/constants'

import { Button } from '@/components/ui/button'
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

export function UsuariosTable() {
  const router = useRouter()
  const [data, setData] = useState<Profile[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Dialog state
  const [desativarDialogOpen, setDesativarDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const from = (page - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (roleFilter) {
        query = query.eq('role', roleFilter)
      }

      if (statusFilter === 'ativo') {
        query = query.eq('ativo', true)
      } else if (statusFilter === 'inativo') {
        query = query.eq('ativo', false)
      }

      const { data: profiles, count: total, error } = await query as {
        data: Profile[] | null
        count: number | null
        error: Error | null
      }

      if (error) throw error

      setData(profiles ?? [])
      setCount(total ?? 0)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }, [page, roleFilter, statusFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleDesativar = async () => {
    if (!selectedUserId) return
    setActionLoading(true)
    try {
      // Verificar se existe pelo menos 1 admin ativo alem deste
      const supabase = createClient()
      const { data: admins, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .eq('ativo', true)
        .neq('id', selectedUserId) as {
        data: Profile[] | null
        error: Error | null
      }

      if (checkError) throw checkError

      if (!admins || admins.length === 0) {
        toast.error('Não é possível desativar. Deve existir ao menos 1 administrador ativo.')
        setDesativarDialogOpen(false)
        return
      }

      const response = await fetch(`/api/users/${selectedUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: false }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao desativar usuário')
      }

      toast.success('Usuário desativado com sucesso!')
      setDesativarDialogOpen(false)
      loadData()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Erro ao desativar usuário.')
    } finally {
      setActionLoading(false)
    }
  }

  const columns = useMemo<ColumnDef<Profile>[]>(
    () => [
      {
        accessorKey: 'nome',
        header: 'Nome',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.nome}</span>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
      },
      {
        accessorKey: 'role',
        header: 'Perfil',
        cell: ({ row }) => {
          const role = row.original.role
          return (
            <Badge
              variant="secondary"
              className={
                role === 'admin'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }
            >
              {USER_ROLE_LABELS[role]}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'ativo',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={
              row.original.ativo
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }
          >
            {row.original.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        ),
      },
      {
        accessorKey: 'ultimo_acesso',
        header: 'Último Acesso',
        cell: ({ row }) =>
          row.original.ultimo_acesso
            ? formatDateTime(row.original.ultimo_acesso)
            : '-',
      },
      {
        id: 'acoes',
        header: 'Ações',
        cell: ({ row }) => {
          const user = row.original
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/usuarios/${user.id}/editar`)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              {user.ativo && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => {
                    setSelectedUserId(user.id)
                    setDesativarDialogOpen(true)
                  }}
                >
                  <UserX className="h-4 w-4" />
                </Button>
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
        <h1 className="text-2xl font-bold">Usuários do Sistema</h1>
        <Button onClick={() => router.push('/usuarios/novo')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select
          value={roleFilter}
          onValueChange={(value) => {
            setRoleFilter(value === 'todos' ? '' : (value as UserRole))
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos os perfis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os perfis</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="operador">Operador</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value === 'todos' ? '' : value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
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
                  Nenhum usuário encontrado.
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
          {count} usuário{count !== 1 ? 's' : ''} encontrado{count !== 1 ? 's' : ''}
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

      {/* Dialog Desativar */}
      <Dialog open={desativarDialogOpen} onOpenChange={setDesativarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desativar Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desativar este usuário? Ele não poderá mais
              acessar o sistema até ser reativado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDesativarDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDesativar}
              disabled={actionLoading}
            >
              {actionLoading ? 'Desativando...' : 'Desativar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
