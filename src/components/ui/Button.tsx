import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-fg hover:brightness-110 active:brightness-95 shadow-soft',
  secondary: 'border border-line-strong bg-card text-fg hover:bg-card-hover hover:border-faint/60',
  ghost: 'text-muted hover:bg-card hover:text-fg',
  danger:
    'border border-incorrect/40 bg-incorrect/10 text-incorrect hover:bg-incorrect/15 hover:border-incorrect/60',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-[13px]',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center font-medium whitespace-nowrap transition-[background-color,border-color,color,filter,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
})

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  active?: boolean
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, active, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-150',
        active ? 'bg-card text-fg' : 'text-muted hover:bg-card hover:text-fg',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
})
