import { hexToRgb, rgbToHex } from './patterns'

/**
 * The same colour-vision simulation the app applies to the live board, using
 * the Brettel/Viénot matrices copied from `VisionSimulation` in
 * Models/BlockColor.swift. It runs on the whole page section, not on a preview
 * swatch, for the same reason it does in the app: you should be able to check a
 * palette in the situation you actually read it in.
 */

export type VisionId = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'achromatopsia'

export const VISION_MODES: readonly { id: VisionId; name: string }[] = [
  { id: 'none', name: 'Normal vision' },
  { id: 'deuteranopia', name: 'Deuteranopia' },
  { id: 'protanopia', name: 'Protanopia' },
  { id: 'tritanopia', name: 'Tritanopia' },
  { id: 'achromatopsia', name: 'Achromatopsia' },
]

const MATRICES: Record<Exclude<VisionId, 'none'>, number[]> = {
  deuteranopia: [0.625, 0.375, 0.0, 0.7, 0.3, 0.0, 0.0, 0.3, 0.7],
  protanopia: [0.567, 0.433, 0.0, 0.558, 0.442, 0.0, 0.0, 0.242, 0.758],
  tritanopia: [0.95, 0.05, 0.0, 0.0, 0.433, 0.567, 0.0, 0.475, 0.525],
  achromatopsia: [0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114],
}

export function simulate(hex: string, mode: VisionId): string {
  if (mode === 'none') return hex
  const m = MATRICES[mode]
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex(
    m[0] * r + m[1] * g + m[2] * b,
    m[3] * r + m[4] * g + m[5] * b,
    m[6] * r + m[7] * g + m[8] * b,
  )
}
