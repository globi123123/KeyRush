import type { Sample } from '../types'

export type KeyResult = 'correct' | 'incorrect' | 'ignored'

export interface SessionOptions {
  /** Automatically type the indentation after a correct line break (code mode). */
  autoIndent?: boolean
}

export interface SessionStats {
  /** Elapsed time in seconds. */
  elapsed: number
  wpm: number
  rawWpm: number
  accuracy: number
  cpm: number
  correctChars: number
  incorrectChars: number
  errors: number
  keystrokes: number
  /** Number of fully and correctly typed words. */
  words: number
  /** 0..1, how much of the text has been typed. */
  progress: number
}

/** Standard word length used by typing tests. */
export const CHARS_PER_WORD = 5

/** Minimum elapsed time used in rate calculations to avoid absurd values right after the start. */
const MIN_ELAPSED = 1

export function calcWpm(chars: number, seconds: number): number {
  if (chars <= 0) return 0
  return chars / CHARS_PER_WORD / (Math.max(seconds, MIN_ELAPSED) / 60)
}

export function calcAccuracy(keystrokes: number, errors: number): number {
  if (keystrokes <= 0) return 100
  return Math.max(0, ((keystrokes - errors) / keystrokes) * 100)
}

/**
 * The typing engine. Holds the target text and everything the user typed,
 * validates character by character and computes the metrics.
 *
 * Formulas (consistent across all modes):
 *   WPM      = (correct characters / 5) / minutes
 *   Raw WPM  = (all typed characters / 5) / minutes
 *   Accuracy = correct keystrokes / all keystrokes
 *   CPM      = correct characters / minutes
 *
 * Characters inserted automatically (indentation in code mode) never count
 * as typed characters, so they cannot inflate the speed.
 */
export class TypingSession {
  target: string
  readonly options: SessionOptions
  private typedChars: string[] = []
  private autoFlags: boolean[] = []
  private correct = 0
  private incorrect = 0
  /** Correct characters that were inserted automatically. */
  private autoCorrect = 0
  keystrokes = 0
  errors = 0
  startedAt: number | null = null
  finishedAt: number | null = null
  readonly samples: Sample[] = []
  private sampleKeystrokes = 0
  private sampleErrors = 0

  constructor(target: string, options: SessionOptions = {}) {
    this.target = target
    this.options = options
  }

  get typed(): string {
    return this.typedChars.join('')
  }

  get position(): number {
    return this.typedChars.length
  }

  get started(): boolean {
    return this.startedAt !== null
  }

  get finished(): boolean {
    return this.finishedAt !== null
  }

  /** Text is fully typed and the last character is correct. */
  get complete(): boolean {
    const last = this.target.length - 1
    return this.typedChars.length === this.target.length && this.typedChars[last] === this.target[last]
  }

  /** Appends more text, used by endless and timed modes. */
  extend(text: string) {
    if (!text) return
    this.target = this.target.length > 0 ? `${this.target} ${text}` : text
  }

  start(now: number) {
    if (this.startedAt === null) this.startedAt = now
  }

  finish(now: number) {
    if (this.finishedAt !== null) return
    this.finishedAt = now
    this.recordSamples(now, true)
  }

  /** Types one character. */
  input(char: string, now: number): KeyResult {
    if (this.finished || this.position >= this.target.length) return 'ignored'
    this.start(now)
    this.recordSamples(now)

    const expected = this.target[this.position]
    const ok = char === expected
    this.push(char, false)
    this.keystrokes++
    this.sampleKeystrokes++
    if (!ok) {
      this.errors++
      this.sampleErrors++
    }

    if (ok && char === '\n' && this.options.autoIndent) {
      while (this.position < this.target.length && this.target[this.position] === ' ') this.push(' ', true)
    }
    return ok ? 'correct' : 'incorrect'
  }

