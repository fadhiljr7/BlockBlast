import { useRef } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SITE } from '../data/site'
import { WordReveal } from '../components/WordReveal'
import { useGsapEffect } from '../lib/motion'

const UPDATED = new Date(__BUILD_DATE__).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** The three buckets Apple's privacy nutrition labels sort data into. */
const NUTRITION = [
  {
    title: 'Data Used to Track You',
    verdict: 'None',
    tone: 'success',
    detail:
      'No advertising identifier, no data brokers, no cross-app or cross-site tracking of any kind.',
  },
  {
    title: 'Data Linked to You',
    verdict: 'None',
    tone: 'success',
    detail:
      'We hold no account, no profile and no identifier that points back at you. Game Center and iCloud are Apple services that you control from iOS Settings.',
  },
  {
    title: 'Data Not Linked to You',
    verdict: 'Diagnostics only',
    tone: 'neutral',
    detail:
      'Anonymous crash reports, and only if you have opted in to sharing analytics with developers in iOS Settings. They contain no gameplay and no personal information.',
  },
] as const

const NOT_COLLECTED = [
  'Location, precise or coarse',
  'Contacts and address book',
  'Photos, camera and the photo library',
  'Microphone and any audio input',
  'Health, fitness and sensor data',
  'Browsing or search history',
  'Advertising identifiers (IDFA)',
  'Purchase history — there are no purchases',
] as const

type SectionProps = { id: string; title: string; children: ReactNode }

function Section({ id, title, children }: SectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-28">
      <h2 id={`${id}-heading`} className="display-3">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-ink-dim [&_a]:text-accent">{children}</div>
    </section>
  )
}

