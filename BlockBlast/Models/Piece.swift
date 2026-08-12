//
//  Piece.swift
//  BlockBlast
//

import Foundation

/// A piece silhouette, normalised so its top-left occupied cell sits at (0, 0).
nonisolated struct PieceShape: Hashable, Sendable {
    /// Localisation key suffix, e.g. `tShape` → `shape.tShape`.
    let key: String
    let cells: [GridPosition]
    let width: Int
    let height: Int
    /// Relative frequency in the random bag. Big awkward pieces show up less often.
    let weight: Int

    /// Builds a shape from an ASCII sketch: `"X"` is filled, anything else empty.
    init(key: String, weight: Int = 10, rows: [String]) {
        var cells: [GridPosition] = []
        for (rowIndex, row) in rows.enumerated() {
            for (colIndex, character) in row.enumerated() where character == "X" {
                cells.append(GridPosition(row: rowIndex, col: colIndex))
            }
        }
        self.key = key
        self.weight = weight
        self.cells = cells.sorted()
        self.height = (cells.map(\.row).max() ?? -1) + 1
        self.width = (cells.map(\.col).max() ?? -1) + 1
    }

    var cellCount: Int { cells.count }

    var localizedName: String {
        switch key {
        case "single": String(localized: "shape.single", defaultValue: "single cell")
        case "domino": String(localized: "shape.domino", defaultValue: "domino")
        case "line3": String(localized: "shape.line3", defaultValue: "3 in a line")
        case "line4": String(localized: "shape.line4", defaultValue: "4 in a line")
        case "line5": String(localized: "shape.line5", defaultValue: "5 in a line")
        case "square2": String(localized: "shape.square2", defaultValue: "2 by 2 square")
        case "square3": String(localized: "shape.square3", defaultValue: "3 by 3 square")
        case "rect": String(localized: "shape.rect", defaultValue: "rectangle")
        case "corner": String(localized: "shape.corner", defaultValue: "corner")
        case "lShape": String(localized: "shape.lShape", defaultValue: "L-shape")
        case "tShape": String(localized: "shape.tShape", defaultValue: "T-shape")
        case "sShape": String(localized: "shape.sShape", defaultValue: "S-shape")
        default: String(localized: "shape.block", defaultValue: "block")
        }
    }

    /// "3 by 2 T-shape, 5 cells" — the size-then-name-then-count order VoiceOver users
    /// asked for, because size is what decides whether a piece still fits.
    var accessibilityDescription: String {
        String(
            format: String(localized: "shape.description", defaultValue: "%1$d by %2$d %3$@, %4$d cells"),
            height, width, localizedName, cellCount
        )
    }

    /// Row-major occupancy grid, used for drawing previews.
    func occupancyGrid() -> [[Bool]] {
        var grid = Array(repeating: Array(repeating: false, count: width), count: height)
        for cell in cells { grid[cell.row][cell.col] = true }
        return grid
    }
}

nonisolated extension PieceShape {
    /// The full silhouette library. Weights are tuned so the tray stays playable:
    /// small and medium pieces dominate, 3×3 and 5-lines are rare.
    static let library: [PieceShape] = [
        PieceShape(key: "single", weight: 6, rows: ["X"]),

        PieceShape(key: "domino", weight: 12, rows: ["XX"]),
        PieceShape(key: "domino", weight: 12, rows: ["X", "X"]),

        PieceShape(key: "line3", weight: 12, rows: ["XXX"]),
        PieceShape(key: "line3", weight: 12, rows: ["X", "X", "X"]),

        PieceShape(key: "line4", weight: 8, rows: ["XXXX"]),
        PieceShape(key: "line4", weight: 8, rows: ["X", "X", "X", "X"]),

        PieceShape(key: "line5", weight: 4, rows: ["XXXXX"]),
        PieceShape(key: "line5", weight: 4, rows: ["X", "X", "X", "X", "X"]),

        PieceShape(key: "square2", weight: 12, rows: ["XX", "XX"]),
        PieceShape(key: "square3", weight: 3, rows: ["XXX", "XXX", "XXX"]),

        PieceShape(key: "rect", weight: 6, rows: ["XXX", "XXX"]),
        PieceShape(key: "rect", weight: 6, rows: ["XX", "XX", "XX"]),

        PieceShape(key: "corner", weight: 10, rows: ["X.", "XX"]),
        PieceShape(key: "corner", weight: 10, rows: ["XX", "X."]),
        PieceShape(key: "corner", weight: 10, rows: ["XX", ".X"]),
        PieceShape(key: "corner", weight: 10, rows: [".X", "XX"]),

        PieceShape(key: "lShape", weight: 7, rows: ["X..", "X..", "XXX"]),
        PieceShape(key: "lShape", weight: 7, rows: ["XXX", "X..", "X.."]),
        PieceShape(key: "lShape", weight: 7, rows: ["XXX", "..X", "..X"]),
        PieceShape(key: "lShape", weight: 7, rows: ["..X", "..X", "XXX"]),

        PieceShape(key: "tShape", weight: 7, rows: ["XXX", ".X."]),
        PieceShape(key: "tShape", weight: 7, rows: [".X.", "XXX"]),
        PieceShape(key: "tShape", weight: 7, rows: ["X.", "XX", "X."]),
        PieceShape(key: "tShape", weight: 7, rows: [".X", "XX", ".X"]),

        PieceShape(key: "sShape", weight: 5, rows: [".XX", "XX."]),
        PieceShape(key: "sShape", weight: 5, rows: ["XX.", ".XX"]),
        PieceShape(key: "sShape", weight: 5, rows: ["X.", "XX", ".X"]),
        PieceShape(key: "sShape", weight: 5, rows: [".X", "XX", "X."]),
    ]

    static func random(using generator: inout some RandomNumberGenerator) -> PieceShape {
        let total = library.reduce(0) { $0 + $1.weight }
        var roll = Int.random(in: 0..<total, using: &generator)
        for shape in library {
            roll -= shape.weight
            if roll < 0 { return shape }
        }
        return library[0]
    }
}

/// A concrete piece sitting in the tray: a silhouette plus an identity.
nonisolated struct Piece: Identifiable, Hashable, Sendable {
    let id: UUID
    let shape: PieceShape
    let color: BlockColor

    init(id: UUID = UUID(), shape: PieceShape, color: BlockColor) {
        self.id = id
        self.shape = shape
        self.color = color
    }

    static func random(using generator: inout some RandomNumberGenerator) -> Piece {
        Piece(
            shape: PieceShape.random(using: &generator),
            color: BlockColor.allCases.randomElement(using: &generator) ?? .red
        )
    }

    /// "3 by 2 T-shape, 5 cells, blue with horizontal stripes"
    var accessibilityDescription: String {
        String(
            format: String(localized: "piece.description", defaultValue: "%1$@, %2$@"),
            shape.accessibilityDescription,
            color.accessibilityDescription
        )
    }
}
