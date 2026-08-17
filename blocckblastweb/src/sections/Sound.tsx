import { useState } from 'react'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import { EARCONS, SOUND_PACKS } from '../data/site'
import { playCell } from '../lib/tone'

const SIZE = 8
/** A sparse board so a sweep has both empty and occupied cells to cross. */
const OCCUPIED = new Set([9, 10, 17, 26, 27, 35, 36, 44, 51, 52, 53, 58])

export default function Sound() {
  const [lastCell, setLastCell] = useState<string | null>(null)
  const [muted, setMuted] = useState(false)

  function sound(row: number, col: number) {
    if (muted) return
    const occupied = OCCUPIED.has(row * SIZE + col)
    const audible = playCell(row, col, SIZE, { occupied })
    setLastCell(
      audible
        ? `Row ${row + 1}, column ${col + 1}, ${occupied ? 'occupied' : 'empty'}`
        : 'Click any cell once — a browser will not start audio before you do.',
    )
  }

  return (
    <section id="sound" className="container-page scroll-mt-24 py-24 sm:py-32">
      <SectionHeading
        eyebrow="Sonic navigation"
        title="Sweep the board with your ear."
        lead="Every sound in the app is synthesised at runtime rather than shipped as an asset, so the pitch mapping used for navigation stays exact. This is the same mapping, rebuilt in the browser — headphones make the left-to-right position obvious."
      />

      <div className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <Reveal className="panel p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-white/60">
              Move over the board, or use a keyboard — every cell plays as you cross it.
            </p>
            <button
              type="button"
              aria-pressed={muted}
              onClick={() => setMuted((value) => !value)}
              className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:border-white/30 hover:text-white"
            >
              {muted ? 'Sound off' : 'Sound on'}
            </button>
          </div>

          <div
            className="mt-6 grid gap-1.5 rounded-2xl bg-surface/60 p-3"
            style={{ gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: SIZE * SIZE }, (_, index) => {
              const row = Math.floor(index / SIZE)
              const col = index % SIZE
              const occupied = OCCUPIED.has(index)
              return (
                <button
                  key={index}
                  type="button"
                  aria-label={`Play row ${row + 1}, column ${col + 1}, ${occupied ? 'occupied' : 'empty'}`}
                  onPointerEnter={() => sound(row, col)}
                  onFocus={() => sound(row, col)}
                  onClick={() => sound(row, col)}
                  className={`aspect-square rounded-[22%] transition ${
                    occupied
                      ? 'bg-block-cyan/70 hover:bg-block-cyan'
                      : 'bg-cell/60 hover:bg-cell'
                  }`}
                />
              )
            })}
          </div>

          <p className="mt-4 text-sm text-white/45" role="status" aria-live="polite">
            {lastCell ?? 'Higher rows sound higher. Occupied cells gain a second partial.'}
          </p>
        </Reveal>

        <div className="flex flex-col gap-6">
          <Reveal delay={0.08} className="panel p-6 sm:p-8">
            <h3 className="text-lg font-semibold">The earcon vocabulary</h3>
            <dl className="mt-5 divide-y divide-white/10">
              {EARCONS.map((earcon) => (
                <div key={earcon.event} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
                  <dt className="text-sm font-medium text-white/85">{earcon.event}</dt>
                  <dd className="text-sm text-white/55">{earcon.sound}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={0.16} className="panel p-6 sm:p-8">
            <h3 className="text-lg font-semibold">Four sound packs</h3>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {SOUND_PACKS.map((pack) => (
                <li key={pack.id} className="rounded-2xl border border-white/10 p-4">
                  <p className="font-medium">{pack.name}</p>
                  <p className="mt-1 text-sm/6 text-white/50">{pack.detail}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
