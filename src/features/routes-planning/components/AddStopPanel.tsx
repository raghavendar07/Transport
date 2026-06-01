import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button, FormField, Select, Input, RadioGroup } from '@/components/ui'
import { SearchInput } from '@/components/domain'
import type { Client, RouteStop, StopType } from '@/lib/api/types'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  clients: Client[]
  onAdd: (stop: Omit<RouteStop, 'id' | 'order' | 'status'>) => void
}

/** Add a stop: find client by UCI/name, pick address, type and planned time. */
export function AddStopPanel({ open, onOpenChange, clients, onAdd }: Props) {
  const [search, setSearch] = useState('')
  const [clientId, setClientId] = useState('')
  const [addressId, setAddressId] = useState('')
  const [type, setType] = useState<StopType>('pickup')
  const [time, setTime] = useState('08:00')

  const filtered = clients.filter(
    (c) => c.uci.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase()),
  )
  const client = clients.find((c) => c.id === clientId)

  function reset() {
    setSearch('')
    setClientId('')
    setAddressId('')
    setType('pickup')
    setTime('08:00')
  }

  function submit() {
    if (!client) return
    const addr = client.addresses.find((a) => a.id === addressId) ?? client.addresses[0]
    onAdd({
      clientId: client.id,
      clientUci: client.uci,
      clientName: client.name,
      addressId: addr.id,
      type,
      plannedTime: time,
    })
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
      title="Add stop"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!clientId}>
            Add stop
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Find client (UCI or name)">
          {() => <SearchInput value={search} onChange={setSearch} placeholder="UCI-00012 or Sunrise…" />}
        </FormField>
        <FormField label="Client" required>
          {(f) => (
            <Select
              {...f}
              value={clientId}
              onValueChange={(v) => {
                setClientId(v)
                const c = clients.find((x) => x.id === v)
                setAddressId(c?.addresses[0]?.id ?? '')
              }}
              options={filtered.map((c) => ({ value: c.id, label: `${c.uci} · ${c.name}` }))}
              placeholder="Select client"
            />
          )}
        </FormField>
        {client && (
          <FormField label="Address" required>
            {(f) => (
              <Select
                {...f}
                value={addressId}
                onValueChange={setAddressId}
                options={client.addresses.map((a) => ({ value: a.id, label: `${a.label} — ${a.line1}, ${a.city}` }))}
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
                { value: 'drop', label: 'Drop' },
              ]}
            />
          )}
        </FormField>
        <FormField label="Planned time" required>
          {(f) => <Input type="time" {...f} value={time} onChange={(e) => setTime(e.target.value)} />}
        </FormField>
      </div>
    </Modal>
  )
}
