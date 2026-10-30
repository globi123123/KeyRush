import { Keyboard, Moon, RotateCcw, Sun, Trash2, Volume2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { TypingText } from '../components/typing/TypingText'
import { Button } from '../components/ui/Button'
import { Segmented } from '../components/ui/Segmented'
import { Select } from '../components/ui/Select'
import { Switch } from '../components/ui/Switch'
import { librarySize } from '../content'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { MODE_INFO } from '../lib/modes'
import { playSound } from '../lib/sound'
import { storageAvailable } from '../lib/storage'
import { useApp } from '../store/app'
import { FONT_SIZES, TYPING_FONTS, useSettings } from '../store/settings'
import { useToast } from '../store/toast'
import { CLASSIC_DURATIONS, GAME_MODES, type FontSize, type TypingFont } from '../types'

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-line py-8 first:border-t-0 first:pt-0 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-10">
      <div>
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <div className="divide-y divide-line rounded-2xl border border-line bg-card/50">{children}</div>
    </section>
  )
}

function Row({ label, description, htmlFor, children }: { label: string; description?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-5">
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="text-sm font-medium text-fg">
          {label}
        </label>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
  )
}

const PREVIEW_TEXT = 'Quiet focus turns practice into progress, one key at a time.'
/** Shows correct characters, one mistake and the caret position. */
const PREVIEW_TYPED = `${PREVIEW_TEXT.slice(0, 22)}x`

