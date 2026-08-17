import { useRef } from 'react'
import { BLOCKS, PENTATONIC_ROWS } from '../lib/blocks'
import { BlockTile } from '../components/BlockTile'
import { WordReveal } from '../components/WordReveal'
import { useGsapEffect } from '../lib/motion'

/**
 * The block key from the game's Settings screen, restated on the web.
 *
 * It is here because it is the most compact proof of the whole thesis: seven
 * blocks, and four independent ways to tell them apart. Take any one column
 * away and the table still identifies every row.
 */
export function BlockKey() {
  const scopeRef = useRef<HTMLElement>(null)

  useGsapEffect(scopeRef, ({ gsap }) => {
    gsap.to('[data-key-heading] [data-reveal-word]', {
      yPercent: 0,
      duration: 0.9,
      stagger: 0.04,
      scrollTrigger: { trigger: '[data-key-heading]', start: 'top 82%' },
    })
    gsap.to('[data-key-row]', {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.06,
      scrollTrigger: { trigger: '[data-key-table]', start: 'top 85%' },
    })
  })

  return (
    <section ref={scopeRef} aria-labelledby="key-heading" className="shell py-28 sm:py-36">
      <p className="eyebrow">The block key</p>
      <WordReveal
        as="h2"
        id="key-heading"
        data-key-heading
        text="Four ways to name the same block."
        className="display-2 mt-5 max-w-[18ch]"
      />
      <p className="mt-5 max-w-2xl text-lg text-ink-dim">
        Every block carries a colour, a pattern, a spoken name and a pitch. Cover any one column
        below and the remaining three still tell all seven apart — which is the whole design, stated
        as a table.
      </p>

      <div data-key-table className="mt-12 overflow-x-auto">
        <table className="w-full min-w-[42rem] border-collapse text-left">
          <caption className="sr-only-text">
            The seven blocks with their pattern, spoken description and audio pitch offset.
          </caption>
          <thead>
            <tr className="border-b border-line text-sm uppercase tracking-wider text-ink-dim">
              <th scope="col" className="py-3 pr-4 font-semibold">
                Block
              </th>
              <th scope="col" className="py-3 pr-4 font-semibold">
                Pattern
              </th>
              <th scope="col" className="py-3 pr-4 font-semibold">
                Spoken as
              </th>
              <th scope="col" className="py-3 font-semibold">
                Tone offset
              </th>
            </tr>
          </thead>
          <tbody>
            {BLOCKS.map((block) => (
              <tr key={block.id} data-key-row data-enter-up className="border-b border-line/60">
                <th scope="row" className="py-4 pr-4 font-semibold">
                  <span className="flex items-center gap-3">
                    <BlockTile block={block} className="h-10 w-10 shrink-0" />
                    {block.name}
                  </span>
                </th>
                <td className="py-4 pr-4 text-ink-dim">
                  <span className="flex items-center gap-3">
                    <span aria-hidden="true" className="font-mono text-ink">
                      {block.glyph}
                    </span>
                    {block.patternName}
                  </span>
                </td>
                <td className="py-4 pr-4 text-ink-dim">
                  <q>
                    {block.name.toLowerCase()} with {block.patternName}
                  </q>
                </td>
                <td className="py-4 text-ink-dim">
                  +{block.toneOffset} {block.toneOffset === 1 ? 'semitone' : 'semitones'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Colour and position are separate audio dimensions in the app, so the
          table must not imply that a block belongs to a row. */}
      <p className="mt-6 max-w-2xl text-sm text-ink-dim">
        The two audio dimensions are independent. A cell&rsquo;s <em>row</em> sets its base pitch on
        a C-major pentatonic scale, from {Math.round(PENTATONIC_ROWS[0])} Hz at the bottom to{' '}
        {Math.round(PENTATONIC_ROWS[PENTATONIC_ROWS.length - 1])} Hz at the top, and its{' '}
        <em>column</em> sets its position in space. The block&rsquo;s own offset is added on top of
        that, so hearing a cell tells you where it is and what is in it at the same time.
      </p>
    </section>
  )
}
