import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import type { RouteStop } from '@/lib/api/types'

function StopRow({ stop, index, onRemove }: { stop: RouteStop; index: number; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id })
  const cancelled = stop.status === 'cancelled'
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-3 rounded-md border border-border bg-card p-3',
        isDragging && 'shadow-pop',
        cancelled && 'opacity-50',
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-text-subtle hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        aria-label={`Reorder stop ${index + 1}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" aria-hidden />
      </button>
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface-hover text-xs font-medium text-text-muted">
        {index + 1}
      </span>
      <div className="flex-1">
        <p className={cn('text-sm font-medium text-text', cancelled && 'line-through')}>{stop.clientName}</p>
        <p className="text-xs text-text-subtle">
          {stop.clientUci} · {stop.plannedTime}
        </p>
      </div>
      <Badge tone={stop.type === 'pickup' ? 'info' : 'neutral'} icon={stop.type === 'pickup' ? ArrowUpFromLine : ArrowDownToLine}>
        {stop.type}
      </Badge>
      {!cancelled && (
        <button
          type="button"
          onClick={() => onRemove(stop.id)}
          aria-label={`Remove ${stop.clientName}`}
          className="rounded p-1 text-status-expired hover:bg-status-expired-bg"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      )}
    </li>
  )
}

/** Drag-and-drop ordered stop list. Keyboard-accessible via dnd-kit sensors. */
export function SortableStops({
  stops,
  onChange,
  onRemove,
}: {
  stops: RouteStop[]
  onChange: (stops: RouteStop[]) => void
  onRemove: (id: string) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (over && active.id !== over.id) {
      const oldIndex = stops.findIndex((s) => s.id === active.id)
      const newIndex = stops.findIndex((s) => s.id === over.id)
      onChange(arrayMove(stops, oldIndex, newIndex).map((s, i) => ({ ...s, order: i })))
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={stops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {stops.map((stop, i) => (
            <StopRow key={stop.id} stop={stop} index={i} onRemove={onRemove} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
