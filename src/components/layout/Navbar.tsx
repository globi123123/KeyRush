import { motion } from 'framer-motion'
import { BarChart3, CalendarDays, Command, Keyboard, Moon, Settings, Sun } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { dateKey } from '../../lib/date'
import { useApp } from '../../store/app'
import { useSettings } from '../../store/settings'
import { useStats } from '../../store/stats'
import { IconButton } from '../ui/Button'
import { Logo } from './Logo'

const LINKS = [
  { to: '/', label: 'Type', icon: Keyboard, end: true },
  { to: '/daily', label: 'Daily', icon: CalendarDays },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Navbar() {
  const { settings, update } = useSettings()
  const { focusMode, setShortcutsOpen } = useApp()
  const { stats } = useStats()
  const dailyDone = Boolean(stats.daily[dateKey()]?.completed)

  return (
    <motion.header
      animate={{ opacity: focusMode ? 0 : 1 }}
      transition={{ duration: 0.25 }}
      className={cn('sticky top-0 z-30 border-b border-line/60 bg-bg/80 backdrop-blur-md', focusMode && 'pointer-events-none')}
    >
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6" aria-label="Main">
        <NavLink to="/" className="flex shrink-0 items-center gap-2.5 rounded-lg" aria-label="KeyRush home">
          <Logo className="size-7" />
          <span className="hidden text-[15px] font-semibold tracking-tight text-fg sm:inline">
            Key<span className="text-accent">Rush</span>
          </span>
        </NavLink>

        <ul className="flex items-center gap-0.5">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                title={label}
                className={({ isActive }) =>
                  cn(
                    'relative flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm font-medium transition-colors sm:px-3',
                    isActive ? 'text-fg' : 'text-muted hover:text-fg',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-lg bg-card"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                        aria-hidden
                      />
                    )}
                    <Icon className={cn('relative size-4', isActive && 'text-accent')} aria-hidden />
                    <span className="relative z-10 sr-only sm:not-sr-only sm:relative">{label}</span>
                    {to === '/daily' && !dailyDone && (
                      <>
                        <span className="absolute top-1.5 right-1 z-10 size-1.5 rounded-full bg-accent" aria-hidden />
                        <span className="sr-only">(not completed today)</span>
                      </>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-0.5">
          <IconButton label="Keyboard shortcuts" onClick={() => setShortcutsOpen(true)} className="hidden sm:inline-flex">
            <Command className="size-4" />
          </IconButton>
          <IconButton
            label={settings.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={() => update('theme', settings.theme === 'dark' ? 'light' : 'dark')}
          >
            {settings.theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </IconButton>
        </div>
      </nav>
    </motion.header>
  )
}
