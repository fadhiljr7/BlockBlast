//
//  GameAudioEngine.swift
//  BlockBlast
//

import AVFoundation
import Foundation
import Observation

/// A point in the listener's space. The board is mapped onto a shallow arc in
/// front of the player: columns spread left→right, rows spread bottom→top.
nonisolated struct AudioPosition: Hashable, Sendable {
    var x: Float
    var y: Float
    var z: Float

    static let center = AudioPosition(x: 0, y: 0, z: -1.2)

    /// Maps a board cell into space. Pitch already encodes the row; position
    /// re-states it, so the two channels reinforce each other while scanning.
    static func cell(_ position: GridPosition) -> AudioPosition {
        let half = Double(Board.size - 1) / 2
        let x = (Double(position.col) - half) / half * 1.6
        let y = (half - Double(position.row)) / half * 0.9
        return AudioPosition(x: Float(x), y: Float(y), z: -1.2)
    }
}

/// Every non-speech sound the game makes.
nonisolated enum Earcon: Hashable, Sendable {
    /// A board cell sings its row as pitch. Occupied cells are richer and louder
    /// than empty ones, so a scan reads as texture, not just a list of notes.
    case cellTone(row: Int, occupied: Bool, colorOffset: Int)
    case pieceLifted
    case hoverValid
    case hoverInvalid
    case placed
    case linesCleared(Int)
    case combo(multiplier: Int)
    case invalid
    case undo
    case newGame
    case gameOver
    case personalBest
    case zenRelief
}

/// Owns the audio graph: a pool of player nodes feeding an `AVAudioEnvironmentNode`
/// so every cue can be positioned in 3D around the listener.
@Observable
@MainActor
final class GameAudioEngine {
    private let engine = AVAudioEngine()
    private let environment = AVAudioEnvironmentNode()
    private var players: [AVAudioPlayerNode] = []
    private var nextPlayer = 0
    private var bufferCache: [Earcon: AVAudioPCMBuffer] = [:]
    private var isConfigured = false
    private var isRunning = false

    private let monoFormat = AVAudioFormat(standardFormatWithSampleRate: 44_100, channels: 1)!
    private static let voiceCount = 10

    var soundPack: SoundPack = .synthetic {
        didSet { if oldValue != soundPack { bufferCache.removeAll() } }
    }
    var isEnabled = true
    var spatialEnabled = true
    var volume: Double = 0.8 {
        didSet { environment.outputVolume = Float(volume) }
    }

    // MARK: - Lifecycle

    func activate() {
        guard !isConfigured else {
            startIfNeeded()
            return
        }
        isConfigured = true

        // `.ambient` keeps the player's own music alive and never interrupts
        // VoiceOver — the game is additive to whatever else is playing.
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.ambient, mode: .default, options: [.mixWithOthers])
        try? session.setActive(true)

        engine.attach(environment)
        engine.connect(environment, to: engine.mainMixerNode, format: nil)
        environment.outputType = .auto
        environment.listenerPosition = AVAudio3DPoint(x: 0, y: 0, z: 0)
        environment.outputVolume = Float(volume)
        environment.distanceAttenuationParameters.distanceAttenuationModel = .inverse
        environment.distanceAttenuationParameters.referenceDistance = 1.0
        environment.distanceAttenuationParameters.maximumDistance = 12.0

        for _ in 0..<Self.voiceCount {
            let player = AVAudioPlayerNode()
            engine.attach(player)
            engine.connect(player, to: environment, format: monoFormat)
            player.renderingAlgorithm = .HRTFHQ
            player.reverbBlend = 0.1
            players.append(player)
        }

        NotificationCenter.default.addObserver(
            forName: AVAudioSession.interruptionNotification,
            object: session,
            queue: .main
        ) { [weak self] notification in
            MainActor.assumeIsolated {
                self?.handleInterruption(notification)
            }
        }
        NotificationCenter.default.addObserver(
            forName: .AVAudioEngineConfigurationChange,
            object: engine,
            queue: .main
        ) { [weak self] _ in
            MainActor.assumeIsolated {
                self?.isRunning = false
                self?.startIfNeeded()
            }
        }

