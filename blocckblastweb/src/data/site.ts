/**
 * Single source of truth for copy that appears in more than one place.
 * Everything here is checked against the iOS source — the seven colours and
 * their patterns come from Models/BlockColor.swift, the placement modes from
 * Game/GameSettings.swift, the themes from Theme/Theme.swift.
 */

export const SITE = {
  name: 'Block Blast — Accessible Edition',
  shortName: 'Block Blast',
  tagline: 'A block puzzle where losing your sight, or your colour vision, changes nothing.',
  description:
    'Every signal the game gives you arrives on three channels at once — visual, audio and haptic. Seven patterned blocks, a board you can hear, and three ways to place a piece.',
  supportEmail: 'abidinfadhil@gmail.com',
  repoUrl: 'https://github.com/fadhiljr7/BlockBlast',
  /** No listing yet — every call to action says so out loud instead of faking a link. */
  appStoreUrl: null as string | null,
  requirements: 'iPhone and iPad · iOS 26.5 or later',
  lastUpdated: '17 August 2026',
} as const

export type BlockId =
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'cyan'

export type BlockDef = {
  id: BlockId
  /** Matches `BlockColor.pattern` in the app. */
  pattern: string
  /** The glyph the app shows in dense UI, from `PatternStyle.glyph`. */
  glyph: string
  hex: string
  /** Semitone offset the audio engine gives this colour, from `BlockColor.toneOffset`. */
  toneOffset: number
}

export const BLOCKS: readonly BlockDef[] = [
  { id: 'red', pattern: 'dots', glyph: '●●●', hex: '#ed424f', toneOffset: 0 },
  { id: 'blue', pattern: 'horizontal stripes', glyph: '≡≡≡', hex: '#3882f5', toneOffset: 2 },
  { id: 'green', pattern: 'vertical stripes', glyph: '|||', hex: '#33ba5c', toneOffset: 4 },
  { id: 'yellow', pattern: 'crosshatch', glyph: '✚✚✚', hex: '#facc26', toneOffset: 5 },
  { id: 'purple', pattern: 'diagonal stripes', glyph: '///', hex: '#9954e6', toneOffset: 7 },
  { id: 'orange', pattern: 'checkerboard', glyph: '▦▦▦', hex: '#fa8729', toneOffset: 9 },
  { id: 'cyan', pattern: 'waves', glyph: '〜〜〜', hex: '#29c9d9', toneOffset: 11 },
] as const

export type Feature = {
  id: string
  title: string
  blurb: string
  detail: string
  block: BlockId
}

export const FEATURES: readonly Feature[] = [
  {
    id: 'sonic-navigation',
    title: 'Sonic navigation',
    blurb: 'The board has a sound. Scan it with your ear and build a map.',
    detail:
      'Row maps to pitch on a C-major pentatonic scale — no interval in it sounds wrong, so scanning never raises a false alarm — and column maps to position in space through an HRTF audio environment.',
    block: 'cyan',
  },
  {
    id: 'patterns',
    title: 'Patterns, always drawn',
    blurb: 'Seven colours, seven patterns. Colour is never the only signal.',
    detail:
      'Dots, horizontal stripes, vertical stripes, crosshatch, diagonals, checkerboard, waves. The Minimal theme paints every block the same white — a standing proof that the game never leans on hue.',
    block: 'purple',
  },
  {
    id: 'three-ways',
    title: 'Three ways to place',
    blurb: 'Drag, tap-tap, or dwell. Switch in the middle of a run.',
    detail:
      'All three routes drive the same engine state, so changing input method never costs you a game. Dwell works with Switch Control and is adjustable from 0.4 to 4 seconds.',
    block: 'green',
  },
  {
    id: 'voiceover',
    title: 'VoiceOver as a first draft',
    blurb: 'Every cell and every tray slot is a labelled element.',
    detail:
      '“Row 3, column 5, red with dots, fits here, clears 2 lines.” Piece descriptions lead with size — “3 by 2 T-shape, 5 cells, blue with horizontal stripes” — because size is what decides whether a piece still fits.',
    block: 'blue',
  },
  {
    id: 'haptics',
    title: 'Haptics that mirror the sound',
    blurb: 'A heartbeat while a piece is in hand. A tick where it fits.',
    detail:
      'Core Haptics renders a sharp tick over a legal cell, a dull thud over an illegal one, and a burst that grows with the number of lines cleared. Falls back to UIKit feedback generators on older hardware.',
    block: 'red',
  },
  {
    id: 'zen',
    title: 'Zen mode',
    blurb: 'No game over. When nothing fits, the fullest rows dissolve.',
    detail:
      'Play continues instead of ending. Verified by a headless 400-move self-play run that never dead-ends.',
    block: 'yellow',
  },
] as const

