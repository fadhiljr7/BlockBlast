import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import BlockTile from '../components/BlockTile'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import { BLOCKS, PLACEMENT_MODES } from '../data/site'
import { gsap, useReducedMotion } from '../lib/motion'

const SIZE = 6
/** A believable half-played board for the illustration. */
const OCCUPIED: Record<number, number> = { 8: 0, 9: 1, 14: 2, 20: 3, 21: 3, 27: 4, 32: 5, 33: 6 }
/** Where the mini piece could land, mirroring the app's dashed candidate marks. */
const CANDIDATES = [16, 17, 22, 29, 30, 35]
const DWELL_CELL = 22
const DRAG_CELL = 16

export default function PlayModes() {
  const [mode, setMode] = useState(PLACEMENT_MODES[1].id)
  const boardRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const reduced = useReducedMotion()
  const active = PLACEMENT_MODES.find((item) => item.id === mode) ?? PLACEMENT_MODES[0]

  /** The tab pattern people expect: arrows move between tabs, not Tab itself. */
  function handleTabKeys(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
    if (step === 0) return
    event.preventDefault()
    const next = (index + step + PLACEMENT_MODES.length) % PLACEMENT_MODES.length
    setMode(PLACEMENT_MODES[next].id)
    tabRefs.current[next]?.focus()
  }

  useEffect(() => {
    if (reduced || !boardRef.current) return

    const context = gsap.context(() => {
      if (mode === 'sticky') {
        gsap.fromTo(
          '[data-candidate]',
          { opacity: 0.15, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.45, stagger: 0.06, ease: 'back.out(2)' },
        )
      }
      if (mode === 'dwell') {
        gsap.fromTo(
          '[data-dwell-ring]',
          { strokeDashoffset: 126 },
          { strokeDashoffset: 0, duration: 1.6, ease: 'none', repeat: -1, repeatDelay: 0.5 },
        )
      }
      if (mode === 'drag') {
        gsap.fromTo(
          '[data-drag-piece]',
          { x: -26, y: -34 },
          {
            x: 0,
            y: -10,
            duration: 1.4,
            ease: 'power2.inOut',
            repeat: -1,
            yoyo: true,
          },
        )
      }
    }, boardRef)

    return () => context.revert()
  }, [mode, reduced])

  return (
    <section id="modes" className="container-page scroll-mt-24 py-24 sm:py-32">
      <SectionHeading
        eyebrow="Three ways to place a piece"
        title="Nothing in this game requires dragging."
        lead="Drag, tap-tap and dwell all drive the same engine state, so you can switch between them in the middle of a run without losing it."
      />

      <div className="mt-14 grid items-start gap-10 lg:grid-cols-[1fr_1.1fr]">
        <Reveal from="left">
          <div
            role="tablist"
            aria-label="Placement modes"
            aria-orientation="vertical"
            className="flex flex-col gap-3"
          >
            {PLACEMENT_MODES.map((item, index) => {
              const selected = item.id === mode
              return (
                <button
                  key={item.id}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  aria-controls="placement-illustration"
                  tabIndex={selected ? 0 : -1}
                  ref={(node) => {
                    tabRefs.current[index] = node
                  }}
                  onKeyDown={(event) => handleTabKeys(event, index)}
                  onClick={() => setMode(item.id)}
                  className={`rounded-2xl border p-5 text-left transition ${
                    selected
                      ? 'border-accent/60 bg-accent/10'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-lg font-semibold text-white">{item.name}</span>
                    <span className="chip">{item.forWhom}</span>
                  </span>
                  <span className="mt-2 block text-sm/6 text-white/55">{item.detail}</span>
                </button>
              )
            })}
          </div>
        </Reveal>

        <Reveal from="right">
          <div
            id="placement-illustration"
            role="tabpanel"
            aria-label={`${active.name} illustration`}
            ref={boardRef}
            className="panel relative p-6 sm:p-8"
          >
            <div
              className="relative mx-auto grid aspect-square w-full max-w-md gap-2 rounded-2xl bg-surface/60 p-3"
              style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: SIZE * SIZE }, (_, index) => {
                const blockIndex = OCCUPIED[index]
                const block = blockIndex === undefined ? null : BLOCKS[blockIndex]
                const isCandidate = mode === 'sticky' && CANDIDATES.includes(index)
                const isDwell = mode === 'dwell' && index === DWELL_CELL
                const isDragTarget = mode === 'drag' && index === DRAG_CELL

                return (
                  <div key={index} className="relative">
                    {block ? (
                      <BlockTile
                        hex={block.hex}
                        pattern={block.pattern}
                        className="h-full w-full"
                        scale={10}
                      />
                    ) : (
                      <div className="h-full w-full rounded-[22%] bg-cell/60" />
                    )}

                    {isCandidate && (
                      <span
                        data-candidate
                        className="absolute inset-0 flex items-center justify-center rounded-[22%] border-2 border-dashed border-accent/80"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      </span>
                    )}

                    {isDwell && (
                      <svg
                        viewBox="0 0 48 48"
                        className="absolute -inset-1"
                        aria-hidden
                        fill="none"
                      >
                        <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                        <circle
                          data-dwell-ring
                          cx="24"
                          cy="24"
                          r="20"
                          stroke="var(--color-accent)"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray="126"
                          strokeDashoffset="42"
                          transform="rotate(-90 24 24)"
                        />
                      </svg>
                    )}

                    {isDragTarget && (
                      <span className="absolute inset-0 rounded-[22%] border-2 border-dashed border-white/40" />
                    )}
                  </div>
                )
              })}

              {mode === 'drag' && (
                <div
                  data-drag-piece
                  className="pointer-events-none absolute top-[16.6%] left-[16.6%] w-[30%]"
                >
                  <div className="grid grid-cols-2 gap-2 drop-shadow-[0_12px_20px_rgba(0,0,0,0.55)]">
                    <BlockTile hex={BLOCKS[6].hex} pattern={BLOCKS[6].pattern} className="aspect-square" scale={10} />
                    <BlockTile hex={BLOCKS[6].hex} pattern={BLOCKS[6].pattern} className="aspect-square" scale={10} />
                  </div>
                </div>
              )}
            </div>

            <p className="mt-6 text-sm/6 text-white/50">
              {mode === 'sticky' &&
                'Legal spots are marked with a dashed outline and a pip — never a fill, because a filled cell always means an occupied cell.'}
              {mode === 'dwell' &&
                'The ring fills over the dwell time you set, then the piece commits itself. Nothing has to be held down.'}
              {mode === 'drag' &&
                'The piece floats above your finger and a near-miss snaps to the nearest legal spot, so precision is never the thing standing between you and a move.'}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
