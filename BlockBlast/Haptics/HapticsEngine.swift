//
//  HapticsEngine.swift
//  BlockBlast
//

import CoreHaptics
import Foundation
import UIKit

/// The physical channel. Every haptic here has a matching earcon and a matching
/// spoken message, so a player can lose any one channel and still read the game.
@MainActor
final class HapticsEngine {
    private var engine: CHHapticEngine?
    private var dragPlayer: CHHapticAdvancedPatternPlayer?
    private var supportsHaptics = CHHapticEngine.capabilitiesForHardware().supportsHaptics

    var isEnabled = true
    /// Scales every event, for players who find full-strength haptics painful
    /// or who need them stronger to feel anything at all.
    var intensityScale: Double = 0.8

    private let impactGenerator = UIImpactFeedbackGenerator(style: .medium)
    private let notificationGenerator = UINotificationFeedbackGenerator()

    func activate() {
        guard isEnabled, supportsHaptics, engine == nil else { return }
        do {
            let engine = try CHHapticEngine()
            engine.playsHapticsOnly = true
            engine.isAutoShutdownEnabled = true
            engine.stoppedHandler = { [weak self] _ in
                MainActor.assumeIsolated { self?.engine = nil }
            }
            engine.resetHandler = { [weak self] in
                MainActor.assumeIsolated {
                    try? self?.engine?.start()
                }
            }
            try engine.start()
            self.engine = engine
        } catch {
            // Fall back to the simpler UIKit generators rather than going silent.
            supportsHaptics = false
        }
    }

    func deactivate() {
        stopDragRhythm()
        engine?.stop()
        engine = nil
    }

    // MARK: - Vocabulary

    /// The piece is in hand. A soft double-beat that keeps repeating tells the
    /// player, without looking, that a drag is still live.
    func startDragRhythm() {
        guard isEnabled, supportsHaptics else { return }
        activate()
        guard let engine, dragPlayer == nil else { return }
        do {
            let events = [
                hapticEvent(.hapticTransient, at: 0, intensity: 0.35, sharpness: 0.3),
                hapticEvent(.hapticTransient, at: 0.16, intensity: 0.22, sharpness: 0.25),
            ]
            let pattern = try CHHapticPattern(events: events, parameters: [])
            let player = try engine.makeAdvancedPlayer(with: pattern)
            player.loopEnabled = true
            player.loopEnd = 0.85
            try player.start(atTime: CHHapticTimeImmediate)
            dragPlayer = player
        } catch {
            dragPlayer = nil
        }
    }

    func stopDragRhythm() {
        try? dragPlayer?.stop(atTime: CHHapticTimeImmediate)
        dragPlayer = nil
    }

    /// Crossing into a cell where the piece fits: a crisp, unmistakable tick.
    func hoverValid() {
        play([hapticEvent(.hapticTransient, at: 0, intensity: 0.55, sharpness: 0.95)],
             fallback: { self.impactFallback(style: .light) })
    }

    /// Hovering somewhere it does not fit: dull and low, deliberately unsatisfying.
    func hoverInvalid() {
        play([hapticEvent(.hapticTransient, at: 0, intensity: 0.35, sharpness: 0.05)],
             fallback: { self.impactFallback(style: .soft) })
    }

    func pieceLifted() {
        play([hapticEvent(.hapticTransient, at: 0, intensity: 0.5, sharpness: 0.6)],
             fallback: { self.impactFallback(style: .light) })
    }

    func placed() {
        play([
            hapticEvent(.hapticTransient, at: 0, intensity: 0.75, sharpness: 0.7),
            hapticEvent(.hapticContinuous, at: 0.02, intensity: 0.35, sharpness: 0.3, duration: 0.08),
        ], fallback: { self.impactFallback(style: .medium) })
    }

    func invalid() {
        play([
            hapticEvent(.hapticContinuous, at: 0, intensity: 0.6, sharpness: 0.05, duration: 0.14),
        ], fallback: { self.notifyFallback(.error) })
    }

