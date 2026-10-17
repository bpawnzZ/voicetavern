# Design

## Context

`tauri ios init` does not commit an Xcode project — it renders an embedded template
(`project.yml`, whose `name:` is `{{app.name}}`) into `src-tauri/gen/apple/` and then
executes `xcodegen generate --spec project.yml` (verified in tauri-cli
`src/mobile/ios/project.rs`). Two facts follow, and both break the old job:

1. **`xcodegen` must be on PATH.** Neither `macos-latest` nor `macos-26` lists it among
   installed tools. Without it, init dies after writing `project.yml` — historically
   swallowed by `|| true`, which is why `src-tauri/gen/apple/` never appeared.
2. **The generated names are lowercase.** They follow the crate/app name
   (`voicetavern`), not `productName`; `productName` only sets `PRODUCT_NAME`
   (`VoiceTavern.app`). The committed lowercase project/scheme names were therefore
   right — they were simply never reached, because init failed first.

## Decisions

### Project and scheme names

The generated project is **`voicetavern.xcodeproj`** with target/scheme
**`voicetavern_iOS`** — lowercase, derived from the Cargo package name, *not* from
`productName` (`VoiceTavern` only becomes `PRODUCT_NAME`, i.e. `VoiceTavern.app`). The
upstream hardcoded names were therefore correct; they were simply never reached,
because init failed first. The init step asserts the `.xcodeproj` by glob rather than
by name so a future rename cannot silently pass, and prints the tree.

### `tauri ios build --no-sign`, not a bare `xcodebuild`

The first CI run disproved the direct-`xcodebuild` plan. The generated project's
"Build Rust Code" phase runs `tauri ios xcode-script`, which connects to the CLI's
options server at `$TMPDIR/<identifier>-server-addr`. With no `tauri` process serving
that file, the phase panics and the archive dies with exit 65:

```
thread '<unnamed>' panicked at crates/tauri-cli/src/mobile/mod.rs:386:59:
failed to read missing addr file /var/folders/.../T/com.voicetavern.app-server-addr:
No such file or directory (os error 2)
```

That is architectural, not a missing flag. `tauri ios build` is the supported device
path: it starts the options server, runs `beforeBuildCommand`, builds and archives.
`--no-sign` ("Skip code signing when bundling the app") archives unsigned and skips
the IPA export, so packaging stays ours.

**Configuration names are lowercase.** The template emits
`configs: { debug: debug, release: release }`, so the build configurations are literally
`debug` and `release`. `-configuration Release` matched nothing, so xcodebuild fell back
to `debug` — and `xcode-script` decides `profile_from_configuration` by
`configuration == "release"`, which is why the debug profile also demanded the dev
server. `tauri ios build` passes the right one; no `-configuration` juggling required.

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
