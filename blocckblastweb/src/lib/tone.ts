/**
 * A browser echo of the app's sonic navigation. Row becomes pitch on a C-major
 * pentatonic scale — no interval in it sounds wrong, so scanning never produces
 * a false alarm — and column becomes a position in the stereo field, which is
 * the flat version of the HRTF environment the app renders on device.
 *
 * Like the app, nothing here is a sound file: every tone is synthesised when it
 * is asked for.
 */

const PENTATONIC = [0, 2, 4, 7, 9]
const MIDDLE_C = 261.63

let context: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!context) {
    const Ctor = window.AudioContext
    if (!Ctor) return null
    context = new Ctor()
  }
  if (context.state === 'suspended') void context.resume()
  return context
}

/** Semitones above middle C for a board row, counting from the top. */
export function semitonesForRow(row: number, size: number): number {
  const fromBottom = size - 1 - row
  const octave = Math.floor(fromBottom / PENTATONIC.length)
  return PENTATONIC[fromBottom % PENTATONIC.length] + octave * 12
}

export function frequencyForRow(row: number, size: number): number {
  return MIDDLE_C * 2 ** (semitonesForRow(row, size) / 12)
}

type CellToneOptions = {
  /** Occupied cells sound richer and a little louder, as they do in the app. */
  occupied?: boolean
  /** Extra semitones — the app gives each colour its own offset. */
  detune?: number
}

/** Plays one cell. Returns false when the browser gives us no audio at all. */
export function playCell(
  row: number,
  col: number,
  size: number,
  { occupied = false, detune = 0 }: CellToneOptions = {},
): boolean {
  const ctx = audio()
  if (!ctx) return false

  const now = ctx.currentTime
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(occupied ? 0.16 : 0.09, now + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42)

  const panner = ctx.createStereoPanner()
  // Column maps left to right across the board.
  panner.pan.value = size > 1 ? (col / (size - 1)) * 1.7 - 0.85 : 0

  const frequency = frequencyForRow(row, size) * 2 ** (detune / 12)

  const oscillator = ctx.createOscillator()
  oscillator.type = occupied ? 'triangle' : 'sine'
  oscillator.frequency.value = frequency
  oscillator.connect(gain)

  // An occupied cell gets a second partial so texture, not just pitch, tells
  // you what you are crossing.
  let partial: OscillatorNode | null = null
  if (occupied) {
    partial = ctx.createOscillator()
    partial.type = 'sine'
    partial.frequency.value = frequency * 2
    const partialGain = ctx.createGain()
    partialGain.gain.value = 0.35
    partial.connect(partialGain)
    partialGain.connect(gain)
  }

  gain.connect(panner)
  panner.connect(ctx.destination)

  oscillator.start(now)
  oscillator.stop(now + 0.45)
  partial?.start(now)
  partial?.stop(now + 0.45)

  // Browsers keep the context suspended until a real gesture, so this reports
  // whether anything was actually audible.
  return ctx.state === 'running'
}

/** The placed-piece earcon: an ascending C–E–G triad. */
export function playPlacedTriad(): boolean {
  const ctx = audio()
  if (!ctx) return false
  ;[0, 4, 7].forEach((semitone, index) => {
    window.setTimeout(() => playCell(4 - index, 3 + index, 8, { detune: semitone }), index * 70)
  })
  return true
}
