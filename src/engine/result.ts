import { createId } from '../lib/random'
import type { ResultMode, Sample, TestResult } from '../types'
import type { SessionStats } from './session'

const round1 = (value: number) => Math.round(value * 10) / 10

interface BuildResultInput {
  mode: ResultMode
  config: string
  recordKey: string
  stats: SessionStats
  samples?: Sample[]
  textId?: string
  score?: number
  level?: number
  timestamp?: number
}

export function buildResult({ mode, config, recordKey, stats, samples, textId, score, level, timestamp }: BuildResultInput): TestResult {
  return {
    id: createId(),
    mode,
    config,
    recordKey,
    wpm: round1(stats.wpm),
    rawWpm: round1(stats.rawWpm),
    accuracy: round1(stats.accuracy),
    cpm: Math.round(stats.cpm),
    correctChars: stats.correctChars,
    incorrectChars: stats.incorrectChars,
    errors: stats.errors,
    words: stats.words,
    duration: round1(stats.elapsed),
    timestamp: timestamp ?? Date.now(),
    samples: samples && samples.length > 0 ? samples.slice() : undefined,
    textId,
    score,
    level,
  }
}

/** Results below these thresholds are shown but not saved to the statistics. */
export function isResultValid(stats: SessionStats): boolean {
  return stats.keystrokes >= 5 && stats.elapsed >= 1
}
