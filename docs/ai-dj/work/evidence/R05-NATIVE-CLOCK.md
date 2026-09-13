# Native script clock acceptance

> Autonomously AI-generated evidence; acceptance covers the clock bridge only.

The native helper and Qt invokable expose process-relative steady milliseconds.
Direct source review confirms no wall clock or timer-count approximation. Native
JavaScript tests verify finite nondecreasing samples, progression while script
timers cannot run, and a shared origin across interface replacement. Both new
tests passed, as did the existing clock resolution test. The broader 43-test
controller-script suite passed; its count includes the two new clock tests.

The isolated custom Mixxx 2.7 application mapping called the native API and
measured progression from 0.000042 to 24.207334 milliseconds. Node independently
received the exact numeric and Unicode diagnostic payloads over virtual MIDI.
The run record binds this evidence to the custom executable and private logs.
All recorded native test and probe artifact hashes were rechecked before this
acceptance. The helper exited, host stopped, and diagnostic bootstrap was removed.

Graph generation 2026-09-13T16:44:03Z reports the helper untracked and related
files changed/partial. Exact source reads supplied the relevant evidence.
See [implementation and limits](../integrations/native-clock.md) and
[run record](../runs/R05-NATIVE-CLOCK.json).

## Required continuation

This accepts only the read-only clock API and its native invocation. It does not
accept production deadlines, cross-process clock mapping, suspend accounting,
queued-action recovery, or musical timing. R12-SUSPEND-RESUME is a required child
of R12; the full reliability gate remains blocked until that work and its native
suspend/resume evidence pass. The clock's platform-dependent suspend behavior is
explicit, and its caller-provided provenance label is not authentication.

> End of autonomously AI-generated evidence.
