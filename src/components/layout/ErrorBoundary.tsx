import { AlertTriangle } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { removeKey } from '../../lib/storage'

interface State {
  error: Error | null
}

/** Catches render errors and offers a way out instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('KeyRush crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg p-6 text-fg">
        <div className="w-full max-w-md rounded-2xl border border-line-strong bg-bg-2 p-6 shadow-soft">
          <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-incorrect/10 text-incorrect">
            <AlertTriangle className="size-5" aria-hidden />
          </div>
          <h1 className="text-base font-semibold">Something went wrong</h1>
          <p className="mt-1.5 text-sm text-muted">
            KeyRush hit an unexpected error. Reloading usually fixes it. If it keeps happening, resetting the saved
            settings can help. Your statistics are kept.
          </p>
          <pre className="mt-4 max-h-28 overflow-auto rounded-lg bg-bg p-3 text-xs text-faint">{this.state.error.message}</pre>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="h-10 rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg hover:brightness-110"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={() => {
                removeKey('settings')
                window.location.reload()
              }}
              className="h-10 rounded-xl border border-line-strong bg-card px-4 text-sm font-medium hover:bg-card-hover"
            >
              Reset settings and reload
            </button>
          </div>
        </div>
      </div>
    )
  }
}
