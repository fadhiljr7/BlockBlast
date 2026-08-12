//
//  PatternShape.swift
//  BlockBlast
//

import SwiftUI
import UIKit

/// The pattern overlay that gives every block a non-colour identity. Drawn as a
/// filled path so one `.fill()` renders every style, and so it survives
/// Increase Contrast without turning to mush.
struct PatternShape: Shape {
    let style: PatternStyle

    func path(in rect: CGRect) -> Path {
        let unit = min(rect.width, rect.height)
        switch style {
        case .dots:
            return dots(in: rect, unit: unit)
        case .horizontalStripes:
            return stripes(in: rect, unit: unit, vertical: false)
        case .verticalStripes:
            return stripes(in: rect, unit: unit, vertical: true)
        case .crosshatch:
            return crosshatch(in: rect, unit: unit)
        case .diagonalStripes:
            return diagonals(in: rect, unit: unit)
        case .checkerboard:
            return checkerboard(in: rect, unit: unit)
        case .waves:
            return waves(in: rect, unit: unit)
        }
    }

    private func dots(in rect: CGRect, unit: CGFloat) -> Path {
        var path = Path()
        let radius = unit * 0.11
        let positions: [CGPoint] = [
            CGPoint(x: 0.30, y: 0.30), CGPoint(x: 0.70, y: 0.30),
            CGPoint(x: 0.30, y: 0.70), CGPoint(x: 0.70, y: 0.70),
        ]
        for position in positions {
            let center = CGPoint(x: rect.minX + rect.width * position.x, y: rect.minY + rect.height * position.y)
            path.addEllipse(in: CGRect(x: center.x - radius, y: center.y - radius, width: radius * 2, height: radius * 2))
        }
        return path
    }

    private func stripes(in rect: CGRect, unit: CGFloat, vertical: Bool) -> Path {
        var path = Path()
        let thickness = unit * 0.12
        let count = 3
        for index in 0..<count {
            let fraction = (CGFloat(index) + 0.5) / CGFloat(count)
            if vertical {
                let x = rect.minX + rect.width * fraction - thickness / 2
                path.addRect(CGRect(x: x, y: rect.minY + rect.height * 0.12, width: thickness, height: rect.height * 0.76))
            } else {
                let y = rect.minY + rect.height * fraction - thickness / 2
                path.addRect(CGRect(x: rect.minX + rect.width * 0.12, y: y, width: rect.width * 0.76, height: thickness))
            }
        }
        return path
    }

    private func crosshatch(in rect: CGRect, unit: CGFloat) -> Path {
        var path = Path()
        let thickness = unit * 0.10
        let arm = unit * 0.20
        let centers: [CGPoint] = [
            CGPoint(x: 0.32, y: 0.32), CGPoint(x: 0.68, y: 0.32),
            CGPoint(x: 0.32, y: 0.68), CGPoint(x: 0.68, y: 0.68),
        ]
        for center in centers {
            let point = CGPoint(x: rect.minX + rect.width * center.x, y: rect.minY + rect.height * center.y)
            path.addRect(CGRect(x: point.x - arm / 2, y: point.y - thickness / 2, width: arm, height: thickness))
            path.addRect(CGRect(x: point.x - thickness / 2, y: point.y - arm / 2, width: thickness, height: arm))
        }
        return path
    }

    private func diagonals(in rect: CGRect, unit: CGFloat) -> Path {
        var path = Path()
        let thickness = unit * 0.13
        let spacing = unit * 0.34
        var offset = -rect.height
        while offset < rect.width + rect.height {
            var line = Path()
            line.move(to: CGPoint(x: rect.minX + offset, y: rect.maxY))
            line.addLine(to: CGPoint(x: rect.minX + offset + rect.height, y: rect.minY))
            path.addPath(line.strokedPath(StrokeStyle(lineWidth: thickness, lineCap: .butt)))
            offset += spacing
        }
        return path
    }

    private func checkerboard(in rect: CGRect, unit: CGFloat) -> Path {
        var path = Path()
        let divisions = 4
        let size = rect.width / CGFloat(divisions)
        let height = rect.height / CGFloat(divisions)
        for row in 0..<divisions {
            for col in 0..<divisions where (row + col).isMultiple(of: 2) {
                path.addRect(
                    CGRect(
                        x: rect.minX + CGFloat(col) * size,
                        y: rect.minY + CGFloat(row) * height,
                        width: size,
                        height: height
                    )
                )
            }
        }
        return path
    }

    private func waves(in rect: CGRect, unit: CGFloat) -> Path {
        var path = Path()
        let thickness = unit * 0.10
        let amplitude = rect.height * 0.09
        for index in 0..<3 {
            let baseline = rect.minY + rect.height * (CGFloat(index) + 0.5) / 3
            var wave = Path()
            wave.move(to: CGPoint(x: rect.minX + rect.width * 0.1, y: baseline))
            let steps = 12
            for step in 1...steps {
                let progress = CGFloat(step) / CGFloat(steps)
                let x = rect.minX + rect.width * (0.1 + 0.8 * progress)
                let y = baseline + sin(progress * .pi * 2) * amplitude
                wave.addLine(to: CGPoint(x: x, y: y))
            }
            path.addPath(wave.strokedPath(StrokeStyle(lineWidth: thickness, lineCap: .round, lineJoin: .round)))
        }
        return path
    }
}

extension Color {
    /// Relative luminance, used to pick a pattern ink that stays legible on any
    /// block colour in any theme.
    var estimatedLuminance: Double {
        let components = UIColor(self).rgbaComponents
        func linear(_ value: Double) -> Double {
            value <= 0.03928 ? value / 12.92 : pow((value + 0.055) / 1.055, 2.4)
        }
        return 0.2126 * linear(components.red) + 0.7152 * linear(components.green) + 0.0722 * linear(components.blue)
    }

    var contrastingInk: Color {
        estimatedLuminance > 0.45 ? Color.black.opacity(0.75) : Color.white.opacity(0.92)
    }
}
