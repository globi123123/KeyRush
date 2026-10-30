import { Keyboard } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useApp } from '../../store/app'

export function Footer() {
  const { focusMode, setShortcutsOpen } = useApp()
  return (
    <footer
      className={cn(
        'mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-6 text-xs text-faint transition-opacity duration-300 sm:px-6',
        focusMode && 'pointer-events-none opacity-0',
      )}
    >
      <p>
        <span className="font-medium text-muted">KeyRush</span> v{__APP_VERSION__}
      </p>
      <button
        type="button"
        onClick={() => setShortcutsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors hover:text-fg"
      >
        <Keyboard className="size-3.5" aria-hidden />
        Shortcuts
      </button>
    </footer>
  )
}
