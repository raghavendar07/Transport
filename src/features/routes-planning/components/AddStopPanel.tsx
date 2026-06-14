import { useEffect, useState } from 'react'
import { AlertTriangle, ShieldCheck } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button, Checkbox, FormField, Combobox, Input, RadioGroup } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { expiryStatus, formatDate } from '@/lib/format'
import type { Client, RouteStop, StopType } from '@/lib/api/types'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  clients: Client[]
  /** Add a brand-new stop. */
  onAdd?: (stop: Omit<RouteStop, 'id' | 'order' | 'status'>) => void
  /** Edit an existing stop in place. When set, the panel renders in edit mode. */
  editing?: RouteStop | null
  onUpdate?: (id: string, patch: Omit<RouteStop, 'id' | 'order' | 'status'>) => void
}

/** Roles allowed to override an expired client authorization at the add-stop step. */
const APPROVAL_ROLES = ['admin', 'dispatcher'] as const

/** Add or edit a stop: find client, pick address, type and planned time. */
export function AddStopPanel({ open, onOpenChange, clients, onAdd, editing, onUpdate }: Props) {
  const { session } = useAuth()
  const [clientId, setClientId] = useState('')
  const [addressId, setAddressId] = useState('')
  const [type, setType] = useState<StopType>('pickup')
  const [time, setTime] = useState('08:00')
  const [overrideApproved, setOverrideApproved] = useState(false)

  // Hydrate the form when editing.
  useEffect(() => {
    if (open && editing) {
      setClientId(editing.clientId)
      setAddressId(editing.addressId)
      setType(editing.type)
      setTime(editing.plannedTime)
    } else if (open && !editing) {
      reset()
    }
  }, [open, editing])

  const client = clients.find((c) => c.id === clientId)
  const authStatus = client?.authorizationExpiry ? expiryStatus(client.authorizationExpiry) : null
  const authExpired = authStatus === 'expired'
  const authExpiring = authStatus === 'expiring'
  const canApprove = !!session && (APPROVAL_ROLES as readonly string[]).includes(session.role)

  function reset() {
    setClientId('')
    setAddressId('')
    setType('pickup')
    setTime('08:00')
    setOverrideApproved(false)
  }

  function submit() {
    if (!client) return
    if (authExpired && !overrideApproved) return
    const addr = client.addresses.find((a) => a.id === addressId) ?? client.addresses[0]
    const payload = {
      clientId: client.id,
      clientUci: client.uci,
      clientName: client.name,
      addressId: addr.id,
      type,
      plannedTime: time,
    }
    if (editing && onUpdate) {
      onUpdate(editing.id, payload)
    } else if (onAdd) {
      onAdd(payload)
    }
    reset()
    onOpenChange(false)
  }

  const blocked = authExpired && !overrideApproved

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
      title={editing ? 'Edit passenger stop' : 'Add passenger stop'}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!clientId || blocked}>
            {editing ? 'Save changes' : 'Add stop'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Passenger (search by UCI or name)" required>
          {(f) => (
            <Combobox
              {...f}
              value={clientId}
              onValueChange={(v) => {
                setClientId(v)
                setOverrideApproved(false)
                const c = clients.find((x) => x.id === v)
                setAddressId(c?.addresses[0]?.id ?? '')
              }}
              options={clients.map((c) => ({ value: c.id, label: `${c.uci} · ${c.name}` }))}
              placeholder="Select passenger"
              searchPlaceholder="UCI-000012 or John…"
            />
          )}
        </FormField>

        {/* Authorization status indicator */}
        {client && client.authorizationExpiry && (
          <AuthorizationNotice
            client={client}
            expired={authExpired}
            expiring={authExpiring}
            canApprove={canApprove}
            overrideApproved={overrideApproved}
            onOverrideChange={setOverrideApproved}
          />
        )}

        {client && (
          <FormField label="Address" required>
            {(f) => (
              <Combobox
                {...f}
                value={addressId}
                onValueChange={setAddressId}
                options={client.addresses.map((a) => ({
                  value: a.id,
                  label: `${a.role === 'pickup' ? 'Pickup' : 'Drop-off'} — ${a.line1}, ${a.city}`,
                }))}
              />
            )}
          </FormField>
        )}
        <FormField label="Type" required>
          {() => (
            <RadioGroup
              value={type}
              onValueChange={(v) => setType(v as StopType)}
              options={[
                { value: 'pickup', label: 'Pickup' },
                { value: 'drop', label: 'Drop-off' },
              ]}
            />
          )}
        </FormField>
        <FormField label="Scheduled time" required>
          {(f) => <Input type="time" {...f} value={time} onChange={(e) => setTime(e.target.value)} />}
        </FormField>
      </div>
    </Modal>
  )
}

interface NoticeProps {
  client: Client
  expired: boolean
  expiring: boolean
  canApprove: boolean
  overrideApproved: boolean
  onOverrideChange: (v: boolean) => void
}

function AuthorizationNotice({
  client,
  expired,
  expiring,
  canApprove,
  overrideApproved,
  onOverrideChange,
}: NoticeProps) {
  if (expired) {
    return (
      <div
        className="rounded-[8px] border border-status-expired-bg bg-status-expired-bg/60 p-3"
        role="alert"
      >
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-expired" aria-hidden />
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-sm font-semibold text-status-expired">
              Authorization expired
            </p>
            <p className="text-xs text-status-expired/90">
              {client.name}'s authorization{' '}
              <span className="font-mono">{client.authorizationNumber}</span> expired on{' '}
              <strong>{formatDate(client.authorizationExpiry)}</strong>. Adding this passenger
              requires Admin or Manager approval.
            </p>
            {canApprove ? (
              <label className="mt-2 flex items-start gap-2 rounded-[6px] border border-status-expired/30 bg-card px-3 py-2">
                <Checkbox
                  id="auth-override"
                  checked={overrideApproved}
                  onCheckedChange={(v) => onOverrideChange(v === true)}
                  aria-label="Approve override"
                />
                <span className="text-xs text-text">
                  I approve adding this passenger despite the expired authorization. The action
                  will be logged for audit.
                </span>
              </label>
            ) : (
              <p className="mt-1 text-xs text-status-expired/90">
                Sign in as Admin or Dispatcher to authorize this exception.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (expiring) {
    return (
      <div className="rounded-[8px] border border-status-warn-bg bg-status-warn-bg/60 p-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warn" aria-hidden />
          <div className="text-xs text-status-warn">
            Authorization <span className="font-mono">{client.authorizationNumber}</span>{' '}
            expires on <strong>{formatDate(client.authorizationExpiry)}</strong>. Renew before
            the next route.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs text-text-muted">
      <ShieldCheck className="h-3.5 w-3.5 text-status-active" aria-hidden />
      Authorization <span className="font-mono">{client.authorizationNumber}</span> valid through{' '}
      {formatDate(client.authorizationExpiry)}.
    </div>
  )
}
