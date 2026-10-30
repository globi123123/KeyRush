import { useMemo, useState, type PointerEvent, type ReactNode } from 'react'
import { useElementSize } from '../../hooks/useElementSize'

export interface ChartSeries {
  id: string
  label: string
  /** CSS colour, usually a token like var(--kr-chart-1). */
  color: string
  values: number[]
  dashed?: boolean
}

interface LineChartProps {
  series: ChartSeries[]
  /** Tooltip title for each point. */
  labels: string[]
  /** Axis label for a point index, or null to skip it. */
  xTick?: (index: number) => string | null
  height?: number
  yMin?: number
  yMax?: number
  yFormat?: (value: number) => string
  /** Optional count per point, drawn as markers along the bottom (e.g. errors). */
  markers?: number[]
  markerLabel?: string
  ariaLabel: string
  /** Show a small dot on every point (useful for sparse data). */
  dots?: boolean
  tooltipExtra?: (index: number) => ReactNode
}

const PAD = { top: 10, right: 10, bottom: 24, left: 36 }

function niceMax(value: number): number {
  if (value <= 0) return 10
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]
  for (const step of steps) if (step * magnitude >= value) return step * magnitude
  return 10 * magnitude
}

/**
 * Responsive SVG line chart with a single y axis, recessive grid,
 * a crosshair tooltip and an accessible data table.
 */
export function LineChart({
  series,
  labels,
  xTick,
  height = 200,
  yMin = 0,
  yMax,
  yFormat = (v) => String(Math.round(v)),
  markers,
  markerLabel = 'Errors',
  ariaLabel,
  dots,
  tooltipExtra,
}: LineChartProps) {
  const [ref, size] = useElementSize<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const count = labels.length
  const width = size.width

  const top = useMemo(() => {
    if (yMax !== undefined) return yMax
    const max = Math.max(0, ...series.flatMap((s) => s.values))
    return niceMax(max * 1.08)
  }, [series, yMax])

  const plotW = Math.max(0, width - PAD.left - PAD.right)
  const plotH = height - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (count <= 1 ? plotW / 2 : (i / (count - 1)) * plotW)
  const y = (v: number) => PAD.top + plotH - ((Math.min(v, top) - yMin) / (top - yMin || 1)) * plotH
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => yMin + (top - yMin) * f)

  const path = (values: number[]) =>
    values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')

  const onPointer = (event: PointerEvent<SVGSVGElement>) => {
    if (count === 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    const px = event.clientX - rect.left
    const ratio = count <= 1 ? 0 : (px - PAD.left) / plotW
    setHover(Math.max(0, Math.min(count - 1, Math.round(ratio * (count - 1)))))
  }

  const tooltipLeft = hover !== null ? x(hover) : 0
  const flip = tooltipLeft > width * 0.62

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel}
          onPointerMove={onPointer}
          onPointerDown={onPointer}
          onPointerLeave={() => setHover(null)}
          className="touch-pan-y overflow-visible"
        >
          {/* Grid and y axis labels */}
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--kr-grid)" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-faint text-[10px] tabular-nums">
                {yFormat(tick)}
              </text>
            </g>
          ))}

          {/* X axis labels */}
          {xTick &&
            labels.map((_, i) => {
              const label = xTick(i)
              if (label === null) return null
              return (
                <text key={i} x={x(i)} y={height - 6} textAnchor="middle" className="fill-faint text-[10px] tabular-nums">
                  {label}
                </text>
              )
            })}

          {/* Error markers along the baseline */}
          {markers?.map((value, i) =>
            value > 0 ? (
              <g key={i} transform={`translate(${x(i)}, ${PAD.top + plotH - 7})`} stroke="var(--kr-incorrect)" strokeWidth={1.75} strokeLinecap="round">
                <line x1={-3} y1={-3} x2={3} y2={3} />
                <line x1={-3} y1={3} x2={3} y2={-3} />
              </g>
            ) : null,
          )}

          {/* Series, drawn in reverse so the first (primary) series is on top */}
          {[...series].reverse().map((s) =>
            s.values.length > 1 ? (
              <path
                key={s.id}
                d={path(s.values)}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray={s.dashed ? '4 4' : undefined}
              />
            ) : null,
          )}
          {[...series].reverse().map((s) =>
            (dots || s.values.length === 1) && s.values.length < 80
              ? s.values.map((v, i) => (
                  <circle key={`${s.id}-${i}`} cx={x(i)} cy={y(v)} r={3} fill={s.color} stroke="var(--kr-card)" strokeWidth={2} />
                ))
              : null,
          )}

          {/* Crosshair */}
          {hover !== null && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} stroke="var(--kr-border-strong)" strokeWidth={1} />
              {series.map((s) =>
                s.values[hover] !== undefined ? (
                  <circle key={s.id} cx={x(hover)} cy={y(s.values[hover])} r={4.5} fill={s.color} stroke="var(--kr-card)" strokeWidth={2} />
                ) : null,
              )}
            </g>
          )}
        </svg>
      )}

      {hover !== null && (
        <div
          className="pointer-events-none absolute top-1 z-10 min-w-32 rounded-lg border border-line-strong bg-bg-2/95 px-3 py-2 text-xs shadow-soft backdrop-blur-sm"
          style={flip ? { right: width - tooltipLeft + 12 } : { left: tooltipLeft + 12 }}
        >
          <p className="mb-1 font-medium text-fg">{labels[hover]}</p>
          {series.map((s) => (
            <p key={s.id} className="flex items-center justify-between gap-4 text-muted">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-3 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="font-medium text-fg tabular-nums">{yFormat(s.values[hover] ?? 0)}</span>
            </p>
          ))}
          {markers && (
            <p className="flex items-center justify-between gap-4 text-muted">
              <span>{markerLabel}</span>
              <span className="font-medium text-fg tabular-nums">{markers[hover] ?? 0}</span>
            </p>
          )}
          {tooltipExtra?.(hover)}
        </div>
      )}

      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Point</th>
            {series.map((s) => (
              <th key={s.id} scope="col">
                {s.label}
              </th>
            ))}
            {markers && <th scope="col">{markerLabel}</th>}
          </tr>
        </thead>
        <tbody>
          {labels.map((label, i) => (
            <tr key={i}>
              <th scope="row">{label}</th>
              {series.map((s) => (
                <td key={s.id}>{yFormat(s.values[i] ?? 0)}</td>
              ))}
              {markers && <td>{markers[i] ?? 0}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ChartLegend({ items }: { items: { label: string; color: string; dashed?: boolean; marker?: boolean }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          {item.marker ? (
            <svg width="10" height="10" viewBox="-5 -5 10 10" aria-hidden stroke={item.color} strokeWidth={1.75} strokeLinecap="round">
              <line x1={-3} y1={-3} x2={3} y2={3} />
              <line x1={-3} y1={3} x2={3} y2={-3} />
            </svg>
          ) : (
            <svg width="14" height="4" aria-hidden>
              <line x1="1" y1="2" x2="13" y2="2" stroke={item.color} strokeWidth={2} strokeLinecap="round" strokeDasharray={item.dashed ? '3 3' : undefined} />
            </svg>
          )}
          {item.label}
        </span>
      ))}
    </div>
  )
}
