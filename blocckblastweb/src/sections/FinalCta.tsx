import { Link } from 'react-router-dom'
import AppStoreButton from '../components/AppStoreButton'
import Reveal from '../components/Reveal'
import { SITE } from '../data/site'

export default function FinalCta() {
  return (
    <section className="container-page py-24 sm:py-32">
      <Reveal className="panel relative overflow-hidden p-10 text-center sm:p-16">
        <div
          aria-hidden
          className="absolute inset-x-0 -top-40 h-80 bg-[radial-gradient(45rem_20rem_at_50%_50%,rgba(255,199,61,0.18),transparent_70%)]"
        />
        <h2 className="relative text-3xl font-semibold tracking-tight sm:text-4xl">
          Built so that nobody has to ask for a way in.
        </h2>
        <p className="relative mx-auto mt-5 max-w-2xl text-base/7 text-white/60">
          English and Indonesian, iPhone and iPad, no accounts and no network calls. Siri knows
          “Start Block Blast” and “Mulai Block Blast”.
        </p>

        <div className="relative mt-10 flex flex-wrap items-center justify-center gap-4">
          <AppStoreButton />
          <Link
            to="/support"
            className="rounded-2xl border border-white/15 px-5 py-3.5 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white"
          >
            Read the support guide
          </Link>
        </div>

        <p className="relative mt-6 text-sm text-white/40">
          Questions?{' '}
          <a className="text-accent underline-offset-4 hover:underline" href={`mailto:${SITE.supportEmail}`}>
            {SITE.supportEmail}
          </a>
        </p>
      </Reveal>
    </section>
  )
}
