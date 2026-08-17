import { useId, useState } from 'react'

type AccordionProps = {
  items: readonly { question: string; answer: string }[]
}

/**
 * Plain buttons and `aria-expanded` rather than `<details>`, so the open state
 * is controlled and a search-and-jump from elsewhere on the page could open the
 * right panel later.
 */
export default function Accordion({ items }: AccordionProps) {
  const [open, setOpen] = useState<number | null>(0)
  const id = useId()

  return (
    <div className="divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
      {items.map((item, index) => {
        const expanded = open === index
        return (
          <div key={item.question}>
            <h3>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={`${id}-panel-${index}`}
                id={`${id}-button-${index}`}
                onClick={() => setOpen(expanded ? null : index)}
                className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition hover:bg-white/[0.03]"
              >
                <span className="font-medium text-white">{item.question}</span>
                <span
                  aria-hidden
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/20 text-white/70 transition-transform duration-300 ${
                    expanded ? 'rotate-45' : ''
                  }`}
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={`${id}-panel-${index}`}
              role="region"
              aria-labelledby={`${id}-button-${index}`}
              hidden={!expanded}
              className="px-6 pb-6"
            >
              <p className="max-w-3xl text-sm/7 text-white/60">{item.answer}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
