//
//  BlockView.swift
//  BlockBlast
//

import SwiftUI

/// One filled cell. Colour, pattern, border and glow are four separate identity
/// channels; a player who cannot use one still has three.
struct BlockView: View {
    let color: BlockColor
    var cornerRadius: CGFloat = 6
    /// Ghost preview during a drag.
    var isGhost = false

    @Environment(\.theme) private var theme
    @Environment(GameSettings.self) private var settings

    private var fill: Color {
        settings.visionSimulation.apply(to: theme.color(for: color))
    }

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
        shape
            .fill(fill.opacity(isGhost ? 0.45 : 1))
            .overlay {
                if settings.patternsEnabled {
                    PatternShape(style: color.pattern)
                        .fill(fill.contrastingInk.opacity(theme.patternOpacity * (isGhost ? 0.6 : 1)))
                        // Diagonals and waves are drawn past the edges so they meet
                        // the corners cleanly; the block shape trims them.
                        .clipShape(shape)
                }
            }
            .overlay {
                // A highlight along the top edge keeps blocks readable as separate
                // objects even when neighbours share a colour.
                shape
                    .strokeBorder(
                        LinearGradient(
                            colors: [Color.white.opacity(theme.prefersOpaqueSurfaces ? 0 : 0.35), .clear],
                            startPoint: .top,
                            endPoint: .center
                        ),
                        lineWidth: 1
                    )
            }
            .overlay {
                shape.strokeBorder(theme.blockStroke.opacity(isGhost ? 0.6 : 1), lineWidth: theme.blockStrokeWidth)
            }
            .shadow(
                color: theme.usesGlow ? fill.opacity(isGhost ? 0.2 : 0.65) : .clear,
                radius: theme.usesGlow ? 8 : 0
            )
            .accessibilityHidden(true)
    }
}

/// An empty board cell.
struct EmptyCellView: View {
    var cornerRadius: CGFloat = 6
    var isHighlighted = false
    var isRejected = false

    @Environment(\.theme) private var theme

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
        shape
            .fill(theme.emptyCell)
            .overlay {
                if isRejected {
                    shape.fill(Color.red.opacity(0.25))
                }
            }
            .overlay {
                // A candidate landing spot is marked with an outline and a pip,
                // never a fill — a filled cell always means an occupied cell.
                if isHighlighted {
                    shape.strokeBorder(theme.accent.opacity(0.95), style: StrokeStyle(lineWidth: 2, dash: [4, 3]))
                    Circle()
                        .fill(theme.accent.opacity(0.55))
                        .scaleEffect(0.22)
                } else {
                    shape.strokeBorder(theme.gridLine, lineWidth: 1)
                }
            }
            .accessibilityHidden(true)
    }
}

/// A piece silhouette, used in the tray, the drag layer and the hint overlay.
struct PieceView: View {
    let piece: Piece
    let cellSize: CGFloat
    var spacing: CGFloat = 2
    var isGhost = false

    var body: some View {
        let grid = piece.shape.occupancyGrid()
        VStack(spacing: spacing) {
            ForEach(0..<piece.shape.height, id: \.self) { row in
                HStack(spacing: spacing) {
                    ForEach(0..<piece.shape.width, id: \.self) { col in
                        if grid[row][col] {
                            BlockView(color: piece.color, cornerRadius: cellSize * 0.22, isGhost: isGhost)
                                .frame(width: cellSize, height: cellSize)
                        } else {
                            Color.clear.frame(width: cellSize, height: cellSize)
                        }
                    }
                }
            }
        }
        .accessibilityHidden(true)
    }
}
