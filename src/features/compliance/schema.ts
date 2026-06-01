import { z } from 'zod'

export const documentSchema = z.object({
  scope: z.enum(['business', 'driver', 'vehicle']),
  scopeRefId: z.string().nullable().default(null),
  title: z.string().min(2, 'Title is required'),
  type: z.string().min(2, 'Type is required'),
  issueDate: z.string().min(1, 'Issue date is required'),
  expiryDate: z.string().nullable().default(null),
  notes: z.string().default(''),
})
export type DocumentValues = z.infer<typeof documentSchema>

export const changePasswordSchema = z
  .object({
    current: z.string().min(1, 'Current password is required'),
    next: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirm: z.string().min(1, 'Confirm your password'),
  })
  .refine((v) => v.next === v.confirm, { message: 'Passwords do not match', path: ['confirm'] })
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>
