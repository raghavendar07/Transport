import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button, FormField, Select, Textarea, RadioGroup, useToast } from '@/components/ui'
import { useRouteMutations } from '../hooks'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  routeId: string
  currentDriverId: string
  inProgress: boolean
  driverOptions: { value: string; label: string }[]
}

/** Substitute the assigned driver, with a mandatory reason note. */
export function SubstituteDriverModal({ open, onOpenChange, routeId, currentDriverId, inProgress, driverOptions }: Props) {
  const toast = useToast()
  const { substitute } = useRouteMutations()
  const [driverId, setDriverId] = useState('')
  const [reason, setReason] = useState('')
  const [scope, setScope] = useState('next')

  async function submit() {
    await substitute.mutateAsync({ id: routeId, driverId, reason })
    toast.success('Driver substituted', inProgress && scope === 'next' ? 'Applied from the next stop onward.' : 'Applied to the whole route.')
    setDriverId('')
    setReason('')
    onOpenChange(false)
  }

  const options = driverOptions.filter((d) => d.value !== currentDriverId)

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Substitute driver"
      description="Reassign this route to a different driver."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} loading={substitute.isPending} disabled={!driverId || reason.trim().length < 3}>
            Substitute
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="New driver" required>
          {(f) => <Select {...f} value={driverId} onValueChange={setDriverId} options={options} placeholder="Select driver" />}
        </FormField>
        {inProgress && (
          <FormField label="Apply to" required>
            {() => (
              <RadioGroup
                value={scope}
                onValueChange={setScope}
                options={[
                  { value: 'next', label: 'From next stop', description: 'Route is in progress — keep completed stops with the original driver' },
                  { value: 'all', label: 'Entire route' },
                ]}
              />
            )}
          </FormField>
        )}
        <FormField label="Reason" required hint="Recorded in the audit log">
          {(f) => <Textarea {...f} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Original driver called in sick" />}
        </FormField>
      </div>
    </Modal>
  )
}
