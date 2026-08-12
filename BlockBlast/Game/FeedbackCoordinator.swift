//
//  FeedbackCoordinator.swift
//  BlockBlast
//

import Accessibility
import Foundation
import Observation

/// Turns one game event into the same information on three channels: sound,
/// touch and speech. Views never talk to the audio or haptic engines directly,
/// which is what keeps the modalities from drifting out of sync.
@MainActor
@Observable
final class FeedbackCoordinator {
    let audio: GameAudioEngine
    let haptics: HapticsEngine
    private let settings: GameSettings

    init(audio: GameAudioEngine, haptics: HapticsEngine, settings: GameSettings) {
        self.audio = audio
        self.haptics = haptics
        self.settings = settings
        sync()
    }

    /// Pushes the current preferences into both engines. Cheap, so it runs on
    /// every settings change rather than being remembered in two places.
    func sync() {
        audio.isEnabled = settings.audioEnabled
        audio.soundPack = settings.soundPack
        audio.spatialEnabled = settings.spatialAudioEnabled
        audio.volume = settings.audioVolume
        haptics.isEnabled = settings.hapticsEnabled
        haptics.intensityScale = settings.hapticIntensity
    }

    func activate() {
        sync()
        audio.activate()
        haptics.activate()
    }

    func deactivate() {
        audio.deactivate()
        haptics.deactivate()
    }

    // MARK: - Events

    func handle(_ event: GameEvent, engine: GameEngine) {
        sync()
        switch event {
        case let .placed(placement, gained, combo):
            handlePlacement(placement, gained: gained, combo: combo, engine: engine)

        case let .rejected(reason):
            audio.play(.invalid)
            haptics.invalid()
            Announcer.announce(Speech.rejected(reason))

        case .undone:
            audio.play(.undo)
            haptics.undo()
            Announcer.announce(
                String(
                    format: String(localized: "event.undone", defaultValue: "Move undone. Score %1$@"),
                    Speech.number(engine.score)
                )
            )

        case .newGame:
            audio.play(.newGame)
            Announcer.announce(
                Speech.boardSummary(board: engine.board, mode: engine.mode, score: engine.score, best: engine.bestScore)
            )

        case let .gameOver(finalScore, isPersonalBest):
            audio.play(.gameOver)
            haptics.gameOver()
            if isPersonalBest {
                haptics.personalBest()
                // Delayed so the celebration lands after the game-over cadence
                // instead of on top of it.
                Task { [audio] in
                    try? await Task.sleep(for: .milliseconds(900))
                    audio.play(.personalBest)
                }
            }
            Announcer.announce(
                Speech.gameOver(score: finalScore, isPersonalBest: isPersonalBest),
                priority: .high
            )

        case let .zenRelief(cells):
            audio.play(.zenRelief)
            haptics.linesCleared(min(cells.count / Board.size, 4), combo: 1)
            Announcer.announce(
                String(
                    localized: "event.zenRelief",
                    defaultValue: "No moves left, so the board made room. Keep going."
                )
            )

        case let .selectionChanged(piece):
            if piece != nil {
                audio.play(.pieceLifted)
                haptics.pieceLifted()
            } else {
                haptics.selectionChanged()
            }
            Announcer.announce(Speech.selection(piece, placements: engine.validOriginsForSelection.count))
        }
    }

    private func handlePlacement(_ placement: Placement, gained: Int, combo: Int, engine: GameEngine) {
        audio.play(.placed, at: .cell(placement.origin))
        haptics.placed()

        if placement.didClear {
            haptics.linesCleared(placement.linesCleared, combo: combo)
            Task { [audio] in
                try? await Task.sleep(for: .milliseconds(120))
                audio.play(.linesCleared(placement.linesCleared))
                if combo > 1 {
                    try? await Task.sleep(for: .milliseconds(180))
                    audio.play(.combo(multiplier: combo))
                }
            }
        }

        let message = Speech.placed(
            placement: placement,
            score: engine.score,
            gained: gained,
            combo: combo,
            verbosity: settings.speechVerbosity,
            includeScore: settings.announceScore
        )
        Announcer.announce(message)
    }

    // MARK: - Continuous feedback

    /// Sonic navigation: the cell under the finger, or under VoiceOver focus,
    /// sings its row as pitch and its column as stereo position.
    func exploreCell(_ position: GridPosition, board: Board) {
        guard settings.boardTonesEnabled else { return }
        let content = board[position]
        audio.play(
            .cellTone(
                row: position.row,
                occupied: content != nil,
                colorOffset: content?.toneOffset ?? 0
            ),
            at: .cell(position)
        )
        if content == nil {
            haptics.hoverValid()
        } else {
            haptics.hoverInvalid()
        }
    }

    /// Called as a dragged piece crosses cell boundaries.
    func hover(valid: Bool, at position: GridPosition) {
        if valid {
            audio.play(.hoverValid, at: .cell(position))
            haptics.hoverValid()
        } else {
            audio.play(.hoverInvalid, at: .cell(position))
            haptics.hoverInvalid()
        }
    }

    func speakCell(_ position: GridPosition, board: Board) {
        Announcer.announce(Speech.cell(at: position, content: board[position]))
    }
}
