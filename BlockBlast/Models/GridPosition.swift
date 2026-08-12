//
//  GridPosition.swift
//  BlockBlast
//

import Foundation

/// A coordinate on the 8×8 board. Row 0 is the top row, column 0 the left column.
nonisolated struct GridPosition: Hashable, Codable, Comparable, Sendable {
    var row: Int
    var col: Int

    init(row: Int, col: Int) {
        self.row = row
        self.col = col
    }

    func offset(row deltaRow: Int, col deltaCol: Int) -> GridPosition {
        GridPosition(row: row + deltaRow, col: col + deltaCol)
    }

    /// Reading order, which is also the order VoiceOver walks the board in.
    static func < (lhs: GridPosition, rhs: GridPosition) -> Bool {
        (lhs.row, lhs.col) < (rhs.row, rhs.col)
    }
}
