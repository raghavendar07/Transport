import { expiryStatus } from '@/lib/format'
import type { RequiredDocument } from '@/lib/api/types'

/** Required document types per entity (USA / FMCSA commercial passenger transport). */
export const DRIVER_DOCUMENT_TYPES = [
  "Commercial Driver's License (CDL)",
  'DOT Medical Examiner Certificate',
  'Motor Vehicle Record (MVR)',
  'Defensive Driving Certificate',
] as const

export const VEHICLE_DOCUMENT_TYPES = [
  'Vehicle Registration',
  'Certificate of Insurance (COI)',
  'DOT Annual Inspection',
  'Emissions / Smog Certificate',
] as const

export type DocStatus = 'missing' | 'active' | 'expiring' | 'expired'

/** Derive an upload/expiry status for a single required document. */
export function documentStatus(doc: RequiredDocument): DocStatus {
  if (!doc.fileName) return 'missing'
  return expiryStatus(doc.expiryDate) ?? 'active'
}

/** Build the empty document rows for a given set of required types. */
export function emptyDocuments(types: readonly string[]): RequiredDocument[] {
  return types.map((type) => ({ type, issueDate: '', expiryDate: '', fileName: null, fileSize: null }))
}

/**
 * Merge any existing documents onto the canonical required-type list so the form
 * always renders one row per required type, prefilled where data exists.
 */
export function mergeDocuments(types: readonly string[], existing: RequiredDocument[] = []): RequiredDocument[] {
  return types.map(
    (type) =>
      existing.find((d) => d.type === type) ?? { type, issueDate: '', expiryDate: '', fileName: null, fileSize: null },
  )
}
