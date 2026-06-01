import { useEffect, useState } from 'react'
import { Bell, BellOff, Check } from 'lucide-react'
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
  useToast,
} from '@/components/ui'
import { formatDateTime } from '@/lib/format'
import { NOTIFICATION_EVENTS, type NotificationChannel, type NotificationPreferences } from '@/lib/api/types'
import { cn } from '@/lib/cn'
import { useNotifications, useNotificationMutations, usePrefs, useUpdatePrefs } from '../hooks'

const EVENT_LABEL: Record<string, string> = {
  licence_expiring: 'Licence expiring',
  document_expiring: 'Document expiring',
  checklist_failure: 'Checklist failure',
  route_published: 'Route published',
  driver_substituted: 'Driver substituted',
}
const CHANNELS: NotificationChannel[] = ['email', 'push', 'in_app']
const CHANNEL_LABEL: Record<NotificationChannel, string> = { email: 'Email', push: 'Push', in_app: 'In-app' }

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

  function toggle(event: string, channel: NotificationChannel) {
    setPrefs((prev) => {
      if (!prev) return prev
      const ev = prev[event as keyof NotificationPreferences]
      return { ...prev, [event]: { ...ev, [channel]: !ev[channel] } }
    })
  }

  async function save() {
    await update.mutateAsync(prefs!)
    toast.success('Preferences saved')
  }

  return (
    <Card>
      <CardBody>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-muted">
              <th className="py-2 font-medium">Event</th>
              {CHANNELS.map((c) => (
                <th key={c} className="py-2 text-center font-medium">
                  {CHANNEL_LABEL[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NOTIFICATION_EVENTS.map((ev) => (
              <tr key={ev} className="border-b border-border last:border-0">
                <td className="py-3 text-text">{EVENT_LABEL[ev]}</td>
                {CHANNELS.map((c) => (
                  <td key={c} className="py-3 text-center">
                    <div className="flex justify-center">
                      <Checkbox
                        checked={prefs[ev][c]}
                        onCheckedChange={() => toggle(ev, c)}
                        aria-label={`${EVENT_LABEL[ev]} via ${CHANNEL_LABEL[c]}`}
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex justify-end">
          <Button onClick={save} loading={update.isPending}>
            Save preferences
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

export function NotificationsPage() {
  return (
    <div className="mx-auto max-w-3xl">
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
