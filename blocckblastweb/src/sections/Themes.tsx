import BlockTile from '../components/BlockTile'
import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'
import { BLOCKS, THEMES } from '../data/site'

const PATTERNS = [BLOCKS[0].pattern, BLOCKS[1].pattern, BLOCKS[2].pattern]

export default function Themes() {
  return (
    <section id="themes" className="container-page scroll-mt-24 py-24 sm:py-32">
      <SectionHeading
        eyebrow="Six themes"
        title="Including one that paints every block the same white."
        lead="Minimal exists as a standing proof rather than a style: if the game is still playable when hue carries no information at all, then hue was never the thing carrying it."
      />

      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {THEMES.map((theme, index) => (
          <li key={theme.id}>
            <Reveal delay={(index % 3) * 0.07} className="panel h-full overflow-hidden">
              <div
                className="flex items-center justify-center gap-3 p-8"
                style={{
                  background: `linear-gradient(160deg, ${theme.surface[0]}, ${theme.surface[1]})`,
                }}
              >
                {theme.blocks.map((hex, blockIndex) => (
                  <BlockTile
                    key={blockIndex}
                    hex={hex}
                    pattern={PATTERNS[blockIndex]}
                    className="h-14 w-14"
                    scale={11}
                  />
                ))}
                <span
                  className="h-14 w-14 rounded-[22%] border-2 border-dashed"
                  style={{ borderColor: theme.surface[2] }}
                  aria-hidden
                />
              </div>
              <div className="border-t border-white/10 p-5">
                <h3 className="font-semibold">{theme.name}</h3>
                <p className="mt-1 text-sm text-white/50">{theme.detail}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  )
}
