# Tasks

## 1. Reproduce and confirm the defect

- [x] 1.1 Confirm every published IPA is a stub: `stat -c%s` under 1 KB and `unzip -l` listing only `Payload/`
- [x] 1.2 Confirm the two `|| true` masks sit on the init and archive steps of `build-ios-unsigned`
- [x] 1.3 Confirm `src-tauri/gen/apple/` is absent and listed in `.gitignore`

## 2. Repair the iOS job

- [x] 2.1 Install `xcodegen` (Tauri's required generator; not in the runner image)
- [x] 2.2 Remove both `|| true` masks so generation and archive failures fail the job
- [x] 2.3 Assert the generated `.xcodeproj` exists after init, printing the tree
- [x] 2.4 Resolve project and scheme by discovery instead of the wrong hardcoded lowercase names
- [x] 2.5 Run `npm ci` and `npm run build` before archiving
- [x] 2.6 Archive for `generic/platform=iOS` with all signing disabled
- [x] 2.7 Package `Payload/<App>.app` from the archive and refuse to zip an empty `Payload/`
- [x] 2.8 Emit `VoiceTavern_unsigned.ipa.sha256` next to the IPA
- [x] 2.9 Add `actions/upload-artifact@v4` for IPA + checksum on every run

## 3. Build in CI

- [x] 3.1 Push `fix/ios-unsigned-ipa`
- [x] 3.2 Dispatch `build.yml --ref fix/ios-unsigned-ipa` and watch to completion
- [x] 3.3 On failure, read `gh run view --log-failed` and fix the real cause (no masking)
      - runs 38993625148 (xcodegen missing, then options-server panic) → 38994081502 green

## 4. Verify the artifact (not the run status)

- [x] 4.1 `gh run download` the artifact and `stat -c%s` the IPA (megabytes, not hundreds of bytes)
- [x] 4.2 `unzip -l` shows `Payload/VoiceTavern.app/…`
- [x] 4.3 Extract and confirm `Info.plist` + `VoiceTavern` executable exist
- [x] 4.4 `file` reports `Mach-O 64-bit arm64`
- [x] 4.5 `CFBundleExecutable` printed from the built `Info.plist`
- [x] 4.6 No `_CodeSignature` and no `embedded.mobileprovision`
- [x] 4.7 `NSMicrophoneUsageDescription` present in the built `Info.plist`
- [x] 4.8 `sha256sum` matches the published `.sha256`

## 5. Publish

- [x] 5.1 Release `v1.0.8-ios` in the fork with IPA + `.sha256` attached
- [x] 5.2 Archive this OpenSpec change and commit on the branch
