import Reveal from '../components/Reveal'
import SectionHeading from '../components/SectionHeading'

const CHANNELS = [
  {
    id: 'visual',
    name: 'Visual',
    line: 'Pattern first, colour second.',
    detail:
      'Every block draws its pattern whether you asked for it or not. Borders thicken under Increase Contrast, and a filled cell always means an occupied cell — candidate spots are dashed outlines and pips, never fills.',
    accent: 'var(--color-block-blue)',
  },
  {
    id: 'audio',
    name: 'Audio',
    line: 'The board has a shape you can hear.',
    detail:
      'Row becomes pitch on a C-major pentatonic scale, column becomes a position in space. Occupied cells sound richer than empty ones, so a scan reads as texture instead of a list of notes.',
    accent: 'var(--color-block-cyan)',
  },
  {
    id: 'haptic',
    name: 'Haptic',
    line: 'Your hand knows before you look.',
    detail:
      'A looping heartbeat while a piece is in hand, a sharp tick as it crosses a cell where it fits, a dull thud where it does not, and a burst that grows with the number of lines cleared.',
    accent: 'var(--color-accent)',
  },
]

export default function Channels() {
  return (
    <section id="channels" className="container-page scroll-mt-24 py-24 sm:py-32">
      <SectionHeading
        eyebrow="Three channels, one event"
        title="Lose any one channel and the board is still fully readable."
        lead="The rules live in a pure engine that emits a single game event. One coordinator renders that event into sound, touch and speech — which is why the three channels cannot drift out of sync with each other."
      />

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {CHANNELS.map((channel, index) => (
          <Reveal
            key={channel.id}
            delay={index * 0.08}
            className="panel flex h-full flex-col p-7 transition hover:border-white/20"
          >
            <span
              aria-hidden
              className="h-1.5 w-12 rounded-full"
              style={{ backgroundColor: channel.accent }}
            />
            <h3 className="mt-6 text-xl font-semibold">{channel.name}</h3>
            <p className="mt-2 text-base font-medium text-white/80">{channel.line}</p>
            <p className="mt-4 text-sm/6 text-white/55">{channel.detail}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
