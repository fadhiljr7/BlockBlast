import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import AppStoreButton from '../components/AppStoreButton'
import HeroCanvas from '../three/HeroCanvas'
import { SITE } from '../data/site'
import { gsap, useReducedMotion } from '../lib/motion'

const CHANNELS = ['See it', 'Hear it', 'Feel it']

export default function Hero() {
  const rootRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced || !rootRef.current) return

    const context = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('[data-hero-line]', { yPercent: 110, opacity: 0, duration: 0.9, stagger: 0.09 })
        .from('[data-hero-sub]', { y: 18, opacity: 0, duration: 0.7 }, '-=0.45')
        .from('[data-hero-cta]', { y: 16, opacity: 0, duration: 0.6 }, '-=0.4')
        .from('[data-hero-chip]', { y: 10, opacity: 0, duration: 0.5, stagger: 0.08 }, '-=0.35')
    }, rootRef)

    return () => context.revert()
  }, [reduced])

  return (
    <section ref={rootRef} className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <HeroCanvas />
        {/* Keeps text contrast independent of whatever the scene is doing behind it. */}
        <div className="absolute inset-0 bg-linear-to-b from-ink/30 via-ink/55 to-ink" />
      </div>

      <div className="container-page flex min-h-[92svh] flex-col justify-center py-24 sm:py-32">
        <p className="chip mb-8 w-fit">
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
          Accessibility is the design, not a settings page
        </p>

        <h1 className="max-w-4xl text-[clamp(2.5rem,7vw,4.75rem)] leading-[1.02] font-semibold tracking-tight">
          <span className="block overflow-hidden">
            <span data-hero-line className="block">
              A block puzzle
            </span>
          </span>
          <span className="block overflow-hidden">
            <span data-hero-line className="block">
              you can play
            </span>
          </span>
          <span className="block overflow-hidden">
            <span data-hero-line className="block text-accent">
              with your eyes shut.
            </span>
          </span>
        </h1>

        <p data-hero-sub className="mt-8 max-w-xl text-lg/8 text-white/65">
          {SITE.description}
        </p>

        <div data-hero-cta className="mt-10 flex flex-wrap items-center gap-4">
          <AppStoreButton />
          <Link
            to="/support"
            className="rounded-2xl border border-white/15 px-5 py-3.5 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white"
          >
            How to play with VoiceOver
          </Link>
        </div>

        <p className="mt-6 text-sm text-white/40">{SITE.requirements}</p>

        <ul className="mt-14 flex flex-wrap gap-3">
          {CHANNELS.map((channel) => (
            <li key={channel} data-hero-chip className="chip">
              {channel}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
