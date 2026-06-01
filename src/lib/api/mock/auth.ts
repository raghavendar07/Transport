import type { Session } from '@/lib/auth'
import { ApiError } from '@/lib/api/errors'
import { USERS, TENANT_NAME_BY_ID } from './seed'
import { delay } from './latency'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

interface AttemptRecord {
  fails: number
  lockedUntil: number | null
}

const attempts = new Map<string, AttemptRecord>()

function record(email: string): AttemptRecord {
  let rec = attempts.get(email)
  if (!rec) {
    rec = { fails: 0, lockedUntil: null }
    attempts.set(email, rec)
  }
  return rec
}

export const mockAuth = {
  async login(email: string, password: string): Promise<Session> {
    const key = email.trim().toLowerCase()
    const rec = record(key)

    if (rec.lockedUntil && Date.now() < rec.lockedUntil) {
      const minutes = Math.ceil((rec.lockedUntil - Date.now()) / 60000)
      throw new ApiError('account_locked', `Account locked. Try again in ${minutes} min.`, {
        minutesRemaining: minutes,
      })
    }
    if (rec.lockedUntil && Date.now() >= rec.lockedUntil) {
      rec.fails = 0
      rec.lockedUntil = null
    }

    const user = USERS.find((u) => u.email.toLowerCase() === key)

    // First-time users have no password yet — route them to setup, don't count as a failure.
    if (user && user.password === null) {
      throw new ApiError('must_set_password', 'Set your password to continue.', { email: user.email })
    }

    if (!user || user.password !== password || user.status !== 'active') {
      rec.fails += 1
      if (rec.fails >= MAX_ATTEMPTS) {
        rec.lockedUntil = Date.now() + LOCKOUT_MS
        throw new ApiError('account_locked', 'Account locked after 5 failed attempts.', {
          minutesRemaining: 15,
        })
      }
      return delay(Promise.reject(new ApiError('invalid_credentials', 'Incorrect email or password.', {
        attemptsRemaining: MAX_ATTEMPTS - rec.fails,
      })))
    }

    rec.fails = 0
    rec.lockedUntil = null

    const session: Session = {
      userId: user.id,
      tenantId: user.tenantId,
      tenantName: TENANT_NAME_BY_ID[user.tenantId] ?? '—',
      name: user.name,
      email: user.email,
      role: user.role,
      mustSetPassword: false,
    }
    return delay(session)
  },

  async requestPasswordReset(email: string): Promise<void> {
    // Always resolves (don't leak which emails exist).
    await delay(undefined)
    void email
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await delay(undefined)
    void token
    void newPassword
  },
}
