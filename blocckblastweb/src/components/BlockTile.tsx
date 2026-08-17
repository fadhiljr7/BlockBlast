import type { CSSProperties } from 'react'
import { patternInk, patternMask } from '../lib/patterns'

type BlockTileProps = {
  hex: string
  /** Pattern name from `BLOCKS`, e.g. `dots`. */
  pattern: string
  /** Patterns are on by default here for the same reason they are in the app. */
  patterned?: boolean
  className?: string
  style?: CSSProperties
  /** Pattern tile size in pixels; scale it down for small board cells. */
  scale?: number
}

/**
 * One block, drawn the way the game draws it: a rounded square with a fill, an
 * always-present pattern, and a light stroke so blocks stay separable when two
 * of the same colour touch.
 */
export default function BlockTile({
  hex,
  pattern,
  patterned = true,
  className = '',
  style,
  scale = 12,
}: BlockTileProps) {
  const mask = patternMask(pattern)

  return (
    <div
      className={`relative rounded-[22%] ring-1 ring-inset ring-white/40 ${className}`}
      style={{ backgroundColor: hex, ...style }}
    >
      {patterned && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-[22%]"
          style={{
            backgroundColor: patternInk(hex),
            maskImage: mask,
            WebkitMaskImage: mask,
            maskSize: `${scale}px ${scale}px`,
            WebkitMaskSize: `${scale}px ${scale}px`,
            maskRepeat: 'repeat',
            WebkitMaskRepeat: 'repeat',
          }}
        />
      )}
      <span
        aria-hidden
        className="absolute inset-0 rounded-[22%] bg-linear-to-b from-white/20 to-transparent"
      />
    </div>
  )
}
