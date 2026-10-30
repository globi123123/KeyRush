import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { Flame, Heart, Pause, Play, Trophy, Zap } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type CompositionEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { rushTiers, type RushTier } from '../../content/words'
import { buildResult } from '../../engine/result'
import { calcAccuracy, calcWpm, CHARS_PER_WORD } from '../../engine/session'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { cn } from '../../lib/cn'
import { formatNumber } from '../../lib/format'
import { disarmTab, isEditableTarget, isTabArmed } from '../../lib/keyboard'
import { pickRandom } from '../../lib/random'
import { playSound } from '../../lib/sound'
import { useApp, type RushDifficulty } from '../../store/app'
import { useSettings } from '../../store/settings'
import { useStats } from '../../store/stats'
import { useToast } from '../../store/toast'
import type { GameMode, Sample } from '../../types'
import { ResultsScreen } from '../results/ResultsScreen'
import type { CompletedTest } from '../typing/types'
import { Button } from '../ui/Button'
import { Kbd } from '../ui/Kbd'

export const RUSH_DIFFICULTIES: { id: RushDifficulty; label: string }[] = [
  { id: 'relaxed', label: 'Relaxed' },
  { id: 'normal', label: 'Normal' },
  { id: 'intense', label: 'Intense' },
]

const PRESETS: Record<RushDifficulty, { spawn: number; fall: number; lives: number; tierBoost: number }> = {
  relaxed: { spawn: 2700, fall: 13000, lives: 5, tierBoost: 0 },
  normal: { spawn: 2100, fall: 10500, lives: 3, tierBoost: 0 },
  intense: { spawn: 1550, fall: 8200, lives: 3, tierBoost: 1 },
}

/** Words cleared per level. */
const WORDS_PER_LEVEL = 8
const MAX_WORDS = 12

interface RushWord {
  id: number
  text: string
  lane: number
  progress: number
  /** Milliseconds to reach the bottom. */
  duration: number
}

interface GameState {
  words: RushWord[]
  buffer: string
  score: number
  level: number
  lives: number
  combo: number
  bestCombo: number
  destroyed: number
  chars: number
  keystrokes: number
  errors: number
  active: number
  lastSpawn: number
  nextId: number
  samples: Sample[]
  sampleKeys: number
  sampleErrors: number
  lastLane: number
}

type Phase = 'idle' | 'running' | 'paused' | 'over'

function createState(lives: number): GameState {
  return {
    words: [],
    buffer: '',
    score: 0,
    level: 1,
    lives,
    combo: 0,
    bestCombo: 0,
    destroyed: 0,
    chars: 0,
    keystrokes: 0,
    errors: 0,
    active: 0,
    lastSpawn: -Infinity,
    nextId: 1,
    samples: [],
    sampleKeys: 0,
    sampleErrors: 0,
    lastLane: -1,
  }
}

const multiplier = (combo: number) => 1 + Math.min(combo, 20) * 0.1

interface RushGameProps {
  difficulty: RushDifficulty
  onChangeMode?: (mode: GameMode) => void
}

