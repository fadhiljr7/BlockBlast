import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { loadGsap, usePrefersReducedMotion } from '../lib/motion'

type Props = {
  question: string
  children: ReactNode
  /** Search term to mark inside the question, if any. */
  highlight?: string
  defaultOpen?: boolean
}

function Highlighted({ text, term }: { text: string; term: string }) {
  if (!term.trim()) return <>{text}</>
  const parts = text.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'))
  return (
    <>
      {parts.map((part, position) =>
        part.toLowerCase() === term.toLowerCase() ? (
          <mark key={position} className="rounded bg-accent/30 px-0.5 text-ink">
            {part}
          </mark>
        ) : (
          <span key={position}>{part}</span>
        ),
      )}
    </>
  )
}

/**
 * A disclosure with a GSAP height transition.
 *
 * The panel stays mounted so it can animate both ways, and is hidden with
 * `visibility` rather than by unmounting — `visibility: hidden` takes content
 * out of the accessibility tree, so a screen reader never finds collapsed
 * answers, while `hidden` would make the closing animation impossible.
 */
export function Accordion({ question, children, highlight = '', defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const panelRef = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()
  const id = useId()
  const isFirstRun = useRef(true)

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    if (reduced) {
      panel.style.height = open ? 'auto' : '0px'
      panel.style.visibility = open ? 'visible' : 'hidden'
      return
    }

    // The initial state is applied without animating; only user-driven changes
    // move.
    if (isFirstRun.current) {
      isFirstRun.current = false
      panel.style.height = open ? 'auto' : '0px'
      panel.style.visibility = open ? 'visible' : 'hidden'
      return
    }

    let cancelled = false
    void loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (cancelled) return
      if (open) {
        panel.style.visibility = 'visible'
        gsap.fromTo(
          panel,
          { height: 0 },
          {
            height: 'auto',
            duration: 0.42,
            ease: 'power3.out',
            onComplete: () => {
              panel.style.height = 'auto'
              // The page just got taller; pinned sections need to know.
              ScrollTrigger.refresh()
            },
          },
        )
      } else {
        gsap.to(panel, {
          height: 0,
          duration: 0.32,
          ease: 'power2.inOut',
          onComplete: () => {
            panel.style.visibility = 'hidden'
            ScrollTrigger.refresh()
          },
        })
      }
    })

    return () => {
      cancelled = true
    }
  }, [open, reduced])

  return (
    <div className="border-b border-line/70">
      <h3 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          id={`${id}-button`}
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-6 bg-transparent px-1 py-5 text-left text-lg font-semibold text-ink"
        >
          <span>
            <Highlighted text={question} term={highlight} />
          </span>
          <span
            aria-hidden="true"
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-ink-dim transition-transform duration-300 ${
              open ? 'rotate-45' : ''
            }`}
          >
            <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
        </button>
      </h3>

      {/* No inline collapsed style: that would ship in the prerendered HTML and
          hide the answer from anyone whose JavaScript never arrives. The
          collapsed state comes from the `.js` class instead, and this effect
          takes over the inline styles once React is running. */}
      <div
        ref={panelRef}
        data-accordion-panel
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-button`}
        className="overflow-hidden"
      >
        <div className="max-w-3xl px-1 pb-6 pr-8 text-ink-dim">{children}</div>
      </div>
    </div>
  )
}
