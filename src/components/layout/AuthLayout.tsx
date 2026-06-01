import { type ReactNode } from 'react'

/** Centered shell for unauthenticated screens (login, reset, first-time setup). No app chrome. */
export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-brand text-lg font-bold text-brand-fg">
            T
          </div>
          <h1 className="text-xl font-semibold text-text">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-card sm:p-8">{children}</div>
        <p className="mt-6 text-center text-xs text-text-subtle">
          Transport Compliance Platform · Secure portal
        </p>
      </div>
    </div>
  )
}
