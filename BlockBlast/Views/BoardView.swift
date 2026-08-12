//
//  BoardView.swift
//  BlockBlast
//

import SwiftUI

/// Shared geometry so the drag layer, the ghost preview and the explore gesture
/// all agree on where a cell is.
struct BoardGeometry: Equatable {
    var cellSize: CGFloat
    var spacing: CGFloat
    /// The board's frame in the game coordinate space.
    var frame: CGRect

    static let zero = BoardGeometry(cellSize: 0, spacing: 0, frame: .zero)

    var stride: CGFloat { cellSize + spacing }

    static func cellSize(fitting width: CGFloat, spacing: CGFloat) -> CGFloat {
        max((width - spacing * CGFloat(Board.size - 1)) / CGFloat(Board.size), 1)
    }

    /// Board-local rect for a cell.
    func rect(for position: GridPosition) -> CGRect {
        CGRect(
            x: CGFloat(position.col) * stride,
            y: CGFloat(position.row) * stride,
            width: cellSize,
            height: cellSize
        )
    }

    /// The cell under a point given in the game coordinate space, or `nil` outside.
    func position(at point: CGPoint) -> GridPosition? {
        guard stride > 0 else { return nil }
        let local = CGPoint(x: point.x - frame.minX, y: point.y - frame.minY)
        let col = Int(floor(local.x / stride))
        let row = Int(floor(local.y / stride))
        let position = GridPosition(row: row, col: col)
        return Board.contains(position) ? position : nil
    }

    /// The origin a piece should snap to when its top-left bounding corner is at
    /// `point`. Rounded rather than floored, so a piece lands where it looks like
    /// it will rather than where its corner technically sits.
    func snappedOrigin(topLeft point: CGPoint) -> GridPosition {
        let local = CGPoint(x: point.x - frame.minX, y: point.y - frame.minY)
        return GridPosition(
            row: Int(round(local.y / stride)),
            col: Int(round(local.x / stride))
        )
    }
}

struct BoardView: View {
    let engine: GameEngine
    let geometry: BoardGeometry
    /// Cells the piece in hand would occupy right now.
    var previewCells: Set<GridPosition> = []
    var previewIsValid = false
    /// Lines that would clear if the current preview were committed.
    var previewClearedLines: (rows: Set<Int>, cols: Set<Int>) = ([], [])
    var hintCells: Set<GridPosition> = []
    var exploreMode = false
    var onActivate: (GridPosition) -> Void = { _ in }
    /// Reports the grid's frame in the game coordinate space, which is what the
    /// drag layer hit-tests against.
    var onGridFrameChange: (CGRect) -> Void = { _ in }

    @AccessibilityFocusState.Binding var focusedCell: GridPosition?

    @Environment(\.theme) private var theme
    @Environment(GameSettings.self) private var settings
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var validOrigins: Set<GridPosition> {
        settings.placementMode == .drag && !Announcer.isVoiceOverRunning
            ? []
            : Set(engine.validOriginsForSelection)
    }

    var body: some View {
        VStack(spacing: geometry.spacing) {
            ForEach(0..<Board.size, id: \.self) { row in
                HStack(spacing: geometry.spacing) {
                    ForEach(0..<Board.size, id: \.self) { col in
                        cell(at: GridPosition(row: row, col: col))
                    }
                }
            }
        }
        .onGeometryChange(for: CGRect.self) { proxy in
            proxy.frame(in: .named(GameView.coordinateSpace))
        } action: { frame in
            onGridFrameChange(frame)
        }
        .padding(geometry.spacing * 2)
        .background {
            RoundedRectangle(cornerRadius: geometry.cellSize * 0.35, style: .continuous)
                .fill(theme.boardSurface)
                .overlay {
                    RoundedRectangle(cornerRadius: geometry.cellSize * 0.35, style: .continuous)
                        .strokeBorder(theme.gridLine, lineWidth: theme.prefersOpaqueSurfaces ? 2 : 1)
                }
        }
        .accessibilityElement(children: exploreMode ? .ignore : .contain)
        .accessibilityLabel(exploreMode ? exploreLabel : boardLabel)
        .accessibilityDirectTouch(exploreMode, options: .silentOnTouch)
    }

    private var boardLabel: String {
        String(localized: "board.label", defaultValue: "Game board, 8 by 8")
    }

    private var exploreLabel: String {
        String(
            localized: "board.explore.label",
            defaultValue: "Board explorer. Drag a finger to hear each cell. Triple tap to place the piece in hand."
        )
    }

    @ViewBuilder
    private func cell(at position: GridPosition) -> some View {
        let content = engine.board[position]
        let isPreview = previewCells.contains(position)
        let isHint = hintCells.contains(position)
        let willClear = previewClearedLines.rows.contains(position.row)
            || previewClearedLines.cols.contains(position.col)

        ZStack {
            if let content {
                BlockView(color: content, cornerRadius: geometry.cellSize * 0.22)
            } else {
                EmptyCellView(
                    cornerRadius: geometry.cellSize * 0.22,
                    isHighlighted: isHint || (isPreview && previewIsValid) || validOrigins.contains(position),
                    isRejected: isPreview && !previewIsValid
                )
            }

            if isPreview, previewIsValid, let piece = engine.selectedPiece {
                BlockView(color: piece.color, cornerRadius: geometry.cellSize * 0.22, isGhost: true)
                    .transition(.opacity)
            }

            // A line that is about to complete lights up along its whole length —
            // the promise of the clear, before the player commits.
            if willClear, previewIsValid {
                RoundedRectangle(cornerRadius: geometry.cellSize * 0.22, style: .continuous)
                    .strokeBorder(theme.accent, lineWidth: 3)
                    .opacity(0.9)
            }
        }
        .frame(width: geometry.cellSize, height: geometry.cellSize)
        .animation(reduceMotion ? nil : .easeOut(duration: 0.12), value: isPreview)
        .accessibilityElement()
        .accessibilityHidden(exploreMode)
        .accessibilityLabel(label(for: position, content: content))
        .accessibilityHint(hint(for: position))
        .accessibilityAddTraits(.isButton)
        .accessibilityFocused($focusedCell, equals: position)
        .accessibilityAction { onActivate(position) }
        .contentShape(Rectangle())
        .onTapGesture { onActivate(position) }
    }

    private func label(for position: GridPosition, content: BlockColor?) -> String {
        var label = Speech.cell(at: position, content: content)
        if engine.selectedPiece != nil {
            let fits = engine.canPlaceSelection(at: position)
            let lines = fits ? engine.linesCompleted(placing: position) : 0
            label += ", " + Speech.placementSuffix(fits: fits, linesCompleted: lines)
        }
        return label
    }

    private func hint(for position: GridPosition) -> String {
        guard engine.selectedPiece != nil else {
            return String(localized: "cell.hint.pickPiece", defaultValue: "Pick up a piece from the tray first.")
        }
        return engine.canPlaceSelection(at: position)
            ? String(localized: "cell.hint.place", defaultValue: "Double tap to place the piece here.")
            : String(localized: "cell.hint.blocked", defaultValue: "The piece in hand does not fit here.")
    }
}
