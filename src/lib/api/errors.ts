/** Typed API errors so screens can branch on cause (locked account, bad creds, etc.). */
export type ApiErrorCode =
  | 'invalid_credentials'
  | 'account_locked'
  | 'must_set_password'
  | 'not_found'
  | 'forbidden'
  | 'validation'
  | 'unknown'

export class ApiError extends Error {
  code: ApiErrorCode
  meta?: Record<string, unknown>
  constructor(code: ApiErrorCode, message: string, meta?: Record<string, unknown>) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.meta = meta
  }
}