export default function Privacy() {
  const scopeRef = useRef<HTMLDivElement>(null)

  useGsapEffect(scopeRef, ({ gsap }) => {
    gsap.to('[data-privacy-heading] [data-reveal-word]', {
      yPercent: 0,
      duration: 0.9,
      stagger: 0.05,
    })
    gsap.to('[data-privacy-enter]', { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, delay: 0.15 })
  })

  return (
    <div ref={scopeRef} className="pb-10">
      <section className="shell pt-14 sm:pt-20">
        <nav aria-label="Breadcrumb" className="text-sm">
          <ol className="flex list-none flex-wrap items-center gap-2 p-0 text-ink-dim">
            <li>
              <Link to="/" className="text-ink-dim no-underline hover:text-ink">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <span aria-current="page" className="text-ink">
                Privacy Policy
              </span>
            </li>
          </ol>
        </nav>

        <p className="eyebrow mt-8">Privacy policy</p>
        <WordReveal
          as="h1"
          data-privacy-heading
          text="Privacy is a human right."
          className="display-2 mt-5 max-w-[16ch]"
        />
        <p data-privacy-enter data-enter-up className="mt-6 max-w-2xl text-lg text-ink-dim">
          Especially for players who rely on assistive technology, whose settings say a great deal
          about them. This policy explains exactly what Block Blast holds, which is very little, and
          what it never touches.
        </p>
        <p data-privacy-enter data-enter-up className="mt-4 text-sm text-ink-dim">
          Last updated <time dateTime={__BUILD_DATE__.slice(0, 10)}>{UPDATED}</time>
        </p>
      </section>

      <section aria-labelledby="nutrition-heading" className="shell mt-14">
        <h2 id="nutrition-heading" className="sr-only-text">
          Privacy nutrition labels
        </h2>
        <ul className="grid list-none gap-4 p-0 md:grid-cols-3">
          {NUTRITION.map((entry) => (
            <li
              key={entry.title}
              data-privacy-enter
              data-enter-up
              className={`surface-card p-6 ${
                entry.tone === 'success' ? 'border-success/40' : 'border-line'
              }`}
            >
              <p className="text-sm font-semibold uppercase tracking-wider text-ink-dim">
                {entry.title}
              </p>
              <p
                className={`mt-3 font-display text-3xl font-bold tracking-tight ${
                  entry.tone === 'success' ? 'text-success' : 'text-ink'
                }`}
              >
                {/* The verdict is carried by the words, not only by the colour
                    of them — the same rule the game applies to its blocks. */}
                {entry.tone === 'success' && (
                  <span aria-hidden="true" className="mr-2">
                    ✓
                  </span>
                )}
                {entry.verdict}
              </p>
              <p className="mt-3 text-sm text-ink-dim">{entry.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* `shell` centres itself, so the measure has to be a nested element —
          putting max-width on the shell itself would centre the policy text
          while the heading above it stays left-aligned. */}
      <div className="shell mt-20">
        <div className="max-w-3xl space-y-14">
        <Section id="introduction" title="Introduction">
          <p>
            Block Blast: Accessible Edition is a single-player puzzle game for iPhone and iPad. It
            has no accounts, no advertising and no analytics service. This policy covers the app and
            this website, and it applies to everyone who uses either.
          </p>
          <p>
            We have written it in the shortest form that is still complete. If anything here is
            unclear, write to{' '}
            <a href={`mailto:${SITE.privacyEmail}`}>{SITE.privacyEmail}</a> and we will explain it
            and fix the wording.
          </p>
        </Section>

        <Section id="data-we-collect" title="Data we collect">
          <p>The app stores three things, and two of them never leave Apple&rsquo;s services:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-ink">Game Center identifier.</strong> Only if you choose to
              sign in to Game Center, and only so leaderboards can show a score against a name. This
              is handled entirely by Apple; we never receive or store it ourselves.
            </li>
            <li>
              <strong className="text-ink">iCloud sync record.</strong> Your best score and your
              general settings, written to your own private iCloud container so a second device can
              read them. It is your iCloud account, under your control, and it is not readable by
              us.
            </li>
            <li>
              <strong className="text-ink">Anonymous crash reports.</strong> Delivered by Apple, and
              only if you have opted in to sharing analytics with developers in iOS Settings. They
              contain a stack trace and a device model — no gameplay, no identifiers, no content.
            </li>
          </ul>
          <p>
            This website collects nothing at all. It is static files with no cookies, no analytics
            script, no fonts fetched from a third party and no server-side logging beyond what the
            host records to serve a page.
          </p>
        </Section>

        <Section id="data-we-do-not-collect" title="Data we do not collect">
          <ul className="grid list-none gap-2 p-0 sm:grid-cols-2">
            {NOT_COLLECTED.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span aria-hidden="true" className="mt-0.5 text-success">
                  ✕
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p>
            The app requests no runtime permissions of any kind. If iOS ever asks you for one on
            Block Blast&rsquo;s behalf, something is wrong and we would like to hear about it.
          </p>
        </Section>

        <Section id="how-we-use-data" title="How we use data">
          <p>
            For three purposes, and no others: keeping your score and settings in step across your
            own devices; showing Game Center leaderboards if you have opted in; and fixing crashes.
            Nothing is used for profiling, for advertising or for measuring you as a user.
          </p>
        </Section>

        <Section id="data-sharing" title="Data sharing">
          <p>
            None. There are no third-party SDKs in the app, no advertising networks, no analytics
            vendors and no data brokers. Nothing is sold, and nothing is shared for any purpose
            including &ldquo;legitimate interest&rdquo; marketing.
          </p>
          <p>
            The only external parties involved are Apple&rsquo;s own iCloud and Game Center, acting
            for you under Apple&rsquo;s privacy policy, and the static host that serves this
            website.
          </p>
        </Section>

        <Section id="accessibility-data" title="Accessibility data">
          <p>
            Your screen reader verbosity, colour vision simulation, pattern, contrast, haptic
            intensity, placement mode and dwell timing are stored{' '}
            <strong className="text-ink">on your device only</strong>. They are never transmitted,
            never synced and never included in a crash report.
          </p>
          <p>
            This is deliberate. Accessibility settings can reveal a disability, which is
            special-category data under GDPR Article 9 — so the safest design is one where that
            information never travels anywhere it could be inferred from.
          </p>
        </Section>

        <Section id="childrens-privacy" title="Children's privacy">
          <p>
            Block Blast is suitable for all ages and complies with COPPA. Because the app collects
            no personal information from anyone, it collects none from children under 13 either.
            There is no sign-up, no profile, no chat, no user-generated content and no advertising.
          </p>
        </Section>

        <Section id="your-rights" title="Your rights">
          <p>
            Under GDPR, the UK GDPR and the CCPA you have the right to access, correct, export and
            delete your personal data, and to object to its processing. In practice there is
            almost nothing to exercise those rights against, because we hold no personal data about
            you.
          </p>
          <p>To remove what does exist:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-ink">Local settings and progress:</strong> delete the app. All
              on-device data goes with it.
            </li>
            <li>
              <strong className="text-ink">iCloud data:</strong> iOS Settings › your name › iCloud ›
              Manage Account Storage › Block Blast › Delete Data.
            </li>
            <li>
              <strong className="text-ink">Game Center:</strong> managed through your Apple Account
              at{' '}
              <a href="https://appleid.apple.com" rel="noreferrer noopener" target="_blank">
                appleid.apple.com
              </a>
              .
            </li>
          </ul>
          <p>
            We do not sell personal information and never have, so there is no
            &ldquo;Do Not Sell My Personal Information&rdquo; process to run — the answer is already
            no.
          </p>
        </Section>

        <Section id="changes" title="Changes to this policy">
          <p>
            If this policy changes, the date at the top changes with it and the updated version
            appears here before the corresponding app update ships. We will not reduce your
            protections retroactively.
          </p>
        </Section>

        <Section id="contact" title="Contact">
          <p>
            Privacy questions and data requests:{' '}
            <a href={`mailto:${SITE.privacyEmail}`}>{SITE.privacyEmail}</a>. Everything else:{' '}
            <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>, or the{' '}
            <Link to="/support" className="text-accent">
              support centre
            </Link>
            . Accessibility-related messages are answered within 24 hours.
          </p>
          </Section>
        </div>
      </div>
    </div>
  )
}
