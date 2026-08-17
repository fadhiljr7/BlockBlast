import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <section className="shell flex min-h-[60vh] flex-col justify-center py-24">
      <p className="eyebrow">404</p>
      <h1 className="display-2 mt-5 max-w-[16ch]">This page does not exist.</h1>
      <p className="mt-5 max-w-xl text-lg text-ink-dim">
        The link may be out of date, or the page may have moved. Everything on this site is one of
        three places:
      </p>
      <ul className="mt-8 flex list-none flex-wrap gap-4 p-0">
        {[
          { to: '/', label: 'Home' },
          { to: '/support', label: 'Support' },
          { to: '/privacy', label: 'Privacy Policy' },
        ].map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="inline-flex rounded-2xl border border-line bg-surface-2 px-5 py-3 font-semibold text-ink no-underline hover:border-ink-dim"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
