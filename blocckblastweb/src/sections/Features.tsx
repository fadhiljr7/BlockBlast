import BlockTile from '../components/BlockTile'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import { BLOCKS, FEATURES } from '../data/site'

export default function Features() {
  return (
    <section id="features" className="container-page scroll-mt-24 py-24 sm:py-32">
      <SectionHeading
        eyebrow="What is in the box"
        title="Six things that decide how the game feels."
        lead="None of these are toggles bolted on at the end. Each one reaches down into the model — which is why the board stays honest when you turn the screen off."
      />

      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, index) => {
          const block = BLOCKS.find((item) => item.id === feature.block) ?? BLOCKS[0]
          return (
            <li key={feature.id}>
              <Reveal
                delay={(index % 3) * 0.08}
                className="panel group flex h-full flex-col p-7 transition duration-300 hover:-translate-y-1 hover:border-white/20"
              >
                <BlockTile
                  hex={block.hex}
                  pattern={block.pattern}
                  className="h-11 w-11"
                  scale={9}
                />
                <h3 className="mt-6 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm/6 text-white/75">{feature.blurb}</p>
                <p className="mt-4 text-sm/6 text-white/50">{feature.detail}</p>
              </Reveal>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
