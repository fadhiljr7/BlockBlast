import type { ReactNode } from 'react'
import Reveal from './Reveal'

type SectionHeadingProps = {
  eyebrow?: string
  title: ReactNode
  lead?: ReactNode
  className?: string
  align?: 'left' | 'center'
}

export default function SectionHeading({
  eyebrow,
  title,
  lead,
  className = '',
  align = 'left',
}: SectionHeadingProps) {
  return (
    <Reveal className={`${align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'} ${className}`}>
      {eyebrow && <p className="chip mb-5">{eyebrow}</p>}
      <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {lead && <p className="mt-4 text-base/7 text-white/60 sm:text-lg/8">{lead}</p>}
    </Reveal>
  )
}
