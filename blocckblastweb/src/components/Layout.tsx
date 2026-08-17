import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { SITE } from '../data/site'

const logoSrc = `${import.meta.env.BASE_URL}appLogo.png`

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/support', label: 'Support', end: false },
  { to: '/privacy', label: 'Privacy', end: false },
]

/** Routed pages start at the top; in-page anchors keep their target. */
function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, hash])

  return null
}

function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled ? 'border-b border-white/10 bg-ink/80 backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl">
          <img
            src={logoSrc}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-[22%] ring-1 ring-white/15"
          />
          <span className="text-sm font-semibold tracking-tight text-white sm:text-base">
            {SITE.shortName}
            <span className="ml-2 hidden text-white/45 sm:inline">Accessible Edition</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm transition ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="rounded-full border border-white/15 px-3 py-2 text-sm text-white/80 sm:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Primary"
          className="container-page grid gap-1 border-t border-white/10 pb-4 sm:hidden"
        >
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `rounded-xl px-4 py-3 text-base ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/70'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 py-14">
      <div className="container-page grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt="" width={40} height={40} className="h-10 w-10 rounded-[22%]" />
            <p className="font-semibold text-white">{SITE.name}</p>
          </div>
          <p className="mt-4 max-w-sm text-sm text-white/55">{SITE.tagline}</p>
          <p className="mt-4 text-xs text-white/40">{SITE.requirements}</p>
        </div>

        <div>
          <h2 className="text-xs font-semibold tracking-widest text-white/45 uppercase">Pages</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-white/70 transition hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold tracking-widest text-white/45 uppercase">Contact</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a
                href={`mailto:${SITE.supportEmail}`}
                className="text-white/70 transition hover:text-white"
              >
                {SITE.supportEmail}
              </a>
            </li>
            <li>
              <a
                href={SITE.repoUrl}
                className="text-white/70 transition hover:text-white"
                rel="noreferrer"
                target="_blank"
              >
                Source on GitHub
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="container-page mt-10 border-t border-white/10 pt-6 text-xs text-white/35">
        <p>
          © {new Date().getFullYear()} {SITE.shortName}. Built as an accessibility-first rebuild of
          the block-puzzle mechanic. No trackers, no accounts, no ads.
        </p>
      </div>
    </footer>
  )
}

export default function Layout() {
  return (
    <>
      <a
        href="#main"
        className="sr-only rounded-full bg-accent px-4 py-2 font-semibold text-ink focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100"
      >
        Skip to content
      </a>
      <ScrollToTop />
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
