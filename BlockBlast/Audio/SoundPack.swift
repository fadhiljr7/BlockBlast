//
//  SoundPack.swift
//  BlockBlast
//

import Foundation

nonisolated enum SoundPack: String, CaseIterable, Codable, Identifiable, Sendable {
    /// Pure tones: the clearest pitch information, and the default for players
    /// navigating the board by ear.
    case synthetic
    /// Struck wood and glass — warm, ASMR-ish, still pitch-accurate.
    case organic
    /// Square waves and fast decays.
    case retro
    /// Water drops and chimes.
    case nature

    var id: String { rawValue }

    var localizedName: String {
        switch self {
        case .synthetic: String(localized: "sound.synthetic", defaultValue: "Synthetic")
        case .organic: String(localized: "sound.organic", defaultValue: "Organic")
        case .retro: String(localized: "sound.retro", defaultValue: "Retro")
        case .nature: String(localized: "sound.nature", defaultValue: "Nature")
        }
    }

    var localizedDescription: String {
        switch self {
        case .synthetic: String(localized: "sound.synthetic.detail", defaultValue: "Pure tones. Clearest pitch cues for playing by ear.")
        case .organic: String(localized: "sound.organic.detail", defaultValue: "Wood, glass and stone.")
        case .retro: String(localized: "sound.retro.detail", defaultValue: "8-bit chiptune.")
        case .nature: String(localized: "sound.nature.detail", defaultValue: "Water drops and wind chimes.")
        }
    }

    var voiceProfile: VoiceProfile {
        switch self {
        case .synthetic:
            VoiceProfile(waveform: .sine, attack: 0.006, decay: 0.10, sustain: 0.75, release: 0.10, harmonics: [1.0, 0.18], vibrato: 0)
        case .organic:
            VoiceProfile(waveform: .fmBell, attack: 0.002, decay: 0.22, sustain: 0.28, release: 0.30, harmonics: [1.0, 0.35, 0.12], vibrato: 0)
        case .retro:
            VoiceProfile(waveform: .square, attack: 0.001, decay: 0.04, sustain: 0.60, release: 0.04, harmonics: [1.0], vibrato: 0)
        case .nature:
            VoiceProfile(waveform: .triangle, attack: 0.012, decay: 0.18, sustain: 0.45, release: 0.35, harmonics: [1.0, 0.22, 0.08], vibrato: 4.5)
        }
    }
}

nonisolated enum Waveform: Sendable {
    case sine, triangle, square, sawtooth, noise, fmBell
}

/// Envelope and spectrum for one sound pack.
nonisolated struct VoiceProfile: Sendable {
    var waveform: Waveform
    var attack: Double
    var decay: Double
    var sustain: Double
    var release: Double
    /// Relative amplitudes of harmonic partials 1×, 2×, 3× …
    var harmonics: [Double]
    /// Vibrato depth in Hz, 0 for none.
    var vibrato: Double
}
