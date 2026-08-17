import { Link } from 'react-router-dom'
import Accordion from '../components/Accordion'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import { SITE, SUPPORT_FAQ } from '../data/site'
import { usePageMeta } from '../lib/meta'

const QUICK_START = [
  {
    title: 'Playing with VoiceOver',
    steps: [
      'Turn on the ear button above the board to enter audio explore.',
      'Drag one finger over the board to hear each cell as you cross it.',
      'Lift your finger to hear the cell you landed on described in full.',
      'Triple-tap to place the piece you are holding.',
    ],
  },
  {
    title: 'Playing without dragging',
    steps: [
      'Open Settings ▸ Placement.',
      'Choose sticky drag to tap a piece and then tap a highlighted spot.',
      'Or choose dwell control and set a dwell time between 0.4 and 4 seconds.',
      'Switch modes mid-run — your board and score carry over.',
    ],
  },
  {
    title: 'Making the board easier to read',
    steps: [
      'Keep patterns on — they are the identity channel, not a decoration.',
      'Try the High Contrast or Minimal themes.',
      'Turn on Increase Contrast in iOS Settings; the app thickens borders to match.',
      'Use Settings ▸ Vision to play in a simulated palette and check it yourself.',
    ],
  },
  {
    title: 'One-tap maximum accessibility',
    steps: [
      'Open Settings and choose the maximum accessibility preset.',
      'It sets high contrast, patterns, tap-to-place, spatial audio, haptics and verbose speech together.',
      'Every part of it stays adjustable afterwards.',
    ],
  },
]

const BUG_REPORT = [
  'Your device and iOS version.',
  'Which placement mode you were in — drag, sticky or dwell.',
  'Whether VoiceOver, Switch Control, Reduce Motion or Increase Contrast were on.',
  'What you expected to happen, and what happened instead.',
]

export default function Support() {
  usePageMeta(
    'Support',
    'How to play Block Blast with VoiceOver, Switch Control or without dragging, plus troubleshooting for sound, haptics and colour, and how to reach a human.',
  )

  return (
    <>
      <section className="container-page pt-20 pb-4 sm:pt-28">
        <Reveal>
          <p className="chip mb-6">Support</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Anything you cannot do in this game is a bug, not a limitation.
          </h1>
          <p className="mt-6 max-w-2xl text-base/7 text-white/60">
            Start with the guides below — they cover the questions that come up most. If none of them
            match, write to us and describe what you were trying to do. Accessibility reports get
            answered first.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href={`mailto:${SITE.supportEmail}?subject=Block%20Blast%20support`}
              className="rounded-2xl bg-accent px-5 py-3.5 text-sm font-semibold text-ink transition hover:brightness-110"
            >
              Email support
            </a>
            <a
              href={SITE.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-white/15 px-5 py-3.5 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white"
            >
              Open an issue on GitHub
            </a>
          </div>
        </Reveal>
      </section>

      <section className="container-page py-16">
        <SectionHeading eyebrow="Start here" title="Four guides that answer most of it." />

        <ul className="mt-12 grid gap-5 sm:grid-cols-2">
          {QUICK_START.map((guide, index) => (
            <li key={guide.title}>
              <Reveal delay={(index % 2) * 0.08} className="panel h-full p-7">
                <h3 className="text-lg font-semibold">{guide.title}</h3>
                <ol className="mt-4 space-y-3">
                  {guide.steps.map((step, stepIndex) => (
                    <li key={step} className="flex gap-3 text-sm/6 text-white/60">
                      <span
                        aria-hidden
                        className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-white/10 text-[0.7rem] font-semibold text-white/70"
                      >
                        {stepIndex + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page py-16">
        <SectionHeading
          eyebrow="Frequently asked"
          title="Questions, answered as specifically as we can."
        />
        <Reveal className="mt-12">
          <Accordion items={SUPPORT_FAQ} />
        </Reveal>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-5 lg:grid-cols-2">
          <Reveal className="panel p-8">
            <h2 className="text-2xl font-semibold tracking-tight">Reporting a bug</h2>
            <p className="mt-3 text-sm/6 text-white/60">
              The more of this you can include, the faster it gets fixed:
            </p>
            <ul className="mt-5 space-y-3">
              {BUG_REPORT.map((line) => (
                <li key={line} className="flex gap-3 text-sm/6 text-white/60">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {line}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.08} className="panel p-8">
            <h2 className="text-2xl font-semibold tracking-tight">Requirements and contact</h2>
            <dl className="mt-5 divide-y divide-white/10 text-sm">
              <div className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
                <dt className="text-white/45">Devices</dt>
                <dd className="text-white/75">{SITE.requirements}</dd>
              </div>
              <div className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
                <dt className="text-white/45">Languages</dt>
                <dd className="text-white/75">
                  English and Indonesian, including VoiceOver labels and spoken feedback
                </dd>
              </div>
              <div className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
                <dt className="text-white/45">Network</dt>
                <dd className="text-white/75">None — the game is fully offline</dd>
              </div>
              <div className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
                <dt className="text-white/45">Email</dt>
                <dd>
                  <a
                    className="text-accent underline-offset-4 hover:underline"
                    href={`mailto:${SITE.supportEmail}`}
                  >
                    {SITE.supportEmail}
                  </a>
                </dd>
              </div>
            </dl>
            <p className="mt-6 text-sm/6 text-white/50">
              For what the app does and does not store, see the{' '}
              <Link to="/privacy" className="text-accent underline-offset-4 hover:underline">
                privacy policy
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>
    </>
  )
}
