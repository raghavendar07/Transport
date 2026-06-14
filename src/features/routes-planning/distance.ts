import type { Client, RouteStop } from '@/lib/api/types'

/** Haversine distance between two lat/lng points in kilometres. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

interface Point {
  lat: number
  lng: number
}

/** Resolve a stop's coordinates via clients lookup. Returns null when missing. */
export function stopPoint(stop: RouteStop, clients: Client[]): Point | null {
  const c = clients.find((x) => x.id === stop.clientId)
  const a = c?.addresses.find((x) => x.id === stop.addressId)
  if (!a || a.lat == null || a.lng == null) return null
  return { lat: a.lat, lng: a.lng }
}

/** Sum of leg distances along the stop sequence. Missing coords skip those legs. */
export function totalRouteDistanceKm(stops: RouteStop[], clients: Client[]): number {
  let total = 0
  let prev: Point | null = null
  for (const s of stops) {
    const p = stopPoint(s, clients)
    if (p && prev) total += haversineKm(prev, p)
    if (p) prev = p
  }
  return Math.round(total * 10) / 10
}

/** km → miles conversion factor. */
export const KM_TO_MILES = 0.621371

/** Convenience: route distance in miles (UI default). */
export function totalRouteDistanceMiles(stops: RouteStop[], clients: Client[]): number {
  return Math.round(totalRouteDistanceKm(stops, clients) * KM_TO_MILES * 10) / 10
}

/** Centroid of resolved stop coordinates. */
function centroid(points: Point[]): Point | null {
  if (points.length === 0) return null
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 },
  )
  return { lat: sum.lat / points.length, lng: sum.lng / points.length }
}

/**
 * Returns the IDs of stops whose coordinates are further than `maxKm` from the
 * route's centroid — flags passengers added outside the active service area.
 */
export function outOfRangeStopIds(
  stops: RouteStop[],
  clients: Client[],
  maxKm = 50,
): string[] {
  const resolved = stops.map((s) => ({ stop: s, point: stopPoint(s, clients) }))
  const center = centroid(resolved.flatMap((r) => (r.point ? [r.point] : [])))
  if (!center) return []
  return resolved
    .filter((r) => r.point && haversineKm(center, r.point) > maxKm)
    .map((r) => r.stop.id)
}
