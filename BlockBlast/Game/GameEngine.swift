//
//  GameEngine.swift
//  BlockBlast
//

import Foundation
import Observation

nonisolated enum GameMode: String, CaseIterable, Codable, Identifiable, Sendable {
    /// Classic Block Blast: the run ends when no piece fits.
    case classic
    /// No game over, no pressure — when nothing fits, the board makes room.
    case zen

    var id: String { rawValue }

    var localizedName: String {
        switch self {
        case .classic: String(localized: "mode.classic", defaultValue: "Classic")
        case .zen: String(localized: "mode.zen", defaultValue: "Zen")
        }
    }

    var localizedDescription: String {
        switch self {
        case .classic: String(localized: "mode.classic.detail", defaultValue: "The run ends when no piece fits.")
        case .zen: String(localized: "mode.zen.detail", defaultValue: "No timer, no game over. The board makes room when you get stuck.")
        }
    }
}

/// What just happened, in a form the audio, haptic and VoiceOver layers can each
/// render in their own modality. The engine never plays anything itself.
nonisolated enum GameEvent: Equatable, Sendable {
    case placed(Placement, scoreGained: Int, comboMultiplier: Int)
    case rejected(reason: RejectionReason)
    case undone
    case newGame
    case gameOver(finalScore: Int, isPersonalBest: Bool)
    case zenRelief(clearedCells: [GridPosition])
    case selectionChanged(Piece?)

    enum RejectionReason: Equatable, Sendable {
        case occupied
        case outOfBounds
        case noPieceSelected
        case noUndoAvailable
    }
}

/// Rules, scoring, undo and the tray. `@Observable` so SwiftUI tracks exactly the
/// properties each view reads.
@Observable
final class GameEngine {
    static let traySize = 3
    /// One undo is earned for every three pieces placed, and you can bank up to three.
    static let placementsPerUndo = 3
    static let maxUndoTokens = 3

    private(set) var board = Board()
    /// Fixed-length tray; a slot is `nil` once its piece has been played.
    private(set) var tray: [Piece?] = []
    private(set) var score = 0
    private(set) var bestScore = 0
    /// Consecutive placements that cleared at least one line.
    private(set) var comboStreak = 0
    private(set) var isGameOver = false
    private(set) var undoTokens = 1
    private(set) var placementsSinceUndoEarned = 0
    private(set) var piecesPlaced = 0
    private(set) var linesClearedTotal = 0

    /// The last event, consumed by `FeedbackCoordinator`.
    private(set) var lastEvent: GameEvent?

    /// Tray slot the player has picked up — the shared anchor for drag, sticky-drag,
    /// dwell control and VoiceOver, so all four input styles drive one state machine.
    var selectedSlot: Int? {
        didSet {
            guard oldValue != selectedSlot else { return }
            lastEvent = .selectionChanged(selectedPiece)
        }
    }

    /// Board cell the player is currently pointing at, whatever the input method.
    var focusedCell: GridPosition?

    private(set) var mode: GameMode
    private var undoStack: [Snapshot] = []
    private var generator: RandomNumberGenerator

    private struct Snapshot {
        let board: Board
        let tray: [Piece?]
        let score: Int
        let comboStreak: Int
        let piecesPlaced: Int
        let linesClearedTotal: Int
    }

    init(mode: GameMode = .classic, bestScore: Int = 0, generator: RandomNumberGenerator = SystemRandomNumberGenerator()) {
        self.mode = mode
        self.bestScore = bestScore
        self.generator = generator
        refillTray()
    }

    // MARK: - Derived state

    var selectedPiece: Piece? {
        guard let selectedSlot, tray.indices.contains(selectedSlot) else { return nil }
        return tray[selectedSlot]
    }

    var comboMultiplier: Int { max(1, min(comboStreak, 5)) }

    var canUndo: Bool { undoTokens > 0 && !undoStack.isEmpty }

    /// Placements available for the piece in hand — the highlight set for sticky drag,
    /// dwell control and the VoiceOver "valid moves" rotor.
    func validOrigins(forSlot slot: Int) -> [GridPosition] {
        guard tray.indices.contains(slot), let piece = tray[slot] else { return [] }
        return board.validOrigins(for: piece.shape)
    }

    var validOriginsForSelection: [GridPosition] {
        guard let selectedSlot else { return [] }
        return validOrigins(forSlot: selectedSlot)
    }

    func canPlaceSelection(at origin: GridPosition) -> Bool {
        guard let piece = selectedPiece else { return false }
        return board.canPlace(piece.shape, at: origin)
    }

    /// Cells the current selection would occupy at `origin`, for the ghost preview.
    func previewCells(at origin: GridPosition) -> [GridPosition] {
        guard let piece = selectedPiece else { return [] }
        return board.cells(for: piece.shape, at: origin)
    }

    /// Lines that would complete if the selection landed at `origin`. Used to promise
    /// a clear before the player commits — visually, and in the VoiceOver hint.
    func linesCompleted(placing origin: GridPosition) -> Int {
        guard let piece = selectedPiece, board.canPlace(piece.shape, at: origin) else { return 0 }
        var probe = board
        return probe.place(piece, at: origin)?.linesCleared ?? 0
    }

    // MARK: - Moves

