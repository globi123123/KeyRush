import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CategoryFilter, DifficultyFilter } from '../content'
import type { CodeLanguage, PassageCategory, QuoteCategory } from '../content/types'
import type { ClassicDuration, ClassicSource, GameMode, LengthFilter, ZenLength } from '../types'
import { useSettings } from './settings'

export type TestStatus = 'idle' | 'running' | 'finished'
export type RushDifficulty = 'relaxed' | 'normal' | 'intense'

export interface ModeConfig {
  classic: {
    duration: ClassicDuration
    source: ClassicSource
    category: CategoryFilter<PassageCategory>
    difficulty: DifficultyFilter
  }
  zen: { length: ZenLength; category: CategoryFilter<PassageCategory>; difficulty: DifficultyFilter }
  code: { language: CategoryFilter<CodeLanguage> }
  quote: { length: LengthFilter; category: CategoryFilter<QuoteCategory> }
  rush: { difficulty: RushDifficulty }
}

interface AppContextValue {
  mode: GameMode
  setMode: (mode: GameMode) => void
  config: ModeConfig
  updateConfig: <M extends keyof ModeConfig>(mode: M, patch: Partial<ModeConfig[M]>) => void
  /** Status of the test currently on screen. Used for focus mode and shortcut handling. */
  testStatus: TestStatus
  setTestStatus: (status: TestStatus) => void
  /** True while typing: surrounding interface fades out until the mouse moves. */
  focusMode: boolean
  shortcutsOpen: boolean
  setShortcutsOpen: (open: boolean) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings()
  const [mode, setModeState] = useState<GameMode>(settings.defaultMode)
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [mouseActive, setMouseActive] = useState(true)
  const [config, setConfig] = useState<ModeConfig>(() => ({
    classic: { duration: settings.defaultDuration, source: 'words', category: 'all', difficulty: 'any' },
    zen: { length: 'medium', category: 'all', difficulty: 'any' },
    code: { language: 'all' },
    quote: { length: 'random', category: 'all' },
    rush: { difficulty: 'normal' },
  }))

  const setMode = useCallback((next: GameMode) => setModeState(next), [])

  const updateConfig = useCallback(<M extends keyof ModeConfig>(target: M, patch: Partial<ModeConfig[M]>) => {
    setConfig((prev) => ({ ...prev, [target]: { ...prev[target], ...patch } }))
  }, [])

  // A changed default duration applies right away.
  useEffect(() => {
    updateConfig('classic', { duration: settings.defaultDuration })
  }, [settings.defaultDuration, updateConfig])

  // Focus mode: hide the chrome while typing, show it again on mouse movement.
  useEffect(() => {
    if (testStatus !== 'running') {
      setMouseActive(true)
      return
    }
    setMouseActive(false)
    let lastX = -1
    let lastY = -1
    const onMove = (event: MouseEvent) => {
      // Ignore tiny jitter and synthetic events fired without real movement.
      if (lastX >= 0 && Math.abs(event.clientX - lastX) + Math.abs(event.clientY - lastY) > 4) setMouseActive(true)
      lastX = event.clientX
      lastY = event.clientY
    }
    const onKey = () => setMouseActive(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('keydown', onKey)
    }
  }, [testStatus])

  const focusMode = testStatus === 'running' && !mouseActive

  const value = useMemo(
    () => ({
      mode,
      setMode,
      config,
      updateConfig,
      testStatus,
      setTestStatus,
      focusMode,
      shortcutsOpen,
      setShortcutsOpen,
    }),
    [mode, setMode, config, updateConfig, testStatus, focusMode, shortcutsOpen],
  )
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
