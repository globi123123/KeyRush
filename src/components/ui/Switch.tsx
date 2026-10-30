import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  id?: string
  disabled?: boolean
}

export function Switch({ checked, onChange, label, id, disabled }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border p-0.5 transition-colors duration-200 disabled:opacity-45',
        checked ? 'border-accent/60 bg-accent/90' : 'border-line-strong bg-bg-2',
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 36 }}
        className={cn(
          'block size-[18px] rounded-full shadow-sm',
          checked ? 'ml-auto bg-accent-fg' : 'bg-muted',
        )}
      />
    </button>
  )
}
