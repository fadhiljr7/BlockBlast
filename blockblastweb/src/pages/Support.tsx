import { useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FAQ_CATEGORIES } from '../data/faq'
import { SITE, VERSION_HISTORY } from '../data/site'
import { Accordion } from '../components/Accordion'
import { WordReveal } from '../components/WordReveal'
import { useGsapEffect } from '../lib/motion'

const CATEGORIES = ['Accessibility', 'Getting started', 'Account & sync', 'Troubleshooting', 'Other']

type FormErrors = Partial<Record<'name' | 'email' | 'message', string>>

function Breadcrumb({ label }: { label: string }) {
  return (
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
            {label}
          </span>
        </li>
      </ol>
    </nav>
  )
}

function ContactForm() {
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    const category = String(data.get('category') ?? '')
    const message = String(data.get('message') ?? '').trim()

    const next: FormErrors = {}
    if (!name) next.name = 'Enter your name so we know who we are replying to.'
    if (!email) next.email = 'Enter an email address so we can reply.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'That does not look like an email address.'
    if (!message) next.message = 'Tell us what is happening — even one line helps.'

    setErrors(next)

    if (Object.keys(next).length > 0) {
      setStatus(
        `Your message was not sent. ${Object.keys(next).length} ${
          Object.keys(next).length === 1 ? 'field needs' : 'fields need'
        } attention.`,
      )
      // Focus the first field in error, so a keyboard or screen reader user is
      // taken to the problem rather than told one exists.
      const firstError = Object.keys(next)[0]
      formRef.current?.querySelector<HTMLElement>(`[name="${firstError}"]`)?.focus()
      return
    }

    // There is no backend behind this site, so the form composes the message
    // and hands it to the visitor's own mail client. Saying so beats a fake
    // success screen that quietly drops what someone took the time to write.
    const body = `${message}\n\n— ${name}`
    window.location.href = `mailto:${SITE.supportEmail}?subject=${encodeURIComponent(
      `[${category}] Block Blast support`,
    )}&body=${encodeURIComponent(body)}`
    setStatus('Your email app is opening with the message ready to send.')
  }

  const fieldClass =
    'mt-2 w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-ink placeholder:text-ink-dim/70'

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="surface-card p-7 sm:p-9">
      <h3 className="text-2xl">Send us a message</h3>
      <p className="mt-2 text-ink-dim">
        This page has no server behind it — submitting opens your own email app with the message
        prepared. You can also write to{' '}
        <a href={`mailto:${SITE.supportEmail}`} className="text-accent">
          {SITE.supportEmail}
        </a>{' '}
        directly.
      </p>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="text-sm font-semibold">
            Name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'contact-name-error' : undefined}
            className={fieldClass}
          />
          {errors.name && (
            <p id="contact-name-error" className="mt-2 text-sm text-primary-soft">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="contact-email" className="text-sm font-semibold">
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            className={fieldClass}
          />
          {errors.email && (
            <p id="contact-email-error" className="mt-2 text-sm text-primary-soft">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="contact-category" className="text-sm font-semibold">
          Category
        </label>
        <select id="contact-category" name="category" defaultValue="Accessibility" className={fieldClass}>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        <label htmlFor="contact-message" className="text-sm font-semibold">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
          className={fieldClass}
        />
        {errors.message && (
          <p id="contact-message-error" className="mt-2 text-sm text-primary-soft">
            {errors.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="mt-7 rounded-2xl bg-ink px-6 py-3.5 font-semibold text-bg transition-transform duration-300 hover:-translate-y-0.5"
      >
        Compose email
      </button>

      {/* Validation results are announced rather than only shown in red. */}
      <p role="status" aria-live="polite" className="mt-4 text-sm text-ink-dim">
        {status}
      </p>
    </form>
  )
}

export default function Support() {
  const scopeRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return FAQ_CATEGORIES
    return FAQ_CATEGORIES.map((category) => ({
      ...category,
      entries: category.entries.filter(
        (entry) =>
          entry.question.toLowerCase().includes(term) || entry.answer.toLowerCase().includes(term),
      ),
    })).filter((category) => category.entries.length > 0)
  }, [query])

  const resultCount = filtered.reduce((total, category) => total + category.entries.length, 0)
  const totalCount = FAQ_CATEGORIES.reduce((total, category) => total + category.entries.length, 0)

  useGsapEffect(scopeRef, ({ gsap }) => {
    gsap.to('[data-support-heading] [data-reveal-word]', {
      yPercent: 0,
      duration: 0.9,
      stagger: 0.05,
    })
    gsap.to('[data-support-enter]', { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, delay: 0.15 })
  })

  return (
    <div ref={scopeRef} className="pb-10">
      <section className="shell pt-14 sm:pt-20">
        <Breadcrumb label="Support" />
        <p className="eyebrow mt-8">Support centre</p>
        <WordReveal
          as="h1"
          data-support-heading
          text="Help, in the same three channels as the game."
          className="display-2 mt-5 max-w-[18ch]"
        />
        <p data-support-enter data-enter-up className="mt-6 max-w-2xl text-lg text-ink-dim">
          {totalCount} answers covering play, accessibility, syncing and troubleshooting. If yours is
          not here, the form at the bottom reaches a person.
        </p>

        <div
          data-support-enter
          data-enter-up
          className="surface-card mt-10 flex flex-col gap-4 border-accent/40 bg-accent/10 p-7 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h2 className="text-xl">Need accessibility assistance?</h2>
            <p className="mt-1.5 text-ink-dim">
              Accessibility questions jump the queue. We respond within 24 hours.
            </p>
          </div>
          <a
            href={`mailto:${SITE.supportEmail}?subject=${encodeURIComponent('[Accessibility] Block Blast')}`}
            className="shrink-0 rounded-2xl bg-ink px-5 py-3 font-semibold text-bg no-underline"
          >
            Email accessibility support
          </a>
        </div>
      </section>

      <section aria-labelledby="faq-heading" className="shell mt-20">
        <h2 id="faq-heading" className="display-3">
          Frequently asked questions
        </h2>

        <div className="mt-7 max-w-xl">
          <label htmlFor="faq-search" className="text-sm font-semibold">
            Search the FAQ
          </label>
          <input
            id="faq-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="VoiceOver, haptics, iCloud…"
            aria-describedby="faq-search-results"
            className="mt-2 w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-ink placeholder:text-ink-dim/70"
          />
          {/* Filtering happens as you type, so the result count has to be
              spoken as well as shown. */}
          <p id="faq-search-results" role="status" aria-live="polite" className="mt-3 text-sm text-ink-dim">
            {query.trim()
              ? `${resultCount} ${resultCount === 1 ? 'answer' : 'answers'} match “${query.trim()}”.`
              : `Showing all ${totalCount} answers.`}
          </p>
        </div>

        <div className="mt-12 space-y-14">
          {filtered.map((category) => (
            <div key={category.id} id={category.id} className="scroll-mt-24">
              <h3 className="text-2xl">{category.title}</h3>
              <p className="mt-1.5 text-ink-dim">{category.summary}</p>
              <div className="mt-6 border-t border-line/70">
                {category.entries.map((entry) => (
                  <Accordion
                    key={entry.id}
                    question={entry.question}
                    highlight={query}
                    defaultOpen={Boolean(query.trim())}
                  >
                    <p className="m-0">{entry.answer}</p>
                  </Accordion>
                ))}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-lg text-ink-dim">
              Nothing matches “{query.trim()}”. Try a shorter term, or send us the question directly
              — the form below reaches a person.
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="contact-heading" className="shell mt-24">
        <h2 id="contact-heading" className="display-3">
          Contact us
        </h2>
        <div className="mt-8">
          <ContactForm />
        </div>
      </section>

      <section aria-labelledby="version-heading" className="shell mt-24">
        <h2 id="version-heading" className="display-3">
          Version history
        </h2>
        <ol className="mt-8 list-none space-y-6 p-0">
          {VERSION_HISTORY.map((release) => (
            <li key={release.version} className="surface-card p-7">
              <div className="flex flex-wrap items-baseline gap-3">
                <h3 className="text-xl">Version {release.version}</h3>
                <span className="rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink-dim">
                  {release.date}
                </span>
              </div>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-ink-dim">
                {release.changes.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
