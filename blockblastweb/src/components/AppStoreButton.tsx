import { useId, useState } from 'react'

function AppleLogo() {
  return (
    <svg viewBox="0 0 24 24" width={26} height={26} aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M17.05 12.53c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.9-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.89 2.65 3.24 2.6 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.38.81 1.4-.02 2.28-1.27 3.13-2.53.99-1.45 1.4-2.86 1.42-2.93-.03-.01-2.72-1.04-2.72-4.11ZM14.47 4.7c.71-.87 1.2-2.08 1.06-3.28-1.03.04-2.28.69-3.02 1.55-.66.77-1.24 2-1.08 3.18 1.15.09 2.32-.58 3.04-1.45Z" />
    </svg>
  )
}

type Props = {
  /** `hero` is the oversized primary CTA; `compact` fits inside the header. */
  size?: 'hero' | 'compact'
  className?: string
}

/**
 * The App Store call to action.
 *
 * The listing does not exist yet, so this deliberately is not a link: a link to
 * `#` is a trap for screen reader and keyboard users, who get no warning before
 * activating it and no feedback afterwards. Instead it is a button marked
 * `aria-disabled`, which stays focusable and announces its state, and
 * activating it explains the situation in a live region.
 */
export function AppStoreButton({ size = 'hero', className = '' }: Props) {
  const [announced, setAnnounced] = useState(false)
  const noteId = useId()
  const isHero = size === 'hero'

  return (
    <div className={`flex flex-col items-start gap-2 ${className}`}>
      <button
        type="button"
        aria-disabled="true"
        aria-describedby={noteId}
        onClick={() => setAnnounced(true)}
        className={`group relative inline-flex items-center gap-3 rounded-2xl bg-ink font-semibold text-bg transition-transform duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:bg-white active:translate-y-0 ${
          isHero ? 'px-6 py-4 text-lg' : 'px-4 py-2.5 text-sm'
        }`}
      >
        <AppleLogo />
        <span className="flex flex-col text-left leading-tight">
          <span className={isHero ? 'text-xs font-medium opacity-70' : 'sr-only-text'}>
            Download on the
          </span>
          <span className={isHero ? 'text-xl font-bold tracking-tight' : 'font-semibold'}>
            App Store
          </span>
        </span>
        <span
          className={`ml-1 rounded-full border border-primary/40 bg-primary/15 font-semibold uppercase tracking-wider text-primary-soft ${
            isHero ? 'px-2.5 py-1 text-[0.6875rem]' : 'px-2 py-0.5 text-[0.625rem]'
          }`}
        >
          Coming soon
        </span>
      </button>

      <p id={noteId} className={isHero ? 'text-sm text-ink-dim' : 'sr-only-text'}>
        Not released yet — this button is a placeholder while the app is in review.
      </p>

      <p role="status" className="sr-only-text">
        {announced ? 'Block Blast is not on the App Store yet. This button is a placeholder.' : ''}
      </p>
    </div>
  )
}