    /// A burst whose length grows with the number of lines — a four-line clear
    /// is felt as clearly as it is seen.
    func linesCleared(_ lines: Int, combo: Int) {
        let pulses = min(max(lines, 1), 4) * 4
        var events: [CHHapticEvent] = []
        for index in 0..<pulses {
            let progress = Double(index) / Double(max(pulses - 1, 1))
            events.append(
                hapticEvent(
                    .hapticTransient,
                    at: Double(index) * 0.035,
                    intensity: 0.45 + progress * 0.5,
                    sharpness: 0.4 + progress * 0.55
                )
            )
        }
        if combo > 1 {
            events.append(
                hapticEvent(.hapticContinuous, at: Double(pulses) * 0.035, intensity: 0.7,
                            sharpness: 0.8, duration: 0.12 * Double(min(combo, 4)))
            )
        }
        play(events, fallback: { self.notifyFallback(.success) })
    }

    func undo() {
        play([
            hapticEvent(.hapticTransient, at: 0, intensity: 0.4, sharpness: 0.5),
            hapticEvent(.hapticTransient, at: 0.09, intensity: 0.3, sharpness: 0.35),
        ], fallback: { self.impactFallback(style: .rigid) })
    }

    func gameOver() {
        var events: [CHHapticEvent] = []
        for index in 0..<4 {
            events.append(
                hapticEvent(.hapticTransient, at: Double(index) * 0.13,
                            intensity: 0.7 - Double(index) * 0.15,
                            sharpness: 0.5 - Double(index) * 0.1)
            )
        }
        play(events, fallback: { self.notifyFallback(.warning) })
    }

    func personalBest() {
        var events: [CHHapticEvent] = []
        for index in 0..<8 {
            events.append(
                hapticEvent(.hapticTransient, at: Double(index) * 0.06,
                            intensity: 0.5 + Double(index) * 0.06,
                            sharpness: 0.5 + Double(index) * 0.05)
            )
        }
        play(events, fallback: { self.notifyFallback(.success) })
    }

    func selectionChanged() {
        play([hapticEvent(.hapticTransient, at: 0, intensity: 0.4, sharpness: 0.7)],
             fallback: { self.impactFallback(style: .soft) })
    }

    // MARK: - Plumbing

    private func hapticEvent(
        _ type: CHHapticEvent.EventType,
        at time: TimeInterval,
        intensity: Double,
        sharpness: Double,
        duration: TimeInterval? = nil
    ) -> CHHapticEvent {
        let parameters = [
            CHHapticEventParameter(parameterID: .hapticIntensity, value: Float((intensity * intensityScale).clampedToUnit)),
            CHHapticEventParameter(parameterID: .hapticSharpness, value: Float(sharpness.clampedToUnit)),
        ]
        if let duration {
            return CHHapticEvent(eventType: type, parameters: parameters, relativeTime: time, duration: duration)
        }
        return CHHapticEvent(eventType: type, parameters: parameters, relativeTime: time)
    }

    private func play(_ events: [CHHapticEvent], fallback: () -> Void) {
        guard isEnabled else { return }
        guard supportsHaptics else {
            fallback()
            return
        }
        activate()
        guard let engine else {
            fallback()
            return
        }
        do {
            let pattern = try CHHapticPattern(events: events, parameters: [])
            let player = try engine.makePlayer(with: pattern)
            try player.start(atTime: CHHapticTimeImmediate)
        } catch {
            fallback()
        }
    }

    private func impactFallback(style: UIImpactFeedbackGenerator.FeedbackStyle) {
        let generator = UIImpactFeedbackGenerator(style: style)
        generator.prepare()
        generator.impactOccurred(intensity: intensityScale)
    }

    private func notifyFallback(_ type: UINotificationFeedbackGenerator.FeedbackType) {
        notificationGenerator.prepare()
        notificationGenerator.notificationOccurred(type)
    }
}
