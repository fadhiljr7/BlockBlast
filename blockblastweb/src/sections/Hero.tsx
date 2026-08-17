import { useRef, useState } from 'react'
import { HeroGrid } from '../three/HeroGrid'
import { WordReveal } from '../components/WordReveal'
import { AppStoreButton } from '../components/AppStoreButton'
import { VideoLightbox } from '../components/VideoLightbox'
import { useGsapEffect } from '../lib/motion'

const PROOF = [
  { value: '7', label: 'blocks, each with its own pattern, name and pitch' },
  { value: '3', label: 'ways to place a piece, switchable mid-run' },
  { value: '0', label: 'trackers, ads or third-party analytics' },
] as const

export function Hero() {
  const scopeRef = useRef<HTMLElement>(null)
  const [filmOpen, setFilmOpen] = useState(false)

  useGsapEffect(scopeRef, ({ gsap }) => {
    // Everything animates *to* its natural state; the starting state is set in
    // CSS by `.motion-ready`, so the prerendered HTML never flashes its final
    // layout before the timeline takes over.
    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } })

    timeline
      .to('[data-hero-eyebrow]', { opacity: 1, y: 0, duration: 0.6 })
      .to(
        '[data-hero-title] [data-reveal-word]',
        { yPercent: 0, duration: 1.05, stagger: 0.05 },
        '-=0.35',
      )
      .to(
        '[data-hero-tagline] [data-reveal-word]',
        { yPercent: 0, duration: 0.85, stagger: 0.025 },
        '-=0.7',
      )
      .to('[data-hero-cta]', { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, '-=0.5')
      .to('[data-hero-proof] > li', { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, '-=0.45')
      .fromTo('[data-hero-canvas]', { opacity: 0 }, { opacity: 1, duration: 1.8 }, 0)
  })

  return (
    <section
      ref={scopeRef}
      className="relative isolate flex min-h-[calc(100svh-4rem)] items-center overflow-hidden pb-20 pt-16"
      aria-labelledby="hero-title"
    >
      {/* Decorative WebGL board. Hidden from assistive technology; the sentence
          below it is its text alternative. */}
      <div data-hero-canvas className="pointer-events-none absolute inset-0 -z-10">
        <HeroGrid />
        <div
          className="absolute inset-0"
          style={{
            // A scrim, not a veil: it darkens the side the copy sits on and
            // fades out over the board, so the text keeps its contrast ratio
            // without flattening the animation into a grey wash.
            background:
              'linear-gradient(100deg, var(--color-bg) 0%, rgba(10,10,26,0.94) 34%, rgba(10,10,26,0.55) 62%, rgba(10,10,26,0.30) 100%), radial-gradient(90% 70% at 50% 105%, var(--color-bg) 0%, transparent 60%)',
          }}
        />
      </div>
      <p className="sr-only-text">
        Decorative animation: an eight by eight grid of translucent blocks in the game&rsquo;s seven
        colours, drifting and breathing, and leaning towards the pointer.
      </p>

      <div className="shell relative">
        <p data-hero-eyebrow data-enter-up className="eyebrow">
          <span aria-hidden="true">◆</span> iPhone and iPad · iOS 26.5
        </p>

        <WordReveal
          as="h1"
          id="hero-title"
          data-hero-title
          text="Block Blast. Playable by Everyone."
          className="display-1 mt-6 max-w-[15ch]"
          highlight={(word) => word === 'Everyone.'}
        />

        <WordReveal
          as="p"
          data-hero-tagline
          text="A puzzle game where losing your sight or your colour vision changes nothing."
          className="mt-7 max-w-2xl text-xl text-ink-dim sm:text-2xl"
        />

        <div className="mt-10 flex flex-wrap items-start gap-4">
          <div data-hero-cta data-enter-up>
            <AppStoreButton />
          </div>
          <button
            data-hero-cta
            data-enter-up
            type="button"
            onClick={() => setFilmOpen(true)}
            className="inline-flex items-center gap-3 rounded-2xl border border-line bg-surface/70 px-6 py-4 text-lg font-semibold text-ink backdrop-blur transition-colors duration-300 hover:border-ink-dim hover:bg-surface-2"
          >
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-full bg-ink text-bg"
            >
              <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" aria-hidden="true">
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
            </span>
            Watch the Film
          </button>
        </div>

        <ul data-hero-proof className="mt-14 grid max-w-3xl list-none gap-6 p-0 sm:grid-cols-3">
          {PROOF.map((item) => (
            <li key={item.label} data-enter-up className="border-t border-line pt-4">
              <span className="font-display text-4xl font-bold tracking-tight">{item.value}</span>
              <span className="mt-1 block text-sm text-ink-dim">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <VideoLightbox open={filmOpen} onClose={() => setFilmOpen(false)} />
    </section>
  )
}
