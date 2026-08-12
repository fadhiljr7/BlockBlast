//
//  BlockBlastApp.swift
//  BlockBlast
//

import SwiftUI

@main
struct BlockBlastApp: App {
    @State private var settings: GameSettings
    @State private var engine: GameEngine
    @State private var feedback: FeedbackCoordinator
    @State private var router = GameLaunchRouter.shared

    init() {
        let settings = GameSettings()
        let engine = GameEngine(mode: settings.preferredMode, bestScore: settings.bestScore)
        _settings = State(initialValue: settings)
        _engine = State(initialValue: engine)
        _feedback = State(
            initialValue: FeedbackCoordinator(
                audio: GameAudioEngine(),
                haptics: HapticsEngine(),
                settings: settings
            )
        )
    }

    var body: some Scene {
        WindowGroup {
            GameView(engine: engine)
                .environment(settings)
                .environment(feedback)
                .onChange(of: router.pendingStart) { _, request in
                    guard let request else { return }
                    engine.newGame(mode: request.mode)
                    router.pendingStart = nil
                }
        }
    }
}
