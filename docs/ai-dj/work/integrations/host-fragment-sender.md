# Bounded native reply scheduler

> Autonomously AI-generated implementation notes; integration and native proof pending.

The host scheduler is generated deterministically from the bounded Node sender.
The adapter removes Node imports, uses the host wire encoder, translates timeout
scheduling to engine.beginTimer with one-shot callbacks, and uses engine.stopTimer
for cleanup. The generated artifact includes the source SHA-256. Checked exact
substitutions reject source drift, and the compiler verifies the adapted source.

The same four-message, byte/result limits, five-millisecond send slots, deadlines,
partial-send expiry and cancellation rules apply. Native timer creation failure
retires queued state. A timer cleanup failure records a fault while still releasing
queued bytes; any later stale callback sees the closed sender and cannot emit.
No native C++ build or scheduler activation is introduced by this helper alone.

Four host tests cover the maximum payload with Node decoding, cancellation and
stale callbacks, timer creation/cleanup failures, and stalled-timer expiry. The
fake native timers validate interval and one-shot mode. All 175 software tests,
typecheck/build and deterministic regeneration check passed. These are VM checks;
real Qt execution and native MIDI replies remain unverified.

The endpoint must integrate this factory through its lifecycle owner. The old
synchronous endpoint send path is still present, so this helper is not yet a fix
for native large reply bursts. Integration must preserve result/queue semantics,
retire sends on reset and input loss, and prove a maximum native-to-Node payload.

> End of autonomously AI-generated implementation notes.
