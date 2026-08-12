//
//  BlockColor.swift
//  BlockBlast
//

import SwiftUI
import UIKit

/// The seven block identities. A colour is never the only carrier of meaning:
/// every case owns a distinct pattern, a distinct spoken name and a distinct
/// audio timbre, so the game stays fully playable with no colour perception at all.
nonisolated enum BlockColor: String, CaseIterable, Codable, Hashable, Identifiable, Sendable {
    case red, blue, green, yellow, purple, orange, cyan

    var id: String { rawValue }

    /// The pattern drawn on top of the fill. This is the primary identity channel
    /// for colour-blind players, and it is always drawn — never an opt-in extra.
    var pattern: PatternStyle {
        switch self {
        case .red: .dots
        case .blue: .horizontalStripes
        case .green: .verticalStripes
        case .yellow: .crosshatch
        case .purple: .diagonalStripes
        case .orange: .checkerboard
        case .cyan: .waves
        }
    }

    var localizedName: String {
        switch self {
        case .red: String(localized: "color.red", defaultValue: "red")
        case .blue: String(localized: "color.blue", defaultValue: "blue")
        case .green: String(localized: "color.green", defaultValue: "green")
        case .yellow: String(localized: "color.yellow", defaultValue: "yellow")
        case .purple: String(localized: "color.purple", defaultValue: "purple")
        case .orange: String(localized: "color.orange", defaultValue: "orange")
        case .cyan: String(localized: "color.cyan", defaultValue: "cyan")
        }
    }

    /// Spoken as "colour with pattern" so two players describing the same board agree.
    var accessibilityDescription: String {
        String(
            format: String(localized: "block.description", defaultValue: "%1$@ with %2$@"),
            localizedName,
            pattern.localizedName
        )
    }

    /// Semitone offset used by the audio engine so each colour has its own timbre.
    var toneOffset: Int {
        switch self {
        case .red: 0
        case .blue: 2
        case .green: 4
        case .yellow: 5
        case .purple: 7
        case .orange: 9
        case .cyan: 11
        }
    }
}

/// The tactile-looking overlay that identifies a block without relying on hue.
nonisolated enum PatternStyle: String, CaseIterable, Codable, Hashable, Sendable {
    case dots, horizontalStripes, verticalStripes, crosshatch, diagonalStripes, checkerboard, waves

    var localizedName: String {
        switch self {
        case .dots: String(localized: "pattern.dots", defaultValue: "dots")
        case .horizontalStripes: String(localized: "pattern.horizontalStripes", defaultValue: "horizontal stripes")
        case .verticalStripes: String(localized: "pattern.verticalStripes", defaultValue: "vertical stripes")
        case .crosshatch: String(localized: "pattern.crosshatch", defaultValue: "crosshatch")
        case .diagonalStripes: String(localized: "pattern.diagonalStripes", defaultValue: "diagonal stripes")
        case .checkerboard: String(localized: "pattern.checkerboard", defaultValue: "checkerboard")
        case .waves: String(localized: "pattern.waves", defaultValue: "waves")
        }
    }

    /// Compact glyph used in dense UI (the tray legend, the settings preview).
    var glyph: String {
        switch self {
        case .dots: "●●●"
        case .horizontalStripes: "≡≡≡"
        case .verticalStripes: "|||"
        case .crosshatch: "✚✚✚"
        case .diagonalStripes: "///"
        case .checkerboard: "▦▦▦"
        case .waves: "〜〜〜"
        }
    }
}

/// Colour-vision simulation used both by the settings preview and, when the player
/// asks for it, by the live board so they can play in a palette they can verify.
nonisolated enum VisionSimulation: String, CaseIterable, Codable, Identifiable, Sendable {
    case none, deuteranopia, protanopia, tritanopia, achromatopsia

    var id: String { rawValue }

    var localizedName: String {
        switch self {
        case .none: String(localized: "vision.none", defaultValue: "Off")
        case .deuteranopia: String(localized: "vision.deuteranopia", defaultValue: "Deuteranopia")
        case .protanopia: String(localized: "vision.protanopia", defaultValue: "Protanopia")
        case .tritanopia: String(localized: "vision.tritanopia", defaultValue: "Tritanopia")
        case .achromatopsia: String(localized: "vision.achromatopsia", defaultValue: "Achromatopsia")
        }
    }

    /// Row-major 3×3 matrix applied to linear RGB. Values are the widely used
    /// Brettel/Viénot approximations for dichromatic vision.
    private var matrix: [Double]? {
        switch self {
        case .none:
            nil
        case .deuteranopia:
            [0.625, 0.375, 0.0,
             0.700, 0.300, 0.0,
             0.0,   0.300, 0.700]
        case .protanopia:
            [0.567, 0.433, 0.0,
             0.558, 0.442, 0.0,
             0.0,   0.242, 0.758]
        case .tritanopia:
            [0.950, 0.050, 0.0,
             0.0,   0.433, 0.567,
             0.0,   0.475, 0.525]
        case .achromatopsia:
            [0.299, 0.587, 0.114,
             0.299, 0.587, 0.114,
             0.299, 0.587, 0.114]
        }
    }

    func apply(to color: Color) -> Color {
        guard let matrix else { return color }
        let components = UIColor(color).rgbaComponents
        let r = components.red, g = components.green, b = components.blue
        return Color(
            .sRGB,
            red: (matrix[0] * r + matrix[1] * g + matrix[2] * b).clampedToUnit,
            green: (matrix[3] * r + matrix[4] * g + matrix[5] * b).clampedToUnit,
            blue: (matrix[6] * r + matrix[7] * g + matrix[8] * b).clampedToUnit,
            opacity: components.alpha
        )
    }
}

nonisolated extension Double {
    var clampedToUnit: Double { min(max(self, 0), 1) }
}

nonisolated extension UIColor {
    var rgbaComponents: (red: Double, green: Double, blue: Double, alpha: Double) {
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        getRed(&r, green: &g, blue: &b, alpha: &a)
        return (Double(r), Double(g), Double(b), Double(a))
    }
}
