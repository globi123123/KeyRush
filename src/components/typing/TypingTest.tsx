import { AnimatePresence, motion } from 'framer-motion'
import { Flag, MousePointerClick, RotateCcw } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CompositionEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { highlight } from '../../engine/highlight'
import { buildResult, isResultValid } from '../../engine/result'
import { TypingSession } from '../../engine/session'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { cn } from '../../lib/cn'
import { disarmTab, isEditableTarget, isTabArmed } from '../../lib/keyboard'
import { playSound } from '../../lib/sound'
import { useApp } from '../../store/app'
import { FONT_SIZES, useSettings } from '../../store/settings'
import { useStats } from '../../store/stats'
import { useToast } from '../../store/toast'
import type { GameMode, PersonalBest, TestResult } from '../../types'
import { ResultsScreen } from '../results/ResultsScreen'
import { Kbd } from '../ui/Kbd'
import { LiveStats } from './LiveStats'
import { TextAttribution } from './TextAttribution'
import type { CompletedTest, TestDefinition, TextPayload } from './types'
import { TypingText } from './TypingText'

interface TypingTestProps {
  definition: TestDefinition
  /** Called after a valid result was saved. */
  onSaved?: (result: TestResult) => void
  onChangeMode?: (mode: GameMode) => void
}

type Phase = 'ready' | 'running' | 'finished'