        startIfNeeded()
    }

    func deactivate() {
        players.forEach { $0.stop() }
        engine.pause()
        isRunning = false
    }

    private func startIfNeeded() {
        guard isConfigured, !isRunning else { return }
        engine.prepare()
        do {
            try engine.start()
            isRunning = true
        } catch {
            // Audio is an enhancement, never a requirement: if the graph will not
            // start, the game stays fully playable through haptics and VoiceOver.
            isRunning = false
        }
    }

    private func handleInterruption(_ notification: Notification) {
        guard let raw = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: raw)
        else { return }
        switch type {
        case .began:
            isRunning = false
        case .ended:
            try? AVAudioSession.sharedInstance().setActive(true)
            startIfNeeded()
        @unknown default:
            break
        }
    }

    // MARK: - Playback

    func play(_ earcon: Earcon, at position: AudioPosition = .center) {
        guard isEnabled else { return }
        activate()
        guard isRunning, let buffer = buffer(for: earcon) else { return }

        let player = players[nextPlayer % players.count]
        nextPlayer += 1

        if spatialEnabled {
            player.renderingAlgorithm = .HRTFHQ
            player.position = AVAudio3DPoint(x: position.x, y: position.y, z: position.z)
        } else {
            player.renderingAlgorithm = .equalPowerPanning
            player.position = AVAudio3DPoint(x: 0, y: 0, z: -1)
        }

        player.stop()
        player.scheduleBuffer(buffer, at: nil, options: .interrupts, completionHandler: nil)
        player.play()
    }

    func stopAll() {
        players.forEach { $0.stop() }
    }

    private func buffer(for earcon: Earcon) -> AVAudioPCMBuffer? {
        if let cached = bufferCache[earcon] { return cached }
        let profile = soundPack.voiceProfile
        let rendered = ToneRenderer.buffer(
            tones: Self.tones(for: earcon),
            profile: earcon == .invalid ? Self.buzzProfile(from: profile) : profile,
            format: monoFormat,
            noiseMix: earcon == .invalid ? 0.35 : 0
        )
        bufferCache[earcon] = rendered
        return rendered
    }

    private static func buzzProfile(from profile: VoiceProfile) -> VoiceProfile {
        var buzz = profile
        buzz.waveform = .sawtooth
        buzz.attack = 0.002
        buzz.decay = 0.05
        buzz.sustain = 0.5
        buzz.release = 0.08
        return buzz
    }

    // MARK: - Earcon scores

    /// The sound vocabulary. Each cue is a distinct interval shape so they stay
    /// distinguishable at speed and through a phone speaker.
    private static func tones(for earcon: Earcon) -> [Tone] {
        switch earcon {
        case let .cellTone(row, occupied, colorOffset):
            // Bottom row is low, top row is high — the mapping the board is read with.
            let step = (Board.size - 1) - row
            let midi = Pitch.pentatonicMIDI(step: step, root: 50)
            if occupied {
                let base = Pitch.frequency(midi: midi)
                let tint = Pitch.frequency(midi: midi + Double(colorOffset))
                return [
                    Tone(base, start: 0, duration: 0.10, amplitude: 0.9),
                    Tone(tint, start: 0.02, duration: 0.09, amplitude: 0.45),
                ]
            }
            return [Tone(Pitch.frequency(midi: midi), start: 0, duration: 0.07, amplitude: 0.32)]

        case .pieceLifted:
            return [
                Tone(Pitch.frequency(midi: 64), start: 0, duration: 0.06, amplitude: 0.6),
                Tone(Pitch.frequency(midi: 71), start: 0.05, duration: 0.08, amplitude: 0.5),
            ]

        case .hoverValid:
            return [Tone(Pitch.frequency(midi: 84), start: 0, duration: 0.03, amplitude: 0.5)]

        case .hoverInvalid:
            return [Tone(Pitch.frequency(midi: 43), start: 0, duration: 0.05, amplitude: 0.4)]

        case .placed:
            // Ascending major triad, C–E–G.
            return [
                Tone(Pitch.frequency(midi: 60), start: 0.00, duration: 0.07),
                Tone(Pitch.frequency(midi: 64), start: 0.06, duration: 0.07),
                Tone(Pitch.frequency(midi: 67), start: 0.12, duration: 0.12),
            ]

        case let .linesCleared(lines):
            // A sparkling arpeggio that climbs one extra octave per extra line.
            let count = min(max(lines, 1), 4)
            var tones: [Tone] = []
            let degrees = [0, 4, 7, 12, 16, 19, 24]
            for line in 0..<count {
                for (index, degree) in degrees.enumerated() {
                    let midi = 60 + Double(degree + line * 5)
                    tones.append(
                        Tone(
                            Pitch.frequency(midi: midi),
                            start: Double(line) * 0.11 + Double(index) * 0.035,
                            duration: 0.06,
                            amplitude: 0.75 - Double(index) * 0.06
                        )
                    )
                }
            }
            return tones

        case let .combo(multiplier):
            // Harmonic stacking: the chord literally gains a partial per combo step.
            let level = min(max(multiplier, 2), 5)
            let root = Pitch.frequency(midi: 55)
            return (1...level).map { harmonic in
                Tone(
                    root * Double(harmonic),
                    start: Double(harmonic - 1) * 0.045,
                    duration: 0.30,
                    amplitude: 0.8 / Double(harmonic)
                )
            }

        case .invalid:
            return [Tone(Pitch.frequency(midi: 33), start: 0, duration: 0.16, amplitude: 0.7)]

        case .undo:
            return [
                Tone(Pitch.frequency(midi: 67), start: 0, duration: 0.07, amplitude: 0.6),
                Tone(Pitch.frequency(midi: 60), start: 0.06, duration: 0.10, amplitude: 0.55),
            ]

        case .newGame:
            return [
                Tone(Pitch.frequency(midi: 60), start: 0.00, duration: 0.08),
                Tone(Pitch.frequency(midi: 67), start: 0.08, duration: 0.08),
                Tone(Pitch.frequency(midi: 72), start: 0.16, duration: 0.16),
            ]

        case .gameOver:
            // Descending scale, ending on a low glide.
            var tones = (0..<5).map { index in
                Tone(
                    Pitch.frequency(midi: 72 - Double(index) * 3),
                    start: Double(index) * 0.11,
                    duration: 0.10,
                    amplitude: 0.7
                )
            }
            tones.append(
                Tone(Pitch.frequency(midi: 57), start: 0.55, duration: 0.45, amplitude: 0.6,
                     glideTo: Pitch.frequency(midi: 45))
            )
            return tones

        case .personalBest:
            return (0..<6).map { index in
                Tone(
                    Pitch.frequency(midi: 60 + Double([0, 4, 7, 12, 16, 19][index])),
                    start: Double(index) * 0.07,
                    duration: 0.20,
                    amplitude: 0.8
                )
            }

        case .zenRelief:
            return [
                Tone(Pitch.frequency(midi: 65), start: 0.00, duration: 0.30, amplitude: 0.5),
                Tone(Pitch.frequency(midi: 69), start: 0.10, duration: 0.34, amplitude: 0.45),
                Tone(Pitch.frequency(midi: 72), start: 0.20, duration: 0.40, amplitude: 0.4),
            ]
        }
    }
}
