import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { SITE } from '../data/site'
import { AppStoreButton } from './AppStoreButton'

const NAV_LINKS = [
  { to: '/#features', label: 'Features' },
  { to: '/#accessibility', label: 'Accessibility' },
  { to: '/support', label: 'Support' },
  { to: '/privacy', label: 'Privacy' },
] as const

function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" width={28} height={28} aria-hidden="true" focusable="false">
        <rect x="1" y="1" width="13" height="13" rx="3.5" fill="var(--color-primary)" />
        <rect x="18" y="1" width="13" height="13" rx="3.5" fill="var(--color-accent)" />
        <rect x="1" y="18" width="13" height="13" rx="3.5" fill="var(--color-success)" />
        <rect
          x="18"
          y="18"
          width="13"
          height="13"
          rx="3.5"
          fill="none"
          stroke="var(--color-ink-dim)"
          strokeWidth="2"
          strokeDasharray="3 3"
        />
      </svg>
      <span className="whitespace-nowrap font-display text-[1.0625rem] font-bold tracking-tight">
        Block Blast
        {/* The suffix only appears once there is genuinely room for it. Below
            that it wrapped onto its own line and pushed the header apart. */}
        <span className="ml-1.5 hidden text-xs font-medium text-ink-dim xl:inline">
          Accessible Edition
        </span>
      </span>
    </span>
  )
}

function navClass({ isActive }: { isActive: boolean }) {
  return `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'text-ink' : 'text-ink-dim hover:text-ink'
  }`
}

function SiteHeader() {
  const location = useLocation()
  const toggleRef = useRef<HTMLButtonElement>(null)

  // The menu records *which* location it was opened for, so navigating closes
  // it as a consequence of the address changing rather than through an effect
  // that fires after the new page has already painted with the menu still open.
  const locationKey = `${location.pathname}${location.hash}`
  const [openFor, setOpenFor] = useState<string | null>(null)
  const open = openFor === locationKey

  // Escape closes the menu and returns focus to the control that opened it, so
  // keyboard focus is never stranded inside a hidden panel.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenFor(null)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/60 bg-bg/80 backdrop-blur-xl">
      <div className="shell flex h-16 items-center justify-between gap-4">
        {/* No aria-label here: one that read "Block Blast — home" would not
            contain the link's own visible text, which breaks WCAG 2.5.3 (Label
            in Name) for anyone driving the page by voice. The destination is
            appended for screen readers instead, so the accessible name still
            starts with exactly what is on screen. */}
        <Link to="/" className="rounded-lg text-ink no-underline">
          <Wordmark />
          <span className="sr-only-text"> — home</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navClass}>
              {link.label}
            </NavLink>
          ))}
          <AppStoreButton size="compact" className="ml-3" />
        </nav>

        <button
          ref={toggleRef}
          type="button"
          className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpenFor(open ? null : locationKey)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>

      <div
        id="mobile-nav"
        hidden={!open}
        className="border-t border-line/60 bg-surface lg:hidden"
      >
        <nav aria-label="Primary, mobile" className="shell flex flex-col gap-1 py-4">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className="rounded-lg px-3 py-3 text-base font-medium text-ink no-underline"
            >
              {link.label}
            </NavLink>
          ))}
          <AppStoreButton size="compact" className="mt-2 px-3" />
        </nav>
      </div>
    </header>
  )
}

function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line/60 py-14">
      <div className="shell grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-sm text-sm text-ink-dim">
            An iOS block puzzle where accessibility is the design, not a settings page. Built for
            iPhone and iPad.
          </p>
        </div>

        <nav aria-label="Site">
          <h2 className="text-sm font-semibold text-ink">Site</h2>
          <ul className="mt-3 list-none space-y-2 p-0 text-sm">
            <li>
              <Link to="/" className="text-ink-dim no-underline hover:text-ink">
                Home
              </Link>
            </li>
            <li>
              <Link to="/support" className="text-ink-dim no-underline hover:text-ink">
                Support
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="text-ink-dim no-underline hover:text-ink">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold text-ink">Contact</h2>
          <ul className="mt-3 list-none space-y-2 p-0 text-sm">
            <li>
              <a href={`mailto:${SITE.supportEmail}`} className="text-ink-dim no-underline hover:text-ink">
                {SITE.supportEmail}
              </a>
            </li>
            <li>
              <a href={`mailto:${SITE.privacyEmail}`} className="text-ink-dim no-underline hover:text-ink">
                {SITE.privacyEmail}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="shell mt-10 border-t border-line/60 pt-6 text-sm text-ink-dim">
        <p className="m-0">
          {/* Build-time year, not render-time: the prerendered HTML and the
              hydrated client have to agree on it. */}© {new Date(__BUILD_DATE__).getFullYear()}{' '}
          {SITE.name}. Not yet released — every App Store reference on this site is a placeholder.
        </p>
      </div>
    </footer>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only-text focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:m-0 focus:h-auto focus:w-auto focus:overflow-visible focus:rounded-xl focus:bg-ink focus:px-5 focus:py-3 focus:font-semibold focus:text-bg focus:no-underline focus:[clip-path:none]"
      >
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="pt-16 outline-none">
        {children}
      </main>
      <SiteFooter />
    </>
  )
}
