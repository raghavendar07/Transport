import { useState, useEffect } from 'react'
import { Plus, Trash2, ArrowUp, ArrowDown, AlertTriangle, ClipboardCheck } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Input,
  Checkbox,
  Spinner,
  EmptyState,
  useToast,
} from '@/components/ui'
import type { ChecklistItem } from '@/lib/api/types'
import { checklistsApi } from '../hooks'

let tmp = 0
const tmpId = () => `tmp-${tmp++}`

/**
 * Safety checklist builder: define items, mark critical, reorder.
 * Reordering uses accessible up/down controls (keyboard-operable);
 * the drag-and-drop route builder in P7 uses dnd-kit.
 */
export function ChecklistBuilderPage() {
  const toast = useToast()
  const { data, isLoading } = checklistsApi.useList()
  const update = checklistsApi.useUpdate()
  const checklist = data?.items[0]

  const [items, setItems] = useState<ChecklistItem[]>([])
  const [name, setName] = useState('')

  useEffect(() => {
    if (checklist) {
      setItems(checklist.items)
      setName(checklist.name)
    }
  }, [checklist])

  function addItem() {
    setItems((prev) => [...prev, { id: tmpId(), label: '', critical: false, order: prev.length }])
  }
  function updateItem(id: string, patch: Partial<ChecklistItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }
  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }
  function move(index: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  async function save() {
    if (!checklist) return
    const ordered = items.map((it, i) => ({ ...it, order: i }))
    await update.mutateAsync({ id: checklist.id, data: { name, items: ordered } })
    toast.success('Checklist saved')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Safety Checklist Builder"
        description="Define the pre-trip safety checks drivers must complete. Mark critical items."
        actions={
          <Button onClick={save} loading={update.isPending} disabled={!checklist}>
            Save checklist
          </Button>
        }
      />
      {!checklist ? (
        <Card>
          <EmptyState icon={ClipboardCheck} title="No checklist yet" description="A default checklist will appear here." />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Checklist</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label htmlFor="cl-name" className="mb-1.5 block text-sm font-medium text-text">
                Checklist name
              </label>
              <Input id="cl-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <ul className="space-y-2">
              {items.map((item, i) => (
                <li key={item.id} className="flex items-center gap-3 rounded-md border border-border p-3">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label="Move up"
                      className="text-text-subtle hover:text-text disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === items.length - 1}
                      aria-label="Move down"
                      className="text-text-subtle hover:text-text disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                  <Input
                    value={item.label}
                    onChange={(e) => updateItem(item.id, { label: e.target.value })}
                    placeholder="Check item…"
                    aria-label={`Item ${i + 1} label`}
                    className="flex-1"
                  />
                  <label className="flex items-center gap-2 text-sm text-text-muted">
                    <Checkbox
                      checked={item.critical}
                      onCheckedChange={(c) => updateItem(item.id, { critical: c })}
                      aria-label="Critical"
                    />
                    <span className="inline-flex items-center gap-1">
                      {item.critical && <AlertTriangle className="h-3.5 w-3.5 text-status-warn" aria-hidden />}
                      Critical
                    </span>
                  </label>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove item ${i + 1}`}
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-status-expired" />
                  </Button>
                </li>
              ))}
            </ul>

            <Button type="button" variant="secondary" onClick={addItem}>
              <Plus className="h-4 w-4" />
              Add item
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
