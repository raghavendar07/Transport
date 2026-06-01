import { useState } from 'react'
import { Download, Lock } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button, DataTable, type Column, Modal, Badge, useToast } from '@/components/ui'
import { FilterBar } from '@/components/domain'
import { RoleBadge } from '@/components/domain/RoleBadge'
import { formatDateTime } from '@/lib/format'
import { useListControls } from '@/lib/useListControls'
import type { AuditLogEntry } from '@/lib/api/types'
import { useAuditList, useAuditExport } from '../hooks'

export function AuditLogPage() {
  const toast = useToast()
  const { search, filters, onSearchChange, setFilter, clear, params } = useListControls(20)
  const { data, isLoading, isError, refetch } = useAuditList(params)
  const exporter = useAuditExport()
  const [entry, setEntry] = useState<AuditLogEntry | null>(null)

  async function exportCsv() {
    const csv = await exporter.mutateAsync()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'audit-log.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Audit log exported')
  }

  const columns: Column<AuditLogEntry>[] = [
    { key: 'time', header: 'When', cell: (e) => <span className="text-text-muted">{formatDateTime(e.createdAt)}</span> },
    { key: 'actor', header: 'Actor', cell: (e) => <span className="font-medium">{e.actorName}</span> },
    { key: 'role', header: 'Role', cell: (e) => <RoleBadge role={e.actorRole} /> },
    { key: 'action', header: 'Action', cell: (e) => <Badge tone="info">{e.action}</Badge> },
    { key: 'record', header: 'Record', cell: (e) => <span className="font-mono text-xs">{e.recordType}/{e.recordId}</span> },
  ]

  return (
    <div>
      <PageHeader
        title="Audit Log"
        description="Read-only record of every action. Logs cannot be edited or deleted."
        actions={
          <Button variant="secondary" onClick={exportCsv} loading={exporter.isPending}>
            <Download className="h-4 w-4" />
            Export CSV (≤90 days)
          </Button>
        }
      />
      <div className="mb-3 flex items-center gap-2 rounded-md border border-border bg-surface-hover px-3 py-2 text-xs text-text-muted">
        <Lock className="h-3.5 w-3.5" aria-hidden />
        This log is immutable — entries are append-only and retained for 90 days.
      </div>
      <div className="mb-4">
        <FilterBar
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search by actor, action or record…"
          filters={[
            {
              key: 'action',
              label: 'Action',
              options: [
                { value: 'route.publish', label: 'route.publish' },
                { value: 'driver.update', label: 'driver.update' },
                { value: 'user.deactivate', label: 'user.deactivate' },
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
        rowKey={(e) => e.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onRowClick={(e) => setEntry(e)}
        emptyTitle="No log entries"
      />

      <Modal open={!!entry} onOpenChange={(o) => !o && setEntry(null)} title="Audit entry" size="lg">
        {entry && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-text-subtle">Actor</p>
                <p className="text-text">{entry.actorName}</p>
              </div>
              <div>
                <p className="text-xs text-text-subtle">Role</p>
                <RoleBadge role={entry.actorRole} />
              </div>
              <div>
                <p className="text-xs text-text-subtle">Action</p>
                <p className="text-text">{entry.action}</p>
              </div>
              <div>
                <p className="text-xs text-text-subtle">Record</p>
                <p className="font-mono text-text">{entry.recordType}/{entry.recordId}</p>
              </div>
              <div>
                <p className="text-xs text-text-subtle">IP address</p>
                <p className="font-mono text-text">{entry.ip}</p>
              </div>
              <div>
                <p className="text-xs text-text-subtle">Timestamp</p>
                <p className="text-text">{formatDateTime(entry.createdAt)}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-text-subtle">User agent</p>
              <p className="text-text">{entry.userAgent}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-border p-3">
                <p className="mb-1 text-xs font-medium text-text-subtle">Before</p>
                <pre className="overflow-x-auto text-xs text-text">{JSON.stringify(entry.before, null, 2)}</pre>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="mb-1 text-xs font-medium text-text-subtle">After</p>
                <pre className="overflow-x-auto text-xs text-text">{JSON.stringify(entry.after, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
