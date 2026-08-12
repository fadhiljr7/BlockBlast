//
//  GameOverView.swift
//  BlockBlast
//

import SwiftUI

/// End of a classic run. Undo is offered here too: a run should never end on a
/// misplaced tap that the player could not take back.
struct GameOverView: View {
    let engine: GameEngine
    var onNewGame: () -> Void
    var onUndo: () -> Void
    var onSettings: () -> Void

    @Environment(\.theme) private var theme
    @Environment(GameSettings.self) private var settings
    @AccessibilityFocusState private var focusOnTitle: Bool

    private var isPersonalBest: Bool {
        engine.score >= engine.bestScore && engine.score > 0
    }

    var body: some View {
        ZStack {
            Rectangle()
                .fill(.black.opacity(0.55))
                .ignoresSafeArea()

            VStack(spacing: 18) {
                Text(String(localized: "gameOver.title", defaultValue: "Game over"))
                    .font(.system(.largeTitle, design: .rounded, weight: .bold))
                    .foregroundStyle(theme.textPrimary)
                    .accessibilityFocused($focusOnTitle)
                    .accessibilityAddTraits(.isHeader)

                VStack(spacing: 4) {
                    Text(engine.score.formatted(.number))
                        .font(.system(size: 56, weight: .heavy, design: .rounded))
                        .foregroundStyle(theme.accent)
                    Text(String(localized: "gameOver.finalScore", defaultValue: "Final score"))
                        .font(.subheadline)
                        .foregroundStyle(theme.textSecondary)
                }
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(
                    String(
                        format: String(localized: "gameOver.score.label", defaultValue: "Final score %1$@"),
                        Speech.number(engine.score)
                    )
                )

                if isPersonalBest {
                    Label(
                        String(localized: "gameOver.personalBest", defaultValue: "New personal best"),
                        systemImage: "trophy.fill"
                    )
                    .font(.headline)
                    .foregroundStyle(theme.accent)
                }

                HStack(spacing: 22) {
                    statistic(
                        value: engine.piecesPlaced.formatted(.number),
                        label: String(localized: "gameOver.pieces", defaultValue: "Pieces")
                    )
                    statistic(
                        value: engine.linesClearedTotal.formatted(.number),
                        label: String(localized: "gameOver.lines", defaultValue: "Lines")
                    )
                    statistic(
                        value: max(engine.bestScore, settings.bestScore).formatted(.number),
                        label: String(localized: "hud.best", defaultValue: "Best")
                    )
                }

                VStack(spacing: 10) {
                    Button(action: onNewGame) {
                        Text(String(localized: "action.newGame", defaultValue: "New game"))
                            .font(.headline)
                            .frame(maxWidth: .infinity, minHeight: 50)
                            // Dark ink on the accent fill: white on yellow fails
                            // contrast in every theme that uses a bright accent.
                            .foregroundStyle(theme.accent.contrastingInk)
                            .background(theme.accent, in: Capsule())
                    }
                    .buttonStyle(.plain)

                    if engine.canUndo {
                        Button(action: onUndo) {
                            Text(String(localized: "gameOver.undo", defaultValue: "Take back last move"))
                                .frame(maxWidth: .infinity, minHeight: 44)
                        }
                        .buttonStyle(.bordered)
                        .accessibilityHint(
                            String(
                                localized: "gameOver.undo.hint",
                                defaultValue: "Restores the board to before your last placement and continues the run."
                            )
                        )
                    }

                    Button(action: onSettings) {
                        Text(String(localized: "action.settings", defaultValue: "Settings"))
                            .frame(maxWidth: .infinity, minHeight: 44)
                    }
                    .buttonStyle(.bordered)

                    Button {
                        engine.setMode(.zen)
                    } label: {
                        Text(String(localized: "gameOver.tryZen", defaultValue: "Play Zen mode instead"))
                            .frame(maxWidth: .infinity, minHeight: 44)
                    }
                    .buttonStyle(.bordered)
                    .accessibilityHint(
                        String(localized: "mode.zen.detail", defaultValue: "No timer, no game over. The board makes room when you get stuck.")
                    )
                }
                .foregroundStyle(theme.textPrimary)
            }
            .padding(28)
            .frame(maxWidth: 420)
            .background(
                RoundedRectangle(cornerRadius: 28, style: .continuous)
                    .fill(theme.boardSurface)
                    .overlay {
                        RoundedRectangle(cornerRadius: 28, style: .continuous)
                            .strokeBorder(theme.gridLine, lineWidth: 1)
                    }
            )
            .padding(24)
        }
        .accessibilityAddTraits(.isModal)
        .onAppear { focusOnTitle = true }
    }

    private func statistic(value: String, label: String) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(.title3, design: .rounded, weight: .bold))
                .foregroundStyle(theme.textPrimary)
            Text(label)
                .font(.caption)
                .foregroundStyle(theme.textSecondary)
        }
        .accessibilityElement(children: .combine)
    }
}
