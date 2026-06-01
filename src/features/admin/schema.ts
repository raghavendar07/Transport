import { z } from 'zod'

export const userSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  role: z.enum(['tenant_admin', 'dispatcher'], { message: 'Select a role' }),
  status: z.enum(['active', 'inactive']).default('active'),
})
export type UserValues = z.infer<typeof userSchema>

export const tenantSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  code: z.string().min(2, 'Code is required').max(10, 'Max 10 characters'),
  country: z.string().min(2, 'Country is required'),
  timezone: z.string().min(2, 'Timezone is required'),
  defaultLanguage: z.string().min(2, 'Language is required'),
  status: z.enum(['active', 'inactive']).default('active'),
})
export type TenantValues = z.infer<typeof tenantSchema>

export const settingsGeneralSchema = z.object({
  timezone: z.string().min(2, 'Timezone is required'),
  workingDays: z.array(z.string()).min(1, 'Select at least one working day'),
  amRouteTime: z.string().min(1, 'AM time is required'),
  pmRouteTime: z.string().min(1, 'PM time is required'),
})
export type SettingsGeneralValues = z.infer<typeof settingsGeneralSchema>
