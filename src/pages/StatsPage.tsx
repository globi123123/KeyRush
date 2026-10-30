import { BarChart3, Keyboard, RotateCcw, Trash2, Trophy } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ActivityHeatmap } from '../components/charts/ActivityHeatmap'
import { ChartLegend, LineChart } from '../components/charts/LineChart'
import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'
import { EmptyState } from '../components/ui/EmptyState'
import { Segmented } from '../components/ui/Segmented'
import { cn } from '../lib/cn'
import { formatDateTime, formatRelative } from '../lib/date'
import { formatCompact, formatDuration, formatNumber } from '../lib/format'
import { MODE_INFO, modeLabel } from '../lib/modes'
import { computeStreak, useStats } from '../store/stats'
import { useToast } from '../store/toast'
import { CLASSIC_DURATIONS, type ResultMode } from '../types'

type Filter = 'all' | Exclude<ResultMode, 'rush'>
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'classic', label: 'Classic' },
  { value: 'zen', label: 'Zen' },
  { value: 'code', label: 'Code' },
  { value: 'quote', label: 'Quote' },
  { value: 'daily', label: 'Daily' },
]

const CHART_LIMIT = 50
const HISTORY_PAGE = 12

function Card({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-2xl border border-line bg-card/50 p-4 sm:p-5', className)}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-sm font-medium text-fg">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

function Overview({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-card/50 px-4 py-3.5">
      <p className="text-xs font-medium text-faint">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-fg tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-muted">{sub}</p>}
    </div>
  )
}

function movingAverage(values: number[], window: number): number[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1)
    return slice.reduce((sum, v) => sum + v, 0) / slice.length
  })
}

