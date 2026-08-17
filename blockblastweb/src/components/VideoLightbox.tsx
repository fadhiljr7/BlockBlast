import { useCallback, useEffect, useRef } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

type Props = {
  open: boolean
  onClose: () => void
}

/**
 * The "Watch the Film" lightbox.
 *
 * The film itself is not shot yet, so rather than embedding a dead player this
 * shows the poster frame and the described scene list — which is also the
 * honest accessible form of a video, and the form a blind visitor would get
 * from an audio description track anyway.
 *
 * Modal mechanics: focus moves in on open, is trapped while open, Escape and
 * the backdrop close it, and focus returns to the trigger afterwards.
 */
export function VideoLightbox({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement as HTMLElement | null
    closeRef.current?.focus()

    // The page behind a modal must not scroll, and must not be reachable by a
    // screen reader's virtual cursor either.
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKeyDown)
      restoreRef.current?.focus()
    }
  }, [open, onKeyDown])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-8">
      {/* The backdrop is a button so pointer users can dismiss by clicking away;
          keyboard users have Escape and the close button, so it is hidden from
          assistive technology rather than announced as a stray control. */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default border-0 bg-bg/85 backdrop-blur-md"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="film-title"
        aria-describedby="film-description"
        className="surface-card relative z-10 max-h-[88vh] w-full max-w-3xl overflow-y-auto p-6 sm:p-9"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="eyebrow m-0">Accessibility demo</p>
            <h2 id="film-title" className="mt-2 text-3xl">
              Playing with the screen off
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl border border-line bg-surface-2 px-4 py-2 text-sm font-semibold text-ink"
          >
            Close
          </button>
        </div>

        {/* Poster frame. Decorative composition, described by the scene list
            below, so it carries an empty alt rather than a redundant one. */}
        <div className="mt-6 aspect-video w-full overflow-hidden rounded-2xl border border-line bg-bg">
          <svg viewBox="0 0 640 360" className="h-full w-full" role="img" aria-label="Poster frame: a hand resting on an iPhone with a darkened screen, the Block Blast board glowing faintly beneath it.">
            <defs>
              <linearGradient id="film-poster" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#12122a" />
                <stop offset="100%" stopColor="#0a0a1a" />
              </linearGradient>
            </defs>
            <rect width="640" height="360" fill="url(#film-poster)" />
            {Array.from({ length: 16 }, (_, index) => {
              const row = Math.floor(index / 4)
              const col = index % 4
              return (
                <rect
                  key={index}
                  x={228 + col * 46}
                  y={82 + row * 46}
                  width="38"
                  height="38"
                  rx="8"
                  fill={['#e94560', '#3a86ff', '#0ead69', '#facc26'][(row + col) % 4]}
                  opacity={0.16 + ((row * 4 + col) % 5) * 0.06}
                />
              )
            })}
            <circle cx="320" cy="180" r="34" fill="var(--color-ink)" opacity="0.92" />
            <path d="M310 163 L342 180 L310 197 Z" fill="#0a0a1a" />
          </svg>
        </div>

        <p id="film-description" className="mt-6 text-ink-dim">
          The film is still in production. Until it ships, here is what it shows — written out,
          because a described scene list is what a blind viewer would receive from the audio
          description track anyway.
        </p>

        <ol className="mt-5 space-y-4 pl-5 text-sm leading-relaxed">
          <li>
            A player turns on Screen Curtain. The display goes black; the game keeps playing.
          </li>
          <li>
            They sweep a finger across the board. Each cell sings — pitch rising with the row,
            position moving across the stereo field with the column.
          </li>
          <li>
            VoiceOver speaks a cell: <q>Row 3, column 5, red with dots, fits here, clears 2 lines.</q>
          </li>
          <li>A triple-tap places the piece. Two lines clear, and the chord gains a partial.</li>
          <li>
            The screen comes back on for the viewer, showing the same board the player has been
            holding in their head the whole time.
          </li>
        </ol>
      </div>
    </div>
  )
}
