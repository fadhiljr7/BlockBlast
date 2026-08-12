//
//  Board.swift
//  BlockBlast
//

import Foundation

/// The 8×8 playfield. Pure value type: every rule lives here and nothing here
/// touches UI, audio or haptics, which is what makes undo a one-line copy.
nonisolated struct Board: Equatable, Sendable {
    static let size = 8

    private(set) var cells: [BlockColor?]

    init() {
        cells = Array(repeating: nil, count: Board.size * Board.size)
    }

    subscript(position: GridPosition) -> BlockColor? {
        get {
            guard Board.contains(position) else { return nil }
            return cells[position.row * Board.size + position.col]
        }
        set {
            guard Board.contains(position) else { return }
            cells[position.row * Board.size + position.col] = newValue
        }
    }

    static func contains(_ position: GridPosition) -> Bool {
        position.row >= 0 && position.row < size && position.col >= 0 && position.col < size
    }

    var filledCount: Int { cells.lazy.filter { $0 != nil }.count }

    var isEmpty: Bool { filledCount == 0 }

    /// Absolute cells a shape would occupy if its top-left corner sat at `origin`.
    func cells(for shape: PieceShape, at origin: GridPosition) -> [GridPosition] {
        shape.cells.map { $0.offset(row: origin.row, col: origin.col) }
    }

    func canPlace(_ shape: PieceShape, at origin: GridPosition) -> Bool {
        for cell in shape.cells {
            let target = cell.offset(row: origin.row, col: origin.col)
            guard Board.contains(target), self[target] == nil else { return false }
        }
        return true
    }

    /// Every origin where the shape fits, in reading order.
    func validOrigins(for shape: PieceShape) -> [GridPosition] {
        var origins: [GridPosition] = []
        guard shape.height <= Board.size, shape.width <= Board.size else { return origins }
        for row in 0...(Board.size - shape.height) {
            for col in 0...(Board.size - shape.width) {
                let origin = GridPosition(row: row, col: col)
                if canPlace(shape, at: origin) { origins.append(origin) }
            }
        }
        return origins
    }

    func hasValidPlacement(for shape: PieceShape) -> Bool {
        guard shape.height <= Board.size, shape.width <= Board.size else { return false }
        for row in 0...(Board.size - shape.height) {
            for col in 0...(Board.size - shape.width) {
                if canPlace(shape, at: GridPosition(row: row, col: col)) { return true }
            }
        }
        return false
    }

    /// Places a piece and clears any full lines. Returns `nil` if the move is illegal,
    /// so callers can never desync the board by assuming a placement succeeded.
    mutating func place(_ piece: Piece, at origin: GridPosition) -> Placement? {
        guard canPlace(piece.shape, at: origin) else { return nil }

        let placed = cells(for: piece.shape, at: origin)
        for cell in placed { self[cell] = piece.color }

        let fullRows = (0..<Board.size).filter { row in
            (0..<Board.size).allSatisfy { self[GridPosition(row: row, col: $0)] != nil }
        }
        let fullColumns = (0..<Board.size).filter { col in
            (0..<Board.size).allSatisfy { self[GridPosition(row: $0, col: col)] != nil }
        }

        var cleared: Set<GridPosition> = []
        for row in fullRows {
            for col in 0..<Board.size { cleared.insert(GridPosition(row: row, col: col)) }
        }
        for col in fullColumns {
            for row in 0..<Board.size { cleared.insert(GridPosition(row: row, col: col)) }
        }
        for cell in cleared { self[cell] = nil }

        return Placement(
            piece: piece,
            origin: origin,
            placedCells: placed,
            clearedRows: fullRows,
            clearedColumns: fullColumns,
            clearedCells: cleared.sorted()
        )
    }

    /// Empties the given cells. Used by Zen mode to keep the board playable
    /// rather than ending the run.
    mutating func clear(_ positions: some Sequence<GridPosition>) {
        for position in positions { self[position] = nil }
    }
}

/// The outcome of one legal placement — everything the feedback layer needs to
/// speak, sound and animate the move.
nonisolated struct Placement: Equatable, Sendable {
    let piece: Piece
    let origin: GridPosition
    let placedCells: [GridPosition]
    let clearedRows: [Int]
    let clearedColumns: [Int]
    let clearedCells: [GridPosition]

    var linesCleared: Int { clearedRows.count + clearedColumns.count }
    var didClear: Bool { linesCleared > 0 }
}
