import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import { SITE } from '../data/site'
import { usePageMeta } from '../lib/meta'

const SECTIONS = [
  {
    id: 'summary',
    title: 'The short version',
    paragraphs: [
      'Block Blast does not collect, transmit or sell any personal data. There is no account to create, no analytics SDK, no advertising network, no crash reporter and no server to talk to. The app contains no networking code at all.',
      'Everything the game remembers — your settings and your best score — is written to the app’s own storage on your device and stays there.',
    ],
  },
  {
    id: 'on-device',
    title: 'What is stored on your device',
    paragraphs: [
      'Your preferences: theme, sound pack, placement mode, dwell time, speech verbosity, pattern and contrast settings, colour-vision simulation, haptics and audio toggles, and your chosen game mode.',
      'Your progress: the current board and your best score.',
      'This data is stored by iOS in the app’s private container. It is never uploaded, and no other app can read it.',
    ],
  },
  {
    id: 'not-collected',
    title: 'What is never collected',
    paragraphs: [
      'No name, email address, phone number or account identifier. No advertising identifier (IDFA) and no device fingerprint. No location. No contacts, photos, microphone or camera access — the app never asks for these permissions, because it never needs them.',
      'The game plays sound and fires haptics, both of which iOS allows without any permission prompt and neither of which records anything.',
    ],
  },
  {
    id: 'third-parties',
    title: 'Third parties',
    paragraphs: [
      'The app ships with no third-party SDKs, no frameworks beyond Apple’s own, and no audio assets fetched from anywhere — every sound is synthesised on your device as it plays.',
      'If you use Siri or the Shortcuts app to start a game, that interaction is handled by iOS under Apple’s own privacy terms. The app receives only the request to start a game.',
    ],
  },
  {
    id: 'children',
    title: 'Children',
    paragraphs: [
      'The game is suitable for all ages and treats every player the same way: it collects nothing from anyone, including children under 13.',
    ],
  },
  {
    id: 'deletion',
    title: 'Deleting your data',
    paragraphs: [
      'Deleting the app removes everything it has stored. Because nothing was ever sent anywhere, there is no copy elsewhere for us to delete and no request you need to make.',
    ],
  },
  {
    id: 'website',
    title: 'This website',
    paragraphs: [
      'This site is a set of static files served by GitHub Pages. It sets no cookies, runs no analytics and embeds no third-party scripts or fonts. The playable demo on the home page runs entirely in your browser and sends nothing anywhere; nothing it generates is stored between visits.',
      'GitHub, as the host, may log requests such as your IP address for security and operational purposes under its own privacy statement.',
    ],
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    paragraphs: [
      'If the app ever gains a feature that changes any of the above — a leaderboard, for example, or iCloud sync — this page will be updated before that version ships, and the change will be described in the app’s release notes rather than buried here.',
    ],
  },
]

export default function Privacy() {
  usePageMeta(
    'Privacy policy',
    'Block Blast collects nothing. No accounts, no analytics, no advertising, no network calls — settings and scores stay on your device.',
  )

  return (
    <>
      <section className="container-page pt-20 pb-4 sm:pt-28">
        <Reveal>
          <p className="chip mb-6">Privacy</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Privacy policy
          </h1>
          <p className="mt-6 max-w-2xl text-base/7 text-white/60">
            This policy covers the {SITE.shortName} app for iPhone and iPad, and this website.
          </p>
          <p className="mt-3 text-sm text-white/40">Last updated {SITE.lastUpdated}</p>
        </Reveal>

        <Reveal delay={0.08} className="panel mt-12 border-accent/30 bg-accent/5 p-8">
          <p className="text-lg/8 text-white/85">
            The app has no network code. Nothing you do in it leaves your device — not your score,
            not your settings, not the fact that you opened it.
          </p>
        </Reveal>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-12 lg:grid-cols-[16rem_1fr]">
          <nav aria-label="Sections" className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-xs font-semibold tracking-widest text-white/45 uppercase">
              On this page
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-white/60 transition hover:text-white"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="max-w-3xl">
            {SECTIONS.map((section, index) => (
              <Reveal
                key={section.id}
                delay={index === 0 ? 0 : 0.04}
                className="scroll-mt-24 border-b border-white/10 py-8 first:pt-0 last:border-b-0"
              >
                <h2 id={section.id} className="scroll-mt-24 text-2xl font-semibold tracking-tight">
                  {section.title}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mt-4 text-base/7 text-white/60">
                    {paragraph}
                  </p>
                ))}
              </Reveal>
            ))}

            <Reveal className="panel mt-12 p-8">
              <h2 className="text-2xl font-semibold tracking-tight">Contact</h2>
              <p className="mt-4 text-base/7 text-white/60">
                Questions about this policy, or about anything the app does with data, go to{' '}
                <a
                  className="text-accent underline-offset-4 hover:underline"
                  href={`mailto:${SITE.supportEmail}?subject=Block%20Blast%20privacy`}
                >
                  {SITE.supportEmail}
                </a>
                . For help playing the game, the{' '}
                <Link to="/support" className="text-accent underline-offset-4 hover:underline">
                  support page
                </Link>{' '}
                is the faster route.
              </p>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}
