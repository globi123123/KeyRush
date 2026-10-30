import { cn } from '../../lib/cn'

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-label={label} className={cn('inline-block size-5 animate-spin rounded-full border-2 border-line-strong border-t-accent', className)} />
  )
}

/** Full area loading state used while lazy pages load. */
export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner />
    </div>
  )
}
