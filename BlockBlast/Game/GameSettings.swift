//
//  GameSettings.swift
//  BlockBlast
//

import Foundation
import Observation
import SwiftUI

/// How a piece gets from the tray to the board. All three routes drive the same
/// engine state, so a player can switch mid-game without losing their run.
enum PlacementMode: String, CaseIterable, Codable, Identifiable, Sendable {
    /// Direct manipulation. Tapping a piece still arms it, so this never traps
    /// someone who cannot drag.
    case drag
    /// Tap piece → valid cells highlight → tap target.
    case sticky
    /// Tap piece → move focus over a cell → it commits itself after the dwell time.
    case dwell

    var id: String { rawValue }

    var localizedName: String {
        switch self {
        case .drag: String(localized: "placement.drag", defaultValue: "Drag & drop")
        case .sticky: String(localized: "placement.sticky", defaultValue: "Sticky drag (tap, tap)")
        case .dwell: String(localized: "placement.dwell", defaultValue: "Dwell control")
        }
    }

    var localizedDescription: String {
        switch self {
        case .drag: String(localized: "placement.drag.detail", defaultValue: "Drag a piece onto the board. Tapping a piece also picks it up.")
        case .sticky: String(localized: "placement.sticky.detail", defaultValue: "Tap a piece, then tap a highlighted cell. No dragging needed.")
        case .dwell: String(localized: "placement.dwell.detail", defaultValue: "Tap a piece, then rest on a cell — it places itself. Works with Switch Control.")
        }
    }
}

/// How much VoiceOver says per move.
enum SpeechVerbosity: String, CaseIterable, Codable, Identifiable, Sendable {
    case concise, standard, verbose

    var id: String { rawValue }

    var localizedName: String {
        switch self {
        case .concise: String(localized: "verbosity.concise", defaultValue: "Concise")
        case .standard: String(localized: "verbosity.standard", defaultValue: "Standard")
        case .verbose: String(localized: "verbosity.verbose", defaultValue: "Verbose")
        }
    }
}

enum ClearEffect: String, CaseIterable, Codable, Identifiable, Sendable {
    case shatter, dissolve, slideOut, implode

    var id: String { rawValue }

    var localizedName: String {
        switch self {
        case .shatter: String(localized: "clear.shatter", defaultValue: "Shatter")
        case .dissolve: String(localized: "clear.dissolve", defaultValue: "Dissolve")
        case .slideOut: String(localized: "clear.slideOut", defaultValue: "Slide out")
        case .implode: String(localized: "clear.implode", defaultValue: "Implode")
        }
    }
}

/// Everything the player can tune, persisted to `UserDefaults`.
@Observable
final class GameSettings {
    // Presentation
    var theme: ThemeID { didSet { store(theme.rawValue, .theme) } }
    var visionSimulation: VisionSimulation { didSet { store(visionSimulation.rawValue, .visionSimulation) } }
    /// Patterns default on and stay on unless the player deliberately removes them.
    var patternsEnabled: Bool { didSet { store(patternsEnabled, .patternsEnabled) } }
    var forceHighContrast: Bool { didSet { store(forceHighContrast, .forceHighContrast) } }
    var clearEffect: ClearEffect { didSet { store(clearEffect.rawValue, .clearEffect) } }
    var idleAnimationEnabled: Bool { didSet { store(idleAnimationEnabled, .idleAnimation) } }

    // Input
    var placementMode: PlacementMode { didSet { store(placementMode.rawValue, .placementMode) } }
    var dwellDuration: Double { didSet { store(dwellDuration, .dwellDuration) } }
    var hintsEnabled: Bool { didSet { store(hintsEnabled, .hintsEnabled) } }
    var confirmBeforePlacing: Bool { didSet { store(confirmBeforePlacing, .confirmBeforePlacing) } }

    // Audio
    var audioEnabled: Bool { didSet { store(audioEnabled, .audioEnabled) } }
    var soundPack: SoundPack { didSet { store(soundPack.rawValue, .soundPack) } }
    var spatialAudioEnabled: Bool { didSet { store(spatialAudioEnabled, .spatialAudio) } }
    /// Sonic navigation: every cell you touch or focus sings its position.
    var boardTonesEnabled: Bool { didSet { store(boardTonesEnabled, .boardTones) } }
    var audioVolume: Double { didSet { store(audioVolume, .audioVolume) } }

