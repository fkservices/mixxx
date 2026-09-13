# SETUP-F01-MIXXX-2.5.6-ARM evidence

> Autonomously AI-generated evidence at the user's request.

Source revision: `c9aefb3`. Executor: coordinator. [Installation record](../setup/mixxx-runtime.md) contains source, checksum, installed version and executable path.

- Initial job `install-mixxx-2.5.6-arm`, exec session 53108: download and checksum succeeded; mount canceled at license display, terminal failure recorded. `hdiutil info` showed no mounted image afterward.
- Continuation `install-mixxx-2.5.6-arm-resume-mount`, exec session 43699: reused and rehashed the same image, completed read-only mount/copy/unmount, terminal status `succeeded` at 2026-09-13T18:50:25.392144+00:00.
- `CFBundleShortVersionString` and `CFBundleVersion` both read `2.5.6`; executable is `Mixxx`; `file` reports arm64; deep strict signature check exited 0.
- Normal profile remained absent; no app launch or runtime test occurred.

The host-install lease is released only after the terminal continuation and successful unmount were verified. F11 still owns the isolated runtime profile, safe audio configuration, fixture loads and real UI evidence.

> End of autonomously AI-generated evidence.
