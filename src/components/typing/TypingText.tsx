import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Token } from '../../engine/highlight'
import { cn } from '../../lib/cn'
import type { CaretStyle } from '../../types'

interface Segment {
  start: number
  text: string
  tokens?: Token[]
  /** Segment is a single line break. */
  newline: boolean
}

/** Splits the text into words (with their trailing spaces) and line breaks. */
function segment(text: string, tokens?: Token[]): Segment[] {
  const segments: Segment[] = []
  let i = 0
  while (i < text.length) {
    const start = i
    if (text[i] === '\n') {
      segments.push({ start, text: '\n', tokens: tokens?.slice(start, start + 1), newline: true })
      i++
      continue
    }
    while (i < text.length && text[i] !== ' ' && text[i] !== '\n') i++
    while (i < text.length && text[i] === ' ') i++
    segments.push({ start, text: text.slice(start, i), tokens: tokens?.slice(start, i), newline: false })
  }
  return segments
}

interface WordProps {
  text: string
  start: number
  typed: string
  tokens?: Token[]
}

const Word = memo(function Word({ text, start, typed, tokens }: WordProps) {
  return (
    <span className="word">
      {Array.from(text, (char, i) => {
        const t = typed[i]
        const state = t === undefined ? '' : t === char ? ' ok' : ' bad'
        const space = char === ' ' ? ' sp' : ''
        const tok = tokens ? ` tok-${tokens[i]}` : ''
        return (
          <span key={i} data-i={start + i} className={`ch${state}${space}${tok}`}>
            {char}
          </span>
        )
      })}
    </span>
  )
})

const LineBreak = memo(function LineBreak({ start, typed }: { start: number; typed: string }) {
  const state = typed === '' ? '' : typed === '\n' ? ' ok' : ' bad'
  return (
    <>
      <span data-i={start} className={`ch nl${state}`} aria-hidden>
        {'↵'}
      </span>
      <br />
    </>
  )
})

interface TypingTextProps {
  target: string
  typed: string
  tokens?: Token[]
  code?: boolean
  fontPx: number
  caretStyle: CaretStyle
  smoothCaret: boolean
  showCaret: boolean
  visibleLines: number
  /** Line (0-based) the caret is kept on while scrolling. */
  anchorLine: number
  reducedMotion: boolean
}

interface CaretBox {
  left: number
  top: number
  width: number
  height: number
}

export function TypingText({
  target,
  typed,
  tokens,
  code = false,
  fontPx,
  caretStyle,
  smoothCaret,
  showCaret,
  visibleLines,
  anchorLine,
  reducedMotion,
}: TypingTextProps) {
  const lineHeight = Math.round(fontPx * (code ? 1.55 : 1.65))
  const contentRef = useRef<HTMLDivElement>(null)
  const [caret, setCaret] = useState<CaretBox | null>(null)
  const [offset, setOffset] = useState(0)
  const [totalLines, setTotalLines] = useState(visibleLines)
  const [layoutTick, setLayoutTick] = useState(0)
  const [typing, setTyping] = useState(false)

  const segments = useMemo(() => segment(target, tokens), [target, tokens])
  const position = typed.length

  // Re-measure when fonts finish loading or the container resizes.
  useEffect(() => {
    let cancelled = false
    document.fonts?.ready.then(() => !cancelled && setLayoutTick((n) => n + 1))
    const element = contentRef.current
    if (!element || typeof ResizeObserver === 'undefined') return
    let lastWidth = element.offsetWidth
    const observer = new ResizeObserver(() => {
      if (element.offsetWidth !== lastWidth) {
        lastWidth = element.offsetWidth
        setLayoutTick((n) => n + 1)
      }
    })
    observer.observe(element)
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [])

  // Blink only while the user is not typing.
  useEffect(() => {
    if (position === 0) return
    setTyping(true)
    const timer = window.setTimeout(() => setTyping(false), 650)
    return () => window.clearTimeout(timer)
  }, [position])

  useLayoutEffect(() => {
    const content = contentRef.current
    if (!content) return
    const first = content.querySelector<HTMLElement>('[data-i="0"]')
    if (!first) return
    const atEnd = position >= target.length
    const span = content.querySelector<HTMLElement>(`[data-i="${atEnd ? target.length - 1 : position}"]`)
    if (!span) return
    const lastSpan = content.querySelector<HTMLElement>(`[data-i="${target.length - 1}"]`)

    const baseTop = first.offsetTop
    const line = Math.round((span.offsetTop - baseTop) / lineHeight)
    const lines = lastSpan ? Math.round((lastSpan.offsetTop - baseTop) / lineHeight) + 1 : 1
    const charWidth = span.offsetWidth || fontPx * 0.6
    const left = atEnd ? span.offsetLeft + span.offsetWidth : span.offsetLeft
    const lineTop = line * lineHeight

    let box: CaretBox
    if (caretStyle === 'block') {
      const height = Math.round(fontPx * 1.3)
      box = { left, top: lineTop + (lineHeight - height) / 2, width: charWidth, height }
    } else if (caretStyle === 'underline') {
      box = { left, top: lineTop + (lineHeight + fontPx * 1.15) / 2, width: charWidth, height: 2 }
    } else {
      const height = Math.round(fontPx * 1.2)
      box = { left: left - 1, top: lineTop + (lineHeight - height) / 2, width: 2, height }
    }
    setCaret(box)
    setTotalLines(lines)
    setOffset(Math.max(0, Math.min(line - anchorLine, lines - visibleLines)) * lineHeight)
  }, [position, target, lineHeight, fontPx, caretStyle, anchorLine, visibleLines, layoutTick])

  const shownLines = Math.max(1, Math.min(visibleLines, totalLines))
  const hasMoreBelow = offset / lineHeight + visibleLines < totalLines
  const hasMoreAbove = offset > 0
  const mask =
    hasMoreAbove || hasMoreBelow
      ? `linear-gradient(to bottom, ${hasMoreAbove ? 'transparent 0, #000 ' + lineHeight * 0.6 + 'px' : '#000 0'}, #000 calc(100% - ${hasMoreBelow ? lineHeight * 0.7 : 0}px), ${hasMoreBelow ? 'transparent 100%' : '#000 100%'})`
      : undefined

  return (
    <div
      className="relative overflow-hidden"
      style={{
        height: shownLines * lineHeight,
        transition: reducedMotion ? undefined : 'height 180ms ease',
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    >
      <div
        ref={contentRef}
        className={cn('typing-text relative font-mono', code && 'code')}
        style={{
          fontSize: fontPx,
          lineHeight: `${lineHeight}px`,
          transform: `translateY(${-offset}px)`,
          transition: reducedMotion ? undefined : 'transform 160ms cubic-bezier(0.25, 0.8, 0.3, 1)',
        }}
        aria-hidden
      >
        {segments.map((seg) =>
          seg.newline ? (
            <LineBreak key={seg.start} start={seg.start} typed={typed.slice(seg.start, seg.start + 1)} />
          ) : (
            <Word
              key={seg.start}
              start={seg.start}
              text={seg.text}
              tokens={seg.tokens}
              typed={position > seg.start ? typed.slice(seg.start, seg.start + seg.text.length) : ''}
            />
          ),
        )}
        {caret && showCaret && (
          <div
            className={cn('caret', caretStyle, smoothCaret && !reducedMotion && 'smooth', !typing && 'blink')}
            style={{
              width: caret.width,
              height: caret.height,
              transform: `translate(${caret.left}px, ${caret.top}px)`,
            }}
          />
        )}
      </div>
    </div>
  )
}
