import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
export type LoginValues = z.infer<typeof loginSchema>

export const forgotSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
})
export type ForgotValues = z.infer<typeof forgotSchema>

const passwordRules = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/[0-9]/, 'Include a number')

export const resetSchema = z
  .object({
    password: passwordRules,
    confirm: z.string().min(1, 'Confirm your password'),
  })
  .refine((v) => v.password === v.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })
export type ResetValues = z.infer<typeof resetSchema>
