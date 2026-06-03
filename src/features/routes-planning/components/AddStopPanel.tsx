import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button, FormField, Combobox, Input, RadioGroup } from '@/components/ui'
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

/** Add or edit a stop: find client, pick address, type and planned time. */
export function AddStopPanel({ open, onOpenChange, clients, onAdd, editing, onUpdate }: Props) {
  const [clientId, setClientId] = useState('')
  const [addressId, setAddressId] = useState('')
  const [type, setType] = useState<StopType>('pickup')
  const [time, setTime] = useState('08:00')

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

  function reset() {
    setClientId('')
    setAddressId('')
    setType('pickup')
    setTime('08:00')
  }

  function submit() {
    if (!client) return
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
          <Button onClick={submit} disabled={!clientId}>
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
                const c = clients.find((x) => x.id === v)
                setAddressId(c?.addresses[0]?.id ?? '')
              }}
              options={clients.map((c) => ({ value: c.id, label: `${c.uci} · ${c.name}` }))}
              placeholder="Select passenger"
              searchPlaceholder="UCI-000012 or John…"
            />
          )}
        </FormField>
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