export function StatsPage() {
  const { stats, resetStats } = useStats()
  const toast = useToast()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('all')
  const [historyCount, setHistoryCount] = useState(HISTORY_PAGE)
  const [confirmReset, setConfirmReset] = useState(false)
  const { totals, history, bests } = stats
  const streak = computeStreak(stats.daily)

  const typingHistory = useMemo(() => history.filter((r) => r.mode !== 'rush'), [history])
  const chartData = useMemo(() => {
    const filtered = typingHistory.filter((r) => filter === 'all' || r.mode === filter)
    return filtered.slice(0, CHART_LIMIT).reverse()
  }, [typingHistory, filter])

  const avgWpm = totals.wpmTests > 0 ? totals.wpmSum / totals.wpmTests : 0
  const avgAccuracy = totals.wpmTests > 0 ? totals.accuracySum / totals.wpmTests : 0
  const recent10 = typingHistory.slice(0, 10)
  const recentAvg = recent10.length > 0 ? recent10.reduce((s, r) => s + r.wpm, 0) / recent10.length : 0

  const records = useMemo(() => {
    const entries: { key: string; title: string; mode: ResultMode; value: string; detail: string; date?: number }[] = []
    const add = (key: string, title: string, mode: ResultMode) => {
      const best = bests[key]
      entries.push({
        key,
        title,
        mode,
        value: best ? (mode === 'rush' ? formatNumber(best.score ?? 0) : `${Math.round(best.wpm)}`) : '–',
        detail: best ? (mode === 'rush' ? 'points' : `wpm · ${Math.round(best.accuracy)}% acc`) : 'No record yet',
        date: best?.timestamp,
      })
    }
    CLASSIC_DURATIONS.forEach((d) => add(`classic-${d}`, `Classic ${d}s`, 'classic'))
    add('zen', 'Zen', 'zen')
    add('code', 'Code', 'code')
    add('quote', 'Quote', 'quote')
    add('daily', 'Daily challenge', 'daily')
    add('rush-relaxed', 'Rush · Relaxed', 'rush')
    add('rush-normal', 'Rush · Normal', 'rush')
    add('rush-intense', 'Rush · Intense', 'rush')
    return entries
  }, [bests])

  const onReset = () => {
    resetStats()
    setConfirmReset(false)
    toast('Statistics reset', { tone: 'success', description: 'All results, records and streaks were removed.' })
  }

  if (totals.tests === 0) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <PageHeader />
        <EmptyState
          icon={<BarChart3 className="size-5" aria-hidden />}
          title="No statistics yet"
          description="Complete your first test and your progress, records and activity will show up here."
          action={
            <Button variant="primary" icon={<Keyboard className="size-4" aria-hidden />} onClick={() => navigate('/')}>
              Start typing
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        action={
          <Button variant="ghost" size="sm" icon={<Trash2 className="size-3.5" aria-hidden />} onClick={() => setConfirmReset(true)}>
            Reset statistics
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Overview label="Tests completed" value={formatNumber(totals.tests)} sub={`${formatDuration(totals.seconds)} of typing`} />
        <Overview label="Average WPM" value={Math.round(avgWpm)} sub={recent10.length > 0 ? `Last 10: ${Math.round(recentAvg)} wpm` : undefined} />
        <Overview label="Highest WPM" value={Math.round(totals.highestWpm)} sub="Across all typing modes" />
        <Overview label="Average accuracy" value={`${avgAccuracy.toFixed(1)}%`} />
        <Overview label="Words typed" value={formatCompact(totals.words)} />
        <Overview label="Characters typed" value={formatCompact(totals.chars)} sub="Correct characters" />
        <Overview label="Daily streak" value={`${streak.current} day${streak.current === 1 ? '' : 's'}`} sub={`Longest: ${streak.longest}`} />
        <Overview label="Active days" value={formatNumber(Object.keys(stats.activity).length)} />
      </div>

      <div className="mt-6 flex justify-start">
        <Segmented id="stats-filter" label="Filter charts by mode" value={filter} onChange={setFilter} options={FILTERS} />
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card
          title="Speed progress"
          action={
            <ChartLegend
              items={[
                { label: 'WPM', color: 'var(--kr-chart-1)' },
                { label: '10-test average', color: 'var(--kr-chart-2)', dashed: true },
              ]}
            />
          }
        >
          {chartData.length > 0 ? (
            <LineChart
              ariaLabel={`Words per minute for the last ${chartData.length} tests`}
              height={220}
              labels={chartData.map((r) => `${formatDateTime(r.timestamp)} · ${modeLabel(r.mode)} ${r.config}`)}
              series={[
                { id: 'wpm', label: 'WPM', color: 'var(--kr-chart-1)', values: chartData.map((r) => r.wpm) },
                {
                  id: 'avg',
                  label: '10-test avg',
                  color: 'var(--kr-chart-2)',
                  values: movingAverage(chartData.map((r) => r.wpm), 10),
                  dashed: true,
                },
              ]}
              dots={chartData.length <= 20}
            />
          ) : (
            <ChartEmpty />
          )}
        </Card>
        <Card title="Accuracy">
          {chartData.length > 0 ? (
            <LineChart
              ariaLabel={`Accuracy for the last ${chartData.length} tests`}
              height={220}
              labels={chartData.map((r) => `${formatDateTime(r.timestamp)} · ${modeLabel(r.mode)}`)}
              series={[{ id: 'acc', label: 'Accuracy', color: 'var(--kr-chart-1)', values: chartData.map((r) => r.accuracy) }]}
              yMin={Math.max(0, Math.floor(Math.min(...chartData.map((r) => r.accuracy)) / 10) * 10 - 10)}
              yMax={100}
              yFormat={(v) => `${Math.round(v)}%`}
              dots={chartData.length <= 20}
            />
          ) : (
            <ChartEmpty />
          )}
        </Card>
      </div>

      <Card title="Daily activity" className="mt-4">
        <ActivityHeatmap activity={stats.activity} />
      </Card>

      <Card title="Personal records" className="mt-4">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {records.map((record) => {
            const Icon = MODE_INFO[record.mode].icon
            const has = record.date !== undefined
            return (
              <div key={record.key} className="rounded-xl border border-line bg-bg-2/60 px-3.5 py-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                  <Icon className={cn('size-3.5', has ? 'text-accent' : 'text-faint')} aria-hidden />
                  {record.title}
                </p>
                <p className={cn('mt-1.5 text-xl font-semibold tabular-nums', has ? 'text-fg' : 'text-faint')}>{record.value}</p>
                <p className="text-xs text-faint">
                  {record.detail}
                  {record.date !== undefined && <span className="hidden sm:inline">{` · ${formatRelative(record.date)}`}</span>}
                </p>
              </div>
            )
          })}
        </div>
      </Card>

      <Card title="Recent tests" className="mt-4">
        <div className="-mx-4 overflow-x-auto sm:-mx-5">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-faint">
                <th scope="col" className="px-4 pb-2.5 font-medium sm:px-5">Mode</th>
                <th scope="col" className="pb-2.5 font-medium">Configuration</th>
                <th scope="col" className="pb-2.5 text-right font-medium">WPM</th>
                <th scope="col" className="pb-2.5 text-right font-medium">Raw</th>
                <th scope="col" className="pb-2.5 text-right font-medium">Accuracy</th>
                <th scope="col" className="pb-2.5 text-right font-medium">Time</th>
                <th scope="col" className="px-4 pb-2.5 text-right font-medium sm:px-5">Date</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, historyCount).map((r) => {
                const Icon = MODE_INFO[r.mode].icon
                return (
                  <tr key={r.id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-card-hover/50">
                    <td className="px-4 py-2.5 sm:px-5">
                      <span className="inline-flex items-center gap-2 text-fg">
                        <Icon className="size-3.5 text-faint" aria-hidden />
                        {modeLabel(r.mode)}
                      </span>
                    </td>
                    <td className="max-w-48 truncate py-2.5 text-muted">{r.mode === 'rush' ? `${r.config} · ${formatNumber(r.score ?? 0)} pts` : r.config}</td>
                    <td className="py-2.5 text-right font-medium text-fg tabular-nums">{Math.round(r.wpm)}</td>
                    <td className="py-2.5 text-right text-muted tabular-nums">{Math.round(r.rawWpm)}</td>
                    <td className="py-2.5 text-right text-muted tabular-nums">{Math.round(r.accuracy)}%</td>
                    <td className="py-2.5 text-right text-muted tabular-nums">{formatDuration(r.duration)}</td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap text-faint sm:px-5">{formatRelative(r.timestamp)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {history.length > historyCount && (
          <div className="mt-3 flex justify-center">
            <Button variant="ghost" size="sm" onClick={() => setHistoryCount((n) => n + HISTORY_PAGE * 2)}>
              Show more
            </Button>
          </div>
        )}
      </Card>

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset all statistics?"
        description="This permanently removes your test history, personal records, activity and daily streaks. Settings are kept."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)} data-autofocus>
              Cancel
            </Button>
            <Button variant="danger" icon={<RotateCcw className="size-4" aria-hidden />} onClick={onReset}>
              Reset statistics
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          You have completed <span className="font-medium text-fg">{formatNumber(totals.tests)}</span> tests. This cannot be undone.
        </p>
      </Dialog>
    </div>
  )
}

function PageHeader({ action }: { action?: ReactNode }) {
  return (
    <header className="mb-8 flex items-end justify-between gap-4">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-medium tracking-[0.08em] text-accent uppercase">
          <Trophy className="size-3.5" aria-hidden />
          Progress
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-fg">Statistics</h1>
      </div>
      {action}
    </header>
  )
}

function ChartEmpty() {
  return <p className="flex h-[220px] items-center justify-center text-sm text-faint">No tests in this mode yet.</p>
}
