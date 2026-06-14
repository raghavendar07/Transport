import { useEffect, useState } from 'react'
import { Bell, BellOff, Check, FileText, ShieldCheck, Truck, Sparkles, Plus, Trash2, Settings as SettingsIcon } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Card,
  CardBody,
  Tabs,
  TabsList,
  TabTrigger,
  TabPanel,
  Button,
  Checkbox,
  AsyncBoundary,
  EmptyState,
  Spinner,
  Modal,
  Input,
  FormField,
  useToast,
} from '@/components/ui'
import { formatDateTime } from '@/lib/format'
import { NOTIFICATION_EVENTS, type NotificationChannel, type NotificationPreferences } from '@/lib/api/types'
import { DRIVER_DOCUMENT_TYPES, VEHICLE_DOCUMENT_TYPES } from '@/features/fleet-clients/documents'
import { cn } from '@/lib/cn'
import { useNotifications, useNotificationMutations, usePrefs, useUpdatePrefs } from '../hooks'

const CHANNELS: NotificationChannel[] = ['email', 'push', 'in_app']
const CHANNEL_LABEL: Record<NotificationChannel, string> = { email: 'Email', push: 'Push', in_app: 'In-app' }

/** Stable display labels for the core events. Document-type rows derive their label dynamically. */
const CORE_EVENT_LABEL: Record<string, string> = {
  licence_expiring: 'Driver licence expiring',
  document_expiring: 'Any document expiring (catch-all)',
  checklist_failure: 'Pre-trip checklist failure',
  route_published: 'Route published',
  driver_substituted: 'Driver substituted on a route',
}

/** Prefix used to derive per-document-type keys dynamically. */
const DOC_KEY = (type: string) => `doc_expiring:${type}`
/** Prefix for user-defined custom notification rules. */
const CUSTOM_KEY = (label: string) => `custom:${label}`
const isCustomKey = (k: string) => k.startsWith('custom:')
const labelFromCustomKey = (k: string) => k.slice('custom:'.length)

interface PrefGroup {
  title: string
  description: string
  icon: typeof Bell
  rows: { key: string; label: string }[]
}

/**
 * Build groups dynamically. Adding a new entry to DRIVER_DOCUMENT_TYPES /
 * VEHICLE_DOCUMENT_TYPES automatically surfaces a new toggle here — no code
 * change required to the preferences page itself.
 */
function buildGroups(): PrefGroup[] {
  return [
    {
      title: 'Core events',
      description: 'Operational alerts that always exist.',
      icon: Bell,
      rows: NOTIFICATION_EVENTS.map((ev) => ({ key: ev, label: CORE_EVENT_LABEL[ev] ?? ev })),
    },
    {
      title: 'Driver document expiry',
      description: 'One toggle per required driver document — added automatically as new types are configured.',
      icon: ShieldCheck,
      rows: DRIVER_DOCUMENT_TYPES.map((t) => ({ key: DOC_KEY(t), label: t })),
    },
    {
      title: 'Vehicle document expiry',
      description: 'One toggle per required vehicle document — added automatically as new types are configured.',
      icon: Truck,
      rows: VEHICLE_DOCUMENT_TYPES.map((t) => ({ key: DOC_KEY(t), label: t })),
    },
  ]
}

/** Default-on channel matrix for any new event the backend doesn't recognise yet. */
const DEFAULT_CHANNELS: Record<NotificationChannel, boolean> = { email: true, push: true, in_app: true }

function ensureRow(prefs: NotificationPreferences, key: string): Record<NotificationChannel, boolean> {
  return prefs[key] ?? DEFAULT_CHANNELS
}

