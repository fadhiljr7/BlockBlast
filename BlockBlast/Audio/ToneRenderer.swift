//
//  ToneRenderer.swift
//  BlockBlast
//

import AVFoundation
import Foundation

/// One scheduled note inside an earcon.
nonisolated struct Tone: Sendable {
    var frequency: Double
    var start: Double
    var duration: Double
    var amplitude: Double = 1.0
    /// Optional target frequency for a glide, used by the game-over slide.
    var glideTo: Double?

    init(_ frequency: Double, start: Double, duration: Double, amplitude: Double = 1.0, glideTo: Double? = nil) {
        self.frequency = frequency
        self.start = start
        self.duration = duration
        self.amplitude = amplitude
        self.glideTo = glideTo
    }
}

/// Renders earcons into mono PCM buffers at runtime. Synthesising rather than
/// shipping audio files means every cue can be re-voiced per sound pack, and the
/// pitch mapping used for board navigation stays exact.
nonisolated enum ToneRenderer {
    static func buffer(
        tones: [Tone],
        profile: VoiceProfile,
        format: AVAudioFormat,
        noiseMix: Double = 0
    ) -> AVAudioPCMBuffer? {
        let sampleRate = format.sampleRate
        let tail = tones.map { $0.start + $0.duration + profile.release }.max() ?? 0.2
        let frameCount = AVAudioFrameCount(max(sampleRate * (tail + 0.02), 64))

        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount),
              let channel = buffer.floatChannelData?[0]
        else { return nil }
        buffer.frameLength = frameCount

        for frame in 0..<Int(frameCount) { channel[frame] = 0 }

        var noiseState: UInt64 = 0x2545F491_4F6CDD1D
        for tone in tones {
            let startFrame = Int(tone.start * sampleRate)
            let bodyFrames = Int(tone.duration * sampleRate)
            let releaseFrames = Int(profile.release * sampleRate)
            let totalFrames = bodyFrames + releaseFrames
            guard startFrame < Int(frameCount) else { continue }

            var phase = 0.0
            var modulatorPhase = 0.0
            for offset in 0..<totalFrames {
                let frame = startFrame + offset
                guard frame < Int(frameCount) else { break }

                let time = Double(offset) / sampleRate
                let envelope = amplitudeEnvelope(
                    time: time,
                    body: tone.duration,
                    profile: profile
                )
                guard envelope > 0.0001 else { continue }

                let progress: Double = tone.duration > 0 ? min(time / tone.duration, 1) : 1
                var frequency: Double = tone.frequency
                if let glideTo = tone.glideTo {
                    frequency += (glideTo - tone.frequency) * progress
                }
                if profile.vibrato > 0 {
                    let vibratoPhase: Double = 2 * Double.pi * 5.5 * time
                    frequency += profile.vibrato * sin(vibratoPhase)
                }

                var sample = 0.0
                if profile.waveform == .fmBell {
                    // Two-operator FM: a bright strike that decays into a pure tone.
                    let modulatorIndex = 3.0 * exp(-time * 8)
                    modulatorPhase += 2 * .pi * frequency * 2.0 / sampleRate
                    phase += 2 * .pi * frequency / sampleRate
                    sample = sin(phase + modulatorIndex * sin(modulatorPhase))
                } else {
                    phase += 2 * .pi * frequency / sampleRate
                    for (index, weight) in profile.harmonics.enumerated() where weight > 0 {
                        sample += weight * wave(profile.waveform, phase: phase * Double(index + 1))
                    }
                    let normalisation = profile.harmonics.reduce(0, +)
                    if normalisation > 0 { sample /= normalisation }
                }

                if noiseMix > 0 {
                    noiseState = noiseState &* 6364136223846793005 &+ 1442695040888963407
                    let noise = Double(Int64(bitPattern: noiseState >> 11)) / Double(1 << 52) - 1
                    sample = sample * (1 - noiseMix) + noise * noiseMix
                }

                channel[frame] += Float(sample * envelope * tone.amplitude * 0.32)
            }
        }

        // Soft clip so stacked harmonics in a big combo never crack the output.
        for frame in 0..<Int(frameCount) {
            channel[frame] = Float(tanh(Double(channel[frame]) * 1.2))
        }
        return buffer
    }

    private static func amplitudeEnvelope(time: Double, body: Double, profile: VoiceProfile) -> Double {
        if time < profile.attack {
            return profile.attack > 0 ? time / profile.attack : 1
        }
        let afterAttack = time - profile.attack
        if afterAttack < profile.decay {
            let t = profile.decay > 0 ? afterAttack / profile.decay : 1
            return 1 + (profile.sustain - 1) * t
        }
        if time < body {
            return profile.sustain
        }
        let releaseProgress = profile.release > 0 ? (time - body) / profile.release : 1
        guard releaseProgress < 1 else { return 0 }
        return profile.sustain * (1 - releaseProgress) * (1 - releaseProgress)
    }

    private static func wave(_ waveform: Waveform, phase: Double) -> Double {
        let wrapped = phase.truncatingRemainder(dividingBy: 2 * .pi)
        switch waveform {
        case .sine, .fmBell:
            return sin(wrapped)
        case .triangle:
            let t = wrapped / (2 * .pi)
            return 4 * abs(t - 0.5) - 1
        case .square:
            return wrapped < .pi ? 1 : -1
        case .sawtooth:
            return wrapped / .pi - 1
        case .noise:
            return sin(wrapped * 13.7) * sin(wrapped * 4.1)
        }
    }
}

/// Equal-tempered helpers. All game pitches are derived from these so intervals
/// stay musically meaningful — which is what makes the board learnable by ear.
nonisolated enum Pitch {
    static func frequency(midi: Double) -> Double {
        440 * pow(2, (midi - 69) / 12)
    }

    /// C major pentatonic, the scale used for board navigation: no interval in it
    /// sounds "wrong", so scanning the board never produces a false alarm.
    static let pentatonic: [Int] = [0, 2, 4, 7, 9]

    static func pentatonicMIDI(step: Int, root: Int = 48) -> Double {
        let octave = Int(floor(Double(step) / Double(pentatonic.count)))
        let degree = ((step % pentatonic.count) + pentatonic.count) % pentatonic.count
        return Double(root + octave * 12 + pentatonic[degree])
    }
}