export type PlacementMode = {
  id: string
  name: string
  detail: string
  forWhom: string
}

/** Mirrors `PlacementMode` in Game/GameSettings.swift. */
export const PLACEMENT_MODES: readonly PlacementMode[] = [
  {
    id: 'drag',
    name: 'Drag & drop',
    detail:
      'Direct manipulation. The piece floats above your finger, and a near-miss snaps to a neighbouring legal spot. Tapping a piece also picks it up, so this mode never traps anyone.',
    forWhom: 'Default',
  },
  {
    id: 'sticky',
    name: 'Sticky drag',
    detail:
      'Tap a piece, every legal landing spot lights up with a dashed outline and a pip, tap one. No dragging at all.',
    forWhom: 'Limited dexterity',
  },
  {
    id: 'dwell',
    name: 'Dwell control',
    detail:
      'Tap a piece, then rest on a cell — a ring fills and the piece places itself. Works with Switch Control, timed from 0.4 to 4 seconds.',
    forWhom: 'Switch Control',
  },
] as const

export type ThemeDef = {
  id: string
  name: string
  detail: string
  /** Background, board surface, empty cell — as used by the swatch. */
  surface: [string, string, string]
  /** Three representative blocks in that theme's palette. */
  blocks: [string, string, string]
}

/** Mirrors the six palettes in Theme/Theme.swift. */
export const THEMES: readonly ThemeDef[] = [
  {
    id: 'classic',
    name: 'Classic',
    detail: 'Bright, saturated blocks.',
    surface: ['#171f3d', '#212b52', '#2e3b66'],
    blocks: ['#ed424f', '#3882f5', '#33ba5c'],
  },
  {
    id: 'neon',
    name: 'Neon Glow',
    detail: 'Glowing blocks on deep black.',
    surface: ['#080514', '#0f0d1f', '#1c1733'],
    blocks: ['#ff3373', '#33ff80', '#33ffff'],
  },
  {
    id: 'pastel',
    name: 'Pastel Soft',
    detail: 'Soft, low-intensity colours.',
    surface: ['#faf5ef', '#f5f0f7', '#e6e3f0'],
    blocks: ['#f59e9e', '#99baf0', '#9edcad'],
  },
  {
    id: 'highContrast',
    name: 'High Contrast',
    detail: 'Solid fills, thick borders, maximum separation.',
    surface: ['#000000', '#000000', '#1f1f1f'],
    blocks: ['#ff4033', '#4d99ff', '#33f259'],
  },
  {
    id: 'nature',
    name: 'Nature',
    detail: 'Wood, stone and leaf tones.',
    surface: ['#29241c', '#3d3326', '#4f4233'],
    blocks: ['#b8473d', '#527a4f', '#d9b85c'],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    detail: 'Monochrome — pattern carries all identity.',
    surface: ['#121212', '#1a1a1a', '#292929'],
    blocks: ['#ebebeb', '#ebebeb', '#ebebeb'],
  },
] as const

export type SoundPack = {
  id: string
  name: string
  detail: string
}

