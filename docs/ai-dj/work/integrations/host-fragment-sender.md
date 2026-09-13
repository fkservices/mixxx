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

The endpoint now integrates the factory in an eight-fragment mapping. The old
synchronous send loop has been removed. `sendWire(message, deadline)` returns
`{id, queued, delivery: "unconfirmed"}`; it does not claim frames were sent or
observed. An omitted deadline uses 900 ms from admission. `cancelWireSend(id)`
cancels pending output; `drainWireSendResults()` returns bounded local send
results. Callers must drain results to avoid filling the 32-result admission cap.
Later outcome reconciliation must still establish actual observed delivery.

The sender is closed on endpoint fault and shutdown. Each write checks endpoint
usability, preventing a queued callback from continuing after reset or input loss.
Integration tests cover cancellation, reset, overflow notification, shutdown and
stale callbacks. All 176 tests, typecheck and build passed. Native maximum reply
verification remains pending; VM output alone does not establish Qt throughput.

The native run at 6a40312 invalidated the assumed timer cadence: legacy timers
clamp to 20 ms, and the maximum reply expired at 37/128 frames. The seven-frame
reply arrived exactly. The failure is preserved in the native run record.
The adapter now requires `engine.beginMidiSendTimer`, an opt-in fixed five-ms
one-shot API; native rebuild and replay are tracked by R05-NATIVE-SEND-TIMER.
Earlier VM success is not native maximum-transfer acceptance.

The rebuilt app subsequently delivered both complete replies with an explicit
5,000 ms admission deadline: 135 frames matched in each direction, maximum
reply span 808.31 ms, no overflow or clamp warnings. The 900 ms partial-send
limit remains unchanged. With the default admission deadline, the same new
timer expired at 124/128 frames; queue deadlines must budget encoding costs.
[Native run history](../runs/R05-HOST-FRAGMENT-SENDER.json) preserves all three
outcomes. Native cancellation/fault/shutdown during a queued reply still needs
verification before this task is accepted.

> End of autonomously AI-generated implementation notes.
