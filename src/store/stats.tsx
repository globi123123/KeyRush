import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { dateKey, daysBetween } from '../lib/date'
import { isRecord, readJSON, writeJSON } from '../lib/storage'
import type { PersonalBest, TestResult } from '../types'

const STORAGE_KEY = 'stats'
const HISTORY_LIMIT = 500
const SAMPLES_KEPT = 25

/** Accuracy required for a daily challenge attempt to count as completed. */
export const DAILY_ACCURACY_TARGET = 90

export interface ActivityDay {
  tests: number
  seconds: number
  words: number
}

export interface DailyRecord {
  textId: string
  attempts: number
  bestWpm: number
  bestAccuracy: number
  completed: boolean
  completedAt?: number
}

export interface Totals {
  tests: number
  words: number
  chars: number
  seconds: number
  /** Tests counted in WPM averages (rush rounds are excluded). */
  wpmTests: number
  wpmSum: number
  accuracySum: number
  highestWpm: number
}

export interface StatsData {
  version: 1
  history: TestResult[]
  totals: Totals
  bests: Record<string, PersonalBest>
  activity: Record<string, ActivityDay>
  daily: Record<string, DailyRecord>
}

export interface AddResultOutcome {
  isRecord: boolean
  previousBest: PersonalBest | null
}

function emptyStats(): StatsData {
  return {
    version: 1,
    history: [],
    totals: { tests: 0, words: 0, chars: 0, seconds: 0, wpmTests: 0, wpmSum: 0, accuracySum: 0, highestWpm: 0 },
    bests: {},
    activity: {},
    daily: {},
  }
}

const num = (value: unknown, fallback = 0) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback)

function isResult(value: unknown): value is TestResult {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.mode === 'string' &&
    typeof value.wpm === 'number' &&
    typeof value.accuracy === 'number' &&
    typeof value.timestamp === 'number'
  )
}

function sanitize(raw: unknown): StatsData {
  const base = emptyStats()
  if (!isRecord(raw)) return base
  const totals = isRecord(raw.totals) ? raw.totals : {}
  return {
    version: 1,
    history: Array.isArray(raw.history) ? raw.history.filter(isResult).slice(0, HISTORY_LIMIT) : [],
    totals: {
      tests: num(totals.tests),
      words: num(totals.words),
      chars: num(totals.chars),
      seconds: num(totals.seconds),
      wpmTests: num(totals.wpmTests),
      wpmSum: num(totals.wpmSum),
      accuracySum: num(totals.accuracySum),
      highestWpm: num(totals.highestWpm),
    },
    bests: isRecord(raw.bests) ? (raw.bests as Record<string, PersonalBest>) : {},
    activity: isRecord(raw.activity) ? (raw.activity as Record<string, ActivityDay>) : {},
    daily: isRecord(raw.daily) ? (raw.daily as Record<string, DailyRecord>) : {},
  }
}

/** Is this result better than the stored record for its key? */
function beats(result: TestResult, best: PersonalBest | undefined): boolean {
  if (!best) return true
  if (result.mode === 'rush') return (result.score ?? 0) > (best.score ?? 0)
  if (result.wpm !== best.wpm) return result.wpm > best.wpm
  return result.accuracy > best.accuracy
}

export function computeStreak(daily: Record<string, DailyRecord>, today: string = dateKey()): {
  current: number
  longest: number
} {
  const completed = Object.keys(daily)
    .filter((key) => daily[key]?.completed)
    .sort()
  let longest = 0
  let run = 0
  let prev: string | null = null
  for (const key of completed) {
    run = prev && daysBetween(prev, key) === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
    prev = key
  }
  // The current streak is alive if the last completion was today or yesterday.
  let current = 0
  if (prev && daysBetween(prev, today) <= 1) current = run
  return { current, longest }
}

interface StatsContextValue {
  stats: StatsData
  addResult: (result: TestResult) => AddResultOutcome
  recordDailyAttempt: (key: string, textId: string, result: TestResult) => boolean
  getBest: (recordKey: string) => PersonalBest | null
  resetStats: () => void
  saveFailed: boolean
}

const StatsContext = createContext<StatsContextValue | null>(null)

