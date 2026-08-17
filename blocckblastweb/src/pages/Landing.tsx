import BlockKey from '../sections/BlockKey'
import Channels from '../sections/Channels'
import Demo from '../sections/Demo'
import Features from '../sections/Features'
import FinalCta from '../sections/FinalCta'
import Hero from '../sections/Hero'
import PlayModes from '../sections/PlayModes'
import Sound from '../sections/Sound'
import Themes from '../sections/Themes'
import { SITE } from '../data/site'
import { usePageMeta } from '../lib/meta'

export default function Landing() {
  usePageMeta('Accessible block puzzle for iPhone and iPad', SITE.description)

  return (
    <>
      <Hero />
      <Channels />
      <Features />
      <BlockKey />
      <PlayModes />
      <Demo />
      <Sound />
      <Themes />
      <FinalCta />
    </>
  )
}
