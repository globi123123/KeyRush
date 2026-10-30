import { ChevronDown } from 'lucide-react'
import type { SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export interface SelectOption<T extends string> {
  value: T
  label: string
}

interface SelectProps<T extends string> extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
  label: string
  compact?: boolean
}

export function Select<T extends string>({ value, options, onChange, label, compact, className, ...rest }: SelectProps<T>) {
  return (
    <div className={cn('relative inline-flex', className)}>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className={cn(
          'w-full appearance-none rounded-lg border border-transparent bg-transparent pr-7 font-medium text-muted transition-colors hover:bg-card hover:text-fg focus-visible:border-line-strong focus-visible:text-fg',
          compact ? 'h-8 pl-2.5 text-[13px]' : 'h-10 border-line-strong bg-card pl-3 text-sm text-fg hover:bg-card-hover',
        )}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-card text-fg">
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-faint" aria-hidden />
    </div>
  )
}