export function SettingsPage() {
  const { settings, update, reset } = useSettings()
  const { setShortcutsOpen } = useApp()
  const toast = useToast()
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 639px)')
  const size = FONT_SIZES[settings.fontSize]

  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="mb-8">
        <p className="text-xs font-medium tracking-[0.08em] text-accent uppercase">Preferences</p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-fg">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          {storageAvailable
            ? 'Changes are saved automatically in this browser.'
            : 'Storage is unavailable in this browser, so changes last until you close the tab.'}
        </p>
      </header>

      {/* Live preview */}
      <div className="mb-10 rounded-2xl border border-line bg-bg-2/60 px-5 py-6 sm:px-7" aria-label="Typing preview">
        <p className="mb-3 text-[11px] font-medium tracking-[0.08em] text-faint uppercase">Preview</p>
        <TypingText
          target={PREVIEW_TEXT}
          typed={PREVIEW_TYPED}
          fontPx={isMobile ? size.mobilePx : size.px}
          caretStyle={settings.caretStyle}
          smoothCaret={settings.smoothCaret}
          showCaret
          visibleLines={2}
          anchorLine={0}
          reducedMotion={settings.reducedMotion}
        />
      </div>

      <Section title="Appearance" description="Theme, typography and caret.">
        <Row label="Theme" description="Dark is the default.">
          <Segmented
            id="theme"
            label="Theme"
            value={settings.theme}
            onChange={(theme) => update('theme', theme)}
            options={[
              { value: 'dark', label: 'Dark', icon: <Moon className="size-3.5" aria-hidden /> },
              { value: 'light', label: 'Light', icon: <Sun className="size-3.5" aria-hidden /> },
            ]}
          />
        </Row>
        <Row label="Typing font" description="Monospace font used in the typing area." htmlFor="font-family">
          <Select<TypingFont>
            id="font-family"
            label="Typing font"
            value={settings.fontFamily}
            onChange={(font) => update('fontFamily', font)}
            options={Object.entries(TYPING_FONTS).map(([value, font]) => ({ value: value as TypingFont, label: font.label }))}
            className="w-48"
          />
        </Row>
        <Row label="Font size">
          <Segmented<FontSize>
            id="font-size"
            label="Font size"
            value={settings.fontSize}
            onChange={(fontSize) => update('fontSize', fontSize)}
            options={(Object.keys(FONT_SIZES) as FontSize[]).map((key) => ({
              value: key,
              label: key.toUpperCase(),
              title: FONT_SIZES[key].label,
            }))}
          />
        </Row>
        <Row label="Caret style">
          <Segmented
            id="caret-style"
            label="Caret style"
            value={settings.caretStyle}
            onChange={(caretStyle) => update('caretStyle', caretStyle)}
            options={[
              { value: 'line', label: 'Line' },
              { value: 'block', label: 'Block' },
              { value: 'underline', label: 'Underline' },
            ]}
          />
        </Row>
        <Row label="Smooth caret" description="Glide the caret between characters." htmlFor="smooth-caret">
          <Switch id="smooth-caret" label="Smooth caret" checked={settings.smoothCaret} onChange={(v) => update('smoothCaret', v)} />
        </Row>
      </Section>

      <Section title="Typing" description="Defaults used when KeyRush starts.">
        <Row label="Default game mode" htmlFor="default-mode">
          <Select
            id="default-mode"
            label="Default game mode"
            value={settings.defaultMode}
            onChange={(mode) => update('defaultMode', mode)}
            options={GAME_MODES.map((mode) => ({ value: mode, label: MODE_INFO[mode].label }))}
            className="w-48"
          />
        </Row>
        <Row label="Default test duration" description="Used by Classic mode.">
          <Segmented
            id="default-duration"
            label="Default test duration"
            value={settings.defaultDuration}
            onChange={(duration) => update('defaultDuration', duration)}
            options={CLASSIC_DURATIONS.map((d) => ({ value: d, label: `${d}s` }))}
          />
        </Row>
        <Row label="Live statistics" description="Show WPM, accuracy, CPM and errors while typing." htmlFor="live-stats">
          <Switch id="live-stats" label="Live statistics" checked={settings.showLiveStats} onChange={(v) => update('showLiveStats', v)} />
        </Row>
        <Row label="Reduced motion" description="Minimise animations and transitions." htmlFor="reduced-motion">
          <Switch id="reduced-motion" label="Reduced motion" checked={settings.reducedMotion} onChange={(v) => update('reducedMotion', v)} />
        </Row>
      </Section>

      <Section title="Sound" description="Subtle synthesised feedback. Off by default.">
        <Row label="Sound effects" description="Key clicks, errors and finish chimes." htmlFor="sound">
          <Switch id="sound" label="Sound effects" checked={settings.sound} onChange={(v) => update('sound', v)} />
        </Row>
        <Row label="Volume" htmlFor="volume">
          <div className="flex items-center gap-3">
            <input
              id="volume"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              disabled={!settings.sound}
              onChange={(event) => update('volume', Number(event.target.value))}
              className="w-36 accent-[var(--kr-accent)] disabled:opacity-40"
            />
            <Button
              size="sm"
              variant="ghost"
              disabled={!settings.sound}
              icon={<Volume2 className="size-3.5" aria-hidden />}
              onClick={() => playSound('finish', settings.volume)}
            >
              Test
            </Button>
          </div>
        </Row>
      </Section>

      <Section title="General" description="Shortcuts, data and the text library.">
        <Row label="Keyboard shortcuts" description="Restart, exit and switch modes without the mouse.">
          <Button size="sm" icon={<Keyboard className="size-3.5" aria-hidden />} onClick={() => setShortcutsOpen(true)}>
            View shortcuts
          </Button>
        </Row>
        <Row label="Reset settings" description="Restore all preferences to their defaults.">
          <Button
            size="sm"
            icon={<RotateCcw className="size-3.5" aria-hidden />}
            onClick={() => {
              reset()
              toast('Settings restored to defaults', { tone: 'success' })
            }}
          >
            Reset
          </Button>
        </Row>
        <Row label="Statistics" description="Review or reset your saved results.">
          <Button size="sm" variant="ghost" icon={<Trash2 className="size-3.5" aria-hidden />} onClick={() => navigate('/stats')}>
            Manage statistics
          </Button>
        </Row>
        <Row
          label="Text library"
          description={`${librarySize.passages} passages, ${librarySize.snippets} code snippets and ${librarySize.quotes} quotations, all built in.`}
        >
          <span className="text-xs text-faint">Bundled with the app</span>
        </Row>
      </Section>
    </div>
  )
}
