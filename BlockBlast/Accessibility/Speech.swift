//
//  Speech.swift
//  BlockBlast
//

import Accessibility
import SwiftUI
import UIKit

typealias AnnouncementPriority = AttributeScopes.AccessibilityAttributes.AnnouncementPriorityAttribute.AnnouncementPriority

/// Posts VoiceOver announcements. Kept in one place so priorities stay consistent:
/// score updates never interrupt, but game over always does.
enum Announcer {
    static var isVoiceOverRunning: Bool { UIAccessibility.isVoiceOverRunning }

    static func announce(_ message: String, priority: AnnouncementPriority = .default) {
        guard !message.isEmpty else { return }
        var announcement = AttributedString(message)
        announcement.accessibilitySpeechAnnouncementPriority = priority
        AccessibilityNotification.Announcement(announcement).post()
    }

    /// Moves VoiceOver focus and speaks the new context — used after a placement
    /// so focus never lands back on a tray slot that no longer holds a piece.
    static func screenChanged(focusing element: Any? = nil) {
        UIAccessibility.post(notification: .screenChanged, argument: element)
    }
}

/// Every phrase the game speaks. Composed from localised formats so Indonesian
/// and English can order the parts differently.
enum Speech {
    static func number(_ value: Int) -> String {
        value.formatted(.number)
    }

    // MARK: - Board

    static func cell(at position: GridPosition, content: BlockColor?) -> String {
        let row = position.row + 1
        let column = position.col + 1
        if let content {
            return String(
                format: String(localized: "cell.filled", defaultValue: "Row %1$d, column %2$d, %3$@"),
                row, column, content.accessibilityDescription
            )
        }
        return String(
            format: String(localized: "cell.empty", defaultValue: "Row %1$d, column %2$d, empty"),
            row, column
        )
    }

    /// Appended to a cell label while a piece is in hand, so the player learns
    /// whether the move is legal before spending a tap on it.
    static func placementSuffix(fits: Bool, linesCompleted: Int) -> String {
        guard fits else {
            return String(localized: "cell.doesNotFit", defaultValue: "does not fit")
        }
        guard linesCompleted > 0 else {
            return String(localized: "cell.fits", defaultValue: "fits here")
        }
        return String(
            format: String(localized: "cell.fitsAndClears", defaultValue: "fits here, clears %1$d lines"),
            linesCompleted
        )
    }

    // MARK: - Tray

    static func traySlot(index: Int, piece: Piece?) -> String {
        guard let piece else {
            return String(
                format: String(localized: "tray.empty", defaultValue: "Piece %1$d, already played"),
                index + 1
            )
        }
        return String(
            format: String(localized: "tray.piece", defaultValue: "Piece %1$d: %2$@"),
            index + 1, piece.accessibilityDescription
        )
    }

    static func trayHint(placementCount: Int) -> String {
        guard placementCount > 0 else {
            return String(localized: "tray.hint.noMoves", defaultValue: "This piece has no legal moves.")
        }
        return String(
            format: String(localized: "tray.hint", defaultValue: "Double tap to pick up. %1$d placements available."),
            placementCount
        )
    }

    // MARK: - Events

    static func placed(
        placement: Placement,
        score: Int,
        gained: Int,
        combo: Int,
        verbosity: SpeechVerbosity,
        includeScore: Bool
    ) -> String {
        var parts: [String] = []

        switch verbosity {
        case .concise:
            break
        case .standard, .verbose:
            parts.append(
                String(
                    format: String(localized: "event.placedAt", defaultValue: "Placed at row %1$d, column %2$d"),
                    placement.origin.row + 1, placement.origin.col + 1
                )
            )
        }

        if includeScore {
            parts.append(
                String(
                    format: String(localized: "event.score", defaultValue: "Score %1$@"),
                    number(score)
                )
            )
            if verbosity == .verbose {
                parts.append(
                    String(
                        format: String(localized: "event.gained", defaultValue: "plus %1$@"),
                        number(gained)
                    )
                )
            }
        }

        if placement.didClear {
            parts.append(
                String(
                    format: String(localized: "event.linesCleared", defaultValue: "%1$d lines cleared"),
                    placement.linesCleared
                )
            )
        }

        if combo > 1 {
            parts.append(
                String(
                    format: String(localized: "event.combo", defaultValue: "Combo times %1$d"),
                    combo
                )
            )
        }

        return parts.joined(separator: ". ")
    }

    static func rejected(_ reason: GameEvent.RejectionReason) -> String {
        switch reason {
        case .occupied: String(localized: "event.rejected.occupied", defaultValue: "Blocked. Those cells are taken.")
        case .outOfBounds: String(localized: "event.rejected.bounds", defaultValue: "Off the board.")
        case .noPieceSelected: String(localized: "event.rejected.noPiece", defaultValue: "Pick up a piece first.")
        case .noUndoAvailable: String(localized: "event.rejected.noUndo", defaultValue: "No undo available yet.")
        }
    }

    static func gameOver(score: Int, isPersonalBest: Bool) -> String {
        let base = String(
            format: String(localized: "event.gameOver", defaultValue: "Game over. Final score %1$@"),
            number(score)
        )
        guard isPersonalBest else { return base }
        return base + ". " + String(localized: "event.personalBest", defaultValue: "New personal best!")
    }

    static func selection(_ piece: Piece?, placements: Int) -> String {
        guard let piece else {
            return String(localized: "event.pieceReturned", defaultValue: "Piece put back.")
        }
        return String(
            format: String(localized: "event.pieceLifted", defaultValue: "%1$@ in hand. %2$d placements available."),
            piece.accessibilityDescription, placements
        )
    }

    static func hint(slot: Int, origin: GridPosition, piece: Piece) -> String {
        String(
            format: String(
                localized: "event.hint",
                defaultValue: "Hint: piece %1$d, %2$@, fits at row %3$d, column %4$d"
            ),
            slot + 1, piece.shape.localizedName, origin.row + 1, origin.col + 1
        )
    }

    static func boardSummary(board: Board, mode: GameMode, score: Int, best: Int) -> String {
        let filled = board.filledCount
        let free = Board.size * Board.size - filled
        return String(
            format: String(
                localized: "board.summary",
                defaultValue: "%1$@ mode. Score %2$@, best %3$@. %4$d cells filled, %5$d free."
            ),
            mode.localizedName, number(score), number(best), filled, free
        )
    }
}
