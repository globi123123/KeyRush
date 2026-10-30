/**
 * Keyboard helpers shared by the typing views and the global shortcuts.
 */

let tabDown = false
let tabPressedAt = 0

if (typeof window !== 'undefined') {
  window.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Tab') {
        tabDown = true
        tabPressedAt = performance.now()
      }
    },
    true,
  )
  const release = () => {
    tabDown = false
  }
  window.addEventListener('keyup', (event) => event.key === 'Tab' && release(), true)
  window.addEventListener('blur', release)
}

/** True while Tab is held, or shortly after it was pressed inside the typing area. */
export function isTabArmed(windowMs = 0): boolean {
  return tabDown || (windowMs > 0 && performance.now() - tabPressedAt < windowMs)
}

export function disarmTab() {
  tabPressedAt = 0
}

/** Elements where keystrokes belong to the element, not to our shortcuts. */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.dataset.typingCapture === 'true') return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

/** Whether the platform uses the Command key for shortcuts. */
export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent)
