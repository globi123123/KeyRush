import { useMemo, useState } from 'react'
import { useElementSize } from '../../hooks/useElementSize'
import { addDays, dateKey, formatShortDate } from '../../lib/date'
import { formatDuration } from '../../lib/format'
import type { ActivityDay } from '../../store/stats'

const CELL = 13
const GAP = 3
const LEVELS = ['var(--kr-grid)', 'color-mix(in srgb, var(--kr-accent) 28%, var(--kr-card))', 'color-mix(in srgb, var(--kr-accent) 50%, var(--kr-card))', 'color-mix(in srgb, var(--kr-accent) 74%, var(--kr-card))', 'var(--kr-accent)']
const WEEKDAYS = ['Mon', '', 'Wed', '', 'Fri', '', '']

function level(tests: number): number {
  if (tests <= 0) return 0
  if (tests <= 2) return 1
  if (tests <= 5) return 2
  if (tests <= 10) return 3
  return 4
}

interface Cell {
  key: string
  date: Date
  day: ActivityDay | undefined
  future: boolean
}

/** Calendar heatmap of daily typing activity, sized to fit its container. */
export function ActivityHeatmap({ activity }: { activity: Record<string, ActivityDay> }) {
  const [ref, size] = useElementSize<HTMLDivElement>()
  const [hover, setHover] = useState<Cell | null>(null)
  const labelWidth = 28
  const weeks = Math.max(8, Math.min(53, Math.floor((size.width - labelWidth + GAP) / (CELL + GAP)) || 20))

  const columns = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // Weeks start on Monday; the last column contains today.
    const weekday = (today.getDay() + 6) % 7
    const start = addDays(today, -weekday - (weeks - 1) * 7)
    const cols: Cell[][] = []
    for (let w = 0; w < weeks; w++) {
      const col: Cell[] = []
      for (let d = 0; d < 7; d++) {
        const date = addDays(start, w * 7 + d)
        const key = dateKey(date)
        col.push({ key, date, day: activity[key], future: date > today })
      }
      cols.push(col)
    }
    return cols
  }, [activity, weeks])

  const months = columns.map((col, i) => {
    const first = col[0].date
    const prev = columns[i - 1]?.[0].date
    return !prev || prev.getMonth() !== first.getMonth() ? first.toLocaleDateString('en-US', { month: 'short' }) : ''
  })

  return (
    <div ref={ref} className="relative w-full">
      <div className="flex gap-[3px] pl-7 text-[10px] text-faint" aria-hidden>
        {months.map((month, i) => (
          <span key={i} className="shrink-0 overflow-visible whitespace-nowrap" style={{ width: CELL }}>
            {month}
          </span>
        ))}
      </div>
      <div className="mt-1.5 flex">
        <div className="flex w-7 shrink-0 flex-col gap-[3px] text-[10px] text-faint" aria-hidden>
          {WEEKDAYS.map((day, i) => (
            <span key={i} className="leading-[13px]" style={{ height: CELL }}>
              {day}
            </span>
          ))}
        </div>
        <div className="flex gap-[3px]" aria-hidden>
          {columns.map((col, w) => (
            <div key={w} className="flex flex-col gap-[3px]">
              {col.map((cell) => {
                const tests = cell.day?.tests ?? 0
                return (
                  <span
                    key={cell.key}
                    onPointerEnter={() => setHover(cell.future ? null : cell)}
                    onPointerLeave={() => setHover(null)}
                    className="block rounded-[3px] transition-transform duration-100 hover:scale-110"
                    style={{
                      width: CELL,
                      height: CELL,
                      background: cell.future ? 'transparent' : LEVELS[level(tests)],
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <ul className="sr-only" aria-label={`Typing activity over the last ${weeks} weeks`}>
        {columns.flat().filter((cell) => cell.day && !cell.future).map((cell) => (
          <li key={cell.key}>{`${formatShortDate(cell.date)}: ${cell.day?.tests} tests`}</li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-faint">
        <span className="min-h-4 text-muted">
          {hover
            ? `${formatShortDate(hover.date)} · ${hover.day ? `${hover.day.tests} test${hover.day.tests === 1 ? '' : 's'}, ${formatDuration(hover.day.seconds)}` : 'No tests'}`
            : ''}
        </span>
        <span className="flex items-center gap-1" aria-hidden>
          Less
          {LEVELS.map((color) => (
            <span key={color} className="inline-block rounded-[3px]" style={{ width: 10, height: 10, background: color }} />
          ))}
          More
        </span>
      </div>
    </div>
  )
}
