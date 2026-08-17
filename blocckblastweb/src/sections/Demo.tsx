import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import BlockTile from '../components/BlockTile'
import PieceView from '../components/PieceView'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import { BLOCKS } from '../data/site'
import {
  BOARD_SIZE,
  bestHint,
  canPlace,
  comboMultiplier,
  describePiece,
  emptyGrid,
  hasValidPlacement,
  linesCompleted,
  place,
  points,
  randomPiece,
  type Grid,
  type Piece,
  type Position,
} from '../lib/game'
import { gsap, useReducedMotion } from '../lib/motion'

const blockOf = (id: string) => BLOCKS.find((block) => block.id === id) ?? BLOCKS[0]

type Ghost = { index: number; hex: string; pattern: string }

function newTray(): (Piece | null)[] {
  return [randomPiece(), randomPiece(), randomPiece()]
}

/**
 * The app's rules, running in the browser. Placement here is sticky drag — pick
 * a piece, then pick one of the marked landing spots — because that is the one
 * mode that works with a mouse, a finger, a keyboard and a screen reader alike.
 */
export default function Demo() {
  const [grid, setGrid] = useState<Grid>(emptyGrid)
  const [tray, setTray] = useState<(Piece | null)[]>(newTray)
  const [selected, setSelected] = useState<number | null>(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const [ghosts, setGhosts] = useState<Ghost[]>([])
  const [hint, setHint] = useState<Position | null>(null)
  const [focusIndex, setFocusIndex] = useState(0)
  const [status, setStatus] = useState('Pick a piece, then choose one of the marked cells.')

  const boardRef = useRef<HTMLDivElement>(null)
  const scoreRef = useRef<HTMLParagraphElement>(null)
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([])
  const reduced = useReducedMotion()

  const piece = selected === null ? null : tray[selected]
  const gameOver = useMemo(
    () => tray.every((item) => item === null || !hasValidPlacement(grid, item.shape)),
    [grid, tray],
  )

  /** Candidate origins for the piece in hand — the app's dashed-outline set. */
  const candidates = useMemo(() => {
    const map = new Map<number, number>()
    if (!piece) return map
    for (let row = 0; row <= BOARD_SIZE - piece.shape.height; row += 1) {
      for (let col = 0; col <= BOARD_SIZE - piece.shape.width; col += 1) {
        if (canPlace(grid, piece.shape, { row, col })) {
          map.set(row * BOARD_SIZE + col, linesCompleted(grid, piece.shape, { row, col }))
        }
      }
    }
    return map
  }, [grid, piece])

  // Cleared cells linger for one beat as ghosts so the clear reads as an event
  // rather than as cells that were never there.
  useEffect(() => {
    if (ghosts.length === 0) return
    const timer = window.setTimeout(() => setGhosts([]), reduced ? 60 : 420)
    return () => window.clearTimeout(timer)
  }, [ghosts, reduced])

  useEffect(() => {
    if (reduced || ghosts.length === 0 || !boardRef.current) return
    const context = gsap.context(() => {
      gsap.to('[data-ghost]', {
        scale: 0.2,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
        stagger: { each: 0.012, from: 'center' },
      })
    }, boardRef)
    return () => context.revert()
  }, [ghosts, reduced])

  const reset = useCallback(() => {
    setGrid(emptyGrid())
    setTray(newTray())
    setSelected(0)
    setScore(0)
    setStreak(0)
    setGhosts([])
    setHint(null)
    setStatus('New board. Pick a piece, then choose one of the marked cells.')
  }, [])

  function handlePlace(origin: Position) {
    if (selected === null || !piece) {
      setStatus('Pick a piece from the tray first.')
      return
    }

    const placement = place(grid, piece, origin)
    if (!placement) {
      setStatus(
        `${piece.shape.name} does not fit at row ${origin.row + 1}, column ${origin.col + 1}.`,
      )
      if (!reduced && boardRef.current) {
        gsap.fromTo(boardRef.current, { x: -5 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.35)' })
      }
      return
    }

    const nextStreak = placement.linesCleared > 0 ? streak + 1 : 0
    const multiplier = comboMultiplier(nextStreak)
    const gained = points(placement.placedCells.length, placement.linesCleared, multiplier)
    const total = score + gained

    if (placement.clearedCells.length > 0) {
      setGhosts(
        placement.clearedCells.map(({ row, col }) => {
          const index = row * BOARD_SIZE + col
          // Cells the piece just filled are still empty in the old grid.
          const block = blockOf(grid[index] ?? piece.color)
          return { index, hex: block.hex, pattern: block.pattern }
        }),
      )
    }

    const nextTray = tray.map((item, index) => (index === selected ? null : item))
    const exhausted = nextTray.every((item) => item === null)
    const refilled = exhausted ? newTray() : nextTray

    setGrid(placement.grid)
    setTray(refilled)
    setScore(total)
    setBest(Math.max(best, total))
    setStreak(nextStreak)
    setHint(null)
    setSelected(refilled.findIndex((item) => item !== null))

    setStatus(
      placement.linesCleared > 0
        ? `Cleared ${placement.linesCleared} line${placement.linesCleared > 1 ? 's' : ''}, combo ×${multiplier}, ${gained} points.`
        : `Placed at row ${origin.row + 1}, column ${origin.col + 1}. ${gained} points.`,
    )

    if (!reduced && scoreRef.current) {
      gsap.fromTo(
        scoreRef.current,
        { scale: 1 },
        { scale: 1.12, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' },
      )
    }
  }

  function showHint() {
    const suggestion = bestHint(grid, tray)
    if (!suggestion) {
      setStatus(
        'No legal move left. In Zen mode the fullest rows would dissolve and the run would carry on.',
      )
      return
    }
    const suggested = tray[suggestion.slot]
    setSelected(suggestion.slot)
    setHint(suggestion.origin)
    setStatus(
      `Hint: ${suggested ? describePiece(suggested) : 'a piece'} fits at row ${suggestion.origin.row + 1}, column ${suggestion.origin.col + 1}.`,
    )
  }

  /** Roving focus: the board is one tab stop and arrow keys walk it. */
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const deltas: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: BOARD_SIZE,
      ArrowUp: -BOARD_SIZE,
    }
    const delta = deltas[event.key]
    if (delta === undefined) return

    const next = index + delta
    if (next < 0 || next >= BOARD_SIZE * BOARD_SIZE) return
    const wrapped =
      Math.abs(delta) === 1 && Math.floor(next / BOARD_SIZE) !== Math.floor(index / BOARD_SIZE)
    if (wrapped) return

    event.preventDefault()
    setFocusIndex(next)
    cellRefs.current[next]?.focus()
  }

  const rows = Array.from({ length: BOARD_SIZE }, (_, row) => row)

  return (
    <section id="demo" className="container-page scroll-mt-24 py-24 sm:py-32">
      <SectionHeading
        eyebrow="Play it here"
        title="The same rules, running in this page."
        lead="An 8×8 board, a weighted bag of 30 silhouettes, one point per cell placed plus lines² × 10 for a clear, multiplied by the combo. Pick a piece, then pick a marked cell — arrow keys walk the board and Enter places."
      />

      <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Reveal className="panel p-5 sm:p-7">
          <div
            ref={boardRef}
            role="grid"
            aria-label="Demo board, 8 by 8"
            className="mx-auto grid w-full max-w-lg gap-1.5 rounded-2xl bg-surface/60 p-3 sm:gap-2"
            style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}
          >
            {rows.map((row) => (
              // `display: contents` keeps the ARIA row structure without breaking
              // the single CSS grid the board is laid out on.
              <div key={row} role="row" style={{ display: 'contents' }}>
                {Array.from({ length: BOARD_SIZE }, (_, col) => {
                  const index = row * BOARD_SIZE + col
                  const cell = grid[index]
                  const block = cell ? blockOf(cell) : null
                  const lines = candidates.get(index)
                  const isCandidate = lines !== undefined
                  const isHint = hint?.row === row && hint?.col === col
                  const ghost = ghosts.find((item) => item.index === index)

                  const label = [
                    `Row ${row + 1}, column ${col + 1}`,
                    cell ? `${cell} with ${blockOf(cell).pattern}` : 'empty',
                    isCandidate ? 'fits here' : null,
                    lines ? `clears ${lines} line${lines > 1 ? 's' : ''}` : null,
                  ]
                    .filter(Boolean)
                    .join(', ')

                  return (
                    <button
                      key={index}
                      ref={(node) => {
                        cellRefs.current[index] = node
                      }}
                      type="button"
                      role="gridcell"
                      aria-label={label}
                      tabIndex={index === focusIndex ? 0 : -1}
                      onFocus={() => setFocusIndex(index)}
                      onKeyDown={(event) => handleKeyDown(event, index)}
                      onClick={() => handlePlace({ row, col })}
                      className="relative aspect-square rounded-[22%] transition-transform duration-150 hover:scale-105"
                    >
                      {block ? (
                        <BlockTile
                          hex={block.hex}
                          pattern={block.pattern}
                          className="h-full w-full"
                          scale={9}
                        />
                      ) : (
                        <span className="absolute inset-0 rounded-[22%] bg-cell/60" />
                      )}

                      {ghost && (
                        <span data-ghost className="absolute inset-0">
                          <BlockTile
                            hex={ghost.hex}
                            pattern={ghost.pattern}
                            className="h-full w-full"
                            scale={9}
                          />
                        </span>
                      )}

                      {!block && isCandidate && (
                        <span
                          className={`absolute inset-0 flex items-center justify-center rounded-[22%] border-2 border-dashed ${
                            isHint ? 'border-accent bg-accent/15' : 'border-white/30'
                          }`}
                        >
                          <span
                            aria-hidden
                            className={`h-1 w-1 rounded-full ${lines ? 'bg-accent' : 'bg-white/50'}`}
                          />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          <p className="mt-5 text-center text-sm text-white/45" role="status" aria-live="polite">
            {status}
          </p>
        </Reveal>

        <Reveal delay={0.1} className="flex flex-col gap-5">
          <div className="panel p-6">
            <p className="text-xs font-semibold tracking-widest text-white/45 uppercase">Score</p>
            <p ref={scoreRef} className="mt-1 origin-left text-4xl font-semibold tabular-nums">
              {score.toLocaleString()}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-white/45">Combo</dt>
                <dd className="font-medium tabular-nums">×{comboMultiplier(streak)}</dd>
              </div>
              <div>
                <dt className="text-white/45">Best</dt>
                <dd className="font-medium tabular-nums">{best.toLocaleString()}</dd>
              </div>
            </dl>
          </div>

          <div className="panel p-6">
            <p className="text-xs font-semibold tracking-widest text-white/45 uppercase">Tray</p>
            <div className="mt-4 flex items-stretch justify-between gap-3">
              {tray.map((item, slot) => (
                <button
                  key={item?.id ?? `empty-${slot}`}
                  type="button"
                  disabled={!item}
                  aria-pressed={selected === slot}
                  aria-label={item ? describePiece(item) : 'Empty tray slot'}
                  onClick={() => {
                    setSelected(slot)
                    setHint(null)
                    if (item) setStatus(`Selected ${describePiece(item)}.`)
                  }}
                  className={`flex h-24 flex-1 items-center justify-center rounded-2xl border p-2 transition ${
                    selected === slot && item
                      ? 'border-accent/70 bg-accent/10'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                  } ${item ? '' : 'opacity-30'}`}
                >
                  {item && (
                    <PieceView
                      shape={item.shape}
                      hex={blockOf(item.color).hex}
                      pattern={blockOf(item.color).pattern}
                      cell={13}
                      gap={2}
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={showHint}
                className="flex-1 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/80 transition hover:border-white/30 hover:text-white"
              >
                Hint
              </button>
              <button
                type="button"
                onClick={reset}
                className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-ink transition hover:brightness-110"
              >
                New board
              </button>
            </div>
          </div>

          {gameOver && (
            <div className="panel border-accent/40 bg-accent/10 p-6">
              <p className="font-semibold text-white">No move fits.</p>
              <p className="mt-2 text-sm/6 text-white/65">
                In the app this is where Classic mode ends — and where Zen mode dissolves the fullest
                rows so the run carries on instead.
              </p>
            </div>
          )}

          <p className="text-xs/5 text-white/35">
            A straight port of the app's board rules. Sound, haptics, spatial audio and the VoiceOver
            layer are what the iPhone build adds on top of them.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
