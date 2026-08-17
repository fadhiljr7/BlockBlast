/**
 * Rules check for the landing page's demo board.
 *
 * The demo claims to use the game's real scoring and its real Zen behaviour, so
 * those claims are worth verifying rather than eyeballing: a marketing page
 * that quietly gets its own example wrong is worse than one that has no example.
 *
 * Run with `npm run check`.
 */
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)
const game = await jiti.import('../src/lib/miniGame.ts')

const { SIZE, emptyBoard, index, fits, place, hasAnyMove, ensurePlayable, openingTray, describeCell, placementSuffix } = game

let failures = 0
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) {
    failures += 1
    console.error(`FAIL ${name}\n  expected ${JSON.stringify(expected)}\n  actual   ${JSON.stringify(actual)}`)
  } else {
    console.log(`ok   ${name}`)
  }
}

const single = { id: 't1', name: '1 by 1 single', cells: [[0, 0]], block: 'red', rows: 1, cols: 1 }
const line3 = { id: 't2', name: '1 by 3 line', cells: [[0, 0], [0, 1], [0, 2]], block: 'blue', rows: 1, cols: 3 }

// Bounds and occupancy
check('fits inside the board', fits(emptyBoard(), single, 3, 3), true)
check('rejects out of bounds', fits(emptyBoard(), line3, 0, 2), false)
{
  const board = emptyBoard()
  board[index(1, 1)] = 'green'
  check('rejects an occupied cell', fits(board, single, 1, 1), false)
}

// Scoring: one point per cell, plus lines² × 10, times the combo.
{
  const board = emptyBoard()
  for (let col = 0; col < SIZE - 1; col += 1) board[index(0, col)] = 'green'
  const result = place(board, single, 0, SIZE - 1, 0)
  // 1 cell + 1² × 10 = 11, combo goes 0 → 1 so the multiplier is 1.
  check('single line clear scores 11', result.gained, 11)
  check('single line clear removes the row', result.board.slice(0, SIZE).every((cell) => cell === null), true)
  check('combo advances to 1', result.combo, 1)
}

{
  // A row and a column completed by the same piece: lines = 2, so 2² × 10 = 40.
  const board = emptyBoard()
  for (let col = 0; col < SIZE - 1; col += 1) board[index(0, col)] = 'green'
  for (let row = 1; row < SIZE; row += 1) board[index(row, SIZE - 1)] = 'green'
  const result = place(board, single, 0, SIZE - 1, 0)
  check('double clear counts two lines', result.clearedLines, 2)
  check('double clear scores 41', result.gained, 1 + 4 * 10)
}

{
  // Combo multiplies: an existing streak of 2 becomes 3 and multiplies the gain.
  const board = emptyBoard()
  for (let col = 0; col < SIZE - 1; col += 1) board[index(0, col)] = 'green'
  const result = place(board, single, 0, SIZE - 1, 2)
  check('combo 2 becomes 3', result.combo, 3)
  check('combo multiplies the gain', result.gained, 11 * 3)
}

{
  // No clear resets the combo and applies no multiplier.
  const result = place(emptyBoard(), single, 2, 2, 3)
  check('no clear resets the combo', result.combo, 0)
  check('no clear scores the cell only', result.gained, 1)
}

// Zen: a full board must always be recoverable, and must terminate.
{
  const full = emptyBoard().map(() => 'red')
  check('a full board has no move', hasAnyMove(full, [single]), false)
  const rescued = ensurePlayable(full, [single])
  check('zen relief restores a legal move', hasAnyMove(rescued.board, [single]), true)
  check('zen relief clears exactly one row here', rescued.clearedRows.length, 1)
}

{
  // The worst case: a full board and a tray of pieces that need a 2×2 gap.
  const full = emptyBoard().map(() => 'red')
  const square = { id: 't3', name: '2 by 2 square', cells: [[0, 0], [0, 1], [1, 0], [1, 1]], block: 'cyan', rows: 2, cols: 2 }
  const rescued = ensurePlayable(full, [square])
  check('zen relief terminates for a 2x2 piece', hasAnyMove(rescued.board, [square]), true)
  check('zen relief stays bounded', rescued.clearedRows.length <= SIZE, true)
}

// A long unattended run must never dead-end — the demo has no game over.
{
  let board = emptyBoard()
  let tray = openingTray()
  let stuck = false
  for (let move = 0; move < 400; move += 1) {
    const playable = ensurePlayable(board, tray)
    board = playable.board
    const piece = tray.find(Boolean)
    if (!piece) {
      tray = openingTray()
      continue
    }
    let placed = false
    for (let row = 0; row < SIZE && !placed; row += 1) {
      for (let col = 0; col < SIZE && !placed; col += 1) {
        if (fits(board, piece, row, col)) {
          board = place(board, piece, row, col, 0).board
          placed = true
        }
      }
    }
    if (!placed) {
      stuck = true
      break
    }
    tray = openingTray()
  }
  check('400 moves without a dead end', stuck, false)
}

// Spoken labels must match the app's phrasing.
{
  const board = emptyBoard()
  board[index(2, 4)] = 'red'
  check('empty cell label', describeCell(board, 0, 0), 'Row 1, column 1, empty')
  check('filled cell label', describeCell(board, 2, 4), 'Row 3, column 5, red with dots')
  check('suffix when it does not fit', placementSuffix(board, single, 2, 4), 'does not fit')

  const nearlyFull = emptyBoard()
  for (let col = 0; col < SIZE - 1; col += 1) nearlyFull[index(0, col)] = 'green'
  check('suffix counts the clear', placementSuffix(nearlyFull, single, 0, SIZE - 1), 'fits here, clears 1 line')
}

// The opening tray is fixed, or the prerendered HTML would not match hydration.
check('opening tray is deterministic', openingTray().map((piece) => piece.id), openingTray().map((piece) => piece.id))

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`)
  process.exit(1)
}
console.log('\nAll demo-board rules check out.')
