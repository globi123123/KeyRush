export type GameMode = 'classic' | 'zen' | 'code' | 'rush' | 'quote'

/** Modes that can appear in a saved result. The daily challenge is tracked separately. */
export type ResultMode = GameMode | 'daily'

export const GAME_MODES: GameMode[] = ['classic', 'zen', 'code', 'rush', 'quote']

export const CLASSIC_DURATIONS = [15, 30, 60, 120] as const
export type ClassicDuration = (typeof CLASSIC_DURATIONS)[number]

export type LengthFilter = 'short' | 'medium' | 'long' | 'random'
export type ZenLength = LengthFilter | 'endless'
export type ClassicSource = 'passages' | 'words'

export type Theme = 'dark' | 'light'
export type CaretStyle = 'line' | 'block' | 'underline'
export type FontSize = 'sm' | 'md' | 'lg' | 'xl'
export type TypingFont = 'jetbrains' | 'fira' | 'roboto' | 'source' | 'system'

/** One per-second sample used for the performance chart. */
export interface Sample {
  /** Second since the start of the test (1-based). */
  t: number
  /** Cumulative net WPM at this point. */
  wpm: number
  /** Raw WPM for this second only (burst speed). */
  raw: number
  /** Mistakes made during this second. */
  errors: number
}

export interface TestResult {
  id: string
  mode: ResultMode
  /** Human readable configuration, e.g. "60s", "Python", "Medium". */
  config: string
  /** Key used for personal records, e.g. "classic-60". */
  recordKey: string
  wpm: number
  rawWpm: number
  accuracy: number
  cpm: number
  correctChars: number
  incorrectChars: number
  /** All mistakes made while typing, including corrected ones. */
  errors: number
  words: number
  /** Test duration in seconds. */
  duration: number
  timestamp: number
  samples?: Sample[]
  /** Rush mode only. */
  score?: number
  level?: number
  textId?: string
}

export interface PersonalBest {
  wpm: number
  accuracy: number
  score?: number
  timestamp: number
}