export function RushGame({ difficulty, onChangeMode }: RushGameProps) {
  const preset = PRESETS[difficulty]
  const { settings } = useSettings()
  const { setTestStatus } = useApp()
  const { addResult, stats } = useStats()
  const toast = useToast()
  const isMobile = useMediaQuery('(max-width: 639px)')
  const lanes = isMobile ? 3 : 5
  const recordKey = `rush-${difficulty}`
  const best = stats.bests[recordKey]?.score ?? 0

  const game = useRef<GameState>(createState(preset.lives))
  const [, render] = useReducer((n: number) => n + 1, 0)
  const [phase, setPhaseState] = useState<Phase>('idle')
  const phaseRef = useRef<Phase>('idle')
  const [completed, setCompleted] = useState<CompletedTest | null>(null)
  const [flash, setFlash] = useState(0)
  const [levelUp, setLevelUp] = useState<number | null>(null)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const shake = useAnimationControls()
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const lanesRef = useRef(lanes)
  lanesRef.current = lanes

  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next
    setPhaseState(next)
  }, [])

  const sound = useCallback((name: Parameters<typeof playSound>[0]) => {
    const s = settingsRef.current
    if (s.sound) playSound(name, s.volume)
  }, [])

  const focusInput = useCallback(() => inputRef.current?.focus({ preventScroll: true }), [])

  useEffect(() => {
    setTestStatus(phase === 'running' || phase === 'paused' ? 'running' : phase === 'over' ? 'finished' : 'idle')
  }, [phase, setTestStatus])
  useEffect(() => () => setTestStatus('idle'), [setTestStatus])
  useEffect(() => {
    const frame = requestAnimationFrame(focusInput)
    return () => cancelAnimationFrame(frame)
  }, [focusInput])

  /* ---------------------------------------------------------------- */
  /*  Game rules                                                       */
  /* ---------------------------------------------------------------- */

  const spawn = useCallback(() => {
    const g = game.current
    if (g.words.length >= MAX_WORDS) return
    const baseTier = g.level <= 2 ? 1 : g.level <= 4 ? 2 : g.level <= 7 ? 3 : 4
    const roll = Math.random()
    const tier = Math.max(1, Math.min(4, baseTier + preset.tierBoost + (roll < 0.2 ? -1 : roll > 0.85 ? 1 : 0))) as RushTier
    const onScreen = new Set(g.words.map((w) => w.text))
    let text = pickRandom(rushTiers[tier])
    for (let i = 0; i < 6 && onScreen.has(text); i++) text = pickRandom(rushTiers[tier])

    // Prefer a lane whose last word has moved far enough down to avoid overlaps.
    const laneCount = lanesRef.current
    const free = Array.from({ length: laneCount }, (_, lane) => lane).filter(
      (lane) => lane !== g.lastLane && g.words.every((w) => w.lane !== lane || w.progress > 0.18),
    )
    const lane = free.length > 0 ? pickRandom(free) : Math.floor(Math.random() * laneCount)
    const duration = Math.max(3400, preset.fall * 0.93 ** (g.level - 1)) * (0.92 + Math.random() * 0.16)
    g.words.push({ id: g.nextId++, text, lane, progress: 0, duration })
    g.lastLane = lane
  }, [preset])

  const finishGame = useCallback(() => {
    const g = game.current
    setPhase('over')
    const seconds = g.active / 1000
    // Close the last partial second for the chart.
    const lastT = g.samples[g.samples.length - 1]?.t ?? 0
    if (seconds - lastT >= 0.5) {
      const span = seconds - lastT
      g.samples.push({
        t: Math.round(seconds * 10) / 10,
        wpm: Math.round(calcWpm(g.chars, seconds)),
        raw: Math.round((g.sampleKeys / CHARS_PER_WORD / span) * 60),
        errors: g.sampleErrors,
      })
    }
    const result = buildResult({
      mode: 'rush',
      config: RUSH_DIFFICULTIES.find((d) => d.id === difficulty)?.label ?? difficulty,
      recordKey,
      stats: {
        elapsed: seconds,
        wpm: calcWpm(g.chars, seconds),
        rawWpm: calcWpm(g.keystrokes, seconds),
        accuracy: calcAccuracy(g.keystrokes, g.errors),
        cpm: g.chars / Math.max(seconds / 60, 1 / 60),
        correctChars: g.chars,
        incorrectChars: g.errors,
        errors: g.errors,
        keystrokes: g.keystrokes,
        words: g.destroyed,
        progress: 1,
      },
      samples: g.samples,
      score: Math.round(g.score),
      level: g.level,
    })
    const valid = g.keystrokes > 0
    let isRecord = false
    let previousBest = null
    if (valid) {
      const outcome = addResult(result)
      previousBest = outcome.previousBest
      isRecord = outcome.isRecord && previousBest !== null && (result.score ?? 0) > 0
    }
    sound(isRecord ? 'record' : 'finish')
    if (isRecord) toast('New Rush high score', { tone: 'record', description: `${formatNumber(result.score ?? 0)} points` })
    setCompleted({ result, saved: valid, isRecord, previousBest })
  }, [addResult, difficulty, recordKey, setPhase, sound, toast])

  const destroy = useCallback(
    (word: RushWord) => {
      const g = game.current
      g.words = g.words.filter((w) => w.id !== word.id)
      g.combo++
      g.bestCombo = Math.max(g.bestCombo, g.combo)
      g.destroyed++
      g.chars += word.text.length
      g.score += Math.round((word.text.length * 10 + g.level * 5) * multiplier(g.combo))
      g.buffer = ''
      const level = 1 + Math.floor(g.destroyed / WORDS_PER_LEVEL)
      if (level > g.level) {
        g.level = level
        setLevelUp(level)
      }
      sound('word')
    },
    [sound],
  )

  const mistake = useCallback(() => {
    const g = game.current
    g.errors++
    g.sampleErrors++
    g.combo = 0
    g.score = Math.max(0, g.score - (10 + g.level * 2))
    sound('error')
    void shake.start({ x: [0, -7, 6, -4, 3, 0], transition: { duration: 0.3 } })
  }, [shake, sound])

  const start = useCallback(() => {
    game.current = createState(preset.lives)
    setCompleted(null)
    setLevelUp(1)
    setPhase('running')
    render()
    requestAnimationFrame(focusInput)
  }, [focusInput, preset.lives, setPhase])

  const backToIdle = useCallback(() => {
    game.current = createState(preset.lives)
    setCompleted(null)
    setPhase('idle')
    render()
    requestAnimationFrame(focusInput)
  }, [focusInput, preset.lives, setPhase])

  const typeChar = useCallback(
    (char: string) => {
      const current = phaseRef.current
      if (current === 'idle' || current === 'over') {
        if (char === ' ' && current === 'idle') start()
        return
      }
      if (current !== 'running') return
      const g = game.current

      if (char === ' ') {
        if (!g.buffer) return
        const exact = g.words.filter((w) => w.text === g.buffer).sort((a, b) => b.progress - a.progress)[0]
        if (exact) destroy(exact)
        else {
          g.keystrokes++
          g.sampleKeys++
          mistake()
          g.buffer = ''
        }
        render()
        return
      }

      const next = g.buffer + char
      g.keystrokes++
      g.sampleKeys++
      const candidates = g.words.filter((w) => w.text.startsWith(next))
      if (candidates.length === 0) {
        mistake()
        render()
        return
      }
      g.buffer = next
      const exact = candidates.filter((w) => w.text === next).sort((a, b) => b.progress - a.progress)[0]
      // Clear automatically unless a longer word still matches what was typed.
      if (exact && candidates.every((w) => w.text === next)) destroy(exact)
      else sound('key')
      render()
    },
    [destroy, mistake, sound, start],
  )

  /* ---------------------------------------------------------------- */
  /*  Game loop                                                        */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (phase !== 'running') return
    let frame = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(100, now - last)
      last = now
      const g = game.current
      g.active += dt

      for (const word of g.words) word.progress += dt / word.duration
      const missed = g.words.filter((w) => w.progress >= 1)
      if (missed.length > 0) {
        g.words = g.words.filter((w) => w.progress < 1)
        g.lives = Math.max(0, g.lives - missed.length)
        g.combo = 0
        if (missed.some((w) => w.text.startsWith(g.buffer) && g.buffer)) g.buffer = ''
        setFlash((n) => n + 1)
        sound('miss')
      }

      const interval = Math.max(560, preset.spawn * 0.9 ** (g.level - 1))
      if (g.words.length === 0 || g.active - g.lastSpawn >= interval) {
        spawn()
        g.lastSpawn = g.active
      }

      // One sample per second of active play.
      while ((g.samples.length + 1) * 1000 <= g.active) {
        const t = g.samples.length + 1
        g.samples.push({
          t,
          wpm: Math.round(calcWpm(g.chars, t)),
          raw: Math.round((g.sampleKeys / CHARS_PER_WORD) * 60),
          errors: g.sampleErrors,
        })
        g.sampleKeys = 0
        g.sampleErrors = 0
      }

      if (g.lives <= 0) {
        finishGame()
        render()
        return
      }
      render()
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [phase, finishGame, preset.spawn, sound, spawn])

  // Pause when the page is hidden.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && phaseRef.current === 'running') setPhase('paused')
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [setPhase])

  useEffect(() => {
    if (levelUp === null) return
    const timer = window.setTimeout(() => setLevelUp(null), 1100)
    return () => window.clearTimeout(timer)
  }, [levelUp])

  /* ---------------------------------------------------------------- */
  /*  Input                                                            */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (document.querySelector('[data-dialog-open]')) return
      const inCapture = event.target === inputRef.current
      if (event.key === 'Enter' && isTabArmed(inCapture ? 1000 : 0)) {
        event.preventDefault()
        event.stopPropagation()
        disarmTab()
        start()
        return
      }
      if (event.key === 'Escape' && phaseRef.current !== 'idle') {
        event.preventDefault()
        backToIdle()
        return
      }
      if (
        !inCapture &&
        phaseRef.current !== 'over' &&
        event.key.length === 1 &&
        event.key !== ' ' &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !isEditableTarget(event.target)
      ) {
        focusInput()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [backToIdle, focusInput, start])

  const onKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) return
    if (event.key === 'Tab') {
      event.preventDefault()
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (phaseRef.current === 'idle') start()
      else typeChar(' ')
    } else if (event.key === 'Backspace') {
      event.preventDefault()
      const g = game.current
      if (phaseRef.current === 'running' && g.buffer) {
        g.buffer = event.ctrlKey || event.altKey || event.metaKey ? '' : g.buffer.slice(0, -1)
        render()
      }
    }
  }

  const onInput = (event: FormEvent<HTMLTextAreaElement>) => {
    const native = event.nativeEvent as InputEvent
    const element = event.currentTarget
    if (native.isComposing) return
    if (native.inputType === 'insertText') for (const char of native.data ?? element.value) typeChar(char)
    else if (native.inputType === 'insertLineBreak') typeChar(' ')
    else if (native.inputType === 'deleteContentBackward') {
      const g = game.current
      g.buffer = g.buffer.slice(0, -1)
      render()
    }
    element.value = ''
  }

  const onCompositionEnd = (event: CompositionEvent<HTMLTextAreaElement>) => {
    for (const char of event.data) typeChar(char)
    event.currentTarget.value = ''
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  if (phase === 'over' && completed) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
        <ResultsScreen completed={completed} onRetry={start} onChangeMode={onChangeMode} retryLabel="Play again" />
      </motion.div>
    )
  }

  const g = game.current
  const fieldHeight = isMobile ? 340 : 420

  return (
    <div>
      {/* HUD */}
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium tracking-[0.08em] text-faint uppercase">score</p>
          <p className={cn('text-2xl leading-none font-semibold tabular-nums sm:text-[28px]', phase === 'idle' ? 'text-faint' : 'text-accent')}>
            {formatNumber(g.score)}
          </p>
        </div>
        <div className="flex items-end gap-4 sm:gap-7">
          <HudItem label="level" value={String(g.level)} />
          <HudItem
            label="combo"
            value={<span className={cn(g.combo >= 5 && 'text-accent')}>{`×${multiplier(g.combo).toFixed(1)}`}</span>}
          />
          <HudItem
            label="lives"
            value={
              <span className="flex h-[1em] items-center gap-1" role="img" aria-label={`${g.lives} lives left`}>
                {Array.from({ length: preset.lives }, (_, i) => (
                  <Heart
                    key={i}
                    className={cn('size-[0.9em] transition-colors', i < g.lives ? 'fill-incorrect text-incorrect' : 'text-line-strong')}
                    aria-hidden
                  />
                ))}
              </span>
            }
          />
          <HudItem label="best" value={formatNumber(Math.max(best, g.score))} muted />
        </div>
      </div>

      {/* Playing field */}
      <div
        className="rush-field relative overflow-hidden rounded-2xl border border-line bg-bg-2/70"
        style={{ height: fieldHeight }}
        onMouseDown={(event) => {
          event.preventDefault()
          focusInput()
        }}
      >
        <AnimatePresence>
          {g.words.map((word) => {
            const matched = g.buffer && word.text.startsWith(g.buffer)
            const danger = word.progress > 0.72
            return (
              <motion.div
                key={word.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.25, filter: 'blur(2px)', transition: { duration: 0.22 } }}
                className={cn(
                  'absolute rounded-lg border px-2.5 py-1 font-mono text-[15px] whitespace-nowrap shadow-soft sm:text-base',
                  matched ? 'z-10 border-accent/70 bg-card' : danger ? 'border-incorrect/50 bg-card' : 'border-line-strong bg-card/90',
                )}
                style={{
                  left: `${((word.lane + 0.5) / lanes) * 100}%`,
                  top: `calc(${word.progress} * (100% - 2.25rem))`,
                  x: '-50%',
                }}
              >
                {matched ? (
                  <>
                    <span className="text-accent">{g.buffer}</span>
                    <span className="text-fg">{word.text.slice(g.buffer.length)}</span>
                  </>
                ) : (
                  <span className={danger ? 'text-incorrect' : 'text-fg/85'}>{word.text}</span>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>

        <AnimatePresence>
          {levelUp !== null && phase === 'running' && (
            <motion.div
              key={levelUp}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.25 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <span className="flex items-center gap-2 rounded-full border border-accent/40 bg-bg-2/90 px-4 py-1.5 text-sm font-semibold text-accent">
                <Zap className="size-4" aria-hidden />
                Level {levelUp}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Red flash when a word is missed */}
        {flash > 0 && (
          <motion.div
            key={flash}
            className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-incorrect/70 ring-inset"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            aria-hidden
          />
        )}

        {/* Danger line */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-incorrect/40" aria-hidden />

        {phase === 'idle' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
            <div className="max-w-sm text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl border border-line-strong bg-card text-accent">
                <Flame className="size-5" aria-hidden />
              </div>
              <h2 className="text-lg font-semibold text-fg">Rush</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Type the falling words before they reach the bottom. Completed words clear automatically, Space submits
                early. Mistakes cost points, missed words cost a life.
              </p>
              {best > 0 && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted">
                  <Trophy className="size-3.5 text-accent" aria-hidden />
                  High score <span className="font-semibold text-fg tabular-nums">{formatNumber(best)}</span>
                </p>
              )}
              <div className="mt-5 flex items-center justify-center gap-3">
                <Button variant="primary" icon={<Play className="size-4" aria-hidden />} onMouseDown={(e) => e.stopPropagation()} onClick={start}>
                  Start game
                </Button>
                <span className="hidden text-xs text-faint sm:inline">
                  or press <Kbd>space</Kbd>
                </span>
              </div>
            </div>
          </div>
        )}

        {(phase === 'paused' || (phase === 'running' && !focused)) && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/60 backdrop-blur-[2px]">
            <span className="flex items-center gap-2 rounded-full border border-line-strong bg-bg-2/95 px-4 py-2 text-sm text-muted shadow-soft">
              <Pause className="size-4 text-accent" aria-hidden />
              Paused. Click here or start typing to resume.
            </span>
          </div>
        )}

        <textarea
          ref={inputRef}
          className="capture-input"
          data-typing-capture="true"
          aria-label="Rush input. Type the falling words."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          rows={1}
          onKeyDown={onKeyDown}
          onInput={onInput}
          onCompositionEnd={onCompositionEnd}
          onPaste={(event) => event.preventDefault()}
          onFocus={() => {
            setFocused(true)
            if (phaseRef.current === 'paused') setPhase('running')
          }}
          onBlur={() => {
            setFocused(false)
            if (phaseRef.current === 'running') setPhase('paused')
          }}
        />
      </div>

      {/* Input line */}
      <motion.div
        animate={shake}
        className="mx-auto mt-4 flex h-12 max-w-md items-center gap-3 rounded-xl border border-line bg-card/60 px-4 font-mono text-lg"
        aria-live="off"
      >
        <span className="text-faint" aria-hidden>
          &rsaquo;
        </span>
        <span className="text-fg">{g.buffer}</span>
        <span className={cn('-ml-2 h-6 w-0.5 rounded-full bg-accent', phase === 'running' && focused && 'animate-pulse')} aria-hidden />
      </motion.div>

      <p className="mt-6 hidden items-center justify-center gap-2 text-xs text-faint sm:flex">
        <Kbd>space</Kbd>
        <span className="mr-3">submit</span>
        <Kbd>tab</Kbd> + <Kbd>enter</Kbd>
        <span className="mr-3">new game</span>
        <Kbd>esc</Kbd>
        <span>quit</span>
      </p>
    </div>
  )
}

function HudItem({ label, value, muted }: { label: string; value: ReactNode; muted?: boolean }) {
  return (
    <div className="flex flex-col items-end leading-none">
      <span className="text-[10px] font-medium tracking-[0.08em] text-faint uppercase">{label}</span>
      <span className={cn('mt-1 flex h-[1em] items-center text-base font-semibold tabular-nums sm:text-lg', muted ? 'text-muted' : 'text-fg')}>
        {value}
      </span>
    </div>
  )
}
