import { useEffect, useRef, useState } from 'react'
import { MapPin, Map as MapIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface MapMarker {
  lat: number
  lng: number
  label?: string
}

interface MapViewProps {
  markers?: MapMarker[]
  /** Ordered points to draw a route polyline (e.g. live GPS path). */
  path?: { lat: number; lng: number }[]
  /** Picker mode: click to choose a location. */
  pickable?: boolean
  onPick?: (coords: { lat: number; lng: number }) => void
  center?: { lat: number; lng: number }
  zoom?: number
  className?: string
  height?: number
}

let mapsPromise: Promise<typeof google> | null = null

/** Lazy-load the Google Maps JS API once. Resolves null-safely when no key set. */
function loadMaps(key: string): Promise<typeof google> {
  if (mapsPromise) return mapsPromise
  mapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`
    script.async = true
    script.onload = () => resolve(window.google)
    script.onerror = reject
    document.head.appendChild(script)
  })
  return mapsPromise
}

/**
 * Thin Google Maps wrapper. With no VITE_GOOGLE_MAPS_KEY (mock mode) it renders an
 * accessible placeholder listing the points, so screens work without a key.
 */
export function MapView({
  markers = [],
  path = [],
  pickable,
  onPick,
  center,
  zoom = 12,
  className,
  height = 320,
}: MapViewProps) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY
  const ref = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!key || !ref.current) return
    let map: google.maps.Map | undefined
    loadMaps(key)
      .then((g) => {
        if (!ref.current) return
        const fallbackCenter = center ?? markers[0] ?? path[0] ?? { lat: 51.5074, lng: -0.1278 }
        map = new g.maps.Map(ref.current, { center: fallbackCenter, zoom, mapId: 'transport' })
        markers.forEach((m) => new g.maps.Marker({ position: m, map, title: m.label }))
        if (path.length > 1) {
          new g.maps.Polyline({ path, map, strokeColor: '#1B6FC4', strokeWeight: 4 })
        }
        if (pickable) {
          map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) onPick?.({ lat: e.latLng.lat(), lng: e.latLng.lng() })
          })
        }
      })
      .catch(() => setFailed(true))
    return () => {
      map = undefined
    }
  }, [key, markers, path, pickable, onPick, center, zoom])

  if (!key || failed) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-hover text-center',
          className,
        )}
        style={{ height }}
        role="img"
        aria-label="Map placeholder"
      >
        <MapIcon className="h-7 w-7 text-text-subtle" aria-hidden />
        <p className="text-sm text-text-muted">
          {key ? 'Map failed to load' : 'Map preview (no API key in mock mode)'}
        </p>
        {markers.length > 0 && (
          <ul className="mt-1 space-y-0.5 text-xs text-text-subtle">
            {markers.slice(0, 5).map((m, i) => (
              <li key={i} className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" aria-hidden />
                {m.label ?? `${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}`}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return <div ref={ref} className={cn('rounded-lg border border-border', className)} style={{ height }} />
}