export function StatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<StatsData>(() => sanitize(readJSON<unknown>(STORAGE_KEY, null)))
  const [saveFailed, setSaveFailed] = useState(false)
  // A ref mirrors the state so addResult can return a synchronous outcome.
  const statsRef = useRef(stats)
  statsRef.current = stats

  useEffect(() => {
    setSaveFailed(!writeJSON(STORAGE_KEY, stats))
  }, [stats])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === `keyrush:${STORAGE_KEY}`) {
        try {
          setStats(sanitize(event.newValue ? JSON.parse(event.newValue) : null))
        } catch {
          /* ignore malformed data */
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const commit = useCallback((next: StatsData) => {
    statsRef.current = next
    setStats(next)
  }, [])

  const addResult = useCallback(
    (result: TestResult): AddResultOutcome => {
      const prev = statsRef.current
      const previousBest = prev.bests[result.recordKey] ?? null
      const isRecordResult = beats(result, previousBest ?? undefined)
      const today = dateKey(new Date(result.timestamp))
      const countsForWpm = result.mode !== 'rush'

      // Keep detailed per-second samples only for recent results to save space.
      const history = [result, ...prev.history].slice(0, HISTORY_LIMIT).map((entry, index) => {
        if (index < SAMPLES_KEPT || !entry.samples) return entry
        const { samples: _dropped, ...rest } = entry
        void _dropped
        return rest
      })

      const day = prev.activity[today] ?? { tests: 0, seconds: 0, words: 0 }
      const next: StatsData = {
        ...prev,
        history,
        totals: {
          tests: prev.totals.tests + 1,
          words: prev.totals.words + result.words,
          chars: prev.totals.chars + result.correctChars,
          seconds: prev.totals.seconds + result.duration,
          wpmTests: prev.totals.wpmTests + (countsForWpm ? 1 : 0),
          wpmSum: prev.totals.wpmSum + (countsForWpm ? result.wpm : 0),
          accuracySum: prev.totals.accuracySum + (countsForWpm ? result.accuracy : 0),
          highestWpm: countsForWpm ? Math.max(prev.totals.highestWpm, result.wpm) : prev.totals.highestWpm,
        },
        bests: isRecordResult
          ? {
              ...prev.bests,
              [result.recordKey]: {
                wpm: result.wpm,
                accuracy: result.accuracy,
                score: result.score,
                timestamp: result.timestamp,
              },
            }
          : prev.bests,
        activity: {
          ...prev.activity,
          [today]: {
            tests: day.tests + 1,
            seconds: day.seconds + result.duration,
            words: day.words + result.words,
          },
        },
      }
      commit(next)
      return { isRecord: isRecordResult, previousBest }
    },
    [commit],
  )

  const recordDailyAttempt = useCallback(
    (key: string, textId: string, result: TestResult): boolean => {
      const prev = statsRef.current
      const existing = prev.daily[key]
      const passed = result.accuracy >= DAILY_ACCURACY_TARGET
      const newlyCompleted = passed && !existing?.completed
      const record: DailyRecord = {
        textId,
        attempts: (existing?.attempts ?? 0) + 1,
        bestWpm: Math.max(existing?.bestWpm ?? 0, result.wpm),
        bestAccuracy: Math.max(existing?.bestAccuracy ?? 0, result.accuracy),
        completed: Boolean(existing?.completed || passed),
        completedAt: existing?.completedAt ?? (passed ? result.timestamp : undefined),
      }
      commit({ ...prev, daily: { ...prev.daily, [key]: record } })
      return newlyCompleted
    },
    [commit],
  )

  const getBest = useCallback((recordKey: string) => statsRef.current.bests[recordKey] ?? null, [])

  const resetStats = useCallback(() => commit(emptyStats()), [commit])

  const value = useMemo(
    () => ({ stats, addResult, recordDailyAttempt, getBest, resetStats, saveFailed }),
    [stats, addResult, recordDailyAttempt, getBest, resetStats, saveFailed],
  )
  return <StatsContext.Provider value={value}>{children}</StatsContext.Provider>
}

export function useStats(): StatsContextValue {
  const ctx = useContext(StatsContext)
  if (!ctx) throw new Error('useStats must be used inside StatsProvider')
  return ctx
}
