import { Fragment } from 'react'
import { isMac } from '../../lib/keyboard'
import { useApp } from '../../store/app'
import { Dialog } from '../ui/Dialog'
import { Kbd } from '../ui/Kbd'

const mod = isMac ? '⌘' : 'Ctrl'

const GROUPS: { title: string; items: { keys: string[]; label: string }[] }[] = [
  {
    title: 'Test',
    items: [
      { keys: ['Tab', 'Enter'], label: 'Restart with a new text' },
      { keys: ['Esc'], label: 'Exit the current test' },
      { keys: ['Shift', 'Enter'], label: 'Finish a Zen session' },
      { keys: [mod, 'Backspace'], label: 'Delete the previous word' },
    ],
  },
  {
    title: 'Modes',
    items: [
      { keys: ['Alt', '1'], label: 'Classic mode' },
      { keys: ['Alt', '2'], label: 'Zen mode' },
      { keys: ['Alt', '3'], label: 'Code mode' },
      { keys: ['Alt', '4'], label: 'Rush mode' },
      { keys: ['Alt', '5'], label: 'Quote mode' },
    ],
  },
  {
    title: 'General',
    items: [
      { keys: [mod, ','], label: 'Open settings' },
      { keys: ['?'], label: 'Show this help (outside the typing area)' },
    ],
  },
]

export function ShortcutsDialog() {
  const { shortcutsOpen, setShortcutsOpen } = useApp()
  return (
    <Dialog
      open={shortcutsOpen}
      onClose={() => setShortcutsOpen(false)}
      title="Keyboard shortcuts"
      description="Mode shortcuts are paused while a test is running, so they never interrupt your typing."
    >
      <div className="space-y-5">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="mb-2 text-[11px] font-medium tracking-[0.08em] text-faint uppercase">{group.title}</h3>
            <ul className="divide-y divide-line rounded-xl border border-line bg-card/50">
              {group.items.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-4 px-3.5 py-2.5 text-sm">
                  <span className="text-muted">{item.label}</span>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-faint">
                    {item.keys.map((key, i) => (
                      <Fragment key={key}>
                        {i > 0 && <span>+</span>}
                        <Kbd>{key}</Kbd>
                      </Fragment>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Dialog>
  )
}
