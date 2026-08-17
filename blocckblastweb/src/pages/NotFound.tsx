import { Link } from 'react-router-dom'
import BlockTile from '../components/BlockTile'
import { BLOCKS } from '../data/site'
import { usePageMeta } from '../lib/meta'

export default function NotFound() {
  usePageMeta('Page not found', 'That page does not exist. Head back to the Block Blast home page.')

  return (
    <section className="container-page flex min-h-[70svh] flex-col items-center justify-center py-24 text-center">
      <div className="flex items-center gap-3" aria-hidden>
        <BlockTile hex={BLOCKS[0].hex} pattern={BLOCKS[0].pattern} className="h-14 w-14" scale={11} />
        <BlockTile hex={BLOCKS[1].hex} pattern={BLOCKS[1].pattern} className="h-14 w-14" scale={11} />
        <span className="candidate-outline h-14 w-14" />
        <BlockTile hex={BLOCKS[2].hex} pattern={BLOCKS[2].pattern} className="h-14 w-14" scale={11} />
      </div>

      <h1 className="mt-10 text-4xl font-semibold tracking-tight sm:text-5xl">
        No piece fits here.
      </h1>
      <p className="mt-4 max-w-md text-base/7 text-white/55">
        That page does not exist — an empty cell, marked the way the game marks them.
      </p>

      <Link
        to="/"
        className="mt-10 rounded-2xl bg-accent px-5 py-3.5 text-sm font-semibold text-ink transition hover:brightness-110"
      >
        Back to the home page
      </Link>
    </section>
  )
}
