import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react'
import { cn } from '@/lib/cn'

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: number
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (t: Omit<ToastItem, 'id'>) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const VARIANT_META: Record<ToastVariant, { icon: typeof Info; cls: string }> = {
  success: { icon: CheckCircle2, cls: 'text-status-active' },
  error: { icon: XCircle, cls: 'text-status-expired' },
  warning: { icon: AlertTriangle, cls: 'text-status-warn' },
  info: { icon: Info, cls: 'text-status-info' },
}

let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((t: Omit<ToastItem, 'id'>) => {
    counter += 1
    setItems((prev) => [...prev, { ...t, id: counter }])
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, description) => toast({ title, description, variant: 'success' }),
      error: (title, description) => toast({ title, description, variant: 'error' }),
    }),
    [toast],
  )

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right" duration={5000}>
        {children}
        {items.map((item) => {
          const { icon: Icon, cls } = VARIANT_META[item.variant]
          return (
            <ToastPrimitive.Root
              key={item.id}
              onOpenChange={(open) => !open && remove(item.id)}
              className={cn(
                'flex items-start gap-3 rounded-md border border-border bg-card p-4 shadow-pop',
                'data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out',
              )}
            >
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', cls)} aria-hidden />
              <div className="flex-1">
                <ToastPrimitive.Title className="text-sm font-semibold text-text">
                  {item.title}
                </ToastPrimitive.Title>
                {item.description && (
                  <ToastPrimitive.Description className="mt-0.5 text-sm text-text-muted">
                    {item.description}
                  </ToastPrimitive.Description>
                )}
              </div>
              <ToastPrimitive.Close
                className="text-text-subtle hover:text-text"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" aria-hidden />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          )
        })}
        <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-50 flex w-96 max-w-[100vw] flex-col gap-2 p-6" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}
