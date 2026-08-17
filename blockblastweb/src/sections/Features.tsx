import { useCallback, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { FEATURES } from '../data/site'
import { FeatureIcon } from '../components/FeatureIcon'
import { WordReveal } from '../components/WordReveal'
import { ParticleField } from '../three/ParticleField'
import type { Emitter } from '../three/ParticleField'
import { loadGsap, useGsapEffect, usePrefersReducedMotion } from '../lib/motion'

/** Resolves a CSS custom property to the concrete colour Three.js needs. */
function resolveColour(value: string, element: HTMLElement): string {
  const match = value.match(/var\((--[^)]+)\)/)
  if (!match) return value
  return getComputedStyle(element).getPropertyValue(match[1]).trim() || '#ffffff'
}

export function Features() {
  const scopeRef = useRef<HTMLElement>(null)
  const emitterRef = useRef<Emitter | null>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()

  useGsapEffect(scopeRef, ({ gsap }) => {
    gsap.to('[data-features-heading] [data-reveal-word]', {
      yPercent: 0,
      duration: 0.9,
      stagger: 0.04,
      scrollTrigger: { trigger: '[data-features-heading]', start: 'top 82%' },
    })

    gsap.to('[data-feature-card]', {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.08,
      scrollTrigger: { trigger: '[data-feature-grid]', start: 'top 78%' },
    })
  })

  const onEnter = useCallback(
    (event: ReactPointerEvent<HTMLElement>, accent: string) => {
      if (reduced) return

      const card = event.currentTarget
      const icon = card.querySelector<HTMLElement>('[data-feature-icon]')
      const field = fieldRef.current
      if (!icon || !field) return

      const iconBox = icon.getBoundingClientRect()
      const fieldBox = field.getBoundingClientRect()
      emitterRef.current?.burst(
        iconBox.left + iconBox.width / 2 - fieldBox.left,
        iconBox.top + iconBox.height / 2 - fieldBox.top,
        resolveColour(accent, card),
      )

      void loadGsap().then(({ gsap }) => {
        gsap.to(icon, {
          scale: 1.16,
          rotate: -8,
          duration: 0.5,
          ease: 'back.out(2.2)',
          overwrite: true,
        })
      })
    },
    [reduced],
  )

  const onLeave = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (reduced) return
      const icon = event.currentTarget.querySelector<HTMLElement>('[data-feature-icon]')
      if (!icon) return
      void loadGsap().then(({ gsap }) => {
        gsap.to(icon, { scale: 1, rotate: 0, duration: 0.45, ease: 'power3.out', overwrite: true })
      })
    },
    [reduced],
  )

  return (
    <section
      ref={scopeRef}
      id="features"
      aria-labelledby="features-heading"
      className="relative scroll-mt-24 py-28 sm:py-36"
    >
      <div ref={fieldRef} className="pointer-events-none absolute inset-0">
        <ParticleField emitter={emitterRef} />
      </div>

      <div className="shell relative z-10">
        <p className="eyebrow">What you get</p>
        <WordReveal
          as="h2"
          id="features-heading"
          data-features-heading
          text="Six systems, one board."
          className="display-2 mt-5 max-w-[16ch]"
        />
        <p className="mt-5 max-w-2xl text-lg text-ink-dim">
          None of these is a toggle bolted on at the end. Each one goes down into the model, which
          is why they hold together when you use several at once.
        </p>

        <ul
          data-feature-grid
          className="mt-14 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((feature) => (
            <li
              key={feature.id}
              data-feature-card
              data-enter-up
              onPointerEnter={(event) => onEnter(event, feature.accent)}
              onPointerLeave={onLeave}
              className="surface-card group relative overflow-hidden p-7 transition-[transform,box-shadow,border-color] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1.5 hover:border-ink-dim/50 hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)]"
            >
              <span
                data-feature-icon
                className="inline-flex origin-center items-center justify-center rounded-2xl border p-3.5"
                style={{
                  color: feature.accent,
                  // The tint is derived from the feature's own colour, so the
                  // icon plate identifies the card as much as the glyph does.
                  borderColor: `color-mix(in srgb, ${feature.accent} 34%, transparent)`,
                  background: `color-mix(in srgb, ${feature.accent} 12%, transparent)`,
                }}
              >
                <FeatureIcon id={feature.id} />
              </span>

              <h3 className="mt-6 text-xl font-semibold tracking-tight">{feature.title}</h3>
              <p className="mt-2 font-medium text-ink">{feature.blurb}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-dim">{feature.detail}</p>

              {/* A hairline in the feature's own colour, so each card is
                  identifiable by more than its position. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-px opacity-40 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: feature.accent }}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
