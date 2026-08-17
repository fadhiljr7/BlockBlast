import { useCallback, useRef, useState, useSyncExternalStore } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { BLOCK_BY_ID, VISION_MODES } from '../lib/blocks'
import type { VisionMode } from '../lib/blocks'
import { BlockTile } from '../components/BlockTile'
import { WordReveal } from '../components/WordReveal'
import { useGsapEffect } from '../lib/motion'
import {
  SIZE,
  describeCell,
  describePiece,
  emptyBoard,
  fits,
  index,
  newTray,
  openingTray,
  ensurePlayable,
  place,
  placementSuffix,
} from '../lib/miniGame'
import type { Board, Piece } from '../lib/miniGame'

const STEPS = [
  {
    id: 'colour',
    title: 'Colour vision',
    body: 'Switch the simulation and watch the hues collapse. The patterns do not — which is why the board stays readable no matter which cones are missing.',
  },
  {
    id: 'speech',
    title: 'Screen reader',
    body: 'Turn on the transcript to see every phrase VoiceOver would speak, in the app’s own wording. Position, contents, whether the piece fits, and how many lines it would clear.',
  },
  {
    id: 'haptics',
    title: 'Haptics',
    body: 'The third channel. In the app, Core Haptics mirrors every cue — a tick where a piece fits, a thud where it does not, and a burst that grows with the lines cleared.',
  },
] as const

function PiecePreview({ piece, size = 20 }: { piece: Piece; size?: number }) {
  const block = BLOCK_BY_ID[piece.block]
  return (
    <span
      aria-hidden="true"
      className="grid gap-0.5"
      style={{
        gridTemplateColumns: `repeat(${piece.cols}, ${size}px)`,
        gridTemplateRows: `repeat(${piece.rows}, ${size}px)`,
      }}
    >
      {Array.from({ length: piece.rows * piece.cols }, (_, cell) => {
        const row = Math.floor(cell / piece.cols)
        const col = cell % piece.cols
        const filled = piece.cells.some(([r, c]) => r === row && c === col)
        return filled ? (
          <BlockTile key={cell} block={block} className="h-full w-full" />
        ) : (
          <span key={cell} />
        )
      })}
    </span>
  )
}

