export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" fill="var(--kr-card)" />
      <rect x="12" y="16" width="40" height="32" rx="8" fill="none" stroke="var(--kr-accent)" strokeWidth="4" />
      <path d="M24 26v12M24 32l8-6M28 30l6 8" stroke="var(--kr-fg)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="38" y="35" width="7" height="4" rx="2" fill="var(--kr-accent)" />
    </svg>
  )
}
