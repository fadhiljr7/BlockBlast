import { useRef } from 'react'
import { BLOCK_BY_ID } from '../lib/blocks'
import type { BlockId } from '../lib/blocks'
import { BlockTile } from '../components/BlockTile'
import { WordReveal } from '../components/WordReveal'
import { useGsapEffect } from '../lib/motion'

const STATS = [
  {
    value: '1 in 12',
    unit: 'men',
    detail: 'have some form of colour vision deficiency.',
  },
  {
    value: '1 in 200',
    unit: 'women',
    detail: 'have it too — a group routinely left out of the estimate.',
  },
  {
    value: '285M',
    unit: 'people',
    detail: 'worldwide are visually impaired, 39 million of them blind.',
  },
] as const

/**
 * A board built from the exact hues deuteranopia collapses together. Red, green
 * and orange are three obviously different blocks to typical colour vision and
 * three near-identical ones without green cones — which is the entire argument
 * this section is making, so the demonstration has to be real rather than
 * illustrative.
 */
const BOARD: readonly BlockId[] = [
  'red', 'green', 'orange', 'red', 'green',
  'green', 'orange', 'red', 'green', 'orange',
  'orange', 'red', 'green', 'orange', 'red',
  'red', 'green', 'orange', 'red', 'green',
  'green', 'orange', 'red', 'green', 'orange',
]

function MiniBoard({ patterns }: { patterns: boolean }) {
  return (
    <div
      className="grid grid-cols-5 gap-1.5 rounded-xl bg-surface p-2"
      style={{ filter: 'url(#cvd-deuteranopia)' }}
    >
      {BOARD.map((id, index) => (
        <BlockTile
          key={index}
          block={BLOCK_BY_ID[id]}
          patterns={patterns}
          className="aspect-square w-full"
        />
      ))}
    </div>
  )
}

export function Problem() {
  const scopeRef = useRef<HTMLElement>(null)

  useGsapEffect(scopeRef, ({ gsap }) => {
    gsap.to('[data-problem-heading] [data-reveal-word]', {
      yPercent: 0,
      duration: 0.9,
      stagger: 0.04,
      scrollTrigger: { trigger: '[data-problem-heading]', start: 'top 80%' },
    })

    gsap.to('[data-stat]', {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.12,
      scrollTrigger: { trigger: '[data-stats]', start: 'top 82%' },
    })

    // The two boards arrive one after the other, so the comparison is read in
    // order rather than as one wall of blocks.
    gsap.to('[data-compare]', {
      opacity: 1,
      y: 0,
      duration: 0.9,
      stagger: 0.18,
      scrollTrigger: { trigger: '[data-compare-grid]', start: 'top 78%' },
    })
  })

  return (
    <section
      ref={scopeRef}
      id="problem"
      aria-labelledby="problem-heading"
      className="shell scroll-mt-24 py-28 sm:py-36"
    >
      <p className="eyebrow">The problem</p>

      <WordReveal
        as="h2"
        id="problem-heading"
        data-problem-heading
        text="Most puzzle games ignore them."
        className="display-2 mt-5 max-w-[18ch]"
      />

      <ul data-stats className="mt-14 grid list-none gap-8 p-0 md:grid-cols-3">
        {STATS.map((stat) => (
          <li key={stat.value} data-stat data-enter-up className="border-t border-line pt-5">
            <p className="font-display text-5xl font-bold tracking-tight text-ink">
              {stat.value}
              <span className="ml-2 align-middle text-base font-medium text-ink-dim">
                {stat.unit}
              </span>
            </p>
            <p className="mt-2 text-ink-dim">{stat.detail}</p>
          </li>
        ))}
      </ul>

      <div className="mt-20">
        <h3 className="display-3 max-w-2xl">The same board, seen without green cones.</h3>
        <p className="mt-4 max-w-2xl text-ink-dim">
          Both grids below are rendered through a deuteranopia simulation — the same matrix the game
          uses. The only difference between them is whether the blocks carry patterns.
        </p>

        <div data-compare-grid className="mt-10 grid gap-8 md:grid-cols-2">
          <article data-compare data-enter-up className="surface-card p-6">
            <div className="flex items-baseline justify-between gap-4">
              <h4 className="text-lg font-semibold">A typical puzzle game</h4>
              <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-soft">
                Unplayable
              </span>
            </div>
            <div className="mt-5">
              <MiniBoard patterns={false} />
            </div>
            <p className="mt-5 text-sm text-ink-dim">
              Three block types rendered as colour alone. Red and orange have collapsed into the
              same yellow — two of the three are now the same block as far as your eyes are
              concerned, and a puzzle about matching becomes a puzzle about guessing.
            </p>
          </article>

          <article data-compare data-enter-up className="surface-card p-6">
            <div className="flex items-baseline justify-between gap-4">
              <h4 className="text-lg font-semibold">Block Blast</h4>
              <span className="rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-success">
                Fully playable
              </span>
            </div>
            <div className="mt-5">
              <MiniBoard patterns />
            </div>
            <p className="mt-5 text-sm text-ink-dim">
              Identical hues, identical filter. Dots, vertical stripes and checkerboard separate the
              three block types instantly — and they are drawn always, not as an opt-in setting.
            </p>
          </article>
        </div>

        {/* The comparison is entirely visual, so its conclusion is stated in
            text for anyone who cannot see either grid. */}
        <p className="sr-only-text">
          Both grids contain the same twenty-five blocks: red with dots, green with vertical
          stripes, and orange with checkerboard. In the first grid, where colour is the only
          signal, deuteranopia turns both the red and the orange blocks into the same yellow —
          they become impossible to tell apart, while green survives as a desaturated grey. In the
          second grid the hues are identical and the filter is identical, but dots, vertical
          stripes and checkerboard stay completely distinct, so all three block types remain
          identifiable.
        </p>
      </div>
    </section>
  )
}