export function AccessibilityDemo() {
  const scopeRef = useRef<HTMLElement>(null)

  const [board, setBoard] = useState<Board>(emptyBoard)
  const [tray, setTray] = useState<(Piece | null)[]>(openingTray)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [focusCell, setFocusCell] = useState({ row: 0, col: 0 })

  const [vision, setVision] = useState<VisionMode>('none')
  const [transcriptOn, setTranscriptOn] = useState(false)
  const [hapticsOn, setHapticsOn] = useState(false)

  const [transcript, setTranscript] = useState<string[]>([])
  const [liveMessage, setLiveMessage] = useState('')
  const [step, setStep] = useState(0)

  const cellRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Platform capability, read at render rather than copied into state by an
  // effect. The server snapshot is `true` so the prerendered HTML never ships
  // the "not supported" note to a device that does support it.
  const hapticsSupported = useSyncExternalStore(
    () => () => {},
    () => 'vibrate' in navigator,
    () => true,
  )

  /**
   * `speak` feeds the visible transcript and, when it is something a real
   * screen reader would not already have said, the live region too.
   *
   * Focus moves are deliberately transcript-only: VoiceOver already reads the
   * label of whatever the user just focused, and echoing it into a live region
   * would make the page say everything twice.
   */
  const speak = useCallback((message: string, options?: { live?: boolean }) => {
    setTranscript((entries) => [message, ...entries].slice(0, 7))
    if (options?.live !== false) setLiveMessage(message)
  }, [])

  const vibrate = useCallback(
    (pattern: number | number[]) => {
      if (!hapticsOn || typeof navigator === 'undefined' || !('vibrate' in navigator)) return
      navigator.vibrate(pattern)
    },
    [hapticsOn],
  )

  const selectPiece = useCallback(
    (slot: number) => {
      const piece = tray[slot]
      if (!piece) return
      setSelected(slot)
      speak(`${describePiece(piece)}, selected. Choose a cell.`)
      vibrate(12)
    },
    [tray, speak, vibrate],
  )

  const reset = useCallback(() => {
    setBoard(emptyBoard())
    setTray(openingTray())
    setSelected(null)
    setScore(0)
    setCombo(0)
    speak('New demo board. Score 0.')
  }, [speak])

  const playCell = useCallback(
    (row: number, col: number) => {
      const slot = selected
      const piece = slot === null ? null : tray[slot]

      if (!piece) {
        speak(`${describeCell(board, row, col)}. Choose a piece first.`)
        return
      }

      if (!fits(board, piece, row, col)) {
        speak(`Row ${row + 1}, column ${col + 1}, does not fit.`)
        // The app answers an illegal move with a dull thud rather than silence,
        // so you learn the edge of the board without looking at it.
        vibrate([18, 40, 18])
        return
      }

      const result = place(board, piece, row, col, combo)

      const remaining = tray.map((entry, position) => (position === slot ? null : entry))
      const nextTray = remaining.every((entry) => entry === null) ? newTray() : remaining

      // Zen rules, applied here rather than reactively: if the new position has
      // no legal move left, the fullest rows dissolve until it does. A landing
      // page demo that can be lost is a landing page demo that is broken.
      const playable = ensurePlayable(result.board, nextTray)

      setBoard(playable.board)
      setScore((value) => value + result.gained)
      setCombo(playable.clearedRows.length > 0 ? 0 : result.combo)
      setTray(nextTray)
      setSelected(null)

      const cleared =
        result.clearedLines > 0
          ? ` ${result.clearedLines} ${result.clearedLines === 1 ? 'line' : 'lines'} cleared.`
          : ''
      const comboText = result.combo > 1 ? ` Combo ${result.combo} times.` : ''
      const relief =
        playable.clearedRows.length > 0
          ? ' Nothing fits — in Zen mode the board makes room, so the fullest row dissolves.'
          : ''
      speak(
        `Placed at row ${row + 1}, column ${col + 1}.${cleared}${comboText} Plus ${result.gained}.${relief}`,
      )

      // The burst grows with the number of lines, matching the app's haptics.
      if (result.clearedLines > 0) {
        vibrate(Array.from({ length: result.clearedLines * 2 }, (_, i) => (i % 2 ? 30 : 45)))
      } else {
        vibrate(20)
      }
    },
    [board, combo, selected, tray, speak, vibrate],
  )

  const onCellKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>, row: number, col: number) => {
      const moves: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
      }
      const move = moves[event.key]
      if (!move) return
      event.preventDefault()
      const next = {
        row: Math.min(SIZE - 1, Math.max(0, row + move[0])),
        col: Math.min(SIZE - 1, Math.max(0, col + move[1])),
      }
      setFocusCell(next)
      cellRefs.current[index(next.row, next.col)]?.focus()
      // Transcript only — the browser and screen reader announce the newly
      // focused cell from its own label.
      speak(describeCell(board, next.row, next.col), { live: false })
    },
    [board, speak],
  )

  useGsapEffect(scopeRef, ({ gsap, ScrollTrigger }) => {
    gsap.to('[data-demo-heading] [data-reveal-word]', {
      yPercent: 0,
      duration: 0.9,
      stagger: 0.04,
      scrollTrigger: { trigger: '[data-demo-heading]', start: 'top 82%' },
    })

    gsap.to('[data-demo-panel]', {
      opacity: 1,
      y: 0,
      duration: 0.9,
      stagger: 0.12,
      scrollTrigger: { trigger: '[data-demo-panel]', start: 'top 80%' },
    })

    // The section pins and walks through the three channels — but only where
    // there is room for it. On a short or narrow viewport a pinned, scroll-
    // driven panel fights the interactive board inside it, so the copy simply
    // stacks and scrolls normally.
    const media = gsap.matchMedia()
    media.add('(min-width: 1024px) and (min-height: 900px)', () => {
      const trigger = ScrollTrigger.create({
        trigger: '[data-demo-pin]',
        start: 'top top+=72',
        end: '+=1500',
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          setStep(Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length)))
        },
      })
      return () => trigger.kill()
    })
    return () => media.revert()
  })

  const activePiece = selected === null ? null : tray[selected]
  const visionOption = VISION_MODES.find((mode) => mode.id === vision)!

  return (
    <section
      ref={scopeRef}
      id="accessibility"
      aria-labelledby="demo-heading"
      className="scroll-mt-24 py-28 sm:py-36"
    >
      <div className="shell">
        <p className="eyebrow">Try it yourself</p>
        <WordReveal
          as="h2"
          id="demo-heading"
          data-demo-heading
          text="Take a channel away. Keep playing."
          className="display-2 mt-5 max-w-[19ch]"
        />
        <p className="mt-5 max-w-2xl text-lg text-ink-dim">
          This board is real: tap a piece, then tap a cell. Full rows and columns clear, and the
          score uses the game&rsquo;s own formula. Now remove your colour vision, or your sight, and
          try again.
        </p>
      </div>

      <div data-demo-pin className="shell mt-14">
        {/* The walkthrough the pin scrolls through. All three steps are always
            in the DOM; scrolling only changes which one is emphasised, so a
            reader who never triggers the pin still gets the whole explanation. */}
        <ol className="mb-8 grid list-none gap-3 p-0 md:grid-cols-3">
          {STEPS.map((entry, position) => (
            <li
              key={entry.id}
              className={`rounded-2xl border p-4 transition-colors duration-500 ${
                position === step ? 'border-ink/40 bg-surface' : 'border-line bg-surface/40'
              }`}
            >
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span
                  aria-hidden="true"
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs ${
                    position === step ? 'bg-ink text-bg' : 'bg-surface-2 text-ink-dim'
                  }`}
                >
                  {position + 1}
                </span>
                {entry.title}
              </p>
              <p className="mt-1.5 text-sm leading-snug text-ink-dim">{entry.body}</p>
            </li>
          ))}
        </ol>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* Controls */}
          <div data-demo-panel data-enter-up className="flex flex-col gap-4">
            {/* A labelled group rather than a fieldset: these are toggle
                buttons, not form fields, and a <legend> notches the card's
                border wherever it sits. */}
            <div role="group" aria-labelledby="vision-group-label" className="surface-card p-6">
              <h3
                id="vision-group-label"
                className="text-sm font-semibold uppercase tracking-wider text-ink-dim"
              >
                Colour vision simulation
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {VISION_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    aria-pressed={vision === mode.id}
                    onClick={() => {
                      setVision(mode.id)
                      speak(
                        mode.id === 'none'
                          ? 'Colour vision simulation off.'
                          : `${mode.label} simulation on. ${mode.detail}`,
                      )
                    }}
                    className={`rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${
                      vision === mode.id
                        ? 'border-accent bg-accent/15 text-ink'
                        : 'border-line bg-surface-2 text-ink-dim hover:text-ink'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-ink-dim">{visionOption.detail}</p>
            </div>

            <div className="surface-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold">Screen reader transcript</h3>
                  <p className="mt-1 text-sm text-ink-dim">
                    Shows what VoiceOver would speak, in the app&rsquo;s wording.
                  </p>
                </div>
                <button
                  type="button"
                  aria-pressed={transcriptOn}
                  onClick={() => {
                    setTranscriptOn((value) => !value)
                    speak(transcriptOn ? 'Transcript hidden.' : 'Transcript shown.')
                  }}
                  className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                    transcriptOn
                      ? 'border-success bg-success/15 text-ink'
                      : 'border-line bg-surface-2 text-ink-dim'
                  }`}
                >
                  {transcriptOn ? 'On' : 'Off'}
                </button>
              </div>

              {transcriptOn && (
                <ol className="mt-5 list-none space-y-2 p-0">
                  {transcript.length === 0 && (
                    <li className="text-sm text-ink-dim">
                      Nothing spoken yet. Select a piece to begin.
                    </li>
                  )}
                  {transcript.map((entry, position) => (
                    <li
                      key={`${entry}-${position}`}
                      className={`rounded-lg border border-line bg-bg/60 px-3 py-2 text-sm ${
                        position === 0 ? 'text-ink' : 'text-ink-dim'
                      }`}
                    >
                      <span className="mr-2 select-none text-ink-dim" aria-hidden="true">
                        ▸
                      </span>
                      {entry}
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="surface-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold">Haptic preview</h3>
                  <p className="mt-1 text-sm text-ink-dim">
                    Fires a vibration pattern on each placement.
                  </p>
                </div>
                <button
                  type="button"
                  aria-pressed={hapticsOn}
                  disabled={!hapticsSupported}
                  onClick={() => {
                    const next = !hapticsOn
                    setHapticsOn(next)
                    if (next) navigator.vibrate?.([14, 40, 26])
                    speak(next ? 'Haptic preview on.' : 'Haptic preview off.')
                  }}
                  className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    hapticsOn
                      ? 'border-success bg-success/15 text-ink'
                      : 'border-line bg-surface-2 text-ink-dim'
                  }`}
                >
                  {hapticsOn ? 'On' : 'Off'}
                </button>
              </div>
              {!hapticsSupported && (
                <p className="mt-3 text-sm text-ink-dim">
                  Your browser does not expose the Vibration API — Safari on iOS and iPadOS never
                  has. On iPhone this is one of the things only a native app can do, which is a good
                  part of why the game is one.
                </p>
              )}
            </div>
          </div>

          {/* Board */}
          <div data-demo-panel data-enter-up className="surface-card p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm text-ink-dim">Score</p>
                <p className="font-display text-4xl font-bold tracking-tight">
                  {score}
                  {combo > 1 && (
                    <span className="ml-3 align-middle text-base font-semibold text-primary-soft">
                      combo ×{combo}
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={reset}
                className="rounded-xl border border-line bg-surface-2 px-4 py-2 text-sm font-semibold text-ink"
              >
                Reset board
              </button>
            </div>

            <div
              className="mt-6 max-w-[26rem]"
              style={vision === 'none' ? undefined : { filter: `url(#cvd-${vision})` }}
            >
              <div
                role="grid"
                aria-label={`Demo board, ${SIZE} by ${SIZE}. Use the arrow keys to move between cells.`}
                className="grid gap-2 rounded-2xl bg-bg/70 p-3"
                style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: SIZE }, (_, row) => (
                  // The grid is a single CSS grid, so rows are presentational
                  // wrappers only; `display: contents` keeps the ARIA row
                  // structure without breaking the layout.
                  <div key={row} role="row" style={{ display: 'contents' }}>
                    {Array.from({ length: SIZE }, (_, col) => {
                      const content = board[index(row, col)]
                      const canPlace = activePiece ? fits(board, activePiece, row, col) : false
                      const label = activePiece
                        ? `${describeCell(board, row, col)}, ${placementSuffix(board, activePiece, row, col)}`
                        : describeCell(board, row, col)

                      return (
                        <div key={col} role="gridcell" className="contents">
                          <button
                            ref={(element) => {
                              cellRefs.current[index(row, col)] = element
                            }}
                            type="button"
                            // Roving tabindex: the grid is one tab stop, and
                            // the arrow keys move within it — sixteen separate
                            // tab stops would be a wall to get past.
                            tabIndex={focusCell.row === row && focusCell.col === col ? 0 : -1}
                            aria-label={label}
                            onFocus={() => setFocusCell({ row, col })}
                            onKeyDown={(event) => onCellKeyDown(event, row, col)}
                            onClick={() => playCell(row, col)}
                            className={`relative aspect-square w-full rounded-xl border transition-[transform,border-color,background-color] duration-200 ${
                              content
                                ? 'border-transparent'
                                : canPlace
                                  ? 'border-dashed border-ink/70 bg-ink/5'
                                  : 'border-line bg-surface-2/60 hover:border-ink-dim/60'
                            }`}
                          >
                            {content && (
                              <BlockTile
                                block={BLOCK_BY_ID[content]}
                                className="absolute inset-0 h-full w-full"
                              />
                            )}
                            {/* A legal landing spot is marked with an outline
                                and a pip — never a fill, because in this game a
                                filled cell always means an occupied cell. */}
                            {!content && canPlace && (
                              <span
                                aria-hidden="true"
                                className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink"
                              />
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-dim">
                Tray — tap a piece, then a cell
              </h3>
              <div className="mt-3 flex flex-wrap gap-3">
                {tray.map((piece, slot) =>
                  piece ? (
                    <button
                      key={piece.id}
                      type="button"
                      aria-pressed={selected === slot}
                      aria-label={`${describePiece(piece)}. ${selected === slot ? 'Selected.' : 'Select this piece.'}`}
                      onClick={() => selectPiece(slot)}
                      className={`flex min-h-20 min-w-24 items-center justify-center rounded-xl border p-3 transition-colors ${
                        selected === slot
                          ? 'border-accent bg-accent/15'
                          : 'border-line bg-surface-2 hover:border-ink-dim/60'
                      }`}
                    >
                      <PiecePreview piece={piece} />
                    </button>
                  ) : (
                    <span
                      key={`empty-${slot}`}
                      aria-hidden="true"
                      className="min-h-20 min-w-24 rounded-xl border border-dashed border-line/60"
                    />
                  ),
                )}
              </div>
            </div>

            {/* Everything the demo says, for a real screen reader. Polite, so it
                never interrupts what the user is already hearing. */}
            <p role="status" aria-live="polite" className="sr-only-text">
              {liveMessage}
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}
