import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'
import { ShortcutsDialog } from './components/layout/ShortcutsDialog'
import { PageLoader } from './components/ui/Spinner'
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts'
import { TestPage } from './pages/TestPage'
import { useSettings } from './store/settings'
import { useStats } from './store/stats'
import { useToast } from './store/toast'

const DailyPage = lazy(() => import('./pages/DailyPage').then((m) => ({ default: m.DailyPage })))
const StatsPage = lazy(() => import('./pages/StatsPage').then((m) => ({ default: m.StatsPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))

const TITLES: Record<string, string> = {
  '/': 'KeyRush',
  '/daily': 'Daily Challenge · KeyRush',
  '/stats': 'Statistics · KeyRush',
  '/settings': 'Settings · KeyRush',
}

export function App() {
  const location = useLocation()
  const { settings } = useSettings()
  const { saveFailed } = useStats()
  const toast = useToast()
  useGlobalShortcuts()

  useEffect(() => {
    document.title = TITLES[location.pathname] ?? 'KeyRush'
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  useEffect(() => {
    if (saveFailed) {
      toast('Your progress could not be saved', {
        tone: 'error',
        description: 'The browser storage is full or disabled. Results stay available until you close the tab.',
        duration: 6000,
      })
    }
  }, [saveFailed, toast])

  const motionProps = settings.reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -4 },
        transition: { duration: 0.22, ease: [0.25, 0.8, 0.3, 1] as const },
      }

  return (
    <MotionConfig reducedMotion={settings.reducedMotion ? 'always' : 'never'}>
      <div className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only-focusable fixed top-3 left-3 z-50 rounded-lg bg-card px-3 py-2 text-sm text-fg shadow-soft"
          onClick={(event) => {
            event.preventDefault()
            document.getElementById('main')?.focus()
          }}
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main" tabIndex={-1} className="flex flex-1 flex-col px-4 pt-8 pb-10 outline-none sm:px-6 sm:pt-14">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={location.pathname} className="flex flex-1 flex-col" {...motionProps}>
              <Suspense fallback={<PageLoader />}>
                <Routes location={location}>
                  <Route path="/" element={<TestPage />} />
                  <Route path="/daily" element={<DailyPage />} />
                  <Route path="/stats" element={<StatsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
        <Footer />
        <ShortcutsDialog />
      </div>
    </MotionConfig>
  )
}
