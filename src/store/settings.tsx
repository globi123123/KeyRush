import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isRecord, readJSON, writeJSON } from '../lib/storage'
import {
  CLASSIC_DURATIONS,
  GAME_MODES,
  type CaretStyle,
  type ClassicDuration,
  type FontSize,
  type GameMode,
  type Theme,
  type TypingFont,
} from '../types'

export interface Settings {
  theme: Theme
  sound: boolean
  volume: number
  caretStyle: CaretStyle
  smoothCaret: boolean
  fontSize: FontSize
  fontFamily: TypingFont
  defaultMode: GameMode
  defaultDuration: ClassicDuration
  showLiveStats: boolean
  reducedMotion: boolean
}

const STORAGE_KEY = 'settings'

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  sound: false,
  volume: 0.5,
  caretStyle: 'line',
  smoothCaret: true,
  fontSize: 'md',
  fontFamily: 'jetbrains',
  defaultMode: 'classic',
  defaultDuration: 30,
  showLiveStats: true,
  reducedMotion: false,
}

export const FONT_SIZES: Record<FontSize, { label: string; px: number; mobilePx: number }> = {
  sm: { label: 'Small', px: 20, mobilePx: 17 },
  md: { label: 'Medium', px: 24, mobilePx: 19 },
  lg: { label: 'Large', px: 28, mobilePx: 21 },
  xl: { label: 'Extra large', px: 32, mobilePx: 23 },
}

export const TYPING_FONTS: Record<TypingFont, { label: string; stack: string }> = {
  jetbrains: { label: 'JetBrains Mono', stack: "'JetBrains Mono Variable'" },
  fira: { label: 'Fira Code', stack: "'Fira Code Variable'" },
  roboto: { label: 'Roboto Mono', stack: "'Roboto Mono Variable'" },
  source: { label: 'Source Code Pro', stack: "'Source Code Pro Variable'" },
  system: { label: 'System mono', stack: 'ui-monospace' },
}

const oneOf = <T,>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback

/** Merges stored data with defaults and drops anything invalid. */
function sanitize(raw: unknown): Settings {
  const d = { ...DEFAULT_SETTINGS, reducedMotion: prefersReducedMotion() }
  if (!isRecord(raw)) return d
  return {
    theme: oneOf(raw.theme, ['dark', 'light'] as const, d.theme),
    sound: typeof raw.sound === 'boolean' ? raw.sound : d.sound,
    volume: typeof raw.volume === 'number' && raw.volume >= 0 && raw.volume <= 1 ? raw.volume : d.volume,
    caretStyle: oneOf(raw.caretStyle, ['line', 'block', 'underline'] as const, d.caretStyle),
    smoothCaret: typeof raw.smoothCaret === 'boolean' ? raw.smoothCaret : d.smoothCaret,
    fontSize: oneOf(raw.fontSize, ['sm', 'md', 'lg', 'xl'] as const, d.fontSize),
    fontFamily: oneOf(raw.fontFamily, Object.keys(TYPING_FONTS) as TypingFont[], d.fontFamily),
    defaultMode: oneOf(raw.defaultMode, GAME_MODES, d.defaultMode),
    defaultDuration: oneOf(raw.defaultDuration, CLASSIC_DURATIONS, d.defaultDuration),
    showLiveStats: typeof raw.showLiveStats === 'boolean' ? raw.showLiveStats : d.showLiveStats,
    reducedMotion: typeof raw.reducedMotion === 'boolean' ? raw.reducedMotion : d.reducedMotion,
  }
}

interface SettingsContextValue {
  settings: Settings
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  reset: () => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => sanitize(readJSON<unknown>(STORAGE_KEY, null)))

  useEffect(() => {
    writeJSON(STORAGE_KEY, settings)
  }, [settings])

  // Apply visual settings to the document.
  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = settings.theme
    root.dataset.reducedMotion = String(settings.reducedMotion)
    root.style.setProperty('--kr-typing-font', TYPING_FONTS[settings.fontFamily].stack)
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', settings.theme === 'dark' ? '#111214' : '#f6f5f2')
  }, [settings.theme, settings.reducedMotion, settings.fontFamily])

  // Keep multiple tabs in sync.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === `keyrush:${STORAGE_KEY}` && event.newValue) {
        try {
          setSettings(sanitize(JSON.parse(event.newValue)))
        } catch {
          /* ignore malformed data */
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }))
  }, [])

  const reset = useCallback(() => setSettings({ ...DEFAULT_SETTINGS, reducedMotion: prefersReducedMotion() }), [])

  const value = useMemo(() => ({ settings, update, reset }), [settings, update, reset])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}