/** Mirrors `SoundPack` in Audio/SoundPack.swift. */
export const SOUND_PACKS: readonly SoundPack[] = [
  { id: 'synthetic', name: 'Synthetic', detail: 'Pure tones. Clearest pitch cues for playing by ear.' },
  { id: 'organic', name: 'Organic', detail: 'Wood, glass and stone.' },
  { id: 'retro', name: 'Retro', detail: '8-bit chiptune.' },
  { id: 'nature', name: 'Nature', detail: 'Water drops and wind chimes.' },
] as const

export type Earcon = { event: string; sound: string }

/** The earcon vocabulary described in the app README. */
export const EARCONS: readonly Earcon[] = [
  { event: 'Piece placed', sound: 'Ascending major triad, C–E–G' },
  { event: 'Line cleared', sound: 'Sparkling arpeggio, an octave higher per extra line' },
  { event: 'Combo', sound: 'Harmonic stacking — the chord gains a partial per combo step' },
  { event: 'Invalid move', sound: 'Low sawtooth buzz' },
  { event: 'Game over', sound: 'Descending scale into a low glide' },
] as const

export type Faq = { question: string; answer: string }

export const SUPPORT_FAQ: readonly Faq[] = [
  {
    question: 'How do I play with VoiceOver and the screen off?',
    answer:
      'Turn on audio explore with the ear button above the board. The board becomes a direct-touch surface: drag a finger to hear each cell as you cross it, lift to hear that cell described, and triple-tap to place the piece you are holding. This is the mode designed for Screen Curtain.',
  },
  {
    question: 'I cannot drag pieces. Is there another way?',
    answer:
      'Yes — two. Settings ▸ Placement offers sticky drag (tap a piece, then tap one of the highlighted landing spots) and dwell control (tap a piece, rest on a cell, and it places itself after a delay you choose between 0.4 and 4 seconds). Both drive the same engine, so you can switch mid-run without losing your game.',
  },
  {
    question: 'The colours are hard to tell apart.',
    answer:
      'Every block also carries a pattern, and patterns are always drawn. If you want more separation, try the High Contrast or Minimal themes, turn on Increase Contrast in iOS Settings (the app thickens block borders in response), or use the colour-vision simulation in Settings ▸ Vision to play in the exact palette you want to verify. Settings also holds a block key listing every colour with its pattern name.',
  },
  {
    question: 'I hear no sound, or no spatial audio.',
    answer:
      'Check the iOS silent switch and that Settings ▸ Audio has sound enabled. Spatial positioning needs headphones — the column-to-position mapping is rendered through an HRTF environment and collapses to centre on the built-in speaker. Every sound is synthesised at runtime, so there is nothing to download and nothing that can fail to load.',
  },
  {
    question: 'Haptics are not firing.',
    answer:
      'Core Haptics needs an iPhone 8 or later and iOS system haptics enabled (Settings ▸ Sounds & Haptics). iPads have no Taptic Engine, so the app falls back to sound and speech there. Check that the app’s own haptics toggle is on in Settings ▸ Feedback.',
  },
  {
    question: 'What is Zen mode?',
    answer:
      'A mode with no game over. When no piece in the tray fits anywhere, the fullest rows dissolve and play continues. Nothing is scored for that dissolve — it exists so a run can be a place to sit rather than a thing to lose.',
  },
  {
    question: 'How does undo work?',
    answer:
      'You start with one undo token and earn another every three pieces placed, banking up to three. Undo restores the board, the score and the combo streak exactly as they were, because a snapshot is a value copy of the whole game state.',
  },
  {
    question: 'Can I play in Indonesian?',
    answer:
      'Yes. English and Indonesian are both complete, including VoiceOver labels and spoken feedback, and numbers follow your locale. The app follows your system language; Settings links straight to the iOS per-app language screen if you want to override it.',
  },
  {
    question: 'Does the app work offline?',
    answer:
      'Entirely. There is no network code in the app at all — no accounts, no leaderboards, no ads, no analytics. Sounds are synthesised on device rather than downloaded.',
  },
] as const
