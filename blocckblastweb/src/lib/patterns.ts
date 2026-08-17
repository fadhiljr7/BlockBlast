/**
 * The seven pattern overlays from `PatternStyle` in the app, rebuilt as CSS
 * masks. A mask rather than a background image means the ink colour stays a
 * property of the tile, so a block can darken its pattern on a light fill the
 * way the app does.
 */

type PatternId =
  | 'dots'
  | 'horizontal stripes'
  | 'vertical stripes'
  | 'crosshatch'
  | 'diagonal stripes'
  | 'checkerboard'
  | 'waves'

/** Each tile is drawn in a 12×12 box and repeated. */
const TILES: Record<PatternId, string> = {
  dots: '<circle cx="6" cy="6" r="2.6"/>',
  'horizontal stripes': '<rect x="0" y="2" width="12" height="3.4"/><rect x="0" y="8" width="12" height="3.4"/>',
  'vertical stripes': '<rect x="2" y="0" width="3.4" height="12"/><rect x="8" y="0" width="3.4" height="12"/>',
  crosshatch: '<rect x="0" y="4.6" width="12" height="2.4"/><rect x="4.6" y="0" width="2.4" height="12"/>',
  'diagonal stripes':
    '<path d="M-3 3 L3 -3 M-3 9 L9 -3 M-3 15 L15 -3 M3 15 L15 3 M9 15 L15 9" stroke="#fff" stroke-width="2.6" fill="none"/>',
  checkerboard: '<rect x="0" y="0" width="6" height="6"/><rect x="6" y="6" width="6" height="6"/>',
  waves:
    '<path d="M-1 8 Q2 4 5 8 T11 8 T17 8" stroke="#fff" stroke-width="2.2" fill="none"/><path d="M-1 2 Q2 -2 5 2 T11 2 T17 2" stroke="#fff" stroke-width="2.2" fill="none"/>',
}

/** `url("data:…")` ready to drop into `mask-image`. */
export function patternMask(pattern: string): string {
  const tile = TILES[pattern as PatternId] ?? TILES.dots
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="#fff">${tile}</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/**
 * Pattern ink, picked per block the way the app picks it: dark ink on a light
 * fill, light ink on a dark one, so the pattern never disappears into its block.
 */
export function patternInk(hex: string): string {
  return relativeLuminance(hex) > 0.45 ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.85)'
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const channel = (value: number) => {
    const v = value / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const value = hex.replace('#', '')
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`
}
