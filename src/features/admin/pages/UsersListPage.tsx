import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, UserX, Users } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button, DataTable, type Column, ConfirmDialog, useToast } from '@/components/ui'
import { FilterBar } from '@/components/domain'
import { RoleBadge } from '@/components/domain/RoleBadge'
import { StatusBadge } from '@/components/domain/StatusBadge'
import { formatDateTime } from '@/lib/format'
import { useListControls } from '@/lib/useListControls'
import { useAuth } from '@/lib/auth'
import type { User } from '@/lib/api/types'
import { usersApi } from '../hooks'

export function UsersListPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { session } = useAuth()
  const { search, filters, page, setPage, setFilter, onSearchChange, clear, params } = useListControls()
  const { data, isLoading, isError, refetch } = usersApi.useList(params)
  const update = usersApi.useUpdate()
  const [deactivating, setDeactivating] = useState<User | null>(null)

  const isSelf = deactivating?.id === session?.userId

  async function confirmDeactivate() {
    if (!deactivating || isSelf) return
    await update.mutateAsync({ id: deactivating.id, data: { status: 'inactive' } })
    toast.success('User deactivated', `${deactivating.name} can no longer sign in.`)
    setDeactivating(null)
  }

  const columns: Column<User>[] = [
    { key: 'name', header: 'Name', cell: (u) => <span className="font-medium">{u.name}</span>, sortValue: (u) => u.name },
    { key: 'email', header: 'Email', cell: (u) => <span className="text-text-muted">{u.email}</span> },
    { key: 'role', header: 'Role', cell: (u) => <RoleBadge role={u.role} /> },
    { key: 'status', header: 'Status', cell: (u) => <StatusBadge status={u.status} /> },
    {
      key: 'lastLogin',
      header: 'Last login',
      cell: (u) => <span className="text-text-muted">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Never'}</span>,
      sortValue: (u) => u.lastLoginAt ?? '',
    },
  ]

  return (
    <div>
      <PageHeader
        title="Users"
        description="Administrators and dispatchers in your company."
        actions={
          <Button onClick={() => navigate('/users/new')}>
            <Plus className="h-4 w-4" />
            Add user
          </Button>
        }
      />
      <div className="mb-4">
        <FilterBar
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search by name or email…"
          filters={[
            {
              key: 'role',
              label: 'Role',
              options: [
                { value: 'tenant_admin', label: 'Tenant Admin' },
                { value: 'dispatcher', label: 'Dispatcher' },
              ],
            },
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ],
            },
          ]}
          values={filters}
          onFilterChange={setFilter}
          onClear={clear}
        />
      </div>
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(u) => u.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        rowActions={(u) => (
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" aria-label={`Edit ${u.name}`} onClick={() => navigate(`/users/${u.id}/edit`)}>
              <Pencil className="h-4 w-4" />
            </Button>
            {u.status === 'active' && (
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Deactivate ${u.name}`}
                onClick={() => setDeactivating(u)}
              >
                <UserX className="h-4 w-4 text-status-expired" />
              </Button>
            )}
          </div>
        )}
        pagination={{ page, pageSize: params.pageSize!, total: data?.total ?? 0, onPageChange: setPage }}
        emptyTitle="No users found"
        emptyDescription="Add an administrator or dispatcher to your company."
        emptyAction={
          <Button size="sm" onClick={() => navigate('/users/new')}>
            <Users className="h-4 w-4" />
            Add user
          </Button>
        }
      />

      <ConfirmDialog
        open={!!deactivating}
        onOpenChange={(o) => !o && setDeactivating(null)}
        title={isSelf ? 'Cannot deactivate yourself' : 'Deactivate user?'}
        description={
          isSelf
            ? 'You cannot deactivate your own account. Ask another administrator to do this.'
            : `${deactivating?.name} will immediately lose access to the portal. You can reactivate them later.`
        }
        variant="danger"
        confirmLabel={isSelf ? 'Close' : 'Deactivate'}
        confirmDisabled={false}
        loading={update.isPending}
        onConfirm={isSelf ? () => setDeactivating(null) : confirmDeactivate}
      />
    </div>
  )
}
