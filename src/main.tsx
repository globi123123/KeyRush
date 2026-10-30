import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import '@fontsource-variable/fira-code'
import '@fontsource-variable/roboto-mono'
import '@fontsource-variable/source-code-pro'
import './index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from './App'
import { ErrorBoundary } from './components/layout/ErrorBoundary'
import { AppProvider } from './store/app'
import { SettingsProvider } from './store/settings'
import { StatsProvider } from './store/stats'
import { ToastProvider } from './store/toast'

const root = document.getElementById('root')
if (!root) throw new Error('Root element missing')

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <SettingsProvider>
        <StatsProvider>
          <ToastProvider>
            <AppProvider>
              <HashRouter>
                <App />
              </HashRouter>
            </AppProvider>
          </ToastProvider>
        </StatsProvider>
      </SettingsProvider>
    </ErrorBoundary>
  </StrictMode>,
)
