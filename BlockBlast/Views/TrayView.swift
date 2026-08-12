//
//  TrayView.swift
//  BlockBlast
//

import SwiftUI

/// The three-piece tray. Every slot is simultaneously a drag source, a tap target
/// and a VoiceOver button, so no input style is second-class.
struct TrayView: View {
    let engine: GameEngine
    let slotWidth: CGFloat
    let cellSize: CGFloat
    var draggingSlot: Int?
    var onTap: (Int) -> Void
    var onDragChanged: (Int, CGPoint) -> Void
    var onDragEnded: (Int, CGPoint) -> Void
    var onAutoPlace: (Int) -> Void

    @Environment(\.theme) private var theme
    @Environment(GameSettings.self) private var settings
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var isBreathing = false

    /// The idle "breathe" that marks the tray as the live, waiting element.
    /// Off under Reduce Motion, and off whenever the player switched it off.
    private var idleScale: CGFloat {
        settings.idleAnimationEnabled && !reduceMotion && isBreathing ? 1.03 : 1.0
    }

    var body: some View {
        HStack(spacing: 12) {
            ForEach(0..<GameEngine.traySize, id: \.self) { slot in
                slotView(slot)
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(String(localized: "tray.label", defaultValue: "Piece tray"))
        .onAppear {
            guard settings.idleAnimationEnabled, !reduceMotion else { return }
            withAnimation(.easeInOut(duration: 2.4).repeatForever(autoreverses: true)) {
                isBreathing = true
            }
        }
    }

    @ViewBuilder
    private func slotView(_ slot: Int) -> some View {
        let piece = engine.tray.indices.contains(slot) ? engine.tray[slot] : nil
        let isSelected = engine.selectedSlot == slot
        let isDragging = draggingSlot == slot
        let placements = engine.validOrigins(forSlot: slot).count
        let isDead = piece != nil && placements == 0

        RoundedRectangle(cornerRadius: 16, style: .continuous)
            .fill(theme.boardSurface.opacity(theme.prefersOpaqueSurfaces ? 1 : 0.65))
            .overlay {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(
                        isSelected ? theme.accent : theme.gridLine,
                        lineWidth: isSelected ? 3 : 1
                    )
            }
            .overlay {
                if let piece {
                    PieceView(piece: piece, cellSize: cellSize)
                        .opacity(isDragging ? 0.25 : 1)
                        .scaleEffect(isSelected && !isDragging ? 1.06 : idleScale)
                        // A piece with nowhere to go is dimmed and struck through,
                        // so a dead tray is visible before the game ends.
                        .opacity(isDead ? 0.35 : 1)
                        .overlay {
                            if isDead {
                                Image(systemName: "xmark")
                                    .font(.system(size: cellSize, weight: .bold))
                                    .foregroundStyle(theme.textSecondary)
                            }
                        }
                        .animation(reduceMotion ? nil : .spring(duration: 0.25), value: isSelected)
                }
            }
            .frame(width: slotWidth, height: slotWidth)
            .contentShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .onTapGesture { onTap(slot) }
            .gesture(dragGesture(slot: slot), isEnabled: piece != nil && settings.placementMode == .drag)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(Speech.traySlot(index: slot, piece: piece))
            .accessibilityHint(piece == nil ? "" : Speech.trayHint(placementCount: placements))
            .accessibilityAddTraits(isSelected ? [.isButton, .isSelected] : .isButton)
            .accessibilityAction { onTap(slot) }
            .accessibilityActions {
                if piece != nil, placements > 0 {
                    Button(String(localized: "action.autoPlace", defaultValue: "Place at the best spot")) {
                        onAutoPlace(slot)
                    }
                }
            }
    }

    private func dragGesture(slot: Int) -> some Gesture {
        DragGesture(minimumDistance: 2, coordinateSpace: .named(GameView.coordinateSpace))
            .onChanged { value in onDragChanged(slot, value.location) }
            .onEnded { value in onDragEnded(slot, value.location) }
    }
}
