//
//  GameView.swift
//  BlockBlast
//

import SwiftUI

/// The playfield. Owns the three input routes (drag, tap-tap, dwell), the audio
/// explore layer, and the visual effects — all of them driving the same engine.
struct GameView: View {
    static let coordinateSpace = "blockblast.game"
    /// How far above the finger the dragged piece floats, so a thumb never hides
    /// the cells it is about to fill.
    private static let dragLift: CGFloat = 64

    let engine: GameEngine

    @Environment(GameSettings.self) private var settings
    @Environment(FeedbackCoordinator.self) private var feedback
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.colorSchemeContrast) private var colorSchemeContrast
    @Environment(\.scenePhase) private var scenePhase

    @State private var boardGeometry = BoardGeometry.zero
    @State private var dragSlot: Int?
    @State private var dragLocation: CGPoint = .zero
    @State private var previewOrigin: GridPosition?
    @State private var lastPreviewValid: Bool?
    @State private var hint: (slot: Int, origin: GridPosition)?
    @State private var exploreMode = false
    @State private var lastExplored: GridPosition?
    @State private var dwellTarget: GridPosition?
    @State private var dwellProgress: CGFloat = 0
    @State private var dwellTask: Task<Void, Never>?
    @State private var burst: ClearBurst?
    @State private var ripple: Ripple?
    @State private var comboBanner: Int?
    @State private var showSettings = false

    @AccessibilityFocusState private var focusedCell: GridPosition?

    private var theme: Theme {
        Theme.resolve(
            settings.theme,
            increaseContrast: settings.forceHighContrast || colorSchemeContrast == .increased
        )
    }

    var body: some View {
        GeometryReader { proxy in
            let metrics = Metrics(size: proxy.size)
            ZStack {
                backgroundLayer
                contentLayer(metrics)
                effectsLayer
                dragLayer
            }
            .coordinateSpace(.named(Self.coordinateSpace))
        }
        .environment(\.theme, theme)
        .background(theme.background.first ?? .black)
        .sheet(isPresented: $showSettings) {
            SettingsView(engine: engine)
                .environment(\.theme, theme)
        }
        .overlay {
            if engine.isGameOver {
                GameOverView(engine: engine, onNewGame: newGame, onUndo: undo, onSettings: { showSettings = true })
                    .environment(\.theme, theme)
                    .transition(reduceMotion ? .opacity : .opacity.combined(with: .scale(scale: 0.95)))
            }
        }
        .animation(reduceMotion ? nil : .spring(duration: 0.35), value: engine.isGameOver)
        .onChange(of: engine.lastEvent) { _, event in
            guard let event else { return }
            feedback.handle(event, engine: engine)
            engine.consumeEvent()
        }
        .onChange(of: engine.bestScore) { _, best in
            settings.bestScore = max(settings.bestScore, best)
        }
        .onChange(of: focusedCell) { _, cell in
            guard let cell else { return }
            feedback.exploreCell(cell, board: engine.board)
            if settings.placementMode == .dwell, engine.selectedPiece != nil {
                armDwell(at: cell)
            }
        }
        .onChange(of: settings.soundPack) { _, _ in feedback.sync() }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active { feedback.activate() } else { feedback.deactivate() }
        }
        .onAppear { feedback.activate() }
    }

    // MARK: - Layers

    private var backgroundLayer: some View {
        LinearGradient(colors: theme.background, startPoint: .top, endPoint: .bottom)
            .ignoresSafeArea()
    }

    @ViewBuilder
    private func contentLayer(_ metrics: Metrics) -> some View {
        if metrics.isWide {
            HStack(alignment: .center, spacing: 24) {
                boardStack(metrics)
                VStack(spacing: 20) {
                    header
                    tray(metrics)
                    Spacer(minLength: 0)
                }
                .frame(maxWidth: metrics.sideColumnWidth)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
        } else {
            VStack(spacing: metrics.verticalSpacing) {
                header
                boardStack(metrics)
                tray(metrics)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
        }
    }

    private func boardStack(_ metrics: Metrics) -> some View {
        BoardView(
            engine: engine,
            geometry: boardGeometry,
            previewCells: previewCellSet,
            previewIsValid: previewIsValid,
            previewClearedLines: previewClearedLines,
            hintCells: hintCells,
            exploreMode: exploreMode,
            onActivate: activateCell,
            onGridFrameChange: { frame in
                boardGeometry = BoardGeometry(cellSize: metrics.cellSize, spacing: metrics.spacing, frame: frame)
            },
            focusedCell: $focusedCell
        )
        .frame(width: metrics.boardSide, height: metrics.boardSide)
        .overlay { dwellIndicator }
        .gesture(exploreDrag, isEnabled: exploreMode)
        .simultaneousGesture(exploreTripleTap, isEnabled: exploreMode)
    }

    private func tray(_ metrics: Metrics) -> some View {
        TrayView(
            engine: engine,
            slotWidth: metrics.traySlot,
            cellSize: metrics.trayCell,
            draggingSlot: dragSlot,
            onTap: pickUp,
            onDragChanged: handleDragChanged,
            onDragEnded: handleDragEnded,
            onAutoPlace: autoPlace
        )
    }

    @ViewBuilder
    private var effectsLayer: some View {
        if let burst {
            ClearEffectOverlay(burst: burst, geometry: boardGeometry, effect: settings.clearEffect)
                .allowsHitTesting(false)
        }
        if let ripple, !reduceMotion {
            RippleOverlay(ripple: ripple, theme: theme)
                .allowsHitTesting(false)
        }
        if let comboBanner {
            ComboBanner(multiplier: comboBanner, theme: theme, reduceMotion: reduceMotion)
                .allowsHitTesting(false)
        }
    }

    @ViewBuilder
    private var dragLayer: some View {
        if let dragSlot, let piece = engine.tray[dragSlot] {
            PieceView(piece: piece, cellSize: boardGeometry.cellSize, spacing: boardGeometry.spacing)
                .scaleEffect(reduceMotion ? 1 : 1.04)
                .shadow(color: .black.opacity(0.35), radius: 12, y: 6)
                .position(
                    x: dragLocation.x,
                    y: dragLocation.y - Self.dragLift
                )
                .allowsHitTesting(false)
        }
    }

    @ViewBuilder
    private var dwellIndicator: some View {
        if let dwellTarget, settings.placementMode == .dwell {
            let rect = boardGeometry.rect(for: dwellTarget)
            Circle()
                .trim(from: 0, to: dwellProgress)
                .stroke(theme.accent, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .frame(width: boardGeometry.cellSize * 0.9, height: boardGeometry.cellSize * 0.9)
                .position(
                    x: rect.midX + boardGeometry.spacing * 2,
                    y: rect.midY + boardGeometry.spacing * 2
                )
                .allowsHitTesting(false)
        }
    }

    // MARK: - Header

    private var header: some View {
        VStack(spacing: 10) {
            HStack(alignment: .firstTextBaseline) {
                scoreBlock
                Spacer(minLength: 8)
                bestBlock
            }
            controls
        }
        .padding(.horizontal, 4)
    }

    private var scoreBlock: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(String(localized: "hud.score", defaultValue: "Score"))
                .font(.footnote.weight(.semibold))
                .foregroundStyle(theme.textSecondary)
            HStack(spacing: 8) {
                Text(engine.score.formatted(.number))
                    .font(.system(.largeTitle, design: .rounded, weight: .bold))
                    .contentTransition(reduceMotion ? .identity : .numericText())
                    .foregroundStyle(theme.textPrimary)
                if engine.comboStreak > 1 {
                    Text(
                        String(
                            format: String(localized: "hud.combo", defaultValue: "Combo ×%1$d"),
                            engine.comboMultiplier
                        )
                    )
                    .font(.caption.weight(.bold))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(theme.accent.opacity(0.25), in: Capsule())
                    .foregroundStyle(theme.accent)
                }
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(
            String(
                format: String(localized: "hud.score.label", defaultValue: "Score %1$@"),
                Speech.number(engine.score)
            )
        )
        .accessibilityValue(
            engine.comboStreak > 1
                ? String(format: String(localized: "hud.combo.label", defaultValue: "Combo times %1$d"), engine.comboMultiplier)
                : ""
        )
    }

    private var bestBlock: some View {
        VStack(alignment: .trailing, spacing: 2) {
            Text(String(localized: "hud.best", defaultValue: "Best"))
                .font(.footnote.weight(.semibold))
                .foregroundStyle(theme.textSecondary)
            Text(max(engine.bestScore, settings.bestScore).formatted(.number))
                .font(.system(.title3, design: .rounded, weight: .semibold))
                .foregroundStyle(theme.textPrimary)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(
            String(
                format: String(localized: "hud.best.label", defaultValue: "Best score %1$@"),
                Speech.number(max(engine.bestScore, settings.bestScore))
            )
        )
    }

    private var controls: some View {
        HStack(spacing: 10) {
            controlButton(
                systemImage: "arrow.uturn.backward",
                label: String(localized: "action.undo", defaultValue: "Undo"),
                hint: String(
                    format: String(localized: "action.undo.hint", defaultValue: "%1$d undos banked. One is earned every three pieces."),
                    engine.undoTokens
                ),
                badge: engine.undoTokens > 0 ? "\(engine.undoTokens)" : nil,
                isEnabled: engine.canUndo,
                action: undo
            )
            if settings.hintsEnabled {
                controlButton(
                    systemImage: "lightbulb.max",
                    label: String(localized: "action.hint", defaultValue: "Hint"),
                    hint: String(localized: "action.hint.hint", defaultValue: "Highlights and announces one legal move."),
                    isEnabled: !engine.isGameOver,
                    action: showHint
                )
            }
            controlButton(
                systemImage: exploreMode ? "ear.fill" : "ear",
                label: String(localized: "action.explore", defaultValue: "Audio explore"),
                hint: String(
                    localized: "action.explore.hint",
                    defaultValue: "Turns the board into a touch-and-listen surface. Drag to hear cells, triple tap to place."
                ),
                isEnabled: true,
                isOn: exploreMode,
                action: toggleExplore
            )
            controlButton(
                systemImage: "arrow.clockwise",
                label: String(localized: "action.newGame", defaultValue: "New game"),
                hint: String(localized: "action.newGame.hint", defaultValue: "Starts a fresh board."),
                isEnabled: true,
                action: newGame
            )
            controlButton(
                systemImage: "slider.horizontal.3",
                label: String(localized: "action.settings", defaultValue: "Settings"),
                hint: String(localized: "action.settings.hint", defaultValue: "Themes, sound, haptics and input options."),
                isEnabled: true,
                action: { showSettings = true }
            )
        }
    }

    private func controlButton(
        systemImage: String,
        label: String,
        hint: String,
        badge: String? = nil,
        isEnabled: Bool,
        isOn: Bool = false,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Image(systemName: systemImage)
                .font(.system(size: 18, weight: .semibold))
                .frame(minWidth: 44, minHeight: 44)
                .foregroundStyle(isOn ? theme.background.first ?? .black : theme.textPrimary)
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(isOn ? theme.accent : theme.boardSurface.opacity(theme.prefersOpaqueSurfaces ? 1 : 0.7))
                )
                .overlay(alignment: .topTrailing) {
                    if let badge {
                        Text(badge)
                            .font(.caption2.weight(.bold))
                            .padding(4)
                            .background(theme.accent, in: Circle())
                            .foregroundStyle(theme.background.first ?? .black)
                            .offset(x: 4, y: -4)
                    }
                }
        }
        .disabled(!isEnabled)
        .opacity(isEnabled ? 1 : 0.4)
        .accessibilityLabel(label)
        .accessibilityHint(hint)
        .accessibilityAddTraits(isOn ? [.isButton, .isSelected] : .isButton)
    }

    // MARK: - Preview state

    private var previewCellSet: Set<GridPosition> {
        guard let previewOrigin, let piece = engine.selectedPiece else { return [] }
        return Set(piece.shape.cells.map { $0.offset(row: previewOrigin.row, col: previewOrigin.col) })
    }

    private var previewIsValid: Bool {
        guard let previewOrigin else { return false }
        return engine.canPlaceSelection(at: previewOrigin)
    }

    private var previewClearedLines: (rows: Set<Int>, cols: Set<Int>) {
        guard let previewOrigin, let piece = engine.selectedPiece,
              engine.board.canPlace(piece.shape, at: previewOrigin)
        else { return ([], []) }
        var probe = engine.board
        guard let placement = probe.place(piece, at: previewOrigin) else { return ([], []) }
        return (Set(placement.clearedRows), Set(placement.clearedColumns))
    }

    private var hintCells: Set<GridPosition> {
        guard let hint, let piece = engine.tray[hint.slot] else { return [] }
        return Set(piece.shape.cells.map { $0.offset(row: hint.origin.row, col: hint.origin.col) })
    }

    // MARK: - Input

    private func pickUp(_ slot: Int) {
        guard engine.tray.indices.contains(slot), engine.tray[slot] != nil else { return }
        hint = nil
        cancelDwell()
        engine.selectedSlot = engine.selectedSlot == slot ? nil : slot
    }

    private func activateCell(_ position: GridPosition) {
        guard engine.selectedSlot != nil else {
            feedback.exploreCell(position, board: engine.board)
            feedback.speakCell(position, board: engine.board)
            return
        }
        if settings.placementMode == .dwell, dwellTarget != position {
            armDwell(at: position)
            return
        }
        // Confirm mode: the first tap only aims. Nothing is committed until the
        // same cell is chosen twice, so a stray tap costs nothing.
        if settings.confirmBeforePlacing, settings.placementMode != .dwell, previewOrigin != position {
            previewOrigin = position
            let fits = engine.canPlaceSelection(at: position)
            lastPreviewValid = fits
            feedback.hover(valid: fits, at: position)
            Announcer.announce(
                fits
                    ? String(
                        format: String(
                            localized: "event.confirmPlacement",
                            defaultValue: "Aimed at row %1$d, column %2$d. Activate again to place."
                        ),
                        position.row + 1, position.col + 1
                    )
                    : Speech.rejected(.occupied)
            )
            return
        }
        commit(at: position)
    }

    private func commit(at position: GridPosition) {
        guard let slot = engine.selectedSlot else { return }
        cancelDwell()
        previewOrigin = nil
        let boardBefore = engine.board
        guard let placement = engine.place(slot: slot, at: position) else { return }
        hint = nil
        presentEffects(for: placement, boardBefore: boardBefore)
    }

    private func autoPlace(_ slot: Int) {
        guard let piece = engine.tray[slot],
              let origin = engine.board.validOrigins(for: piece.shape).first
        else { return }
        engine.selectedSlot = slot
        commit(at: origin)
    }

    private func undo() {
        cancelDwell()
        hint = nil
        engine.undo()
    }

    private func newGame() {
        cancelDwell()
        hint = nil
        burst = nil
        engine.newGame()
    }

    private func showHint() {
        guard let suggestion = engine.bestHint(), let piece = engine.tray[suggestion.slot] else {
            Announcer.announce(String(localized: "event.noHint", defaultValue: "No legal moves left."))
            return
        }
        hint = suggestion
        engine.selectedSlot = suggestion.slot
        Announcer.announce(Speech.hint(slot: suggestion.slot, origin: suggestion.origin, piece: piece))
    }

    private func toggleExplore() {
        exploreMode.toggle()
        lastExplored = nil
        Announcer.announce(
            exploreMode
                ? String(localized: "event.exploreOn", defaultValue: "Audio explore on. Drag across the board to hear it. Triple tap to place.")
                : String(localized: "event.exploreOff", defaultValue: "Audio explore off.")
        )
    }

    // MARK: - Drag

    private func handleDragChanged(_ slot: Int, _ location: CGPoint) {
        if dragSlot != slot {
            dragSlot = slot
            engine.selectedSlot = slot
            feedback.haptics.startDragRhythm()
        }
        dragLocation = location
        updatePreview(slot: slot, location: location)
    }

    private func handleDragEnded(_ slot: Int, _ location: CGPoint) {
        feedback.haptics.stopDragRhythm()
        updatePreview(slot: slot, location: location)
        let target = previewOrigin
        dragSlot = nil
        previewOrigin = nil
        lastPreviewValid = nil

        guard let target else {
            engine.selectedSlot = nil
            return
        }
        commit(at: target)
    }

    private func updatePreview(slot: Int, location: CGPoint) {
        guard let piece = engine.tray[slot], boardGeometry.stride > 0 else { return }
        let stride = boardGeometry.stride
        let pieceWidth = CGFloat(piece.shape.width) * stride - boardGeometry.spacing
        let pieceHeight = CGFloat(piece.shape.height) * stride - boardGeometry.spacing
        let topLeft = CGPoint(
            x: location.x - pieceWidth / 2,
            y: location.y - pieceHeight / 2 - Self.dragLift
        )

        var origin = boardGeometry.snappedOrigin(topLeft: topLeft)
        // Forgiveness: if the exact landing is blocked, accept a neighbouring
        // origin rather than punishing a near-miss.
        if !engine.board.canPlace(piece.shape, at: origin),
           let nearby = nearestValidOrigin(to: origin, shape: piece.shape) {
            origin = nearby
        }

        let isOnBoard = origin.row > -2 && origin.col > -2
            && origin.row < Board.size + 1 && origin.col < Board.size + 1
        let newOrigin: GridPosition? = isOnBoard ? origin : nil

        if newOrigin != previewOrigin {
            previewOrigin = newOrigin
            if let newOrigin {
                let valid = engine.board.canPlace(piece.shape, at: newOrigin)
                if lastPreviewValid != valid || valid {
                    feedback.hover(valid: valid, at: clamped(newOrigin))
                }
                lastPreviewValid = valid
            }
        }
    }

    private func clamped(_ position: GridPosition) -> GridPosition {
        GridPosition(
            row: min(max(position.row, 0), Board.size - 1),
            col: min(max(position.col, 0), Board.size - 1)
        )
    }

    private func nearestValidOrigin(to origin: GridPosition, shape: PieceShape) -> GridPosition? {
        let offsets: [(Int, Int)] = [
            (0, -1), (0, 1), (-1, 0), (1, 0),
            (-1, -1), (-1, 1), (1, -1), (1, 1),
        ]
        for (deltaRow, deltaCol) in offsets {
            let candidate = origin.offset(row: deltaRow, col: deltaCol)
            if engine.board.canPlace(shape, at: candidate) { return candidate }
        }
        return nil
    }

    // MARK: - Explore & dwell

    private var exploreDrag: some Gesture {
        DragGesture(minimumDistance: 0, coordinateSpace: .named(Self.coordinateSpace))
            .onChanged { value in
                guard let cell = boardGeometry.position(at: value.location) else { return }
                guard cell != lastExplored else { return }
                lastExplored = cell
                focusedCell = nil
                feedback.exploreCell(cell, board: engine.board)
            }
            .onEnded { _ in
                guard let cell = lastExplored else { return }
                feedback.speakCell(cell, board: engine.board)
            }
    }

    private var exploreTripleTap: some Gesture {
        TapGesture(count: 3).onEnded {
            guard let cell = lastExplored else { return }
            commit(at: cell)
        }
    }

    private func armDwell(at position: GridPosition) {
        cancelDwell()
        guard engine.selectedPiece != nil else { return }
        dwellTarget = position
        dwellProgress = 0
        withAnimation(.linear(duration: settings.dwellDuration)) { dwellProgress = 1 }
        feedback.hover(valid: engine.canPlaceSelection(at: position), at: position)
        dwellTask = Task { [settings] in
            try? await Task.sleep(for: .seconds(settings.dwellDuration))
            guard !Task.isCancelled, dwellTarget == position else { return }
            commit(at: position)
        }
    }

    private func cancelDwell() {
        dwellTask?.cancel()
        dwellTask = nil
        dwellTarget = nil
        dwellProgress = 0
    }

    // MARK: - Effects

    private func presentEffects(for placement: Placement, boardBefore: Board) {
        if !reduceMotion {
            let rect = boardGeometry.rect(for: placement.origin)
            ripple = Ripple(
                id: UUID(),
                center: CGPoint(
                    x: boardGeometry.frame.minX + rect.midX,
                    y: boardGeometry.frame.minY + rect.midY
                )
            )
        }

        guard placement.didClear else { return }

        let blocks = placement.clearedCells.map { position in
            ClearedBlock(
                position: position,
                color: boardBefore[position] ?? placement.piece.color
            )
        }
        if !reduceMotion {
            burst = ClearBurst(id: UUID(), blocks: blocks)
        }
        if engine.comboMultiplier > 1 {
            comboBanner = engine.comboMultiplier
        }

        Task {
            try? await Task.sleep(for: .milliseconds(700))
            burst = nil
            ripple = nil
            comboBanner = nil
        }
    }

    // MARK: - Metrics

    /// Layout numbers derived once per size change: board side, cell size and the
    /// tray scale that keeps a five-cell piece inside its slot.
    private struct Metrics {
        let size: CGSize
        let isWide: Bool
        let boardSide: CGFloat
        let spacing: CGFloat
        let cellSize: CGFloat
        let traySlot: CGFloat
        let trayCell: CGFloat
        let verticalSpacing: CGFloat
        /// Width of the side column in landscape — always whatever is left after
        /// the board, so the two never fight for the same pixels.
        let sideColumnWidth: CGFloat

        init(size: CGSize) {
            self.size = size
            isWide = size.width > size.height * 1.15
            let sideLimit: CGFloat = isWide
                ? min(size.height - 40, size.width * 0.55)
                : min(size.width - 32, size.height * 0.58)
            let side = max(min(sideLimit, 620), 120)
            boardSide = side
            spacing = max(side * 0.011, 2)
            // The board draws its grid inside a `spacing * 2` inset on each side.
            cellSize = BoardGeometry.cellSize(fitting: side - spacing * 4, spacing: spacing)
            sideColumnWidth = max(min(380, size.width - side - 64), 180)
            let trayWidth: CGFloat = isWide ? sideColumnWidth : side
            traySlot = max((trayWidth - 24) / 3, 60)
            trayCell = traySlot / 5.8
            verticalSpacing = size.height < 700 ? 10 : 18
        }
    }
}

// MARK: - Effect models & overlays

struct ClearedBlock: Identifiable, Equatable {
    var position: GridPosition
    var color: BlockColor
    var id: GridPosition { position }
}

struct ClearBurst: Identifiable, Equatable {
    let id: UUID
    let blocks: [ClearedBlock]
}

struct Ripple: Identifiable, Equatable {
    let id: UUID
    let center: CGPoint
}

/// Draws the blocks that were just removed and animates them out. The engine has
/// already cleared them, so this layer is purely decorative and never blocks input.
struct ClearEffectOverlay: View {
    let burst: ClearBurst
    let geometry: BoardGeometry
    let effect: ClearEffect

    @State private var progress: CGFloat = 0

    var body: some View {
        ZStack {
            ForEach(burst.blocks) { block in
                let rect = geometry.rect(for: block.position)
                BlockView(color: block.color, cornerRadius: geometry.cellSize * 0.22)
                    .frame(width: geometry.cellSize, height: geometry.cellSize)
                    .modifier(ClearEffectModifier(effect: effect, block: block, progress: progress))
                    .position(
                        x: geometry.frame.minX + rect.midX,
                        y: geometry.frame.minY + rect.midY
                    )
            }
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.45)) { progress = 1 }
        }
    }
}

