import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-line-strong bg-bg-2 px-1.5 font-sans text-[11px] font-medium text-muted shadow-[inset_0_-1px_0_var(--kr-border-strong)]',
        className,
      )}
    >
      {children}
    </kbd>
  )
}
