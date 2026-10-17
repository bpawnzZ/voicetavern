# Proposal

## Why

Every published `VoiceTavern_unsigned.ipa` (v1.0.2 → v1.0.7) is a **166-byte zip whose
only entry is an empty `Payload/` directory** — there is no `.app` in any release. Two
masked failures in the `build-ios-unsigned` job (`tauri ios init … || true` and
`xcodebuild … || true`) let the job go green while nothing was compiled, and the
packaging step then zipped an unvalidated (empty) directory. The repository has no
`src-tauri/gen/apple/`, which is the tell that the iOS app has never once been built
here. LiveContainer's "app bundle not found" is literal and downstream of this.

## What Changes

- Remove both `|| true` masks from the `build-ios-unsigned` job. Every generation,
  archive and packaging step must fail the job.
- Install `xcodegen` before init — `tauri ios init` shells out to it and neither
  `macos-latest` nor `macos-26` images ship it.
- Assert the generated Xcode project exists after init instead of assuming it.
- Stop hardcoding `voicetavern.xcodeproj` / `voicetavern_iOS`: Tauri derives both from
  `productName` (`VoiceTavern`), so the committed names were wrong as well as masked.
  Discover the project and scheme from the generated tree.
- Archive with signing fully disabled; package `Payload/<App>.app`; **fail if
  `Payload/` contains no `.app`** — that guard is the actual fix.
- Upload the IPA plus a `.sha256` as a workflow artifact on **every** run (branch
  dispatch included), in addition to the existing tag-gated release upload.

Not in scope: app features, UI, provider handling, signing certificates, deployment
target changes, upstream PRs.

## Capabilities

### New Capabilities
- `ios-release-build`: CI produces and publishes a real, installable unsigned iOS IPA
  whose bundle contents are verifiable.

### Modified Capabilities
<!-- none: this change adds a release capability; no existing spec behavior changes -->

## Impact

- `.github/workflows/build.yml` — iOS job only.
- `.gitignore` — ignores `openspec init` tool scaffolding (`.hermes/skills`).
- `openspec/` — planning artifacts for this change.
- One CI tool added: `xcodegen` (documented Tauri iOS prerequisite; already required
  by the build, merely never installed). No new runtime dependency, no app code change.
