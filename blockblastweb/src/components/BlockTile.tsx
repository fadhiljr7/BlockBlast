import type { Block, PatternStyle } from '../lib/blocks'

/**
 * The seven pattern overlays, ported from `PatternShape.swift` at the same
 * proportions (the Swift version draws into a cell rect; this draws into a
 * 100×100 viewBox, so every constant is the Swift multiplier × 100).
 *
 * These are the game's primary identity channel for colour-blind players, which
 * is why they are redrawn here rather than approximated with CSS gradients.
 */
function PatternGlyph({ style }: { style: PatternStyle }) {
  switch (style) {
    case 'dots':
      return (
        <>
          {[
            [30, 30],
            [70, 30],
            [30, 70],
            [70, 70],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={11} />
          ))}
        </>
      )

    case 'horizontalStripes':
      return (
        <>
          {[0, 1, 2].map((index) => (
            <rect key={index} x={12} y={((index + 0.5) / 3) * 100 - 6} width={76} height={12} />
          ))}
        </>
      )

    case 'verticalStripes':
      return (
        <>
          {[0, 1, 2].map((index) => (
            <rect key={index} x={((index + 0.5) / 3) * 100 - 6} y={12} width={12} height={76} />
          ))}
        </>
      )

    case 'crosshatch':
      return (
        <>
          {[
            [32, 32],
            [68, 32],
            [32, 68],
            [68, 68],
          ].map(([x, y]) => (
            <g key={`${x}-${y}`}>
              <rect x={x - 10} y={y - 5} width={20} height={10} />
              <rect x={x - 5} y={y - 10} width={10} height={20} />
            </g>
          ))}
        </>
      )

    case 'diagonalStripes':
      return (
        <>
          {[-100, -66, -32, 2, 36, 70].map((offset) => (
            <line
              key={offset}
              x1={offset}
              y1={100}
              x2={offset + 100}
              y2={0}
              strokeWidth={13}
              stroke="currentColor"
            />
          ))}
        </>
      )

    case 'checkerboard':
      return (
        <>
          {Array.from({ length: 16 }, (_, index) => {
            const row = Math.floor(index / 4)
            const col = index % 4
            if ((row + col) % 2 !== 0) return null
            return <rect key={index} x={col * 25} y={row * 25} width={25} height={25} />
          })}
        </>
      )

    case 'waves': {
      // One full sine period across the cell, three baselines — the same
      // 12-step sampling the Swift path uses.
      const path = (baseline: number) => {
        const points = Array.from({ length: 13 }, (_, step) => {
          const progress = step / 12
          const x = 10 + 80 * progress
          const y = baseline + Math.sin(progress * Math.PI * 2) * 9
          return `${x.toFixed(2)},${y.toFixed(2)}`
        })
        return `M${points.join('L')}`
      }
      return (
        <>
          {[0, 1, 2].map((index) => (
            <path
              key={index}
              d={path(((index + 0.5) / 3) * 100)}
              fill="none"
              stroke="currentColor"
              strokeWidth={10}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </>
      )
    }
  }
}

/** Relative luminance, matching `Color.estimatedLuminance` in the app. */
function luminance(hex: string): number {
  const value = hex.replace('#', '')
  const channels = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255)
  const linear = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  )
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

/** Pattern ink that stays legible on any block colour, as `contrastingInk` does. */
function patternInk(hex: string): string {
  return luminance(hex) > 0.45 ? 'rgba(0,0,0,0.78)' : 'rgba(255,255,255,0.94)'
}

type BlockTileProps = {
  block: Block
  className?: string
  /** Suppress the pattern to demonstrate what colour-only design costs. */
  patterns?: boolean
  /** Set when a parent element already conveys the meaning to assistive tech. */
  decorative?: boolean
}

/**
 * One block: fill, always-drawn pattern, and a border that survives being
 * viewed through a colour-vision filter.
 */
export function BlockTile({
  block,
  className = '',
  patterns = true,
  decorative = true,
}: BlockTileProps) {
  const ink = patternInk(block.hex)
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={className}
      style={{ color: ink }}
      role={decorative ? 'presentation' : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={
        decorative ? undefined : `${block.name.toLowerCase()} with ${block.patternName}`
      }
      focusable="false"
    >
      <rect x={0} y={0} width={100} height={100} rx={14} fill={block.hex} />
      {patterns && (
        <g fill="currentColor" opacity={0.62} clipPath="url(#block-tile-clip)">
          <PatternGlyph style={block.pattern} />
        </g>
      )}
      <rect
        x={1.5}
        y={1.5}
        width={97}
        height={97}
        rx={13}
        fill="none"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth={3}
      />
    </svg>
  )
}
