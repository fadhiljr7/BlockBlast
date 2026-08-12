//
//  Theme.swift
//  BlockBlast
//

import SwiftUI

enum ThemeID: String, CaseIterable, Codable, Identifiable, Sendable {
    case classic, neon, pastel, highContrast, nature, minimal

    var id: String { rawValue }

    var localizedName: String {
        switch self {
        case .classic: String(localized: "theme.classic", defaultValue: "Classic")
        case .neon: String(localized: "theme.neon", defaultValue: "Neon Glow")
        case .pastel: String(localized: "theme.pastel", defaultValue: "Pastel Soft")
        case .highContrast: String(localized: "theme.highContrast", defaultValue: "High Contrast")
        case .nature: String(localized: "theme.nature", defaultValue: "Nature")
        case .minimal: String(localized: "theme.minimal", defaultValue: "Minimal")
        }
    }

    var localizedDescription: String {
        switch self {
        case .classic: String(localized: "theme.classic.detail", defaultValue: "Bright, saturated blocks.")
        case .neon: String(localized: "theme.neon.detail", defaultValue: "Glowing blocks on deep black.")
        case .pastel: String(localized: "theme.pastel.detail", defaultValue: "Soft, low-intensity colours.")
        case .highContrast: String(localized: "theme.highContrast.detail", defaultValue: "Maximum contrast, solid fills, thick borders.")
        case .nature: String(localized: "theme.nature.detail", defaultValue: "Wood, stone and leaf tones.")
        case .minimal: String(localized: "theme.minimal.detail", defaultValue: "Monochrome — pattern carries all identity.")
        }
    }
}

/// A resolved palette. Themes only supply colour and weight; identity always also
/// travels through pattern, so `minimal` (one hue for every block) stays playable.
struct Theme: Equatable {
    var id: ThemeID
    var background: [Color]
    var boardSurface: Color
    var emptyCell: Color
    var gridLine: Color
    var textPrimary: Color
    var textSecondary: Color
    var accent: Color
    var blockPalette: [BlockColor: Color]
    /// Opacity of the pattern overlay drawn on every block.
    var patternOpacity: Double
    /// Stroke around each block, widened in high-contrast modes.
    var blockStrokeWidth: Double
    var blockStroke: Color
    var usesGlow: Bool
    var prefersOpaqueSurfaces: Bool

    func color(for block: BlockColor) -> Color {
        blockPalette[block] ?? .gray
    }

    static func resolve(_ id: ThemeID, increaseContrast: Bool = false) -> Theme {
        let theme: Theme = switch id {
        case .classic: .classic
        case .neon: .neon
        case .pastel: .pastel
        case .highContrast: .highContrast
        case .nature: .nature
        case .minimal: .minimal
        }
        guard increaseContrast, id != .highContrast else { return theme }
        return theme.contrastBoosted()
    }

    /// Applied when the system reports Increase Contrast: drop transparency,
    /// thicken separations, keep hues.
    private func contrastBoosted() -> Theme {
        var boosted = self
        boosted.blockStrokeWidth = max(blockStrokeWidth, 3)
        boosted.blockStroke = .white
        boosted.patternOpacity = min(patternOpacity + 0.2, 1.0)
        boosted.gridLine = gridLine.opacity(1.0)
        boosted.prefersOpaqueSurfaces = true
        return boosted
    }
}

extension Theme {
    static let classic = Theme(
        id: .classic,
        background: [Color(red: 0.09, green: 0.12, blue: 0.24), Color(red: 0.05, green: 0.06, blue: 0.14)],
        boardSurface: Color(red: 0.13, green: 0.17, blue: 0.32),
        emptyCell: Color(red: 0.18, green: 0.23, blue: 0.40),
        gridLine: Color.white.opacity(0.10),
        textPrimary: .white,
        textSecondary: Color.white.opacity(0.7),
        accent: Color(red: 1.0, green: 0.78, blue: 0.24),
        blockPalette: [
            .red: Color(red: 0.93, green: 0.26, blue: 0.31),
            .blue: Color(red: 0.22, green: 0.51, blue: 0.96),
            .green: Color(red: 0.20, green: 0.73, blue: 0.36),
            .yellow: Color(red: 0.98, green: 0.80, blue: 0.15),
            .purple: Color(red: 0.60, green: 0.33, blue: 0.90),
            .orange: Color(red: 0.98, green: 0.53, blue: 0.16),
            .cyan: Color(red: 0.16, green: 0.79, blue: 0.85),
        ],
        patternOpacity: 0.40,
        blockStrokeWidth: 2,
        blockStroke: Color.white.opacity(0.85),
        usesGlow: false,
        prefersOpaqueSurfaces: false
    )

    static let neon = Theme(
        id: .neon,
        background: [Color(red: 0.03, green: 0.02, blue: 0.08), .black],
        boardSurface: Color(red: 0.06, green: 0.05, blue: 0.12),
        emptyCell: Color(red: 0.11, green: 0.09, blue: 0.20),
        gridLine: Color(red: 0.45, green: 0.30, blue: 0.95).opacity(0.35),
        textPrimary: Color(red: 0.90, green: 0.95, blue: 1.0),
        textSecondary: Color(red: 0.65, green: 0.60, blue: 0.95),
        accent: Color(red: 0.35, green: 1.0, blue: 0.85),
        blockPalette: [
            .red: Color(red: 1.0, green: 0.20, blue: 0.45),
            .blue: Color(red: 0.25, green: 0.60, blue: 1.0),
            .green: Color(red: 0.25, green: 1.0, blue: 0.50),
            .yellow: Color(red: 1.0, green: 0.95, blue: 0.30),
            .purple: Color(red: 0.75, green: 0.35, blue: 1.0),
            .orange: Color(red: 1.0, green: 0.60, blue: 0.20),
            .cyan: Color(red: 0.20, green: 1.0, blue: 1.0),
        ],
        patternOpacity: 0.35,
        blockStrokeWidth: 2,
        blockStroke: Color.white.opacity(0.9),
        usesGlow: true,
        prefersOpaqueSurfaces: false
    )

