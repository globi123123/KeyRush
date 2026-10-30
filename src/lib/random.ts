/** Small, fast seeded PRNG (mulberry32). Returns floats in [0, 1). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Deterministic 32-bit hash of a string (FNV-1a). */
export function hashString(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

export function randomInt(max: number, rng: () => number = Math.random): number {
  return Math.floor(rng() * max)
}

export function pickRandom<T>(items: readonly T[], rng: () => number = Math.random): T {
  return items[randomInt(items.length, rng)]
}

export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const copy = items.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, rng)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
