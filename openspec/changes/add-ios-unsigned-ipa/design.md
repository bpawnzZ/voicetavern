# Design

## Context

`tauri ios init` does not commit an Xcode project — it renders an embedded template
(`project.yml`, whose `name:` is `{{app.name}}`) into `src-tauri/gen/apple/` and then
executes `xcodegen generate --spec project.yml` (verified in tauri-cli
`src/mobile/ios/project.rs`). Two facts follow, and both break the old job:

1. **`xcodegen` must be on PATH.** Neither `macos-latest` nor `macos-26` lists it among
   installed tools. Without it, init dies after writing `project.yml` — historically
   swallowed by `|| true`, which is why `src-tauri/gen/apple/` never appeared.
2. **Project and scheme names derive from `productName`.** With
   `productName: VoiceTavern` the products are `VoiceTavern.xcodeproj` and scheme
   `VoiceTavern_iOS`. The committed `voicetavern.xcodeproj` / `voicetavern_iOS` were
   lowercase guesses — wrong *and* masked.

## Decisions

### Discover the project, never hardcode it

Print `src-tauri/gen/apple/` after init, then resolve:

```bash
PROJ=$(find src-tauri/gen/apple -maxdepth 1 -name '*.xcodeproj' -print -quit)
SCHEME=$(xcodebuild -list -json -project "$PROJ" | python3 -c 'import json,sys; ...')
```

A name change upstream then costs a log line, not a red run. This also satisfies the
"print the actual generated path and adjust" requirement without a local macOS box.
If discovery is empty the step fails with an `::error::` annotation.

### `xcodebuild archive`, not `tauri ios build`

`tauri ios build` is the local-dev path and wants a signing identity for device
builds. Command-line settings beat project settings, so signing is disabled at the
invocation: `CODE_SIGNING_ALLOWED=NO`, `CODE_SIGNING_REQUIRED=NO`,
`CODE_SIGN_IDENTITY=""`, `PROVISIONING_PROFILE=""`, `CODE_SIGN_ENTITLEMENTS=""`,
`DEVELOPMENT_TEAM=""`, plus `ONLY_ACTIVE_ARCH=NO` for a full arm64 slice.

### `npm ci && npm run build` before archiving

Tauri embeds `frontendDist` (`../dist`) into the Rust binary at compile time, so the
Vite build must exist before the archive's Rust script phase runs. Archiving before
the frontend build produces an app with a stale or missing asset bundle.

### Runner stays `macos-latest`

Xcode 26.x is the default on the macOS runner images and ships `iphoneos26.x`, which
covers the iOS 26.5 target device. The project's deployment target is left untouched —
downgrading it is not needed to run on iOS 26. **No Xcode pin is added until a real
failure proves one necessary**; a speculative pin is another thing to rot. The
"Select Xcode" step keeps printing `xcodebuild -version` so the version is in the log.

### Guard, not a better zip

The failure mode is not the zip call — it is zipping a directory nobody validated.
Packaging asserts `Payload/*.app` exists and exits 1 with an error annotation
otherwise, so an empty archive can never be published as a "successful" run again.

### Artifacts on all runs, release on tags

`upload-artifact@v4` runs unconditionally (90-day artifact, retrievable from a branch
dispatch); the `softprops/action-gh-release` step keeps its `refs/tags/` gate. The
`.sha256` is generated next to the IPA and uploaded with it.

## Risks

- **iOS-incompatible Rust crate.** `ws`/`tauri-plugin-websocket` may not cross-compile
  cleanly for `aarch64-apple-ios`. If so it is a genuine blocker to report with the
  verbatim error, not something to paper over.
- **`tauri ios init` template drift.** If the generated tree differs from the template
  read for this design, discovery still adapts; only the assertion wording changes.
- **Unverified by CI:** device install, launch, and microphone permission behaviour.
  Those are confirmed by the human on the phone, not by the runner.
