import { motion } from 'framer-motion'
import { useMemo } from 'react'

const COLORS = ['var(--kr-accent)', 'var(--kr-correct)', 'var(--kr-fg)']

/** A short, subtle burst of particles for new personal records. */
export function Celebration({ count = 26 }: { count?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4
        const distance = 70 + Math.random() * 90
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance * 0.7 - 20,
          size: 3 + Math.random() * 4,
          rotate: Math.random() * 360,
          delay: Math.random() * 0.12,
          color: COLORS[i % COLORS.length],
          round: i % 3 !== 0,
        }
      }),
    [count],
  )

  return (
    <div className="pointer-events-none absolute top-1/2 left-1/2 z-10" aria-hidden>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute block"
          style={{
            width: p.size,
            height: p.round ? p.size : p.size * 2.2,
            background: p.color,
            borderRadius: p.round ? 999 : 1,
          }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.4, rotate: 0 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 40], opacity: [0, 1, 0], scale: [0.4, 1, 0.8], rotate: p.rotate }}
          transition={{ duration: 1.4, delay: p.delay, ease: [0.2, 0.7, 0.3, 1], times: [0, 0.45, 1] }}
        />
      ))}
    </div>
  )
}
