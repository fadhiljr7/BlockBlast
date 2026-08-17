import type { BlockId } from './blocks'
import { BLOCK_BY_ID } from './blocks'

/**
 * A 4×4 cut-down of the game's rules, for the demo board on the landing page.
 *
 * It keeps the parts that matter to the argument the section is making: pieces
 * are placed by tap-then-tap (never by dragging), full rows and columns clear,
 * and scoring uses the real formula — cells placed, plus lines² × 10, times the
 * combo. Everything else the app does is left out on purpose.
 */

export const SIZE = 4

export type Cell = BlockId | null
export type Board = Cell[]

export type Piece = {
  id: string
  /** Spoken shape name, leading with size, exactly as the app describes pieces. */
  name: string
  /** Offsets from the piece's top-left corner. */
  cells: readonly (readonly [number, number])[]
  block: BlockId
  rows: number
  cols: number
}

type Shape = { id: string; name: string; cells: readonly (readonly [number, number])[] }

const SHAPES: readonly Shape[] = [
  { id: 'single', name: '1 by 1 single', cells: [[0, 0]] },
  { id: 'domino-h', name: '1 by 2 horizontal pair', cells: [[0, 0], [0, 1]] },
  { id: 'domino-v', name: '2 by 1 vertical pair', cells: [[0, 0], [1, 0]] },
  { id: 'square', name: '2 by 2 square', cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  { id: 'corner', name: '2 by 2 corner', cells: [[0, 0], [1, 0], [1, 1]] },
  { id: 'line-3h', name: '1 by 3 horizontal line', cells: [[0, 0], [0, 1], [0, 2]] },
  { id: 'line-3v', name: '3 by 1 vertical line', cells: [[0, 0], [1, 0], [2, 0]] },
]

const BLOCK_IDS: readonly BlockId[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'cyan']

export function emptyBoard(): Board {
  return Array<Cell>(SIZE * SIZE).fill(null)
}

export function index(row: number, col: number): number {
  return row * SIZE + col
}

let counter = 0

export function randomPiece(): Piece {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)]
  const block = BLOCK_IDS[Math.floor(Math.random() * BLOCK_IDS.length)]
  counter += 1
  return {
    id: `${shape.id}-${counter}`,
    name: shape.name,
    cells: shape.cells,
    block,
    rows: Math.max(...shape.cells.map(([row]) => row)) + 1,
    cols: Math.max(...shape.cells.map(([, col]) => col)) + 1,
  }
}

export function newTray(): Piece[] {
  return [randomPiece(), randomPiece(), randomPiece()]
}

/**
 * The opening hand, fixed rather than random.
 *
 * The page is prerendered, so a random first tray would be generated once at
 * build time and again at hydration, and the two would disagree — React would
 * throw out the server HTML and re-render the whole page. A designed opening
 * also makes a better first impression than whatever the dice produce: a
 * single, a horizontal pair and a square, which between them demonstrate every
 * rule the board has.
 */
export function openingTray(): Piece[] {
  const shapes: [string, BlockId][] = [
    ['square', 'blue'],
    ['line-3h', 'green'],
    ['corner', 'orange'],
  ]
  return shapes.map(([shapeId, block]) => {
    const shape = SHAPES.find((entry) => entry.id === shapeId)!
    return {
      id: `opening-${shapeId}`,
      name: shape.name,
      cells: shape.cells,
      block,
      rows: Math.max(...shape.cells.map(([row]) => row)) + 1,
      cols: Math.max(...shape.cells.map(([, col]) => col)) + 1,
    }
  })
}

export function fits(board: Board, piece: Piece, row: number, col: number): boolean {
  return piece.cells.every(([dr, dc]) => {
    const r = row + dr
    const c = col + dc
    return r >= 0 && r < SIZE && c >= 0 && c < SIZE && board[index(r, c)] === null
  })
}

export function hasAnyMove(board: Board, tray: readonly (Piece | null)[]): boolean {
  return tray.some((piece) => {
    if (!piece) return false
    for (let row = 0; row < SIZE; row += 1) {
      for (let col = 0; col < SIZE; col += 1) {
        if (fits(board, piece, row, col)) return true
      }
    }
    return false
  })
}

