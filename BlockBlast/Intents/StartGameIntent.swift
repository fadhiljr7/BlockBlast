//
//  StartGameIntent.swift
//  BlockBlast
//

import AppIntents
import Foundation
import Observation

/// Bridges Siri and the Shortcuts app to the running game. The intent only records
/// intent; the scene applies it, so a voice command and a button press take the
/// same path through the engine.
@Observable
@MainActor
final class GameLaunchRouter {
    static let shared = GameLaunchRouter()

    struct StartRequest: Equatable {
        let mode: GameMode
        let id = UUID()
    }

    var pendingStart: StartRequest?

    private init() {}
}

nonisolated extension GameMode: AppEnum {
    static var typeDisplayRepresentation: TypeDisplayRepresentation {
        TypeDisplayRepresentation(name: "Game mode")
    }

    static var caseDisplayRepresentations: [GameMode: DisplayRepresentation] {
        [
            .classic: DisplayRepresentation(title: "Classic"),
            .zen: DisplayRepresentation(title: "Zen"),
        ]
    }
}

struct StartGameIntent: AppIntent {
    static let title: LocalizedStringResource = "Start a new game"
    static let description = IntentDescription("Opens Block Blast and deals a fresh board.")
    static let openAppWhenRun = true

    @Parameter(title: "Mode", default: .classic)
    var mode: GameMode

    init() {}

    init(mode: GameMode) {
        self.mode = mode
    }

    @MainActor
    func perform() async throws -> some IntentResult {
        GameLaunchRouter.shared.pendingStart = GameLaunchRouter.StartRequest(mode: mode)
        return .result()
    }
}

struct BlockBlastShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: StartGameIntent(mode: .classic),
            phrases: [
                "Start \(.applicationName)",
                "Play \(.applicationName)",
                "New game in \(.applicationName)",
                "Mulai \(.applicationName)",
                "Main \(.applicationName)",
                "Permainan baru di \(.applicationName)",
            ],
            shortTitle: "Start a new game",
            systemImageName: "play.fill"
        )
        AppShortcut(
            intent: StartGameIntent(mode: .zen),
            phrases: [
                "Start Zen mode in \(.applicationName)",
                "Relax with \(.applicationName)",
                "Mulai mode Zen di \(.applicationName)",
                "Santai dengan \(.applicationName)",
            ],
            shortTitle: "Start Zen mode",
            systemImageName: "leaf.fill"
        )
    }
}
