import { SITE } from '../data/site'

/**
 * There is no App Store listing yet, so the button says exactly that instead of
 * pointing somewhere that will 404. When `SITE.appStoreUrl` is filled in, this
 * becomes a real link with no other change.
 */
export default function AppStoreButton({ className = '' }: { className?: string }) {
  const label = SITE.appStoreUrl ? 'Download on the App Store' : 'Coming to the App Store'

  const content = (
    <>
      <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6 shrink-0 fill-current">
        <path d="M16.365 1.43c0 1.14-.42 2.2-1.12 3.02-.85.99-2.24 1.76-3.38 1.67a3.9 3.9 0 0 1 1.1-3.06c.74-.86 2.02-1.5 3.09-1.63.01.03.31.01.31 0zM20.5 17.1c-.55 1.26-.82 1.82-1.53 2.94-.99 1.56-2.39 3.5-4.12 3.51-1.54.02-1.94-1-4.03-.99-2.09.01-2.53 1.01-4.07.99-1.73-.01-3.05-1.76-4.04-3.32C-.14 15.87-.43 10.7 1.3 8c1.16-1.85 3-2.93 4.73-2.93 1.76 0 2.87 1 4.32 1 1.41 0 2.27-1 4.31-1 1.54 0 3.17.86 4.33 2.34-3.8 2.11-3.18 7.6.51 9.69z" />
      </svg>
      <span className="text-left leading-tight">
        <span className="block text-[0.65rem] tracking-widest text-white/60 uppercase">
          {SITE.appStoreUrl ? 'Download on the' : 'Coming to the'}
        </span>
        <span className="block text-lg font-semibold text-white">App Store</span>
      </span>
    </>
  )

  const shared =
    'inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 transition hover:bg-white/15'

  if (SITE.appStoreUrl) {
    return (
      <a
        href={SITE.appStoreUrl}
        className={`${shared} ${className}`}
        aria-label={label}
        rel="noreferrer"
      >
        {content}
      </a>
    )
  }

  return (
    <span
      className={`${shared} cursor-default opacity-80 ${className}`}
      role="note"
      aria-label={`${label}. ${SITE.requirements}.`}
    >
      {content}
    </span>
  )
}
