import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { AppStoreButton } from '../components/AppStoreButton'
import { WordReveal } from '../components/WordReveal'
import { useGsapEffect } from '../lib/motion'

export function FinalCta() {
  const scopeRef = useRef<HTMLElement>(null)

  useGsapEffect(scopeRef, ({ gsap }) => {
    gsap.to('[data-cta-heading] [data-reveal-word]', {
      yPercent: 0,
      duration: 1,
      stagger: 0.05,
      scrollTrigger: { trigger: '[data-cta-heading]', start: 'top 85%' },
    })
    gsap.to('[data-cta-body]', {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.1,
      scrollTrigger: { trigger: '[data-cta-heading]', start: 'top 80%' },
    })
  })

  return (
    <section ref={scopeRef} aria-labelledby="cta-heading" className="shell pb-8 pt-12">
      <div className="surface-card relative overflow-hidden px-8 py-16 sm:px-14 sm:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(90% 120% at 85% 10%, rgba(233,69,96,0.16) 0%, transparent 60%), radial-gradient(70% 100% at 10% 90%, rgba(58,134,255,0.14) 0%, transparent 60%)',
          }}
        />

        <div className="relative">
          <WordReveal
            as="h2"
            id="cta-heading"
            data-cta-heading
            text="Accessibility is the design, not a settings page."
            className="display-2 max-w-[17ch]"
          />
          <p data-cta-body data-enter-up className="mt-6 max-w-xl text-lg text-ink-dim">
            Block Blast is finished and in review. When it lands, it lands with every one of these
            systems on by default — nothing here is a paid tier, and nothing here arrives later.
          </p>

          <div data-cta-body data-enter-up className="mt-9 flex flex-wrap items-start gap-4">
            <AppStoreButton />
            <Link
              to="/support"
              className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface/70 px-6 py-4 text-lg font-semibold text-ink no-underline transition-colors duration-300 hover:border-ink-dim hover:bg-surface-2"
            >
              Read the support guide
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
