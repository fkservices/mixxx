# M13 cue observer implementation

> Autonomously AI-generated implementation evidence; native integration remains pending.

The host-side factory implements the fixed eight-key, two-deck allowlist from
the [cue observation contract](../contracts/manual-cue-observation.md). It
captures initial values, callback edges and periodic refreshes as separate
records. Callback values are preserved directly so a brief press followed by
release is not replaced by a later zero read. Numeric cue positions retain full
JavaScript number precision with no conversion, clamping or MIDI quantization.

Presence comes from a live connection. Failed connections yield unavailable
records; invalid or throwing reads yield unknown values. Zero remains a real
value only when a connected read succeeds. The factory does not infer user
intent, actor identity, actual preview source or authoritative deck identity.

The collector owns at most 16 connections, one 100 ms refresh timer and 256
queued records. Overflow drops new records and preserves exact first/last lost
sequence and count. A bounded drain returns detached records and a gap report.
Shutdown retires callbacks and attempts all cleanup even if one operation fails.
Restart requires draining prior-generation records and increments generation.
Clock faults and cleanup failure prohibit restarting that instance. A malformed
non-disposable connection handle fails initialization explicitly.

The implementation uses host-compatible JavaScript syntax and no Node runtime
APIs. It has no control setters, MIDI output, self-registration in the assembled
mapping or automatic authority. The transport integration owns factory lifecycle
and must supply a verified clock and drain the queue promptly. Per-control reads
are not an atomic multi-control snapshot.

## Validation and acceptance

Eight synthetic host tests passed, covering fixed subscriptions, precision,
initial/refresh distinction, transient callback edges, presence/unknown handling,
queue overflow, bounded drains, generation retirement, shutdown, clock regression,
timer failure and invalid connection handles. The full integrated suite passed
130 tests; typecheck, build and whitespace checks passed.

New files were absent from graph coverage, so review used direct source and
executable fixtures. This accepts only `M13-CUE-OBSERVER`'s collector scope.
`M13-CUE-TRANSPORT` and `M13-CUE-NATIVE` remain required, and M13 is not accepted.
Nothing here proves installed Qt execution, actual cue callbacks, MIDI transport,
native manual cue visibility, latency or musical quality.

## Version-pinned connection review

Follow-up inspection of Mixxx 2.5.6 confirms the ordinary connection preserves
FIFO delivery; the unbuffered variant skips superseded values. The observer
retains `makeConnection` and now documents why. A ninth observer test explicitly
prohibits falling back to the coalescing API when FIFO connections are missing.
All 151 integrated tests, typecheck and build passed after this review. See
[native integration findings](../integrations/wire-endpoint.md) for sources and
the still-open clock and native-runtime requirements.

> End of autonomously AI-generated implementation evidence.
