import { Hero } from '../sections/Hero'
import { Problem } from '../sections/Problem'
import { Features } from '../sections/Features'
import { BlockKey } from '../sections/BlockKey'
import { AccessibilityDemo } from '../sections/AccessibilityDemo'
import { Testimonials } from '../sections/Testimonials'
import { FinalCta } from '../sections/FinalCta'

export default function Landing() {
  return (
    <>
      <Hero />
      <Problem />
      <Features />
      <BlockKey />
      <AccessibilityDemo />
      <Testimonials />
      <FinalCta />
    </>
  )
}
