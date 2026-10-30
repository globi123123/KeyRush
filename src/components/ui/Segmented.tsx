import { motion } from 'framer-motion'
import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface SegmentOption<T extends string | number> {
  value: T
  label: ReactNode
  icon?: ReactNode
  title?: string
}

interface SegmentedProps<T extends string | number> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  /** Shared layout id for the animated indicator; must be unique per control. */
  id: string
  size?: 'sm' | 'md'
  className?: string
}

/** A radio group rendered as pills, with an animated active indicator and arrow key support. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  id,
  size = 'sm',
  className,
}: SegmentedProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  )

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
    let next: number | null = null
    if (event.key in keys) next = (activeIndex + keys[event.key] + options.length) % options.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = options.length - 1
    if (next === null) return
    event.preventDefault()
    onChange(options[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className={cn('flex items-center gap-0.5', className)}>
      {options.map((option, index) => {
        const active = option.value === value
        return (
          <button
            key={String(option.value)}
            ref={(el) => {
              refs.current[index] = el
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            title={option.title}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative inline-flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-colors duration-150',
              size === 'sm' ? 'h-8 px-2.5 text-[13px]' : 'h-9 px-3.5 text-sm',
              active ? 'text-fg' : 'text-muted hover:text-fg',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-lg border border-line-strong bg-card"
                transition={{ type: 'spring', stiffness: 520, damping: 40 }}
                aria-hidden
              />
            )}
            <span className={cn('relative z-10 inline-flex items-center gap-1.5', active && Boolean(option.icon) && '[&>svg]:text-accent')}>
              {option.icon}
              {option.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
