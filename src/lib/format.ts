export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('en-US')
}

export function formatCompact(value: number): string {
  if (Math.abs(value) < 10000) return formatNumber(value)
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

/** Formats seconds as "45s", "2m 05s" or "1h 12m". */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${String(seconds % 60).padStart(2, '0')}s`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${String(minutes % 60).padStart(2, '0')}m`
}

/** Formats seconds as a countdown clock, e.g. 1:05 or 45. Pass `minutes` to always show minutes (0:07). */
export function formatClock(totalSeconds: number, minutes = false): string {
  const seconds = Math.max(0, minutes ? Math.floor(totalSeconds) : Math.ceil(totalSeconds))
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 || minutes ? `${m}:${String(s).padStart(2, '0')}` : String(s)
}
