/** Single source of truth for anything that appears in more than one place. */

export const SITE = {
  name: 'Block Blast: Accessible Edition',
  shortName: 'Block Blast',
  /** Project page on GitHub Pages. Update alongside `base` in vite.config.ts. */
  url: 'https://fadhiljr7.github.io/BlockBlast',
  tagline: 'A puzzle game where losing your sight or your colour vision changes nothing.',
  description:
    'Play Block Blast, the puzzle game designed for blind players, color-blind players, and everyone else. Sonic navigation, pattern blocks, and three ways to play.',
  supportEmail: 'support@blockblast.app',
  privacyEmail: 'privacy@blockblast.app',
  /** The App Store listing does not exist yet — every CTA says so out loud. */
  appStoreUrl: null as string | null,
  locale: 'en',
} as const

export type Feature = {
  id: string
  title: string
  blurb: string
  /** Longer line used by assistive technology and by the card's expanded copy. */
  detail: string
  accent: string
}

export const FEATURES: readonly Feature[] = [
  {
    id: 'sonic-navigation',
    title: 'Sonic Navigation',
    blurb: 'Hear the board. Every cell has a pitch and a place in space.',
    detail:
      'Row maps to pitch on a C-major pentatonic scale; column maps to position through a spatial audio environment. Occupied cells sound richer and louder than empty ones, so a scan reads as texture rather than a list of notes.',
    accent: 'var(--color-accent)',
  },
  {
    id: 'pattern-system',
    title: 'Pattern System',
    blurb: 'Seven colours, seven patterns. Colour is never the only signal.',
    detail:
      'Dots, horizontal stripes, vertical stripes, crosshatch, diagonals, checkerboard, waves. The pattern is always drawn — never an opt-in extra — and the Minimal theme paints every block the same white as a standing proof that hue is optional.',
    accent: 'var(--color-primary)',
  },
  {
    id: 'three-ways-to-play',
    title: 'Three Ways to Play',
    blurb: 'Drag, tap-tap, or dwell. Switch mid-run.',
    detail:
      'All three routes drive the same state machine, so changing input method never costs you a run. Dwell control works with Switch Control and its timing is adjustable from 0.4 to 4 seconds.',
    accent: 'var(--color-success)',
  },
  {
    id: 'voiceover-native',
    title: 'VoiceOver Native',
    blurb: 'Every label, every action, fully spoken.',
    detail:
      'Each cell and tray slot is a labelled element: "Row 3, column 5, red with dots, fits here, clears 2 lines." Piece descriptions lead with size, because size is what decides whether a piece still fits.',
    accent: 'var(--color-primary-soft)',
  },
  {
    id: 'zen-mode',
    title: 'Zen Mode',
    blurb: 'No game over. No pressure. Just you and the blocks.',
    detail:
      'When nothing fits, the fullest rows dissolve and play continues. Verified over a 400-move run that never dead-ends.',
    accent: 'var(--color-block-cyan)',
  },
  {
    id: 'icloud-sync',
    title: 'iCloud Sync',
    blurb: 'Start on iPhone. Finish on iPad.',
    detail:
      'Your settings and your best score follow you across devices. Accessibility preferences stay on the device that set them.',
    accent: 'var(--color-block-purple)',
  },
] as const

export type Testimonial = {
  quote: string
  name: string
  role: string
}

/**
 * Placeholder quotes. These are written as illustrative copy for an unreleased
 * app — no real person or publication has endorsed it yet, and the section
 * header says so.
 */
export const TESTIMONIALS: readonly Testimonial[] = [
  {
    quote:
      'I played eleven rounds before I realised I had never turned the screen back on. The board is genuinely in the sound.',
    name: 'Placeholder quote',
    role: 'Screen reader user, beta group',
  },
  {
    quote:
      'Most games hand colour-blind players a filter and call it done. This one hands you a pattern that was there from the first commit.',
    name: 'Placeholder quote',
    role: 'Accessibility advocate',
  },
  {
    quote:
      'Switching from drag to dwell in the middle of a run, without losing the run, is the detail that tells you who built this.',
    name: 'Placeholder quote',
    role: 'Switch Control user, beta group',
  },
  {
    quote:
      'The Minimal theme — every block the same white — is the most confident accessibility statement I have seen in a puzzle game.',
    name: 'Placeholder quote',
    role: 'Design writer',
  },
] as const

export type PlacementMode = {
  id: string
  name: string
  detail: string
}

/** Mirrors `PlacementMode` in GameSettings.swift. */
export const PLACEMENT_MODES: readonly PlacementMode[] = [
  {
    id: 'drag',
    name: 'Drag & drop',
    detail:
      'Direct manipulation. The piece floats above your finger, and a near-miss snaps to a neighbouring legal spot. Tapping a piece also picks it up, so this never traps someone who cannot drag.',
  },
  {
    id: 'sticky',
    name: 'Sticky drag',
    detail:
      'Tap a piece, every legal landing spot lights up, tap one. No dragging at all.',
  },
  {
    id: 'dwell',
    name: 'Dwell control',
    detail:
      'Tap a piece, then rest on a cell — a ring fills and it places itself. Works with Switch Control, adjustable from 0.4 to 4 seconds.',
  },
] as const

export type ReleaseNote = {
  version: string
  date: string
  status: string
  changes: readonly string[]
}

export const VERSION_HISTORY: readonly ReleaseNote[] = [
  {
    version: '1.0',
    date: 'Pending App Store review',
    status: 'upcoming',
    changes: [
      'First public release.',
      'Classic and Zen modes on an 8×8 board with a weighted bag of 30 piece silhouettes.',
      'Sonic navigation, spatial audio and four sound packs, all synthesised at runtime.',
      'Seven blocks, seven always-drawn patterns, six themes including High Contrast and Minimal.',
      'Drag, sticky-drag and dwell placement, switchable mid-run.',
      'English and Indonesian, including VoiceOver labels and Siri shortcuts.',
    ],
  },
  {
    version: '0.9 (TestFlight)',
    date: 'Beta',
    status: 'shipped',
    changes: [
      'Added the one-tap maximum accessibility preset.',
      'Whole-game colour vision simulation, not just a settings preview swatch.',
      'Undo tokens now accrue every three placements and bank up to three.',
      'Audio explore mode: drag to hear cells, lift to hear one described, triple-tap to place.',
    ],
  },
] as const
