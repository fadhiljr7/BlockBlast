import type { ElementType } from 'react'
import { splitWords } from '../lib/motion'

type Props = {
  text: string
  as?: ElementType
  className?: string
  /** Marks the words the design emphasises, by index. */
  highlight?: (word: string, index: number) => boolean
} & Record<string, unknown>

/**
 * A heading split into per-word spans for GSAP stagger reveals.
 *
 * The split is visual only. Screen readers get the whole phrase once, from the
 * hidden copy — reading eleven separate spans would be eleven separate
 * stutters, and the animation is not information.
 */
export function WordReveal({
  text,
  as: Tag = 'h2',
  className = '',
  highlight,
  ...rest
}: Props) {
  const words = splitWords(text)
  return (
    <Tag className={className} {...rest}>
      <span className="sr-only-text">{text}</span>
      <span aria-hidden="true">
        {words.map((word, index) => (
          // Words repeat within a heading, so the index has to be part of the key.
          <span key={`${word}-${index}`}>
            {/* The mask clips the word while it slides up from below the line.
                The inter-word space stays outside the mask: trailing whitespace
                inside an inline-block is dropped, and the words would collide. */}
            <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
              <span
                data-reveal-word
                className={`inline-block ${highlight?.(word, index) ? 'text-gradient' : ''}`}
              >
                {word}
              </span>
            </span>
            {index < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </span>
    </Tag>
  )
}
