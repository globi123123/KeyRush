import { useEffect, useMemo, useState } from 'react'
import type { TypingSession } from '../../engine/session'
import { cn } from '../../lib/cn'
import { formatClock } from '../../lib/format'

interface LiveStatsProps {
  session: TypingSession
  phase: 'ready' | 'running' | 'finished'
  timeLimit?: number
  showMetrics: boolean
  /** Changes on every keystroke so the numbers follow the typing. */
  version: number
  progressStyle: 'words' | 'percent' | 'clock'
}

function Metric({ label, value, title }: { label: string; value: string; title: string }) {
  return (
    <div className="flex flex-col items-end leading-none" title={title}>
      <span className="text-[10px] font-medium tracking-[0.08em] text-faint uppercase">{label}</span>
      <span className="mt-1 text-base font-semibold text-fg tabular-nums sm:text-lg">{value}</span>
    </div>
  )
}

export function LiveStats({ session, phase, timeLimit, showMetrics, version, progressStyle }: LiveStatsProps) {
  const [now, setNow] = useState(() => performance.now())

  useEffect(() => {
    if (phase !== 'running') return
    const id = window.setInterval(() => setNow(performance.now()), 200)
    return () => window.clearInterval(id)
  }, [phase])

  // Keystrokes also refresh the clock reference so metrics react instantly.
  useEffect(() => setNow(performance.now()), [version])

  const totalWords = useMemo(() => session.target.trim().split(/\s+/).length, [session.target])
  const stats = session.stats(now)
  const running = phase === 'running'

  let primary: string
  let progress: number
  if (timeLimit) {
    primary = formatClock(Math.max(0, timeLimit - stats.elapsed))
    progress = Math.min(1, stats.elapsed / timeLimit)
  } else if (progressStyle === 'clock') {
    primary = formatClock(stats.elapsed, true)
    progress = 0
  } else if (progressStyle === 'percent') {
    primary = `${Math.floor(stats.progress * 100)}%`
    progress = stats.progress
  } else {
    const typed = session.typed
    const current = Math.min(totalWords, (typed.match(/\s+/g)?.length ?? 0) + (/\S$/.test(typed) ? 1 : 0))
    primary = `${current}/${totalWords}`
    progress = stats.progress
  }

  return (
    <div className="mb-5">
      <div className="flex items-end justify-between gap-4">
        <div
          className={cn(
            'text-2xl leading-none font-semibold tabular-nums transition-colors duration-300 sm:text-[28px]',
            running ? 'text-accent' : 'text-faint',
          )}
          aria-label={timeLimit ? 'Time remaining' : 'Progress'}
        >
          {primary}
        </div>
        {showMetrics && (
          <div
            className={cn('flex items-end gap-5 transition-opacity duration-300 sm:gap-7', running ? 'opacity-100' : 'opacity-0')}
            aria-hidden={!running}
          >
            <Metric label="wpm" value={String(Math.round(stats.wpm))} title="Words per minute" />
            <Metric label="acc" value={`${Math.floor(stats.accuracy)}%`} title="Accuracy" />
            <div className="hidden sm:block">
              <Metric label="cpm" value={String(Math.round(stats.cpm))} title="Characters per minute" />
            </div>
            <Metric label="err" value={String(stats.errors)} title="Errors" />
          </div>
        )}
      </div>
      <div className="mt-3 h-[2px] overflow-hidden rounded-full bg-line" aria-hidden>
        <div
          className="h-full rounded-full bg-accent/70 transition-[width] duration-200 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  )
}
