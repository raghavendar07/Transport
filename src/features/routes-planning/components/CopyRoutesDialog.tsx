import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button, Input, FormField, Select, Checkbox, useToast } from '@/components/ui'
import { useRouteMutations } from '../hooks'
import { useFleetOptions } from '../useFleetOptions'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  defaultFrom: string
}

/** Duplicate a day's routes to a target date, optionally bulk-reassigning fleet. */
export function CopyRoutesDialog({ open, onOpenChange, defaultFrom }: Props) {
  const toast = useToast()
  const { copyDay } = useRouteMutations()
  const { driverOptions, vehicleOptions } = useFleetOptions()
  const [fromDate, setFromDate] = useState(defaultFrom)
  const [toDate, setToDate] = useState('')
  const [reassign, setReassign] = useState(false)
  const [driverId, setDriverId] = useState('')
  const [vehicleId, setVehicleId] = useState('')

  async function submit() {
    const count = await copyDay.mutateAsync({
      fromDate,
      toDate,
      reassign: reassign ? { driverId: driverId || undefined, vehicleId: vehicleId || undefined } : undefined,
    })
    toast.success('Routes copied', `${count} route${count === 1 ? '' : 's'} duplicated to ${toDate} as drafts.`)
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Copy routes to another day"
      description="Duplicates all routes from the source date as drafts."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} loading={copyDay.isPending} disabled={!toDate || toDate === fromDate}>
            Copy routes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="From date" required>
            {(f) => <Input type="date" {...f} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />}
          </FormField>
          <FormField label="To date" required>
            {(f) => <Input type="date" {...f} value={toDate} onChange={(e) => setToDate(e.target.value)} />}
          </FormField>
        </div>
        <label className="flex items-center gap-2 text-sm text-text">
          <Checkbox checked={reassign} onCheckedChange={setReassign} aria-label="Reassign fleet" />
          Bulk reassign driver / vehicle
        </label>
        {reassign && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="New driver">
              {(f) => <Select {...f} value={driverId} onValueChange={setDriverId} options={driverOptions} placeholder="Keep original" />}
            </FormField>
            <FormField label="New vehicle">
              {(f) => <Select {...f} value={vehicleId} onValueChange={setVehicleId} options={vehicleOptions} placeholder="Keep original" />}
            </FormField>
          </div>
        )}
      </div>
    </Modal>
  )
}
