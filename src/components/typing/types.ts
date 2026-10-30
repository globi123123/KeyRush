import type { CodeLanguage } from '../../content/types'
import type { PersonalBest, ResultMode, TestResult } from '../../types'

export interface TextMeta {
  /** Short description such as "Philosophy" or "Python". */
  label?: string
  title?: string
  author?: string
  source?: string
}

export interface TextPayload {
  text: string
  id?: string
  meta?: TextMeta
  /** Code mode: enables syntax highlighting, line breaks and auto indentation. */
  language?: CodeLanguage
}

export interface TestDefinition {
  mode: ResultMode
  /** Human readable configuration, e.g. "60s · Words". */
  configLabel: string
  recordKey: string
  /** Seconds. When set, the test ends when the time is up. */
  timeLimit?: number
  /** Code layout: more visible lines and a framed editor look. */
  code?: boolean
  /** Allows finishing early (Zen mode). */
  manualFinish?: boolean
  /** "New text" keeps the same text (daily challenge). */
  fixedText?: boolean
  progressStyle?: 'words' | 'percent' | 'clock'
  /** Overrides the configuration label once the text is known. */
  describe?: (payload: TextPayload) => string
  create: () => TextPayload
  /** Supplies more text when the user gets close to the end. */
  more?: () => string
}

export interface CompletedTest {
  result: TestResult
  saved: boolean
  isRecord: boolean
  previousBest: PersonalBest | null
  meta?: TextMeta
}
