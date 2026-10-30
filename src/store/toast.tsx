import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, Trophy, X } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

export type ToastTone = 'info' | 'success' | 'error' | 'record'

interface Toast {
  id: number
  message: string
  description?: string
  tone: ToastTone
}

interface ToastOptions {
  description?: string
  tone?: ToastTone
  duration?: number
}

type ToastFn = (message: string, options?: ToastOptions) => void

const ToastContext = createContext<ToastFn | null>(null)

const ICONS = {
  info: Info,
  success: CheckCircle2,
  error: AlertTriangle,
  record: Trophy,
}

const ICON_COLORS: Record<ToastTone, string> = {
  info: 'text-muted',
  success: 'text-correct',
  error: 'text-incorrect',
  record: 'text-accent',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback<ToastFn>(
    (message, options = {}) => {
      const id = nextId.current++
      const entry: Toast = { id, message, description: options.description, tone: options.tone ?? 'info' }
      setToasts((list) => [...list.filter((t) => t.message !== message), entry].slice(-4))
      window.setTimeout(() => dismiss(id), options.duration ?? 3200)
    },
    [dismiss],
  )

  const value = useMemo(() => toast, [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6"
        role="region"
        aria-label="Notifications"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const Icon = ICONS[t.tone]
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line-strong bg-card px-4 py-3 shadow-soft"
                role={t.tone === 'error' ? 'alert' : 'status'}
              >
                <Icon className={`mt-0.5 size-4 shrink-0 ${ICON_COLORS[t.tone]}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-fg">{t.message}</p>
                  {t.description && <p className="mt-0.5 text-xs text-muted">{t.description}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="-mr-1 rounded-md p-1 text-faint transition-colors hover:text-fg"
                  aria-label="Dismiss notification"
                >
                  <X className="size-3.5" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
