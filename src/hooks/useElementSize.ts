import { useLayoutEffect, useRef, useState } from 'react'

/** Tracks the content size of an element with a ResizeObserver. */
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => {
      const rect = element.getBoundingClientRect()
      setSize((prev) =>
        Math.round(prev.width) === Math.round(rect.width) && Math.round(prev.height) === Math.round(rect.height)
          ? prev
          : { width: rect.width, height: rect.height },
      )
    }
    update()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, size] as const
}
