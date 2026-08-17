import { useState } from 'react'
import BlockTile from '../components/BlockTile'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import { BLOCKS } from '../data/site'
import { simulate, VISION_MODES, type VisionId } from '../lib/vision'

/**
 * The block key from the app's settings screen, plus the colour-vision
 * simulation it ships with. Turning patterns off under a simulation is the
 * whole argument for the pattern system, so both switches are here to play with.
 */
export default function BlockKey() {
  const [vision, setVision] = useState<VisionId>('none')
  const [patterned, setPatterned] = useState(true)

  return (
    <section id="blocks" className="container-page scroll-mt-24 py-24 sm:py-32">
      <SectionHeading
        eyebrow="The block key"
        title="Seven colours. Seven patterns. Try taking the colour away."
        lead="This is the same key the app keeps in Settings, and the same colour-vision simulation — which the app applies to the whole board, not to a preview swatch, so you can verify a palette in the situation you actually play in."
      />

      <Reveal className="mt-12 panel p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <fieldset>
            <legend className="text-xs font-semibold tracking-widest text-white/45 uppercase">
              Simulate colour vision
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {VISION_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  aria-pressed={vision === mode.id}
                  onClick={() => setVision(mode.id)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    vision === mode.id
                      ? 'bg-accent font-medium text-ink'
                      : 'border border-white/15 text-white/70 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {mode.name}
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            aria-pressed={patterned}
            onClick={() => setPatterned((value) => !value)}
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:border-white/30 hover:text-white"
          >
            Patterns: {patterned ? 'on' : 'off'}
          </button>
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {BLOCKS.map((block) => {
            const hex = simulate(block.hex, vision)
            return (
              <li key={block.id} className="flex flex-col items-center gap-3 text-center">
                <BlockTile
                  hex={hex}
                  pattern={block.pattern}
                  patterned={patterned}
                  className="aspect-square w-full max-w-24"
                  scale={16}
                />
                <div>
                  <p className="text-sm font-medium capitalize">{block.id}</p>
                  <p className="text-xs text-white/50">{block.pattern}</p>
                </div>
              </li>
            )
          })}
        </ul>

        <p className="mt-8 max-w-3xl text-sm/6 text-white/50" role="status">
          {patterned
            ? vision === 'none'
              ? 'Both channels are on. Every block is separable by hue and by pattern.'
              : 'Hues have collapsed towards each other, and the pattern is still doing the work. This is the state the game is designed for.'
            : 'Patterns off — the state the game never ships in. Under a simulation, several of these blocks are now the same object.'}
        </p>
      </Reveal>
    </section>
  )
}
