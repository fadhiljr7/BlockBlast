/**
 * Support content. Answers are plain strings rather than JSX so the same data
 * can render the accordion and generate the FAQPage structured data at build
 * time without the two drifting apart.
 */

export type FaqEntry = {
  id: string
  question: string
  answer: string
}

export type FaqCategory = {
  id: string
  title: string
  summary: string
  entries: readonly FaqEntry[]
}

export const FAQ_CATEGORIES: readonly FaqCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    summary: 'How to play, scoring, and the two modes.',
    entries: [
      {
        id: 'how-to-play',
        question: 'How do I play Block Blast?',
        answer:
          'You get three pieces at a time. Place them anywhere they fit on the 8×8 board, and completing a full row or column clears it. The run ends in Classic mode when none of your three pieces fit anywhere. There is no timer in either mode — you can take as long as you like on every move.',
      },
      {
        id: 'scoring',
        question: 'How does scoring work?',
        answer:
          'You score one point per cell placed, plus lines² × 10 for a clear, multiplied by your current combo. Clearing two lines at once is worth far more than clearing one twice, so setting up a double is the main source of a high score.',
      },
      {
        id: 'combo',
        question: 'What is a combo and how do I keep it?',
        answer:
          'The combo grows with every consecutive placement that clears at least one line, and it caps at ×5. Placing a piece without clearing anything resets it to zero. The audio tells you where you are: the chord literally gains a partial for each combo step.',
      },
      {
        id: 'modes',
        question: 'What is the difference between Classic and Zen mode?',
        answer:
          'Classic ends when no piece fits. Zen has no game over at all — when nothing fits, the fullest rows dissolve and play continues. Zen is the mode to start in if you are learning the board by ear, because a mistake never costs you the run.',
      },
      {
        id: 'undo',
        question: 'How do undos work?',
        answer:
          'You start a run with one undo token and earn another every three pieces placed, banking up to three. Undo restores the whole previous state — board, tray, score and combo — because the engine keeps the rules in plain value types that can simply be copied back.',
      },
      {
        id: 'hints',
        question: 'Can the game show me a move?',
        answer:
          'Yes. The hint button finds a legal move, prefers one that clears lines, then both highlights it and announces it aloud. Hints are on by default and can be turned off in Settings if you would rather not have the option available.',
      },
    ],
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    summary: 'VoiceOver, colour vision, audio and haptics.',
    entries: [
      {
        id: 'voiceover-setup',
        question: 'How do I set up the game for VoiceOver?',
        answer:
          'Open Settings inside the game and tap "Maximum accessibility". That single tap turns on the High Contrast theme, patterns, tap-to-place, spatial audio, board tones, haptics and verbose speech together. Then turn on Audio Explore with the ear button on the board: drag a finger to hear each cell as you cross it, lift to hear it described, and triple-tap to place the piece in your hand. This is the mode built for playing with Screen Curtain on.',
      },
      {
        id: 'playing-by-ear',
        question: 'How do I read the board by ear?',
        answer:
          'Each cell sings its row as a pitch on a C-major pentatonic scale and its column as a position in space, so a left-to-right sweep is heard as movement across you and an up-down sweep as movement in pitch. Occupied cells are richer and louder than empty ones. No interval in the pentatonic scale sounds wrong, which means a scan never produces a false alarm.',
      },
      {
        id: 'colour-blind-settings',
        question: 'What are the colour blind settings?',
        answer:
          'Every block already carries a pattern that is always drawn — dots, horizontal stripes, vertical stripes, crosshatch, diagonals, checkerboard or waves — so no setting is required to make the board readable. On top of that you can switch on deuteranopia, protanopia, tritanopia or achromatopsia simulation for the whole game, not just a preview swatch, so you can verify a palette in the situation you actually play in. Settings also carries a block key listing every colour with its pattern name.',
      },
      {
        id: 'no-colour-at-all',
        question: 'Is the game playable with no colour perception at all?',
        answer:
          'Yes, and there is a built-in way to prove it. The Minimal theme paints every one of the seven blocks the same near-white and raises pattern opacity to full, so pattern is the only visual identity channel left. If the game is playable in Minimal — and it is — it is not leaning on hue anywhere.',
      },
      {
        id: 'haptics-not-working',
        question: 'Haptics are not working. What should I check?',
        answer:
          'Check three things in order. First, Settings › Sounds & Haptics › System Haptics must be on in iOS. Second, haptics are disabled system-wide while Low Power Mode is active. Third, iPad and iPhone SE (1st generation) have no Taptic Engine, so the game falls back to audio and speech cues on that hardware. If all three are fine, raise Haptic Intensity in the game\'s Settings — it may be turned down rather than off.',
      },
      {
        id: 'cannot-drag',
        question: 'I cannot drag pieces. What are my options?',
        answer:
          'Two, and neither requires a drag. Sticky drag: tap a piece, every legal landing spot lights up, tap one. Dwell control: tap a piece, then rest on a cell and it places itself when a ring fills — the dwell time is adjustable from 0.4 to 4 seconds and it works with Switch Control. You can switch between all three modes in the middle of a run without losing it.',
      },
      {
        id: 'reduce-motion',
        question: 'Does the game respect Reduce Motion?',
        answer:
          'Yes. With iOS Reduce Motion on, the idle block animation stops, clear effects become a simple fade, and nothing scales or springs. You can also turn the idle animation off on its own in Settings if you want the motion reduced only here.',
      },
      {
        id: 'speech-too-much',
        question: 'VoiceOver says too much on every move. Can I shorten it?',
        answer:
          'Settings › Speech has three verbosity levels. Concise gives you position and content only; Standard adds whether the piece fits and how many lines it would clear; Verbose adds score and combo changes. Score announcements can also be turned off separately, and they never interrupt what VoiceOver is already saying — only game over does that.',
      },
    ],
  },
  {
    id: 'account-sync',
    title: 'Account & Sync',
    summary: 'iCloud, Game Center and purchases.',
    entries: [
      {
        id: 'icloud-sync',
        question: 'How do I sync my progress between iPhone and iPad?',
        answer:
          'Sign in to the same iCloud account on both devices and make sure iCloud Drive is on. Your best score and your settings sync automatically. Accessibility preferences — screen reader, colour vision and haptic settings — deliberately stay on the device that set them and are never transmitted.',
      },
      {
        id: 'sync-not-updating',
        question: 'My score has not synced. What should I try?',
        answer:
          'iCloud key-value sync settles within a minute or so on a good connection but waits for one on a poor one. Open the game on the first device, let it reach the main screen, then open it on the second. If it still lags, check Settings › [your name] › iCloud › iCloud Drive is on, and that the game is not restricted by Low Data Mode.',
      },
      {
        id: 'game-center',
        question: 'Do I need Game Center to play?',
        answer:
          'No. Game Center is entirely optional and only powers leaderboards. Everything in the game — every mode, every accessibility feature — works fully signed out, and no account of any kind is required.',
      },
      {
        id: 'purchases',
        question: 'Are there in-app purchases, ads, or a subscription?',
        answer:
          'No. There are no in-app purchases, no advertising, no subscription and no paywalled accessibility features. Nothing in the game is gated behind a payment, so there is nothing to restore.',
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    summary: 'Crashes, audio, and battery.',
    entries: [
      {
        id: 'no-sound',
        question: 'I get no sound, or sound only through the speaker.',
        answer:
          'Check the iOS Silent switch — the game respects it rather than forcing playback. Then check Audio is on and Volume is up in the game\'s Settings. If the sound is present but flat, turn Spatial Audio back on: with it off, the board still sings its rows as pitch but stops placing columns across the stereo field.',
      },
      {
        id: 'audio-after-call',
        question: 'The audio stopped after a phone call or another app.',
        answer:
          'The game yields its audio session to calls and to other apps that take priority, and resumes when the interruption ends. If it does not come back, return to the home screen and reopen the game — the audio graph rebuilds on launch. Sounds are synthesised at runtime rather than loaded from files, so nothing has to be re-downloaded.',
      },
      {
        id: 'battery-drain',
        question: 'The game is using more battery than I expect.',
        answer:
          'Spatial audio and Core Haptics are the two most expensive features. Turning off the idle block animation in Settings, or lowering haptic intensity, makes the largest difference. In Low Power Mode the system disables haptics for you and the game reduces its animation work automatically.',
      },
      {
        id: 'crash-on-launch',
        question: 'The game crashes or will not open.',
        answer:
          'Force-quit and reopen first — that clears the great majority of one-off audio-session failures. If it persists, restart the device, then check for a game update in the App Store. Crash reports reach us only if you have opted in to sharing analytics with developers in iOS Settings › Privacy & Security › Analytics & Improvements, and they contain no personal information. If it still crashes, email support with your device model and iOS version.',
      },
      {
        id: 'lost-progress',
        question: 'I lost my best score after reinstalling.',
        answer:
          'Best scores live in iCloud, so signing in to the same Apple Account and opening the game should restore yours within a minute. Runs in progress are not preserved across a delete — the board state is local to the install by design, because keeping it would mean storing gameplay data we have no reason to hold.',
      },
    ],
  },
] as const

export const ALL_FAQ_ENTRIES: readonly (FaqEntry & { category: string; categoryId: string })[] =
  FAQ_CATEGORIES.flatMap((category) =>
    category.entries.map((entry) => ({
      ...entry,
      category: category.title,
      categoryId: category.id,
    })),
  )
