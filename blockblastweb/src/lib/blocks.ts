/**
 * The game's block vocabulary, mirrored from `BlockColor.swift` so the site
 * never shows a block the app would not recognise. Colour values are the
 * Classic theme from `Theme.swift`; the pattern, the spoken name and the
 * semitone offset are the other three identity channels, and they are the whole
 * point — a block is legible with any one of them missing.
 */

export type PatternStyle =
  | 'dots'
  | 'horizontalStripes'
  | 'verticalStripes'
  | 'crosshatch'
  | 'diagonalStripes'
  | 'checkerboard'
  | 'waves'

export type BlockId = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'cyan'

export type Block = {
  id: BlockId
  /** Spoken by VoiceOver as "<name> with <pattern>". */
  name: string
  hex: string
  pattern: PatternStyle
  patternName: string
  /** Compact glyph used in the game's tray legend. */
  glyph: string
  /** Semitone offset above the row's pitch — each colour gets its own timbre. */
  toneOffset: number
}

export const BLOCKS: readonly Block[] = [
  { id: 'red', name: 'Red', hex: '#ed424f', pattern: 'dots', patternName: 'dots', glyph: '●●●', toneOffset: 0 },
  { id: 'blue', name: 'Blue', hex: '#3882f5', pattern: 'horizontalStripes', patternName: 'horizontal stripes', glyph: '≡≡≡', toneOffset: 2 },
  { id: 'green', name: 'Green', hex: '#33ba5c', pattern: 'verticalStripes', patternName: 'vertical stripes', glyph: '|||', toneOffset: 4 },
  { id: 'yellow', name: 'Yellow', hex: '#facc26', pattern: 'crosshatch', patternName: 'crosshatch', glyph: '✚✚✚', toneOffset: 5 },
  { id: 'purple', name: 'Purple', hex: '#9954e6', pattern: 'diagonalStripes', patternName: 'diagonal stripes', glyph: '///', toneOffset: 7 },
  { id: 'orange', name: 'Orange', hex: '#fa8729', pattern: 'checkerboard', patternName: 'checkerboard', glyph: '▦▦▦', toneOffset: 9 },
  { id: 'cyan', name: 'Cyan', hex: '#29c9d9', pattern: 'waves', patternName: 'waves', glyph: '〜〜〜', toneOffset: 11 },
] as const

export const BLOCK_BY_ID: Record<BlockId, Block> = Object.fromEntries(
  BLOCKS.map((block) => [block.id, block]),
) as Record<BlockId, Block>

/** "red with dots" — the exact phrasing the game speaks. */
export function describe(block: Block): string {
  return `${block.name.toLowerCase()} with ${block.patternName}`
}

/* -------------------------------------------------------------------------
   Colour-vision simulation
   The same Brettel/Viénot approximations the game applies in
   `VisionSimulation.apply(to:)`. SVG filters interpolate in linear RGB by
   default, which is the space these matrices are defined in, so the site's
   simulation and the game's simulation agree.
------------------------------------------------------------------------- */

export type VisionMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'achromatopsia'

export type VisionOption = {
  id: VisionMode
  label: string
  /** Who this affects, in plain language. */
  detail: string
  /** Row-major 3x3 matrix applied to linear RGB; `null` for pass-through. */
  matrix: readonly number[] | null
}

export const VISION_MODES: readonly VisionOption[] = [
  { id: 'none', label: 'Off', detail: 'Typical colour vision.', matrix: null },
  {
    id: 'deuteranopia',
    label: 'Deuteranopia',
    detail: 'No green cones — the most common form, about 1 in 16 men.',
    matrix: [0.625, 0.375, 0.0, 0.7, 0.3, 0.0, 0.0, 0.3, 0.7],
  },
  {
    id: 'protanopia',
    label: 'Protanopia',
    detail: 'No red cones. Reds darken towards black.',
    matrix: [0.567, 0.433, 0.0, 0.558, 0.442, 0.0, 0.0, 0.242, 0.758],
  },
  {
    id: 'tritanopia',
    label: 'Tritanopia',
    detail: 'No blue cones. Blue and green collapse together.',
    matrix: [0.95, 0.05, 0.0, 0.0, 0.433, 0.567, 0.0, 0.475, 0.525],
  },
  {
    id: 'achromatopsia',
    label: 'Achromatopsia',
    detail: 'No colour at all. Only pattern and brightness remain.',
    matrix: [0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114],
  },
] as const

/** Expands a 3x3 matrix into the 4x5 form `feColorMatrix` expects. */
export function toFeColorMatrix(matrix: readonly number[]): string {
  const [a, b, c, d, e, f, g, h, i] = matrix
  return [a, b, c, 0, 0, d, e, f, 0, 0, g, h, i, 0, 0, 0, 0, 0, 1, 0].join(' ')
}

/* -------------------------------------------------------------------------
   Sonic navigation
   Row maps to pitch on a C-major pentatonic scale, so no interval in a scan
   ever sounds "wrong" and a false note never reads as a false alarm. Column
   maps to stereo position. Both mirror `GameAudioEngine`.
------------------------------------------------------------------------- */

/** C-major pentatonic, low row to high row, in Hz. */
export const PENTATONIC_ROWS = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25] as const

/** Board column to stereo pan, matching `AudioPosition.cell`. */
export function panForColumn(col: number, size = 8): number {
  const half = (size - 1) / 2
  return (col - half) / half
}