function NotificationCentre() {
  const query = useNotifications()
  const { markRead, markAllRead } = useNotificationMutations()

  return (
    <Card>
      <CardBody className="p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <span className="text-sm font-medium text-text">Recent notifications</span>
          <Button size="sm" variant="ghost" onClick={() => markAllRead.mutate()}>
            <Check className="h-4 w-4" />
            Mark all read
          </Button>
        </div>
        <AsyncBoundary
          isLoading={query.isLoading}
          isError={query.isError}
          data={query.data}
          onRetry={query.refetch}
          emptyFallback={<EmptyState icon={BellOff} title="No notifications" />}
        >
          {(items) => (
            <ul className="divide-y divide-border">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={cn('flex items-start gap-3 px-5 py-3', !n.read && 'bg-brand-50/50')}
                >
                  <Bell className={cn('mt-0.5 h-4 w-4', n.read ? 'text-text-subtle' : 'text-brand')} aria-hidden />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text">{n.title}</p>
                    <p className="text-sm text-text-muted">{n.body}</p>
                    <p className="mt-0.5 text-xs text-text-subtle">{formatDateTime(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <Button size="sm" variant="ghost" onClick={() => markRead.mutate(n.id)}>
                      Mark read
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </AsyncBoundary>
      </CardBody>
    </Card>
  )
}

function PrefsMatrix() {
  const { data, isLoading } = usePrefs()
  const update = useUpdatePrefs()
  const toast = useToast()
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [newLabel, setNewLabel] = useState('')

  useEffect(() => {
    if (data) setPrefs(data)
  }, [data])

  if (isLoading || !prefs) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    )
  }

  const groups = buildGroups()
  const customRows = Object.keys(prefs)
    .filter(isCustomKey)
    .map((k) => ({ key: k, label: labelFromCustomKey(k) }))

  function addCustom() {
    const trimmed = newLabel.trim()
    if (!trimmed) return
    const key = CUSTOM_KEY(trimmed)
    if (prefs && prefs[key]) {
      toast.success('Already exists', `A preference named "${trimmed}" already exists.`)
      return
    }
    setPrefs((prev) => {
      if (!prev) return prev
      return { ...prev, [key]: { email: true, push: true, in_app: true } }
    })
    setNewLabel('')
    setAddOpen(false)
  }

  function removeCustom(key: string) {
    setPrefs((prev) => {
      if (!prev) return prev
      const { [key]: _removed, ...rest } = prev
      void _removed
      return rest
    })
  }

  function toggle(key: string, channel: NotificationChannel) {
    setPrefs((prev) => {
      if (!prev) return prev
      const row = ensureRow(prev, key)
      return { ...prev, [key]: { ...row, [channel]: !row[channel] } }
    })
  }

  function setAllInGroup(group: PrefGroup, on: boolean) {
    setPrefs((prev) => {
      if (!prev) return prev
      const next = { ...prev }
      for (const r of group.rows) {
        next[r.key] = { email: on, push: on, in_app: on }
      }
      return next
    })
  }

  async function save() {
    await update.mutateAsync(prefs!)
    toast.success('Preferences saved')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-[8px] border border-status-info-bg bg-status-info-bg/40 p-3 text-xs text-status-info">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">Auto-syncs with document catalogue</p>
          <p className="text-status-info/90">
            New driver or vehicle document types you add (e.g. "Lift Maintenance", "CPR") show up
            as their own toggle here automatically. Defaults to all channels on until you change
            them.
          </p>
        </div>
      </div>

      {groups.map((group) => {
        const GroupIcon = group.icon
        return (
          <Card key={group.title}>
            <CardBody className="p-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-brand-100 text-brand">
                    <GroupIcon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-text">{group.title}</p>
                    <p className="text-xs text-text-muted">{group.description}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setAllInGroup(group, true)}>
                    All on
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAllInGroup(group, false)}>
                    All off
                  </Button>
                </div>
              </div>
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col />
                  {CHANNELS.map((c) => (
                    <col key={c} className="w-24" />
                  ))}
                </colgroup>
                <thead>
                  <tr className="border-b border-border bg-surface-hover/40 text-text-muted">
                    <th className="px-5 py-2 text-left font-medium">Event</th>
                    {CHANNELS.map((c) => (
                      <th key={c} className="px-3 py-2 text-center font-medium">
                        {CHANNEL_LABEL[c]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row) => {
                    const data = ensureRow(prefs, row.key)
                    return (
                      <tr key={row.key} className="border-b border-border last:border-0">
                        <td className="px-5 py-3 text-text">
                          <div className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 shrink-0 text-text-subtle" aria-hidden />
                            <span className="truncate">{row.label}</span>
                          </div>
                        </td>
                        {CHANNELS.map((c) => (
                          <td key={c} className="px-3 py-3">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={data[c]}
                                onCheckedChange={() => toggle(row.key, c)}
                                aria-label={`${row.label} via ${CHANNEL_LABEL[c]}`}
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                  {group.rows.length === 0 && (
                    <tr>
                      <td colSpan={CHANNELS.length + 1} className="px-5 py-4 text-center text-xs text-text-subtle">
                        No event types configured.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardBody>
          </Card>
        )
      })}

      {/* Custom preferences — operator-defined notification rules */}
      <Card>
        <CardBody className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-brand-100 text-brand">
                <SettingsIcon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-text">Additional preferences</p>
                <p className="text-xs text-text-muted">
                  Add your own notification rules — anything beyond documents (e.g. "Late arrival", "Fuel low").
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add preference
            </Button>
          </div>
          {customRows.length === 0 ? (
            <p className="px-5 py-6 text-center text-xs text-text-subtle">
              No custom preferences yet. Click <strong>Add preference</strong> to create one.
            </p>
          ) : (
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col />
                {CHANNELS.map((c) => (
                  <col key={c} className="w-24" />
                ))}
                <col className="w-12" />
              </colgroup>
              <thead>
                <tr className="border-b border-border bg-surface-hover/40 text-text-muted">
                  <th className="px-5 py-2 text-left font-medium">Event</th>
                  {CHANNELS.map((c) => (
                    <th key={c} className="px-3 py-2 text-center font-medium">
                      {CHANNEL_LABEL[c]}
                    </th>
                  ))}
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {customRows.map((row) => {
                  const data = ensureRow(prefs, row.key)
                  return (
                    <tr key={row.key} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 text-text">
                        <div className="flex items-center gap-2 min-w-0">
                          <Bell className="h-3.5 w-3.5 shrink-0 text-text-subtle" aria-hidden />
                          <span className="truncate">{row.label}</span>
                          <span className="shrink-0 rounded-[2px] bg-surface-hover px-[6px] py-0.5 text-[10px] font-medium text-text-muted">
                            Custom
                          </span>
                        </div>
                      </td>
                      {CHANNELS.map((c) => (
                        <td key={c} className="px-3 py-3">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={data[c]}
                              onCheckedChange={() => toggle(row.key, c)}
                              aria-label={`${row.label} via ${CHANNEL_LABEL[c]}`}
                            />
                          </div>
                        </td>
                      ))}
                      <td className="px-3 py-3">
                        <div className="flex justify-center">
                          <button
                            type="button"
                            aria-label={`Delete ${row.label} preference`}
                            onClick={() => removeCustom(row.key)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-text-subtle hover:bg-status-expired-bg hover:text-status-expired"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} loading={update.isPending}>
          Save preferences
        </Button>
      </div>

      <Modal
        open={addOpen}
        onOpenChange={(o) => {
          setAddOpen(o)
          if (!o) setNewLabel('')
        }}
        title="Add custom preference"
        description="Name the event you want to be notified about. You can toggle channels after creating it."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addCustom} disabled={!newLabel.trim()}>
              <Plus className="h-4 w-4" />
              Add preference
            </Button>
          </>
        }
      >
        <FormField label="Preference name" required hint="Short label — e.g. 'Late arrival', 'Fuel low', 'Lift maintenance due'.">
          {(f) => (
            <Input
              {...f}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Late arrival"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustom()
                }
              }}
            />
          )}
        </FormField>
      </Modal>
    </div>
  )
}

export function NotificationsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Notifications" description="Your notifications and delivery preferences." />
      <Tabs defaultValue="centre">
        <TabsList>
          <TabTrigger value="centre">Notification centre</TabTrigger>
          <TabTrigger value="prefs">Preferences</TabTrigger>
        </TabsList>
        <TabPanel value="centre">
          <NotificationCentre />
        </TabPanel>
        <TabPanel value="prefs">
          <PrefsMatrix />
        </TabPanel>
      </Tabs>
    </div>
  )
}
