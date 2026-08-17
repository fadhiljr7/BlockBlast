/**
 * A faithful port of the rules that live in Models/Board.swift and
 * Game/GameEngine.swift — 8×8 grid, a weighted bag of 30 silhouettes, one point
 * per cell placed plus `lines² × 10` for a clear, multiplied by the combo.
 *
 * Rules only. Nothing here knows about React, the DOM, sound or animation, for
 * the same reason the Swift engine does not: it keeps the board testable and
 * makes an undo a plain value copy.
 */

import type { BlockId } from '../data/site'
import { BLOCKS } from '../data/site'

export const BOARD_SIZE = 8

export type Cell = BlockId | null
/** Row-major, `row * BOARD_SIZE + col`. */
export type Grid = readonly Cell[]

export type Position = { row: number; col: number }

export type Shape = {
  key: string
  name: string
  cells: readonly Position[]
  width: number
  height: number
  weight: number
}

export type Piece = { id: string; shape: Shape; color: BlockId }

export type Placement = {
  grid: Grid
  placedCells: readonly Position[]
  clearedCells: readonly Position[]
  clearedRows: readonly number[]
  clearedColumns: readonly number[]
  linesCleared: number
}

const SHAPE_NAMES: Record<string, string> = {
  single: 'single cell',
  domino: 'domino',
  line3: '3 in a line',
  line4: '4 in a line',
  line5: '5 in a line',
  square2: '2 by 2 square',
  square3: '3 by 3 square',
  rect: 'rectangle',
  corner: 'corner',
  lShape: 'L-shape',
  tShape: 'T-shape',
  sShape: 'S-shape',
}

/** `X` is filled, anything else is empty — the same sketch format the app uses. */
function shape(key: string, weight: number, rows: string[]): Shape {
  const cells: Position[] = []
  rows.forEach((row, r) => {
    row.split('').forEach((character, c) => {
      if (character === 'X') cells.push({ row: r, col: c })
    })
  })
  return {
    key,
    name: SHAPE_NAMES[key] ?? 'block',
    cells,
    weight,
    height: Math.max(...cells.map((cell) => cell.row)) + 1,
    width: Math.max(...cells.map((cell) => cell.col)) + 1,
  }
}

/** The full silhouette library, weights included, from `PieceShape.library`. */
export const SHAPES: readonly Shape[] = [
  shape('single', 6, ['X']),

  shape('domino', 12, ['XX']),
  shape('domino', 12, ['X', 'X']),

  shape('line3', 12, ['XXX']),
  shape('line3', 12, ['X', 'X', 'X']),

  shape('line4', 8, ['XXXX']),
  shape('line4', 8, ['X', 'X', 'X', 'X']),

  shape('line5', 4, ['XXXXX']),
  shape('line5', 4, ['X', 'X', 'X', 'X', 'X']),

  shape('square2', 12, ['XX', 'XX']),
  shape('square3', 3, ['XXX', 'XXX', 'XXX']),

  shape('rect', 6, ['XXX', 'XXX']),
  shape('rect', 6, ['XX', 'XX', 'XX']),

  shape('corner', 10, ['X.', 'XX']),
  shape('corner', 10, ['XX', 'X.']),
  shape('corner', 10, ['XX', '.X']),
  shape('corner', 10, ['.X', 'XX']),

  shape('lShape', 7, ['X..', 'X..', 'XXX']),
  shape('lShape', 7, ['XXX', 'X..', 'X..']),
  shape('lShape', 7, ['XXX', '..X', '..X']),
  shape('lShape', 7, ['..X', '..X', 'XXX']),

  shape('tShape', 7, ['XXX', '.X.']),
  shape('tShape', 7, ['.X.', 'XXX']),
  shape('tShape', 7, ['X.', 'XX', 'X.']),
  shape('tShape', 7, ['.X', 'XX', '.X']),

  shape('sShape', 5, ['.XX', 'XX.']),
  shape('sShape', 5, ['XX.', '.XX']),
  shape('sShape', 5, ['X.', 'XX', '.X']),
  shape('sShape', 5, ['.X', 'XX', 'X.']),
]

const TOTAL_WEIGHT = SHAPES.reduce((sum, item) => sum + item.weight, 0)

export function emptyGrid(): Grid {
  return Array<Cell>(BOARD_SIZE * BOARD_SIZE).fill(null)
}

export function at(grid: Grid, row: number, col: number): Cell {
  return grid[row * BOARD_SIZE + col]
}

export function cellsFor(shape: Shape, origin: Position): Position[] {
  return shape.cells.map((cell) => ({ row: origin.row + cell.row, col: origin.col + cell.col }))
}

export function canPlace(grid: Grid, shape: Shape, origin: Position): boolean {
  return cellsFor(shape, origin).every(
    ({ row, col }) =>
      row >= 0 &&
      col >= 0 &&
      row < BOARD_SIZE &&
      col < BOARD_SIZE &&
      at(grid, row, col) === null,
  )
}