    // Haptics
    var hapticsEnabled: Bool { didSet { store(hapticsEnabled, .hapticsEnabled) } }
    var hapticIntensity: Double { didSet { store(hapticIntensity, .hapticIntensity) } }

    // Speech
    var speechVerbosity: SpeechVerbosity { didSet { store(speechVerbosity.rawValue, .speechVerbosity) } }
    var announceScore: Bool { didSet { store(announceScore, .announceScore) } }

    // Progress
    var bestScore: Int { didSet { store(bestScore, .bestScore) } }
    var preferredMode: GameMode { didSet { store(preferredMode.rawValue, .preferredMode) } }

    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        func string(_ key: Key) -> String? { defaults.string(forKey: key.storageKey) }
        func bool(_ key: Key, default fallback: Bool) -> Bool {
            defaults.object(forKey: key.storageKey) as? Bool ?? fallback
        }
        func double(_ key: Key, default fallback: Double) -> Double {
            defaults.object(forKey: key.storageKey) as? Double ?? fallback
        }

        theme = ThemeID(rawValue: string(.theme) ?? "") ?? .classic
        visionSimulation = VisionSimulation(rawValue: string(.visionSimulation) ?? "") ?? VisionSimulation.none
        patternsEnabled = bool(.patternsEnabled, default: true)
        forceHighContrast = bool(.forceHighContrast, default: false)
        clearEffect = ClearEffect(rawValue: string(.clearEffect) ?? "") ?? .shatter
        idleAnimationEnabled = bool(.idleAnimation, default: true)

        placementMode = PlacementMode(rawValue: string(.placementMode) ?? "") ?? .drag
        dwellDuration = double(.dwellDuration, default: 1.2)
        hintsEnabled = bool(.hintsEnabled, default: true)
        confirmBeforePlacing = bool(.confirmBeforePlacing, default: false)

        audioEnabled = bool(.audioEnabled, default: true)
        soundPack = SoundPack(rawValue: string(.soundPack) ?? "") ?? .synthetic
        spatialAudioEnabled = bool(.spatialAudio, default: true)
        boardTonesEnabled = bool(.boardTones, default: true)
        audioVolume = double(.audioVolume, default: 0.8)

        hapticsEnabled = bool(.hapticsEnabled, default: true)
        hapticIntensity = double(.hapticIntensity, default: 0.8)

        speechVerbosity = SpeechVerbosity(rawValue: string(.speechVerbosity) ?? "") ?? .standard
        announceScore = bool(.announceScore, default: true)

        bestScore = defaults.integer(forKey: Key.bestScore.storageKey)
        preferredMode = GameMode(rawValue: string(.preferredMode) ?? "") ?? .classic
    }

    /// Turns the whole app into its most accessible configuration in one tap —
    /// the setting a first-time blind player should be able to reach immediately.
    func applyMaximumAccessibilityPreset() {
        theme = .highContrast
        patternsEnabled = true
        forceHighContrast = true
        placementMode = .sticky
        hintsEnabled = true
        audioEnabled = true
        soundPack = .synthetic
        spatialAudioEnabled = true
        boardTonesEnabled = true
        hapticsEnabled = true
        speechVerbosity = .verbose
        announceScore = true
        idleAnimationEnabled = false
    }

    private enum Key: String {
        case theme, visionSimulation, patternsEnabled, forceHighContrast, clearEffect, idleAnimation
        case placementMode, dwellDuration, hintsEnabled, confirmBeforePlacing
        case audioEnabled, soundPack, spatialAudio, boardTones, audioVolume
        case hapticsEnabled, hapticIntensity
        case speechVerbosity, announceScore
        case bestScore, preferredMode

        var storageKey: String { "blockblast.settings.\(rawValue)" }
    }

    private func store(_ value: some Any, _ key: Key) {
        defaults.set(value, forKey: key.storageKey)
    }
}