private struct ClearEffectModifier: ViewModifier {
    let effect: ClearEffect
    let block: ClearedBlock
    let progress: CGFloat

    private var seed: CGFloat {
        CGFloat((block.position.row * 8 + block.position.col) % 7) / 7 - 0.5
    }

    func body(content: Content) -> some View {
        switch effect {
        case .shatter:
            content
                .scaleEffect(1 + progress * 0.6)
                .rotationEffect(.degrees(Double(seed) * 90 * Double(progress)))
                .offset(x: seed * 60 * progress, y: progress * 40)
                .opacity(1 - progress)
        case .dissolve:
            content
                .blur(radius: progress * 8)
                .opacity(1 - progress)
        case .slideOut:
            content
                .offset(x: seed > 0 ? progress * 320 : -progress * 320)
                .opacity(1 - progress * 0.8)
        case .implode:
            content
                .scaleEffect(max(1 - progress, 0.05))
                .opacity(1 - progress)
        }
    }
}

struct RippleOverlay: View {
    let ripple: Ripple
    let theme: Theme

    @State private var progress: CGFloat = 0

    var body: some View {
        Circle()
            .stroke(theme.accent.opacity(1 - progress), lineWidth: 3)
            .frame(width: 40 + progress * 220, height: 40 + progress * 220)
            .position(ripple.center)
            .onAppear {
                withAnimation(.easeOut(duration: 0.5)) { progress = 1 }
            }
    }
}

struct ComboBanner: View {
    let multiplier: Int
    let theme: Theme
    let reduceMotion: Bool

    @State private var shown = false

    var body: some View {
        Text(
            String(
                format: String(localized: "banner.combo", defaultValue: "Combo ×%1$d"),
                multiplier
            )
        )
        .font(.system(.title, design: .rounded, weight: .heavy))
        .foregroundStyle(theme.accent)
        .padding(.horizontal, 22)
        .padding(.vertical, 12)
        .background(theme.boardSurface.opacity(0.92), in: Capsule())
        .scaleEffect(shown || reduceMotion ? 1 : 0.6)
        .opacity(shown ? 1 : 0)
        .accessibilityHidden(true)
        .onAppear {
            if reduceMotion {
                shown = true
            } else {
                withAnimation(.spring(duration: 0.3)) { shown = true }
            }
        }
    }
}