export function validOrigins(grid: Grid, shape: Shape): Position[] {
  const origins: Position[] = []
  for (let row = 0; row <= BOARD_SIZE - shape.height; row += 1) {
    for (let col = 0; col <= BOARD_SIZE - shape.width; col += 1) {
      const origin = { row, col }
      if (canPlace(grid, shape, origin)) origins.push(origin)
    }
  }
  return origins
}

export function hasValidPlacement(grid: Grid, shape: Shape): boolean {
  for (let row = 0; row <= BOARD_SIZE - shape.height; row += 1) {
    for (let col = 0; col <= BOARD_SIZE - shape.width; col += 1) {
      if (canPlace(grid, shape, { row, col })) return true
    }
  }
  return false
}

/** How many lines a placement would complete, without committing it. */
export function linesCompleted(grid: Grid, shape: Shape, origin: Position): number {
  if (!canPlace(grid, shape, origin)) return 0
  const next = grid.slice()
  for (const { row, col } of cellsFor(shape, origin)) next[row * BOARD_SIZE + col] = 'red'
  return fullRows(next).length + fullColumns(next).length
}

function fullRows(grid: Grid): number[] {
  const rows: number[] = []
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    let complete = true
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (at(grid, row, col) === null) {
        complete = false
        break
      }
    }
    if (complete) rows.push(row)
  }
  return rows
}

function fullColumns(grid: Grid): number[] {
  const columns: number[] = []
  for (let col = 0; col < BOARD_SIZE; col += 1) {
    let complete = true
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      if (at(grid, row, col) === null) {
        complete = false
        break
      }
    }
    if (complete) columns.push(col)
  }
  return columns
}

/** Returns the new grid and everything the feedback layer would need. */
export function place(grid: Grid, piece: Piece, origin: Position): Placement | null {
  if (!canPlace(grid, piece.shape, origin)) return null

  const next = grid.slice()
  const placedCells = cellsFor(piece.shape, origin)
  for (const { row, col } of placedCells) next[row * BOARD_SIZE + col] = piece.color

  const clearedRows = fullRows(next)
  const clearedColumns = fullColumns(next)

  const clearedCells: Position[] = []
  const seen = new Set<number>()
  const markCleared = (row: number, col: number) => {
    const index = row * BOARD_SIZE + col
    if (seen.has(index)) return
    seen.add(index)
    clearedCells.push({ row, col })
  }
  for (const row of clearedRows) for (let col = 0; col < BOARD_SIZE; col += 1) markCleared(row, col)
  for (const col of clearedColumns) for (let row = 0; row < BOARD_SIZE; row += 1) markCleared(row, col)
  for (const { row, col } of clearedCells) next[row * BOARD_SIZE + col] = null

  return {
    grid: next,
    placedCells,
    clearedCells,
    clearedRows,
    clearedColumns,
    linesCleared: clearedRows.length + clearedColumns.length,
  }
}

/** One point per cell placed, `lines² × 10` for the clear, times the combo. */
export function points(placedCells: number, linesCleared: number, comboMultiplier: number): number {
  return placedCells + linesCleared * linesCleared * 10 * comboMultiplier
}

/** Capped at ×5, exactly as `comboMultiplier` in the engine. */
export function comboMultiplier(streak: number): number {
  return Math.max(1, Math.min(streak, 5))
}

export function randomShape(): Shape {
  let roll = Math.floor(Math.random() * TOTAL_WEIGHT)
  for (const candidate of SHAPES) {
    roll -= candidate.weight
    if (roll < 0) return candidate
  }
  return SHAPES[0]
}

let pieceCounter = 0

export function randomPiece(): Piece {
  pieceCounter += 1
  return {
    id: `piece-${pieceCounter}`,
    shape: randomShape(),
    color: BLOCKS[Math.floor(Math.random() * BLOCKS.length)].id,
  }
}

/** The hint button's search: any legal move, preferring one that clears lines. */
export function bestHint(
  grid: Grid,
  tray: readonly (Piece | null)[],
): { slot: number; origin: Position } | null {
  let best: { slot: number; origin: Position; value: number } | undefined
  for (let slot = 0; slot < tray.length; slot += 1) {
    const piece = tray[slot]
    if (!piece) continue
    for (const origin of validOrigins(grid, piece.shape)) {
      const value = linesCompleted(grid, piece.shape, origin) * 100 + piece.shape.cells.length
      if (best === undefined || value > best.value) best = { slot, origin, value }
    }
  }
  return best === undefined ? null : { slot: best.slot, origin: best.origin }
}

/** "3 by 2 T-shape, 5 cells, blue with horizontal stripes" — the app's phrasing. */
export function describePiece(piece: Piece): string {
  const pattern = BLOCKS.find((block) => block.id === piece.color)?.pattern ?? ''
  return `${piece.shape.height} by ${piece.shape.width} ${piece.shape.name}, ${piece.shape.cells.length} cells, ${piece.color} with ${pattern}`
}
