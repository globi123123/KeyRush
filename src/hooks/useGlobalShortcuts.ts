import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isEditableTarget } from '../lib/keyboard'
import { useApp } from '../store/app'
import { GAME_MODES } from '../types'

/**
 * App wide shortcuts. Test specific keys (Tab + Enter, Esc) are handled by
 * the active test itself. Mode shortcuts are ignored while a test is running
 * so that Alt combinations used for typing special characters keep working.
 */
export function useGlobalShortcuts() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setMode, testStatus, setShortcutsOpen } = useApp()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || document.querySelector('[data-dialog-open]')) return

      // Ctrl/Cmd + , opens the settings.
      if ((event.ctrlKey || event.metaKey) && !event.altKey && (event.key === ',' || event.code === 'Comma')) {
        event.preventDefault()
        navigate('/settings')
        return
      }

      // Alt + 1..5 switches the game mode. AltGr (Ctrl + Alt) is left alone.
      if (event.altKey && !event.ctrlKey && !event.metaKey && /^Digit[1-5]$/.test(event.code)) {
        if (testStatus === 'running') return
        event.preventDefault()
        setMode(GAME_MODES[Number(event.code.slice(5)) - 1])
        if (location.pathname !== '/') navigate('/')
        return
      }

      // "?" opens the help, unless the user is typing.
      if (event.key === '?' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const target = event.target as HTMLElement | null
        if (isEditableTarget(target) || target?.dataset.typingCapture === 'true') return
        event.preventDefault()
        setShortcutsOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [location.pathname, navigate, setMode, setShortcutsOpen, testStatus])
}