/** Rows and columns that a placement at this position would complete. */
export function linesCompletedBy(
  board: Board,
  piece: Piece,
  row: number,
  col: number,
): { rows: number[]; cols: number[] } {
  const next = board.slice()
  for (const [dr, dc] of piece.cells) next[index(row + dr, col + dc)] = piece.block

  const rows: number[] = []
  const cols: number[] = []
  for (let r = 0; r < SIZE; r += 1) {
    if (Array.from({ length: SIZE }, (_, c) => next[index(r, c)]).every(Boolean)) rows.push(r)
  }
  for (let c = 0; c < SIZE; c += 1) {
    if (Array.from({ length: SIZE }, (_, r) => next[index(r, c)]).every(Boolean)) cols.push(c)
  }
  return { rows, cols }
}

export type PlacementResult = {
  board: Board
  /** Points gained, already multiplied by the combo. */
  gained: number
  clearedLines: number
  clearedCells: number[]
  combo: number
}

export function place(
  board: Board,
  piece: Piece,
  row: number,
  col: number,
  combo: number,
): PlacementResult {
  const next = board.slice()
  for (const [dr, dc] of piece.cells) next[index(row + dr, col + dc)] = piece.block

  const { rows, cols } = linesCompletedBy(board, piece, row, col)
  const clearedCells: number[] = []
  for (const r of rows) {
    for (let c = 0; c < SIZE; c += 1) clearedCells.push(index(r, c))
  }
  for (const c of cols) {
    for (let r = 0; r < SIZE; r += 1) clearedCells.push(index(r, c))
  }
  for (const cell of clearedCells) next[cell] = null

  const lines = rows.length + cols.length
  // The app's formula: one point per cell placed, plus lines² × 10, all
  // multiplied by the combo, which caps at ×5.
  const nextCombo = lines > 0 ? Math.min(combo + 1, 5) : 0
  const multiplier = lines > 0 ? Math.max(nextCombo, 1) : 1
  const gained = (piece.cells.length + lines * lines * 10) * multiplier

  return {
    board: next,
    gained,
    clearedLines: lines,
    clearedCells: [...new Set(clearedCells)],
    combo: nextCombo,
  }
}

/**
 * Zen relief: when nothing fits, the fullest row dissolves and play continues.
 *
 * This is what makes the demo unlosable *and* guaranteed to terminate — each
 * relief strictly reduces the number of filled cells, so repeatedly failing to
 * find a move empties the board rather than looping forever.
 */
export function ensurePlayable(
  board: Board,
  tray: readonly (Piece | null)[],
): { board: Board; clearedRows: number[] } {
  let next = board
  const clearedRows: number[] = []
  // Bounded by the number of rows: each pass empties one, and an empty board
  // accepts every piece in the set.
  while (!hasAnyMove(next, tray) && clearedRows.length < SIZE) {
    const relief = zenRelief(next)
    next = relief.board
    clearedRows.push(relief.clearedRow)
  }
  return { board: next, clearedRows }
}

export function zenRelief(board: Board): { board: Board; clearedRow: number } {
  let fullest = 0
  let best = -1
  for (let row = 0; row < SIZE; row += 1) {
    const filled = Array.from({ length: SIZE }, (_, col) => board[index(row, col)]).filter(
      Boolean,
    ).length
    if (filled > best) {
      best = filled
      fullest = row
    }
  }
  const next = board.slice()
  for (let col = 0; col < SIZE; col += 1) next[index(fullest, col)] = null
  return { board: next, clearedRow: fullest }
}

/* ---------------------------------------------------------------------------
   Spoken labels — the same phrasing as `Speech.swift`, because the transcript
   panel is claiming to show what VoiceOver would actually say.
--------------------------------------------------------------------------- */

export function describeCell(board: Board, row: number, col: number): string {
  const content = board[index(row, col)]
  const position = `Row ${row + 1}, column ${col + 1}`
  if (!content) return `${position}, empty`
  const block = BLOCK_BY_ID[content]
  return `${position}, ${block.name.toLowerCase()} with ${block.patternName}`
}

export function describePiece(piece: Piece): string {
  const block = BLOCK_BY_ID[piece.block]
  const cells = piece.cells.length === 1 ? '1 cell' : `${piece.cells.length} cells`
  return `${piece.name}, ${cells}, ${block.name.toLowerCase()} with ${block.patternName}`
}

/** The suffix the app appends to a cell label while a piece is in hand. */
export function placementSuffix(board: Board, piece: Piece, row: number, col: number): string {
  if (!fits(board, piece, row, col)) return 'does not fit'
  const { rows, cols } = linesCompletedBy(board, piece, row, col)
  const lines = rows.length + cols.length
  if (lines === 0) return 'fits here'
  return `fits here, clears ${lines} ${lines === 1 ? 'line' : 'lines'}`
}
