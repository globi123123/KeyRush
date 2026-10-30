import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    try {
      return window.matchMedia(query).matches
    } catch {
      return false
    }
  })

  useEffect(() => {
    let media: MediaQueryList
    try {
      media = window.matchMedia(query)
    } catch {
      return
    }
    const onChange = () => setMatches(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])

  return matches
}