    @discardableResult
    func place(slot: Int, at origin: GridPosition) -> Placement? {
        guard !isGameOver, tray.indices.contains(slot), let piece = tray[slot] else {
            lastEvent = .rejected(reason: .noPieceSelected)
            return nil
        }
        guard board.canPlace(piece.shape, at: origin) else {
            let inBounds = piece.shape.cells.allSatisfy {
                Board.contains($0.offset(row: origin.row, col: origin.col))
            }
            lastEvent = .rejected(reason: inBounds ? .occupied : .outOfBounds)
            return nil
        }

        pushSnapshot()

        guard let placement = board.place(piece, at: origin) else { return nil }
        tray[slot] = nil
        piecesPlaced += 1
        linesClearedTotal += placement.linesCleared

        comboStreak = placement.didClear ? comboStreak + 1 : 0
        let gained = Self.points(for: placement, comboMultiplier: comboMultiplier)
        score += gained

        earnUndoTokenIfDue()
        if tray.allSatisfy({ $0 == nil }) { refillTray() }

        selectedSlot = nil
        lastEvent = .placed(placement, scoreGained: gained, comboMultiplier: comboMultiplier)

        evaluateBoardState()
        return placement
    }

    @discardableResult
    func placeSelection(at origin: GridPosition) -> Placement? {
        guard let selectedSlot else {
            lastEvent = .rejected(reason: .noPieceSelected)
            return nil
        }
        return place(slot: selectedSlot, at: origin)
    }

    func undo() {
        guard canUndo, let snapshot = undoStack.popLast() else {
            lastEvent = .rejected(reason: .noUndoAvailable)
            return
        }
        board = snapshot.board
        tray = snapshot.tray
        score = snapshot.score
        comboStreak = snapshot.comboStreak
        piecesPlaced = snapshot.piecesPlaced
        linesClearedTotal = snapshot.linesClearedTotal
        undoTokens -= 1
        isGameOver = false
        selectedSlot = nil
        lastEvent = .undone
    }

    func newGame(mode: GameMode? = nil) {
        if let mode { self.mode = mode }
        board = Board()
        score = 0
        comboStreak = 0
        piecesPlaced = 0
        linesClearedTotal = 0
        undoTokens = 1
        placementsSinceUndoEarned = 0
        undoStack.removeAll()
        isGameOver = false
        selectedSlot = nil
        focusedCell = nil
        refillTray()
        lastEvent = .newGame
    }

    func setMode(_ mode: GameMode) {
        guard mode != self.mode else { return }
        newGame(mode: mode)
    }

    func consumeEvent() { lastEvent = nil }

    // MARK: - Hints

    /// The move the hint system points at: prefer clearing lines, then hugging the
    /// edges, which is the habit that keeps a board alive longest.
    func bestHint() -> (slot: Int, origin: GridPosition)? {
        var best: (slot: Int, origin: GridPosition, score: Int)?
        for (slot, piece) in tray.enumerated() {
            guard let piece else { continue }
            for origin in board.validOrigins(for: piece.shape) {
                var probe = board
                guard let placement = probe.place(piece, at: origin) else { continue }
                var value = placement.linesCleared * 1000
                value += placement.placedCells.reduce(0) { partial, cell in
                    let edgeAffinity = min(cell.row, Board.size - 1 - cell.row)
                        + min(cell.col, Board.size - 1 - cell.col)
                    return partial + (7 - edgeAffinity)
                }
                if best == nil || value > best!.score {
                    best = (slot, origin, value)
                }
            }
        }
        guard let best else { return nil }
        return (best.slot, best.origin)
    }

    // MARK: - Scoring

    /// One point per cell placed, a quadratic bonus for clearing several lines at once,
    /// then the combo multiplier for keeping a clearing streak alive.
    static func points(for placement: Placement, comboMultiplier: Int) -> Int {
        let cellPoints = placement.placedCells.count
        let lines = placement.linesCleared
        let linePoints = lines * lines * 10
        return cellPoints + linePoints * comboMultiplier
    }

    // MARK: - Tray & lifecycle

    private func refillTray() {
        tray = (0..<Self.traySize).map { _ in Piece.random(using: &generator) }
    }

    private func pushSnapshot() {
        undoStack.append(
            Snapshot(
                board: board,
                tray: tray,
                score: score,
                comboStreak: comboStreak,
                piecesPlaced: piecesPlaced,
                linesClearedTotal: linesClearedTotal
            )
        )
        if undoStack.count > 16 { undoStack.removeFirst() }
    }

    private func earnUndoTokenIfDue() {
        placementsSinceUndoEarned += 1
        if placementsSinceUndoEarned >= Self.placementsPerUndo {
            placementsSinceUndoEarned = 0
            undoTokens = min(undoTokens + 1, Self.maxUndoTokens)
        }
    }

    private var hasAnyMove: Bool {
        tray.contains { piece in
            guard let piece else { return false }
            return board.hasValidPlacement(for: piece.shape)
        }
    }

    private func evaluateBoardState() {
        guard !hasAnyMove else { return }
        switch mode {
        case .zen:
            relieveBoard()
        case .classic:
            isGameOver = true
            let isBest = score > bestScore
            if isBest { bestScore = score }
            lastEvent = .gameOver(finalScore: score, isPersonalBest: isBest)
        }
    }

    /// Zen never ends. When nothing fits, the two fullest rows dissolve — no score,
    /// no penalty, just room to keep playing.
    private func relieveBoard() {
        var attempts = 0
        var clearedAll: [GridPosition] = []
        while !hasAnyMove && attempts < Board.size {
            attempts += 1
            let fullest = (0..<Board.size)
                .map { row in
                    (row, (0..<Board.size).count { board[GridPosition(row: row, col: $0)] != nil })
                }
                .filter { $0.1 > 0 }
                .sorted { $0.1 > $1.1 }
                .prefix(2)
                .map(\.0)
            guard !fullest.isEmpty else { break }
            let cells = fullest.flatMap { row in
                (0..<Board.size).map { GridPosition(row: row, col: $0) }
            }
            board.clear(cells)
            clearedAll.append(contentsOf: cells)
        }
        if !clearedAll.isEmpty {
            lastEvent = .zenRelief(clearedCells: clearedAll)
        }
        if score > bestScore { bestScore = score }
    }
}
