import { z } from 'zod'

const phone = z.string().min(6, 'Enter a valid phone number')

export const requiredDocumentSchema = z.object({
  type: z.string(),
  issueDate: z.string().default(''),
  expiryDate: z.string().default(''),
  fileName: z.string().nullable().default(null),
  fileSize: z.number().nullable().default(null),
})

export const driverSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  phone,
  licenceNumber: z.string().min(4, 'Licence number is required'),
  licenceExpiry: z.string().min(1, 'Licence expiry is required'),
  address: z.string().min(3, 'Address is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  photoUrl: z.string().nullable().default(null),
  status: z.enum(['active', 'inactive']).default('active'),
  documents: z.array(requiredDocumentSchema).default([]),
})
export type DriverValues = z.infer<typeof driverSchema>

export const vehicleSchema = z.object({
  registration: z.string().min(2, 'Registration is required'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.coerce.number().int().min(1990, 'Enter a valid year').max(2100),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1'),
  wheelchairSpaces: z.coerce.number().int().min(0).max(8).default(0),
  size: z.enum(['small', 'medium', 'large']).default('medium'),
  fuelType: z.enum(['diesel', 'petrol', 'electric', 'hybrid']),
  insuranceExpiry: z.string().min(1, 'Insurance expiry is required'),
  registrationExpiry: z.string().min(1, 'Registration expiry is required'),
  odometer: z.coerce.number().int().min(0, 'Odometer must be positive'),
  status: z.enum(['active', 'inactive']).default('active'),
  documents: z.array(requiredDocumentSchema).default([]),
})
export type VehicleValues = z.infer<typeof vehicleSchema>

export const clientAddressSchema = z.object({
  id: z.string().default(''),
  label: z.string().default(''),
  role: z.enum(['pickup', 'dropoff']),
  line1: z.string().min(2, 'Address line is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postcode: z.string().min(2, 'Postal code is required'),
  lat: z.number().nullable().default(null),
  lng: z.number().nullable().default(null),
})

export const clientSchema = z.object({
  /**
   * Manually entered. Must match the UCI printed on the authorization document —
   * cannot be auto-assigned because the agency-issued UCI is the legal identifier.
   */
  uci: z
    .string()
    .min(3, 'UCI is required (must match the authorization document)')
    .regex(/^[A-Z0-9-]+$/i, 'UCI may only contain letters, numbers and hyphens'),
  name: z.string().min(2, 'Name is required'),
  contactName: z.string().min(2, 'Contact name is required'),
  contactPhone: phone,
  addresses: z.array(clientAddressSchema).length(2, 'Pickup and drop-off addresses are required'),
  authorizationNumber: z.string().min(2, 'Authorization number is required'),
  authorizationStartDate: z.string().min(1, 'Authorization start date is required'),
  authorizationExpiry: z.string().min(1, 'Authorization expiry is required'),
  emergencyContact: z.string().min(2, 'Emergency contact is required'),
  notes: z.string().default(''),
  status: z.enum(['active', 'inactive']).default('active'),
})
export type ClientValues = z.infer<typeof clientSchema>
