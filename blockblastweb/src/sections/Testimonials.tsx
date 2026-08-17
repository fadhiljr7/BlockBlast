import { useCallback, useRef, useState } from 'react'
import { TESTIMONIALS } from '../data/site'
import { WordReveal } from '../components/WordReveal'
import { loadGsap, useGsapEffect, usePrefersReducedMotion } from '../lib/motion'

export function Testimonials() {
  const scopeRef = useRef<HTMLElement>(null)
  const quoteRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const reduced = usePrefersReducedMotion()

  useGsapEffect(scopeRef, ({ gsap }) => {
    gsap.to('[data-quotes-heading] [data-reveal-word]', {
      yPercent: 0,
      duration: 0.9,
      stagger: 0.04,
      scrollTrigger: { trigger: '[data-quotes-heading]', start: 'top 82%' },
    })
    gsap.to('[data-quote-card]', {
      opacity: 1,
      y: 0,
      duration: 0.9,
      scrollTrigger: { trigger: '[data-quote-card]', start: 'top 82%' },
    })
  })

  const goTo = useCallback(
    (next: number) => {
      const target = (next + TESTIMONIALS.length) % TESTIMONIALS.length
      const element = quoteRef.current

      if (reduced || !element) {
        setActive(target)
        return
      }

      // Fade and slide the outgoing quote out, swap the text at the midpoint,
      // then bring the incoming one in — the transition the brief asks for,
      // driven by state rather than by duplicated DOM.
      void loadGsap().then(({ gsap }) => {
        gsap
          .timeline()
          .to(element, { opacity: 0, x: -24, duration: 0.28, ease: 'power2.inOut' })
          .add(() => setActive(target))
          .fromTo(
            element,
            { opacity: 0, x: 24 },
            { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' },
          )
      })
    },
    [reduced],
  )

  const quote = TESTIMONIALS[active]

  return (
    <section
      ref={scopeRef}
      aria-labelledby="quotes-heading"
      className="shell py-28 sm:py-36"
    >
      <p className="eyebrow">What people say</p>
      <WordReveal
        as="h2"
        id="quotes-heading"
        data-quotes-heading
        text="Written for the people who usually get left out."
        className="display-2 mt-5 max-w-[20ch]"
      />

      <div
        data-quote-card
        data-enter-up
        className="surface-card mt-12 p-8 sm:p-12"
        // A carousel is a group of related items; naming it and marking it as a
        // region lets a screen reader user find it and skip it.
        role="group"
        aria-roledescription="carousel"
        aria-label="Quotes"
      >
        <div ref={quoteRef}>
          <blockquote className="m-0">
            <p className="display-3 font-display font-semibold leading-tight text-ink">
              <span aria-hidden="true">“</span>
              {quote.quote}
              <span aria-hidden="true">”</span>
            </p>
            <footer className="mt-6 text-sm text-ink-dim">
              <span className="font-semibold text-ink">{quote.name}</span> — {quote.role}
            </footer>
          </blockquote>
        </div>

        <div className="mt-10 flex items-center justify-between gap-4">
          {/* Position is announced politely so the change is perceivable
              without sight; the quote text itself is read on focus. */}
          <p aria-live="polite" className="text-sm text-ink-dim">
            Quote {active + 1} of {TESTIMONIALS.length}
          </p>

          <div className="flex items-center gap-2">
            {TESTIMONIALS.map((entry, position) => (
              <button
                key={entry.quote}
                type="button"
                aria-label={`Show quote ${position + 1} of ${TESTIMONIALS.length}`}
                aria-current={position === active}
                onClick={() => goTo(position)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  position === active ? 'w-8 bg-ink' : 'w-2.5 bg-line hover:bg-ink-dim'
                }`}
              />
            ))}

            <button
              type="button"
              onClick={() => goTo(active - 1)}
              aria-label="Previous quote"
              className="ml-3 grid h-11 w-11 place-items-center rounded-full border border-line bg-surface-2 text-ink"
            >
              <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              aria-label="Next quote"
              className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface-2 text-ink"
            >
              <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* The carousel does not auto-advance. Content that moves on its own has
          to offer a pause control to meet WCAG 2.2.2, and a quote nobody asked
          to change is a worse experience than one they step through. */}
      <p className="mt-6 max-w-2xl text-sm text-ink-dim">
        These are placeholder quotes for an unreleased app. Nothing here is attributed to a real
        person or publication, and it will not be until there is something real to attribute.
      </p>
    </section>
  )
}