  /** Removes the last typed character, or the whole current word when `word` is true. */
  backspace(word = false): boolean {
    if (this.finished || this.position === 0) return false
    // Auto-inserted indentation is removed together with the line break before it.
    this.dropAuto()
    if (this.position === 0) return false

    if (!word) {
      this.pop()
      return true
    }

    // Delete trailing whitespace first, then the word itself.
    while (this.position > 0 && /\s/.test(this.typedChars[this.position - 1])) this.pop()
    while (this.position > 0 && !/\s/.test(this.typedChars[this.position - 1])) this.pop()
    return true
  }

  /** Per-character state used by the renderer. */
  charState(index: number): 'pending' | 'correct' | 'incorrect' {
    const typed = this.typedChars[index]
    if (typed === undefined) return 'pending'
    return typed === this.target[index] ? 'correct' : 'incorrect'
  }

  elapsed(now: number): number {
    if (this.startedAt === null) return 0
    const end = this.finishedAt ?? now
    return Math.max(0, (end - this.startedAt) / 1000)
  }

  /** Counts words that are complete and typed without any remaining mistake. */
  countWords(): number {
    let words = 0
    let inWord = false
    let wordOk = true
    const limit = this.typedChars.length
    for (let i = 0; i < limit; i++) {
      const target = this.target[i]
      const isSpace = /\s/.test(target)
      if (isSpace) {
        if (inWord && wordOk) words++
        inWord = false
        wordOk = true
      } else {
        inWord = true
        if (this.typedChars[i] !== target) wordOk = false
      }
    }
    // The last word counts once it is complete (end of text or followed by a space).
    if (inWord && wordOk && (limit === this.target.length || /\s/.test(this.target[limit] ?? ' '))) words++
    return words
  }

  stats(now: number, overrideSeconds?: number): SessionStats {
    const elapsed = overrideSeconds ?? this.elapsed(now)
    const correctChars = this.correct - this.autoCorrect
    const minutes = Math.max(elapsed, MIN_ELAPSED) / 60
    return {
      elapsed,
      wpm: calcWpm(correctChars, elapsed),
      rawWpm: calcWpm(this.keystrokes, elapsed),
      accuracy: calcAccuracy(this.keystrokes, this.errors),
      cpm: correctChars > 0 ? correctChars / minutes : 0,
      correctChars,
      incorrectChars: this.incorrect,
      errors: this.errors,
      keystrokes: this.keystrokes,
      words: this.countWords(),
      progress: this.target.length > 0 ? this.position / this.target.length : 0,
    }
  }

  /**
   * Adds one sample per elapsed second for the performance chart.
   * Called on every keystroke and by the UI timer.
   */
  recordSamples(now: number, final = false) {
    if (this.startedAt === null) return
    const elapsed = this.elapsed(now)
    let next = this.samples.length + 1
    while (next <= elapsed) {
      this.pushSample(next)
      next++
    }
    // Keep the trailing partial second when the test ends, unless it is tiny.
    const last = this.samples[this.samples.length - 1]?.t ?? 0
    if (final && elapsed - last >= 0.5) this.pushSample(Math.round(elapsed * 10) / 10, elapsed - last)
  }

  private pushSample(t: number, span = 1) {
    const correctChars = this.correct - this.autoCorrect
    this.samples.push({
      t,
      wpm: Math.round(calcWpm(correctChars, t)),
      raw: Math.round((this.sampleKeystrokes / CHARS_PER_WORD / span) * 60),
      errors: this.sampleErrors,
    })
    this.sampleKeystrokes = 0
    this.sampleErrors = 0
  }

  private push(char: string, auto: boolean) {
    const index = this.typedChars.length
    this.typedChars.push(char)
    this.autoFlags.push(auto)
    if (char === this.target[index]) {
      this.correct++
      if (auto) this.autoCorrect++
    } else {
      this.incorrect++
    }
  }

  private pop() {
    const index = this.typedChars.length - 1
    const char = this.typedChars.pop()
    const auto = this.autoFlags.pop()
    if (char === undefined) return
    if (char === this.target[index]) {
      this.correct--
      if (auto) this.autoCorrect--
    } else {
      this.incorrect--
    }
  }

  private dropAuto() {
    while (this.autoFlags.length > 0 && this.autoFlags[this.autoFlags.length - 1]) this.pop()
  }
}