export function TypingTest({ definition, onSaved, onChangeMode }: TypingTestProps) {
  const { settings } = useSettings()
  const { setTestStatus } = useApp()
  const { addResult } = useStats()
  const toast = useToast()
  const isMobile = useMediaQuery('(max-width: 639px)')
  const descriptionId = useId()

  const definitionRef = useRef(definition)
  definitionRef.current = definition
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const onSavedRef = useRef(onSaved)
  onSavedRef.current = onSaved

  const [payload, setPayload] = useState<TextPayload>(() => definition.create())
  const createSession = useCallback(
    (next: TextPayload) => new TypingSession(next.text, { autoIndent: Boolean(next.language) }),
    [],
  )
  const sessionRef = useRef<TypingSession | null>(null)
  if (sessionRef.current === null) sessionRef.current = createSession(payload)

  const [version, bump] = useReducer((n: number) => n + 1, 0)
  const [phase, setPhaseState] = useState<Phase>('ready')
  const phaseRef = useRef<Phase>('ready')
  const [completed, setCompleted] = useState<CompletedTest | null>(null)
  const [focused, setFocused] = useState(false)
  const [showBlurHint, setShowBlurHint] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const setPhase = useCallback((next: Phase) => {
    phaseRef.current = next
    setPhaseState(next)
  }, [])

  const focusInput = useCallback(() => {
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  /* ---------------------------------------------------------------- */
  /*  Lifecycle                                                        */
  /* ---------------------------------------------------------------- */

  const reset = useCallback(
    (next: TextPayload) => {
      sessionRef.current = createSession(next)
      setPayload(next)
      setCompleted(null)
      setPhase('ready')
      bump()
      requestAnimationFrame(focusInput)
    },
    [createSession, focusInput, setPhase],
  )

  const payloadRef = useRef(payload)
  payloadRef.current = payload

  const retry = useCallback(() => reset({ ...payloadRef.current }), [reset])
  const newText = useCallback(() => {
    const def = definitionRef.current
    reset(def.fixedText ? { ...payloadRef.current } : def.create())
  }, [reset])

  const finish = useCallback(() => {
    const session = sessionRef.current
    if (!session || session.finished || !session.started || phaseRef.current !== 'running') return
    const def = definitionRef.current
    const now = performance.now()
    const startedAt = session.startedAt ?? now
    const end = def.timeLimit ? Math.min(now, startedAt + def.timeLimit * 1000) : now
    session.finish(end)
    const stats = session.stats(end)
    const result = buildResult({
      mode: def.mode,
      config: def.describe?.(payloadRef.current) ?? def.configLabel,
      recordKey: def.recordKey,
      stats,
      samples: session.samples,
      textId: payloadRef.current.id,
    })

    const valid = isResultValid(stats)
    let isRecord = false
    let previousBest: PersonalBest | null = null
    if (valid) {
      const outcome = addResult(result)
      previousBest = outcome.previousBest
      isRecord = outcome.isRecord && previousBest !== null
      onSavedRef.current?.(result)
    }

    const s = settingsRef.current
    if (s.sound) playSound(isRecord ? 'record' : 'finish', s.volume)
    if (isRecord) {
      toast('New personal best', { tone: 'record', description: `${Math.round(result.wpm)} WPM \u00b7 ${result.config}` })
    } else if (!valid) {
      toast('Test too short to be saved', { description: 'Type a little longer for it to count in your statistics.' })
    }

    setCompleted({ result, saved: valid, isRecord, previousBest, meta: payloadRef.current.meta })
    setPhase('finished')
    bump()
  }, [addResult, setPhase, toast])

  /** Escape: abort a running test, or leave the results screen. */
  const exit = useCallback(() => {
    if (phaseRef.current === 'running') {
      retry()
      toast('Test cancelled')
    } else if (phaseRef.current === 'finished') {
      newText()
    }
  }, [newText, retry, toast])

  const restart = useCallback(() => {
    disarmTab()
    newText()
  }, [newText])

  // Report the status to the app (focus mode, shortcut handling).
  useEffect(() => {
    setTestStatus(phase === 'ready' ? 'idle' : phase)
  }, [phase, setTestStatus])
  useEffect(() => () => setTestStatus('idle'), [setTestStatus])

  // Timer: ends timed tests and keeps the per-second samples up to date.
  useEffect(() => {
    if (phase !== 'running') return
    const id = window.setInterval(() => {
      const session = sessionRef.current
      if (!session) return
      const now = performance.now()
      session.recordSamples(now)
      const limit = definitionRef.current.timeLimit
      if (limit && session.elapsed(now) >= limit) finish()
    }, 50)
    return () => window.clearInterval(id)
  }, [phase, finish])

  // Focus the typing area on mount.
  useEffect(() => {
    const frame = requestAnimationFrame(focusInput)
    return () => cancelAnimationFrame(frame)
  }, [focusInput])

  // Only show the "click to focus" hint after a short delay to avoid flicker.
  useEffect(() => {
    if (focused || phase === 'finished') {
      setShowBlurHint(false)
      return
    }
    const timer = window.setTimeout(() => setShowBlurHint(true), 350)
    return () => window.clearTimeout(timer)
  }, [focused, phase])

  /* ---------------------------------------------------------------- */
  /*  Keyboard                                                         */
  /* ---------------------------------------------------------------- */

  const handleChar = useCallback(
    (char: string) => {
      const session = sessionRef.current
      if (phaseRef.current === 'finished' || !session) return
      const def = definitionRef.current
      const wasStarted = session.started
      const outcome = session.input(char, performance.now())
      if (outcome === 'ignored') return
      if (!wasStarted) setPhase('running')

      const s = settingsRef.current
      if (s.sound) playSound(outcome === 'correct' ? 'key' : 'error', s.volume)

      if (def.more && session.target.length - session.position < 220) session.extend(def.more())
      bump()
      if (session.complete) finish()
    },
    [finish, setPhase],
  )

  const handleBackspace = useCallback((word: boolean) => {
    if (phaseRef.current === 'finished') return
    if (sessionRef.current?.backspace(word)) bump()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (document.querySelector('[data-dialog-open]')) return
      const inCapture = event.target === inputRef.current

      if (event.key === 'Enter' && !event.isComposing && isTabArmed(inCapture ? 1000 : 0)) {
        event.preventDefault()
        event.stopPropagation()
        restart()
        return
      }
      if (event.key === 'Escape') {
        if (phaseRef.current === 'ready') return
        event.preventDefault()
        exit()
        return
      }
      if (event.key === 'Enter' && event.shiftKey && definitionRef.current.manualFinish && phaseRef.current === 'running') {
        event.preventDefault()
        event.stopPropagation()
        finish()
        return
      }
      // Typing anywhere on the page focuses the typing area.
      if (
        !inCapture &&
        phaseRef.current !== 'finished' &&
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
  }, [exit, finish, focusInput, restart])

  const onKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) return
    switch (event.key) {
      case 'Tab':
        // Tab is reserved for Tab + Enter (restart) while typing.
        event.preventDefault()
        break
      case 'Enter':
        event.preventDefault()
        if (payloadRef.current.language) handleChar('\n')
        break
      case 'Backspace':
        event.preventDefault()
        handleBackspace(event.ctrlKey || event.altKey || event.metaKey)
        break
    }
  }

  const onInput = (event: FormEvent<HTMLTextAreaElement>) => {
    const native = event.nativeEvent as InputEvent
    const element = event.currentTarget
    if (native.isComposing) return
    switch (native.inputType) {
      case 'insertText':
      case 'insertReplacementText':
        for (const char of native.data ?? element.value) handleChar(char)
        break
      case 'insertLineBreak':
      case 'insertParagraph':
        if (payloadRef.current.language) handleChar('\n')
        break
      case 'deleteContentBackward':
        handleBackspace(false)
        break
      case 'deleteWordBackward':
        handleBackspace(true)
        break
    }
    element.value = ''
  }

  const onCompositionEnd = (event: CompositionEvent<HTMLTextAreaElement>) => {
    for (const char of event.data) handleChar(char)
    event.currentTarget.value = ''
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  const session = sessionRef.current as TypingSession
  const tokens = useMemo(
    () => (payload.language ? highlight(payload.text, payload.language) : undefined),
    [payload.text, payload.language],
  )
  const code = Boolean(definition.code || payload.language)
  const size = FONT_SIZES[settings.fontSize]
  const basePx = isMobile ? size.mobilePx : size.px
  const fontPx = code ? Math.round(basePx * 0.72) : basePx
  const meta = payload.meta

  return (
    <AnimatePresence mode="wait" initial={false}>
      {phase === 'finished' && completed ? (
        <motion.div
          key="results"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <ResultsScreen
            completed={completed}
            onRetry={retry}
            onNewText={newText}
            onChangeMode={onChangeMode}
            fixedText={definition.fixedText}
          />
        </motion.div>
      ) : (
        <motion.div
          key="test"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <LiveStats
            session={session}
            phase={phase}
            timeLimit={definition.timeLimit}
            showMetrics={settings.showLiveStats}
            version={version}
            progressStyle={definition.progressStyle ?? (code ? 'percent' : 'words')}
          />

          <div
            className={cn('relative', code && 'rounded-2xl border border-line bg-bg-2/60 px-4 py-4 sm:px-6 sm:py-5')}
            onMouseDown={(event) => {
              // Keep focus in the typing area and prevent text selection.
              event.preventDefault()
              focusInput()
            }}
          >
            {code && meta?.title && (
              <div className="mb-3 flex items-center justify-between gap-3 text-xs text-faint" aria-hidden>
                <span className="font-medium text-muted">{meta.title}</span>
                <span className="rounded-md border border-line px-1.5 py-0.5 font-medium">{meta.label}</span>
              </div>
            )}
            <div
              className={cn(
                'transition-[filter,opacity] duration-300',
                showBlurHint && !focused ? 'opacity-35 blur-[3px]' : 'opacity-100',
              )}
            >
              <TypingText
                target={session.target}
                typed={session.typed}
                tokens={tokens}
                code={code}
                fontPx={fontPx}
                caretStyle={settings.caretStyle}
                smoothCaret={settings.smoothCaret}
                showCaret={focused || !showBlurHint}
                visibleLines={code ? (isMobile ? 8 : 11) : 3}
                anchorLine={code ? 3 : 1}
                reducedMotion={settings.reducedMotion}
              />
            </div>

            <textarea
              ref={inputRef}
              className="capture-input"
              data-typing-capture="true"
              aria-label="Typing input"
              aria-describedby={descriptionId}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              rows={1}
              onKeyDown={onKeyDown}
              onInput={onInput}
              onCompositionEnd={onCompositionEnd}
              onPaste={(event) => event.preventDefault()}
              onDrop={(event) => event.preventDefault()}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            <p id={descriptionId} className="sr-only">
              {`Type the following text: ${payload.text}`}
            </p>

            <AnimatePresence>
              {showBlurHint && !focused && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center"
                >
                  <span className="flex items-center gap-2 rounded-full border border-line-strong bg-bg-2/90 px-4 py-2 text-sm text-muted shadow-soft">
                    <MousePointerClick className="size-4 text-accent" aria-hidden />
                    Click here or start typing to focus
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 flex min-h-10 flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 text-[13px] text-faint">
              {!code && meta && <TextAttribution meta={meta} />}
            </div>
            <div className="flex items-center gap-1.5">
              {definition.manualFinish && phase === 'running' && (
                <button
                  type="button"
                  onClick={finish}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-muted transition-colors hover:bg-card hover:text-fg"
                  title="Finish (Shift + Enter)"
                >
                  <Flag className="size-3.5" aria-hidden />
                  Finish
                </button>
              )}
              <button
                type="button"
                onClick={restart}
                className="group inline-flex h-9 items-center gap-2 rounded-lg px-3 text-[13px] font-medium text-muted transition-colors hover:bg-card hover:text-fg"
                title="Restart with a new text (Tab + Enter)"
              >
                <RotateCcw className="size-3.5 transition-transform duration-300 group-hover:-rotate-90" aria-hidden />
                Restart
              </button>
            </div>
          </div>

          <p className="mt-8 hidden items-center justify-center gap-2 text-xs text-faint sm:flex">
            <Kbd>tab</Kbd> + <Kbd>enter</Kbd>
            <span className="mr-3">restart</span>
            <Kbd>esc</Kbd>
            <span className={cn(definition.manualFinish && 'mr-3')}>exit test</span>
            {definition.manualFinish && (
              <>
                <Kbd>shift</Kbd> + <Kbd>enter</Kbd>
                <span>finish</span>
              </>
            )}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
