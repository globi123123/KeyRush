import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, LayoutGrid, RotateCcw, Trophy } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { formatDuration, formatNumber } from '../../lib/format'
import { MODE_INFO } from '../../lib/modes'
import { useSettings } from '../../store/settings'
import { GAME_MODES, type GameMode } from '../../types'
import { ChartLegend, LineChart } from '../charts/LineChart'
import { TextAttribution } from '../typing/TextAttribution'
import type { CompletedTest } from '../typing/types'
import { Button } from '../ui/Button'
import { Celebration } from './Celebration'

interface ResultsScreenProps {
  completed: CompletedTest
  onRetry: () => void
  onNewText?: () => void
  onChangeMode?: (mode: GameMode) => void
  fixedText?: boolean
  retryLabel?: string
}

function Tile({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-card/60 px-4 py-3" title={hint}>
      <p className="text-[11px] font-medium tracking-[0.06em] text-faint uppercase">{label}</p>
      <p className="mt-1 text-lg font-semibold text-fg tabular-nums">{value}</p>
    </div>
  )
}

export function ResultsScreen({ completed, onRetry, onNewText, onChangeMode, fixedText, retryLabel = 'Try again' }: ResultsScreenProps) {
  const { result, saved, isRecord, previousBest, meta } = completed
  const { settings } = useSettings()
  const [showModes, setShowModes] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const rush = result.mode === 'rush'
  const samples = result.samples ?? []

  useEffect(() => {
    sectionRef.current?.focus({ preventScroll: true })
  }, [])

  const metric = rush ? (result.score ?? 0) : result.wpm
  const best = previousBest ? (rush ? (previousBest.score ?? 0) : previousBest.wpm) : null
  const delta = best !== null ? Math.round(metric) - Math.round(best) : 0
  const unit = rush ? 'points' : 'WPM'

  let comparison: ReactNode
  if (!saved) {
    comparison = <span className="text-muted">Too short to be saved</span>
  } else if (isRecord) {
    comparison = (
      <span className="inline-flex items-center gap-1.5 font-medium text-accent">
        <Trophy className="size-3.5" aria-hidden />
        New personal best{best !== null && <span className="text-muted">{` · +${formatNumber(delta)} ${unit}`}</span>}
      </span>
    )
  } else if (best !== null) {
    comparison = (
      <span className="text-muted">
        Personal best <span className="font-medium text-fg tabular-nums">{formatNumber(best)}</span>
        <span className={cn('ml-1.5 tabular-nums', delta < 0 ? 'text-incorrect/90' : 'text-correct')}>
          {delta === 0 ? '±1' : `${delta > 0 ? '+' : '−'}${formatNumber(Math.abs(delta))}`}
        </span>
      </span>
    )
  } else {
    comparison = <span className="text-muted">First result for this configuration</span>
  }

  const ModeIcon = MODE_INFO[result.mode].icon

  return (
    <section ref={sectionRef} tabIndex={-1} aria-labelledby="results-title" className="outline-none">
      <h2 id="results-title" className="sr-only">
        Test results
      </h2>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] lg:gap-10">
        {/* Headline numbers */}
        <div className="flex flex-row gap-10 lg:flex-col lg:gap-6">
          <div className="relative">
            {isRecord && !settings.reducedMotion && <Celebration />}
            <p className="text-xs font-medium tracking-[0.08em] text-faint uppercase">{rush ? 'score' : 'wpm'}</p>
            <motion.p
              className="text-6xl leading-none font-semibold tracking-tight text-accent tabular-nums sm:text-7xl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {formatNumber(metric)}
            </motion.p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-[0.08em] text-faint uppercase">{rush ? 'level' : 'accuracy'}</p>
            <p className="text-4xl leading-none font-semibold tracking-tight text-fg tabular-nums sm:text-5xl">
              {rush ? (result.level ?? 1) : `${Math.round(result.accuracy)}%`}
            </p>
          </div>
        </div>

        {/* Performance chart */}
        <div className="min-w-0 rounded-2xl border border-line bg-card/50 p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-fg">Performance</p>
            <ChartLegend
              items={[
                { label: 'WPM', color: 'var(--kr-chart-1)' },
                { label: 'Raw', color: 'var(--kr-chart-2)', dashed: true },
                { label: 'Errors', color: 'var(--kr-incorrect)', marker: true },
              ]}
            />
          </div>
          {samples.length > 0 ? (
            <LineChart
              ariaLabel="Words per minute over the course of the test"
              height={190}
              labels={samples.map((s) => `${s.t}s`)}
              xTick={(i) => {
                const step = Math.max(1, Math.ceil(samples.length / 8))
                return i % step === 0 || i === samples.length - 1 ? `${Math.round(samples[i].t)}` : null
              }}
              series={[
                { id: 'wpm', label: 'WPM', color: 'var(--kr-chart-1)', values: samples.map((s) => s.wpm) },
                { id: 'raw', label: 'Raw', color: 'var(--kr-chart-2)', values: samples.map((s) => s.raw), dashed: true },
              ]}
              markers={samples.map((s) => s.errors)}
            />
          ) : (
            <p className="flex h-[190px] items-center justify-center text-sm text-faint">Not enough data for a chart.</p>
          )}
        </div>
      </div>

      {/* Detail tiles */}
      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {rush ? (
          <>
            <Tile label="wpm" value={Math.round(result.wpm)} />
            <Tile label="accuracy" value={`${Math.round(result.accuracy)}%`} />
            <Tile label="words" value={formatNumber(result.words)} hint="Words destroyed" />
            <Tile label="mistakes" value={formatNumber(result.errors)} />
            <Tile label="characters" value={formatNumber(result.correctChars)} />
            <Tile label="time" value={formatDuration(result.duration)} />
          </>
        ) : (
          <>
            <Tile label="raw wpm" value={Math.round(result.rawWpm)} hint="Speed including mistakes" />
            <Tile label="cpm" value={formatNumber(result.cpm)} hint="Correct characters per minute" />
            <Tile label="correct" value={formatNumber(result.correctChars)} hint="Correct characters" />
            <Tile label="incorrect" value={formatNumber(result.incorrectChars)} hint="Characters left incorrect" />
            <Tile label="errors" value={formatNumber(result.errors)} hint="All mistakes, including corrected ones" />
            <Tile label="time" value={formatDuration(result.duration)} />
          </>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="flex min-w-0 items-center gap-2 text-faint">
          <ModeIcon className="size-4 shrink-0" aria-hidden />
          <span className="text-muted">{MODE_INFO[result.mode].label}</span>
          <span aria-hidden>&middot;</span>
          <span className="truncate">{result.config}</span>
        </p>
        <p aria-live="polite">{comparison}</p>
      </div>
      {meta && (meta.author || meta.label) && !rush && (
        <div className="mt-1 text-[13px] text-faint">
          <TextAttribution meta={meta} />
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <Button variant="primary" icon={<RotateCcw className="size-4" aria-hidden />} onClick={onRetry}>
          {retryLabel}
        </Button>
        {onNewText && !fixedText && (
          <Button icon={<ArrowRight className="size-4" aria-hidden />} onClick={onNewText}>
            New text
          </Button>
        )}
        {onChangeMode && (
          <Button
            variant="ghost"
            icon={<LayoutGrid className="size-4" aria-hidden />}
            aria-expanded={showModes}
            onClick={() => setShowModes((v) => !v)}
          >
            Change mode
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showModes && onChangeMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {GAME_MODES.map((mode) => {
                const info = MODE_INFO[mode]
                const Icon = info.icon
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onChangeMode(mode)}
                    className="flex items-center gap-2 rounded-xl border border-line bg-card/60 px-3 py-2.5 text-left text-sm text-muted transition-colors hover:border-line-strong hover:bg-card hover:text-fg"
                  >
                    <Icon className="size-4 text-accent" aria-hidden />
                    {info.label}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-8 hidden text-xs text-faint sm:block">
        Press <kbd className="font-sans text-muted">Tab + Enter</kbd> to restart or <kbd className="font-sans text-muted">Esc</kbd> to go back.
      </p>
    </section>
  )
}
