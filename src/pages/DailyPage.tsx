import { CalendarCheck2, CheckCircle2, Clock3, Flame, Target, Trophy } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { TypingTest } from '../components/typing/TypingTest'
import type { TestDefinition } from '../components/typing/types'
import { getDailyPassage, passageCategoryLabel } from '../content'
import { cn } from '../lib/cn'
import { addDays, dateKey, formatLongDate, msUntilMidnight, parseDateKey } from '../lib/date'
import { useApp } from '../store/app'
import { computeStreak, DAILY_ACCURACY_TARGET, useStats } from '../store/stats'
import { useToast } from '../store/toast'
import type { TestResult } from '../types'

function useToday(): string {
  const [today, setToday] = useState(() => dateKey())
  useEffect(() => {
    // Switch to the next challenge at local midnight.
    const timer = window.setTimeout(() => setToday(dateKey()), msUntilMidnight() + 1000)
    return () => window.clearTimeout(timer)
  }, [today])
  return today
}

function useCountdown(): string {
  const [ms, setMs] = useState(() => msUntilMidnight())
  useEffect(() => {
    const id = window.setInterval(() => setMs(msUntilMidnight()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
}

function StatCard({ icon, label, value, sub }: { icon: ReactNode; label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-card/60 px-4 py-3.5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-faint">
        {icon}
        {label}
      </p>
      <p className="mt-1.5 text-xl font-semibold text-fg tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  )
}

export function DailyPage() {
  const today = useToday()
  const countdown = useCountdown()
  const { stats, recordDailyAttempt } = useStats()
  const { focusMode, setMode } = useApp()
  const navigate = useNavigate()
  const toast = useToast()
  const passage = useMemo(() => getDailyPassage(today), [today])
  const record = stats.daily[today]
  const streak = computeStreak(stats.daily, today)

  const definition = useMemo<TestDefinition>(
    () => ({
      mode: 'daily',
      configLabel: formatLongDate(parseDateKey(today)),
      recordKey: 'daily',
      fixedText: true,
      create: () => ({
        text: passage.text,
        id: passage.id,
        meta: { label: `${passageCategoryLabel(passage.category)} · Daily challenge` },
      }),
    }),
    [passage, today],
  )

  const onSaved = (result: TestResult) => {
    const newlyCompleted = recordDailyAttempt(today, passage.id, result)
    if (newlyCompleted) {
      toast('Daily challenge completed', {
        tone: 'success',
        description: 'Come back tomorrow to keep your streak going.',
      })
    } else if (result.accuracy < DAILY_ACCURACY_TARGET && !stats.daily[today]?.completed) {
      toast(`Reach ${DAILY_ACCURACY_TARGET}% accuracy to complete the challenge`, {
        description: `This attempt: ${Math.round(result.accuracy)}%. Give it another try.`,
      })
    }
  }

  const lastDays = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(parseDateKey(today), i - 13)
    const key = dateKey(date)
    return { key, date, completed: Boolean(stats.daily[key]?.completed), attempted: Boolean(stats.daily[key]) }
  })

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className={cn('transition-opacity duration-300', focusMode && 'pointer-events-none opacity-0')}>
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.08em] text-accent uppercase">Daily challenge</p>
            <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-fg">{formatLongDate(parseDateKey(today))}</h1>
            <p className="mt-1 text-sm text-muted">
              One passage per day, the same for everyone. Finish it with at least {DAILY_ACCURACY_TARGET}% accuracy to
              complete the challenge.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-sm text-muted">
            <Clock3 className="size-4 text-faint" aria-hidden />
            <span>
              Next in <span className="font-medium text-fg tabular-nums">{countdown}</span>
            </span>
          </div>
        </header>

        <div className="mb-8 grid grid-cols-2 gap-2.5 md:grid-cols-4">
          <StatCard
            icon={record?.completed ? <CheckCircle2 className="size-3.5 text-correct" aria-hidden /> : <Target className="size-3.5" aria-hidden />}
            label="Status"
            value={record?.completed ? <span className="text-correct">Completed</span> : <span className="text-muted">Open</span>}
            sub={record ? `${record.attempts} attempt${record.attempts === 1 ? '' : 's'}` : 'No attempts yet'}
          />
          <StatCard
            icon={<Trophy className="size-3.5" aria-hidden />}
            label="Today's best"
            value={record ? `${Math.round(record.bestWpm)} wpm` : '–'}
            sub={record ? `${Math.round(record.bestAccuracy)}% best accuracy` : 'Daily WPM record'}
          />
          <StatCard
            icon={<Flame className={cn('size-3.5', streak.current > 0 && 'text-accent')} aria-hidden />}
            label="Current streak"
            value={`${streak.current} day${streak.current === 1 ? '' : 's'}`}
            sub={`Longest: ${streak.longest} day${streak.longest === 1 ? '' : 's'}`}
          />
          <div className="rounded-xl border border-line bg-card/60 px-4 py-3.5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-faint">
              <CalendarCheck2 className="size-3.5" aria-hidden />
              Last 14 days
            </p>
            <div className="mt-3 grid grid-cols-7 gap-1.5" role="list" aria-label="Daily challenge history">
              {lastDays.map((day) => (
                <span
                  key={day.key}
                  role="listitem"
                  title={`${day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${day.completed ? 'completed' : day.attempted ? 'attempted' : 'missed'}`}
                  aria-label={`${day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${day.completed ? 'completed' : day.attempted ? 'attempted' : 'not completed'}`}
                  className={cn(
                    'aspect-square rounded-[4px]',
                    day.completed ? 'bg-accent' : day.attempted ? 'bg-accent/30' : 'bg-line',
                    day.key === today && 'ring-1 ring-fg/40 ring-offset-1 ring-offset-card',
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <TypingTest
        key={today}
        definition={definition}
        onSaved={onSaved}
        onChangeMode={(mode) => {
          setMode(mode)
          navigate('/')
        }}
      />
    </div>
  )
}
