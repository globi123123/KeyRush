import { CalendarDays, Code2, Feather, Flame, Quote, Timer, type LucideIcon } from 'lucide-react'
import type { ResultMode } from '../types'

export interface ModeInfo {
  id: ResultMode
  label: string
  description: string
  icon: LucideIcon
}

export const MODE_INFO: Record<ResultMode, ModeInfo> = {
  classic: { id: 'classic', label: 'Classic', description: 'Timed tests with passages or word sequences.', icon: Timer },
  zen: { id: 'zen', label: 'Zen', description: 'No timer and no pressure. Finish whenever you like.', icon: Feather },
  code: { id: 'code', label: 'Code', description: 'Real code snippets with syntax highlighting.', icon: Code2 },
  rush: { id: 'rush', label: 'Rush', description: 'Arcade mode. Type falling words before they land.', icon: Flame },
  quote: { id: 'quote', label: 'Quote', description: 'Longer quotations and passages by category.', icon: Quote },
  daily: { id: 'daily', label: 'Daily', description: 'One passage per day, the same for everyone.', icon: CalendarDays },
}

export const modeLabel = (mode: ResultMode) => MODE_INFO[mode]?.label ?? mode

