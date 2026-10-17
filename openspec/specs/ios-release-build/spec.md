# ios-release-build Specification

## Purpose
Guarantees that the iOS build pipeline emits a real, installable unsigned IPA — a
`Payload/VoiceTavern.app` bundle with an arm64 Mach-O executable — instead of a green
run that ships an empty archive.

## Requirements

### Requirement: iOS artifact is published for every run

The iOS build job SHALL upload `VoiceTavern_unsigned.ipa` and a sibling `.sha256` as a
workflow artifact on every run, including branch `workflow_dispatch` runs, and SHALL
attach both to the release when the ref is a tag.

#### Scenario: Branch dispatch produces a retrievable artifact

- **WHEN** the iOS workflow is dispatched against a non-tag branch
- **THEN** the run exposes a downloadable artifact containing `VoiceTavern_unsigned.ipa` and `VoiceTavern_unsigned.ipa.sha256`

#### Scenario: Tag run attaches assets to the release

- **WHEN** the workflow is triggered by a `v*` tag
- **THEN** the release carries both the IPA and its checksum file

### Requirement: IPA contains a real application bundle

The `.ipa` SHALL be a zip whose root contains `Payload/VoiceTavern.app/`, and its
listing SHALL include `Payload/VoiceTavern.app/Info.plist` and the app executable.

#### Scenario: Archive holds the app bundle, not a bare Payload directory

- **WHEN** the downloaded IPA is inspected with `unzip -l`
- **THEN** entries under `Payload/VoiceTavern.app/` are listed
- **AND** the file size is measured in megabytes, not hundreds of bytes

#### Scenario: Extraction yields the expected files

- **WHEN** the IPA is extracted
- **THEN** `Payload/VoiceTavern.app/Info.plist` and `Payload/VoiceTavern.app/VoiceTavern` both exist on disk

### Requirement: Executable is an arm64 Mach-O and unsigned

`Payload/VoiceTavern.app/VoiceTavern` SHALL be reported by `file` as `Mach-O 64-bit`
built for `arm64`, and the bundle SHALL carry no `_CodeSignature` directory and no
`embedded.mobileprovision`.

#### Scenario: Binary architecture is arm64

- **WHEN** `file` is run against the extracted executable
- **THEN** the output names `Mach-O 64-bit` and `arm64`

#### Scenario: Bundle is genuinely unsigned

- **WHEN** the bundle is checked for `_CodeSignature` and `embedded.mobileprovision`
- **THEN** neither is present, leaving a clean target for on-device re-signing

### Requirement: Bundle identity is intact

The built `Info.plist` SHALL declare `CFBundleExecutable` matching the executable
shipped in the bundle.

#### Scenario: Info.plist names the shipped executable

- **WHEN** `CFBundleExecutable` is printed from the built `Info.plist`
- **THEN** it equals the executable file present in `VoiceTavern.app`

### Requirement: Microphone usage description survives the build

The built `Info.plist` SHALL retain `NSMicrophoneUsageDescription` from
`src-tauri/Info.plist`; without it iOS terminates the app on first audio capture.

#### Scenario: Usage string present in the packaged plist

- **WHEN** the built `Info.plist` is parsed
- **THEN** `NSMicrophoneUsageDescription` is present and non-empty

### Requirement: Checksum matches the artifact

The published `.sha256` SHALL match a freshly computed `sha256sum` of the IPA.

#### Scenario: Local digest equals published digest

- **WHEN** `sha256sum dist/VoiceTavern_unsigned.ipa` is run
- **THEN** the digest equals the value recorded in `VoiceTavern_unsigned.ipa.sha256`

### Requirement: Build failures are never masked

The iOS job SHALL fail when project generation, archiving, or packaging fails. It MUST
NOT use `|| true` or `continue-on-error` on those steps, SHALL assert the generated
`.xcodeproj` exists before archiving, and SHALL refuse to zip a `Payload/` that
contains no `.app`.

#### Scenario: Missing generated project fails the job

- **WHEN** `tauri ios init` produces no `.xcodeproj`
- **THEN** the job fails at that step and no artifact is claimed

#### Scenario: Empty Payload is refused

- **WHEN** packaging finds no `.app` under `Payload/`
- **THEN** the step exits non-zero with an error annotation instead of producing an IPA
