//
//  SettingsView.swift
//  BlockBlast
//

import SwiftUI
import UIKit

/// Every accessibility affordance is a first-class setting, not a hidden toggle:
/// the sheet opens on the one-tap accessibility preset.
struct SettingsView: View {
    let engine: GameEngine

    @Environment(GameSettings.self) private var settings
    @Environment(FeedbackCoordinator.self) private var feedback
    @Environment(\.theme) private var theme
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        @Bindable var settings = settings

        NavigationStack {
            Form {
                presetSection(settings: settings)
                gameSection(settings: settings)
                inputSection(settings: settings)
                appearanceSection(settings: settings)
                legendSection
                audioSection(settings: settings)
                hapticsSection(settings: settings)
                speechSection(settings: settings)
                languageSection
            }
            .navigationTitle(String(localized: "settings.title", defaultValue: "Settings"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(String(localized: "action.done", defaultValue: "Done")) { dismiss() }
                }
            }
        }
        .onChange(of: settings.soundPack) { _, _ in
            feedback.sync()
            feedback.audio.play(.placed)
        }
        .onChange(of: settings.audioVolume) { _, _ in feedback.sync() }
        .onChange(of: settings.hapticIntensity) { _, _ in
            feedback.sync()
            feedback.haptics.placed()
        }
    }

    // MARK: - Sections

    private func presetSection(settings: GameSettings) -> some View {
        Section {
            Button {
                settings.applyMaximumAccessibilityPreset()
                feedback.sync()
                feedback.audio.play(.personalBest)
                Announcer.announce(
                    String(
                        localized: "settings.preset.applied",
                        defaultValue: "Accessibility preset applied: high contrast, patterns, tap-to-place, spatial audio, haptics and verbose speech."
                    )
                )
            } label: {
                Label(
                    String(localized: "settings.preset", defaultValue: "Set up for maximum accessibility"),
                    systemImage: "accessibility"
                )
            }
            .accessibilityHint(
                String(
                    localized: "settings.preset.hint",
                    defaultValue: "Turns on high contrast, patterns, tap to place, spatial audio, haptics and verbose speech in one step."
                )
            )
        } footer: {
            Text(
                String(
                    localized: "settings.preset.footer",
                    defaultValue: "Everything below can still be changed individually afterwards."
                )
            )
        }
    }

    private func gameSection(settings: GameSettings) -> some View {
        Section(String(localized: "settings.section.game", defaultValue: "Game")) {
            Picker(String(localized: "settings.mode", defaultValue: "Mode"), selection: Binding(
                get: { engine.mode },
                set: { newMode in
                    settings.preferredMode = newMode
                    engine.setMode(newMode)
                }
            )) {
                ForEach(GameMode.allCases) { mode in
                    Text(mode.localizedName).tag(mode)
                }
            }
            .pickerStyle(.segmented)

            Text(engine.mode.localizedDescription)
                .font(.footnote)
                .foregroundStyle(.secondary)

            Toggle(String(localized: "settings.hints", defaultValue: "Hint button"), isOn: Binding(
                get: { settings.hintsEnabled },
                set: { settings.hintsEnabled = $0 }
            ))
            .accessibilityHint(
                String(localized: "settings.hints.hint", defaultValue: "Shows a button that highlights and announces one legal move.")
            )
        }
    }

    private func inputSection(settings: GameSettings) -> some View {
        Section {
            Picker(String(localized: "settings.placement", defaultValue: "Placing pieces"), selection: Binding(
                get: { settings.placementMode },
                set: { settings.placementMode = $0 }
            )) {
                ForEach(PlacementMode.allCases) { mode in
                    Text(mode.localizedName).tag(mode)
                }
            }

            Text(settings.placementMode.localizedDescription)
                .font(.footnote)
                .foregroundStyle(.secondary)

            Toggle(String(localized: "settings.confirm", defaultValue: "Confirm before placing"), isOn: Binding(
                get: { settings.confirmBeforePlacing },
                set: { settings.confirmBeforePlacing = $0 }
            ))
            .disabled(settings.placementMode == .dwell)
            .accessibilityHint(
                String(
                    localized: "settings.confirm.hint",
                    defaultValue: "The first tap on a cell only aims. The piece is placed when you choose the same cell again."
                )
            )

            if settings.placementMode == .dwell {
                VStack(alignment: .leading) {
                    Text(
                        String(
                            format: String(localized: "settings.dwellDuration", defaultValue: "Dwell time: %.1f seconds"),
                            settings.dwellDuration
                        )
                    )
                    Slider(
                        value: Binding(get: { settings.dwellDuration }, set: { settings.dwellDuration = $0 }),
                        in: 0.4...4.0,
                        step: 0.2
                    )
                    .accessibilityLabel(String(localized: "settings.dwellDuration.label", defaultValue: "Dwell time in seconds"))
                    .accessibilityValue(settings.dwellDuration.formatted(.number.precision(.fractionLength(1))))
                }
            }
        } header: {
            Text(String(localized: "settings.section.input", defaultValue: "Input"))
        } footer: {
            Text(
                String(
                    localized: "settings.section.input.footer",
                    defaultValue: "Tapping a piece always picks it up, in every mode, so dragging is never required."
                )
            )
        }
    }

    private func appearanceSection(settings: GameSettings) -> some View {
        Section(String(localized: "settings.section.appearance", defaultValue: "Appearance")) {
            Picker(String(localized: "settings.theme", defaultValue: "Theme"), selection: Binding(
                get: { settings.theme },
                set: { settings.theme = $0 }
            )) {
                ForEach(ThemeID.allCases) { id in
                    Text(id.localizedName).tag(id)
                }
            }

            Text(settings.theme.localizedDescription)
                .font(.footnote)
                .foregroundStyle(.secondary)

            ThemePreviewStrip(themeID: settings.theme, simulation: settings.visionSimulation, showsPatterns: settings.patternsEnabled)

            Toggle(String(localized: "settings.patterns", defaultValue: "Patterns on blocks"), isOn: Binding(
                get: { settings.patternsEnabled },
                set: { settings.patternsEnabled = $0 }
            ))
            .accessibilityHint(
                String(
                    localized: "settings.patterns.hint",
                    defaultValue: "Each colour also carries a unique pattern, so blocks stay distinguishable without colour vision."
                )
            )

            Toggle(String(localized: "settings.highContrast", defaultValue: "Force high contrast"), isOn: Binding(
                get: { settings.forceHighContrast },
                set: { settings.forceHighContrast = $0 }
            ))

            Picker(String(localized: "settings.vision", defaultValue: "Colour vision preview"), selection: Binding(
                get: { settings.visionSimulation },
                set: { settings.visionSimulation = $0 }
            )) {
                ForEach(VisionSimulation.allCases) { simulation in
                    Text(simulation.localizedName).tag(simulation)
                }
            }
            .accessibilityHint(
                String(
                    localized: "settings.vision.hint",
                    defaultValue: "Redraws the whole game the way it looks with this type of colour blindness."
                )
            )

            Picker(String(localized: "settings.clearEffect", defaultValue: "Line clear effect"), selection: Binding(
                get: { settings.clearEffect },
                set: { settings.clearEffect = $0 }
            )) {
                ForEach(ClearEffect.allCases) { effect in
                    Text(effect.localizedName).tag(effect)
                }
            }

            Toggle(String(localized: "settings.idleAnimation", defaultValue: "Gentle idle animation"), isOn: Binding(
                get: { settings.idleAnimationEnabled },
                set: { settings.idleAnimationEnabled = $0 }
            ))
        }
    }

    /// The colour-and-pattern key. A player who cannot tell two hues apart can
    /// still look up which pattern belongs to which name.
    private var legendSection: some View {
        Section {
            ForEach(BlockColor.allCases) { color in
                HStack(spacing: 12) {
                    BlockView(color: color, cornerRadius: 8)
                        .frame(width: 36, height: 36)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(color.localizedName.capitalized)
                        Text("\(color.pattern.glyph)  \(color.pattern.localizedName)")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(color.accessibilityDescription)
            }
        } header: {
            Text(String(localized: "settings.section.legend", defaultValue: "Block key"))
        }
    }

    private func audioSection(settings: GameSettings) -> some View {
        Section {
            Toggle(String(localized: "settings.audio", defaultValue: "Sound"), isOn: Binding(
                get: { settings.audioEnabled },
                set: { settings.audioEnabled = $0 }
            ))

            Picker(String(localized: "settings.soundPack", defaultValue: "Sound pack"), selection: Binding(
                get: { settings.soundPack },
                set: { settings.soundPack = $0 }
            )) {
                ForEach(SoundPack.allCases) { pack in
                    Text(pack.localizedName).tag(pack)
                }
            }
            .disabled(!settings.audioEnabled)

            Text(settings.soundPack.localizedDescription)
                .font(.footnote)
                .foregroundStyle(.secondary)

            Button {
                feedback.sync()
                feedback.audio.play(.linesCleared(2))
            } label: {
                Label(String(localized: "settings.playSample", defaultValue: "Play a sample"), systemImage: "speaker.wave.2")
            }
            .disabled(!settings.audioEnabled)

            Toggle(String(localized: "settings.spatial", defaultValue: "Spatial audio"), isOn: Binding(
                get: { settings.spatialAudioEnabled },
                set: { settings.spatialAudioEnabled = $0 }
            ))
            .disabled(!settings.audioEnabled)
            .accessibilityHint(
                String(
                    localized: "settings.spatial.hint",
                    defaultValue: "Places each sound where its cell is: left to right across the board, low to high up the board."
                )
            )

            Toggle(String(localized: "settings.boardTones", defaultValue: "Cell tones"), isOn: Binding(
                get: { settings.boardTonesEnabled },
                set: { settings.boardTonesEnabled = $0 }
            ))
            .disabled(!settings.audioEnabled)
            .accessibilityHint(
                String(
                    localized: "settings.boardTones.hint",
                    defaultValue: "Every cell you touch or focus plays its own note. Higher notes are higher up the board."
                )
            )

            VStack(alignment: .leading) {
                Text(String(localized: "settings.volume", defaultValue: "Volume"))
                Slider(
                    value: Binding(get: { settings.audioVolume }, set: { settings.audioVolume = $0 }),
                    in: 0...1
                )
                .disabled(!settings.audioEnabled)
                .accessibilityLabel(String(localized: "settings.volume", defaultValue: "Volume"))
            }
        } header: {
            Text(String(localized: "settings.section.audio", defaultValue: "Sound"))
        }
    }

    private func hapticsSection(settings: GameSettings) -> some View {
        Section(String(localized: "settings.section.haptics", defaultValue: "Haptics")) {
            Toggle(String(localized: "settings.haptics", defaultValue: "Haptics"), isOn: Binding(
                get: { settings.hapticsEnabled },
                set: { settings.hapticsEnabled = $0 }
            ))
            VStack(alignment: .leading) {
                Text(String(localized: "settings.hapticIntensity", defaultValue: "Strength"))
                Slider(
                    value: Binding(get: { settings.hapticIntensity }, set: { settings.hapticIntensity = $0 }),
                    in: 0.2...1
                )
                .disabled(!settings.hapticsEnabled)
                .accessibilityLabel(String(localized: "settings.hapticIntensity", defaultValue: "Strength"))
            }
        }
    }

    private func speechSection(settings: GameSettings) -> some View {
        Section {
            Picker(String(localized: "settings.verbosity", defaultValue: "VoiceOver detail"), selection: Binding(
                get: { settings.speechVerbosity },
                set: { settings.speechVerbosity = $0 }
            )) {
                ForEach(SpeechVerbosity.allCases) { verbosity in
                    Text(verbosity.localizedName).tag(verbosity)
                }
            }
            .pickerStyle(.segmented)

            Toggle(String(localized: "settings.announceScore", defaultValue: "Announce score after each move"), isOn: Binding(
                get: { settings.announceScore },
                set: { settings.announceScore = $0 }
            ))
        } header: {
            Text(String(localized: "settings.section.speech", defaultValue: "Speech"))
        } footer: {
            Text(
                String(
                    localized: "settings.section.speech.footer",
                    defaultValue: "With VoiceOver and Screen Curtain on, the board is fully playable: swipe through cells to hear them, or use Audio explore on the game screen."
                )
            )
        }
    }

    private var languageSection: some View {
        Section {
            LabeledContent(
                String(localized: "settings.language", defaultValue: "Language"),
                value: Locale.current.localizedString(forIdentifier: Locale.current.identifier) ?? Locale.current.identifier
            )
            Button {
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(url)
                }
            } label: {
                Label(
                    String(localized: "settings.language.open", defaultValue: "Change language in iOS Settings"),
                    systemImage: "globe"
                )
            }
        } header: {
            Text(String(localized: "settings.section.language", defaultValue: "Language"))
        } footer: {
            Text(
                String(
                    localized: "settings.section.language.footer",
                    defaultValue: "The game follows your system language for both text and spoken feedback, and updates as soon as you change it."
                )
            )
        }
    }
}

/// A row of every block colour, drawn through the current theme and colour-vision
/// simulation — the fastest way to check a palette is still readable to you.
struct ThemePreviewStrip: View {
    let themeID: ThemeID
    let simulation: VisionSimulation
    let showsPatterns: Bool

    var body: some View {
        let theme = Theme.resolve(themeID)
        HStack(spacing: 6) {
            ForEach(BlockColor.allCases) { color in
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(simulation.apply(to: theme.color(for: color)))
                    .overlay {
                        if showsPatterns {
                            PatternShape(style: color.pattern)
                                .fill(simulation.apply(to: theme.color(for: color)).contrastingInk.opacity(theme.patternOpacity))
                                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                        }
                    }
                    .overlay {
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .strokeBorder(theme.blockStroke, lineWidth: theme.blockStrokeWidth)
                    }
                    .frame(height: 40)
            }
        }
        .padding(8)
        .background(theme.boardSurface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(
            String(
                localized: "settings.themePreview.label",
                defaultValue: "Theme preview showing all seven block colours and their patterns"
            )
        )
    }
}
