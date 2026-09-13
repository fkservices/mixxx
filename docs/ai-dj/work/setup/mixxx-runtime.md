# Installed Mixxx runtime

> Autonomously AI-generated setup record at the user's request.

Mixxx 2.5.6 ARM is installed at `/Applications/Mixxx.app`. It has not been launched. The normal Mixxx profile remains absent. F11 owns creating and opening the separate disposable profile.

| Verification | Result |
| --- | --- |
| Official artifact | [mixxx-2.5.6-macosarm.dmg](https://downloads.mixxx.org/releases/2.5.6/mixxx-2.5.6-macosarm.dmg) |
| Published checksum | [SHA-256](https://downloads.mixxx.org/releases/2.5.6/mixxx-2.5.6-macosarm.dmg.sha256sum) |
| SHA-256, independently computed | `f724cd8b0048a60963f11694acbffb2438a89c1cf732117559ac3031f8486e27` |
| Artifact bytes | 65,741,985 |
| CFBundleShortVersionString / CFBundleVersion | `2.5.6` / `2.5.6` |
| CFBundleExecutable | `Mixxx` (capital M; verified installed metadata supersedes guessed executable casing) |
| Architecture | Mach-O 64-bit executable arm64 |
| Signature verification | `codesign --verify --deep --strict /Applications/Mixxx.app` exited 0 |
| Profile/UI/audio/MIDI use | None |

The exact later launch shape is:

```text
/Applications/Mixxx.app/Contents/MacOS/Mixxx --settings-path "/Users/faizkhalid/Library/Application Support/Mixxx-AI-DJ/profiles/mixxx-2.5.6-latenight-f01"
```

Installation reused the verified official disk image, mounted read-only, copied to an absent application destination using `ditto`, and unmounted before the metadata/signature checks. The first attach canceled at the standard open-source license display; a separate continuation supplied the ordinary confirmation and resumed the mount without downloading again. Terminal result manifests and logs remain under `~/Library/Application Support/Mixxx-AI-DJ/jobs/install-mixxx-2.5.6-arm/`.

This proves installation and artifact identity only. Native UI, audio setup, controller mapping and all timing/feature gates remain pending.

> End of autonomously AI-generated setup record.