    static let pastel = Theme(
        id: .pastel,
        background: [Color(red: 0.98, green: 0.96, blue: 0.94), Color(red: 0.93, green: 0.92, blue: 0.97)],
        boardSurface: Color(red: 0.96, green: 0.94, blue: 0.97),
        emptyCell: Color(red: 0.90, green: 0.89, blue: 0.94),
        gridLine: Color.black.opacity(0.08),
        textPrimary: Color(red: 0.20, green: 0.18, blue: 0.28),
        textSecondary: Color(red: 0.42, green: 0.40, blue: 0.52),
        accent: Color(red: 0.55, green: 0.45, blue: 0.85),
        blockPalette: [
            .red: Color(red: 0.96, green: 0.62, blue: 0.62),
            .blue: Color(red: 0.60, green: 0.73, blue: 0.94),
            .green: Color(red: 0.62, green: 0.86, blue: 0.68),
            .yellow: Color(red: 0.97, green: 0.88, blue: 0.60),
            .purple: Color(red: 0.79, green: 0.68, blue: 0.93),
            .orange: Color(red: 0.98, green: 0.76, blue: 0.55),
            .cyan: Color(red: 0.60, green: 0.87, blue: 0.90),
        ],
        patternOpacity: 0.45,
        blockStrokeWidth: 2,
        blockStroke: Color.black.opacity(0.45),
        usesGlow: false,
        prefersOpaqueSurfaces: false
    )

    static let highContrast = Theme(
        id: .highContrast,
        background: [.black, .black],
        boardSurface: .black,
        emptyCell: Color(white: 0.12),
        gridLine: Color.white.opacity(0.85),
        textPrimary: .white,
        textSecondary: Color(white: 0.85),
        accent: Color(red: 1.0, green: 0.92, blue: 0.0),
        blockPalette: [
            .red: Color(red: 1.0, green: 0.25, blue: 0.20),
            .blue: Color(red: 0.30, green: 0.60, blue: 1.0),
            .green: Color(red: 0.20, green: 0.95, blue: 0.35),
            .yellow: Color(red: 1.0, green: 0.92, blue: 0.0),
            .purple: Color(red: 0.78, green: 0.45, blue: 1.0),
            .orange: Color(red: 1.0, green: 0.60, blue: 0.0),
            .cyan: Color(red: 0.0, green: 0.95, blue: 1.0),
        ],
        patternOpacity: 0.85,
        blockStrokeWidth: 3,
        blockStroke: .white,
        usesGlow: false,
        prefersOpaqueSurfaces: true
    )

    static let nature = Theme(
        id: .nature,
        background: [Color(red: 0.16, green: 0.14, blue: 0.11), Color(red: 0.10, green: 0.09, blue: 0.07)],
        boardSurface: Color(red: 0.24, green: 0.20, blue: 0.15),
        emptyCell: Color(red: 0.31, green: 0.26, blue: 0.20),
        gridLine: Color(red: 0.55, green: 0.45, blue: 0.32).opacity(0.4),
        textPrimary: Color(red: 0.96, green: 0.93, blue: 0.86),
        textSecondary: Color(red: 0.78, green: 0.72, blue: 0.62),
        accent: Color(red: 0.85, green: 0.68, blue: 0.35),
        blockPalette: [
            .red: Color(red: 0.72, green: 0.28, blue: 0.24),
            .blue: Color(red: 0.32, green: 0.48, blue: 0.62),
            .green: Color(red: 0.36, green: 0.55, blue: 0.31),
            .yellow: Color(red: 0.85, green: 0.72, blue: 0.36),
            .purple: Color(red: 0.48, green: 0.36, blue: 0.55),
            .orange: Color(red: 0.80, green: 0.52, blue: 0.28),
            .cyan: Color(red: 0.40, green: 0.66, blue: 0.64),
        ],
        patternOpacity: 0.35,
        blockStrokeWidth: 2,
        blockStroke: Color(red: 0.96, green: 0.93, blue: 0.86).opacity(0.75),
        usesGlow: false,
        prefersOpaqueSurfaces: false
    )

    /// Every block is the same near-white. Pattern is the only identity channel —
    /// the strongest possible check that the game never leans on hue.
    static let minimal = Theme(
        id: .minimal,
        background: [Color(white: 0.07), Color(white: 0.03)],
        boardSurface: Color(white: 0.10),
        emptyCell: Color(white: 0.16),
        gridLine: Color.white.opacity(0.20),
        textPrimary: .white,
        textSecondary: Color(white: 0.72),
        accent: .white,
        blockPalette: Dictionary(uniqueKeysWithValues: BlockColor.allCases.map { ($0, Color(white: 0.92)) }),
        patternOpacity: 1.0,
        blockStrokeWidth: 2,
        blockStroke: Color(white: 0.10),
        usesGlow: false,
        prefersOpaqueSurfaces: true
    )
}

private struct ThemeKey: EnvironmentKey {
    static let defaultValue = Theme.classic
}

extension EnvironmentValues {
    var theme: Theme {
        get { self[ThemeKey.self] }
        set { self[ThemeKey.self] = newValue }
    }
}
