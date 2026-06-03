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
import { GripVertical, Pencil, Trash2, MapPin, ArrowUpFromLine, ArrowDownToLine } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { RouteStop } from '@/lib/api/types'

interface Props {
  stops: RouteStop[]
  onChange: (stops: RouteStop[]) => void
  onEdit: (stop: RouteStop) => void
  onRemove: (id: string) => void
}

/** Deterministic colourful gradient avatar per passenger name. */
const AVATAR_PALETTE = [
  'from-violet-500 to-purple-600',
  'from-sky-500 to-blue-600',
  'from-orange-500 to-amber-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-blue-700',
]

function colorFor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length]
}

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

function StopCard({
  stop,
  index,
  isLast,
  onEdit,
  onRemove,
}: {
  stop: RouteStop
  index: number
  isLast: boolean
  onEdit: (stop: RouteStop) => void
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id })
  const cancelled = stop.status === 'cancelled'
  const isPickup = stop.type === 'pickup'

  // Mock ETA jitter so the demo shows mixed "+2 min" / "On time" indicators.
  const etaOffset = (index * 7) % 5 - 1
  const etaLabel = etaOffset > 0 ? `+${etaOffset} min` : etaOffset < 0 ? `${etaOffset} min` : 'On time'
  const etaTone = etaOffset > 0 ? 'text-status-warn' : etaOffset < 0 ? 'text-status-active' : 'text-text-subtle'

  // Convert HH:mm → "HH:MM AM/PM" for display parity with the reference.
  const time12 = (() => {
    const [h, m] = stop.plannedTime.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hh = ((h + 11) % 12) + 1
    return `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
  })()

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="relative flex gap-4"
    >
      {/* Timeline column */}
      <div className="relative flex w-8 flex-col items-center">
        <span
          className={cn(
            'z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm',
            isPickup ? 'bg-brand' : 'bg-status-active',
          )}
        >
          {index + 1}
        </span>
        {!isLast && (
          <span className="absolute left-1/2 top-8 h-[calc(100%+0.5rem)] w-px -translate-x-1/2 bg-border" aria-hidden />
        )}
      </div>

      {/* Drag handle */}
      <button
        type="button"
        className="mt-2 self-start cursor-grab touch-none text-text-subtle hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        aria-label={`Reorder ${stop.clientName}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" aria-hidden />
      </button>

      {/* Card */}
      <div
        className={cn(
          'mb-3 flex-1 rounded-xl border border-border bg-card p-3.5 transition-shadow',
          isDragging && 'shadow-pop',
          cancelled && 'opacity-50',
        )}
      >
        <div className="flex items-start gap-3">
          {/* Coloured gradient avatar */}
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-sm font-semibold text-white',
              colorFor(stop.clientName),
            )}
            aria-hidden
          >
            {initials(stop.clientName)}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className={cn('truncate text-sm font-semibold text-text', cancelled && 'line-through')}>
                {stop.clientName}
              </h4>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                  isPickup ? 'bg-brand-100 text-brand-700' : 'bg-status-active-bg text-status-active',
                )}
              >
                {isPickup ? (
                  <ArrowUpFromLine className="h-3 w-3" aria-hidden />
                ) : (
                  <ArrowDownToLine className="h-3 w-3" aria-hidden />
                )}
                {isPickup ? 'Pickup' : 'Drop-off'}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
              <MapPin className="h-3.5 w-3.5 text-text-subtle" aria-hidden />
              <span className="font-medium text-text-muted">{isPickup ? 'Home Address' : 'Destination'}</span>
              <span className="text-text-subtle">·</span>
              <span>{stop.clientUci}</span>
            </p>
          </div>

          {/* Time + ETA + actions */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums text-text">{time12}</p>
              <p className={cn('text-xs', etaTone)}>{etaLabel}</p>
            </div>
            {!cancelled && (
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => onEdit(stop)}
                  aria-label={`Edit ${stop.clientName}`}
                  className="rounded p-1.5 text-text-subtle hover:bg-surface-hover hover:text-text"
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(stop.id)}
                  aria-label={`Remove ${stop.clientName}`}
                  className="rounded p-1.5 text-status-expired hover:bg-status-expired-bg"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}

/** Vertical timeline of passenger stops — coloured avatars, ETA indicator, drag/edit/delete actions. */
export function PassengerStopTimeline({ stops, onChange, onEdit, onRemove }: Props) {
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
        <ol className="space-y-0">
          {stops.map((stop, i) => (
            <StopCard
              key={stop.id}
              stop={stop}
              index={i}
              isLast={i === stops.length - 1}
              onEdit={onEdit}
              onRemove={onRemove}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  )
}
