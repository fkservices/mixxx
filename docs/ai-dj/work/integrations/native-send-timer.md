# Native MIDI send timer

> Autonomously AI-generated implementation notes; native validation completed, acceptance review pending.

The maximum queued native reply failed in the staged app at revision 6a40312.
Only 37 of 128 reply frames were sent before expiry; the smaller seven-frame
reply arrived intact. The log records 45 timer clamp warnings. Source confirms
that legacy `engine.beginTimer` raises intervals below 20 ms to 20 ms.

The new opt-in `engine.beginMidiSendTimer(callback)` requests a fixed five-ms
Qt precise timer, always one shot. It accepts only callable values and shares
existing `stopTimer`, callback dispatch and interface destruction cleanup.
Legacy `beginTimer` is unchanged. The host adapter requires the new API; absence
faults and retires its bounded queue rather than falling back to slower timers.
The sender still checks deadlines and sends one frame per callback without
catch-up bursts. A precise timer request is not a realtime delivery guarantee.

Native tests inspect the actual registered interval and timer type and check
one-shot execution, cancellation and invalid callback rejection. Software tests,
typecheck and build pass (177 tests). Native build session 36802 exited zero.
The initial expanded native run passed 61/65 tests, including both new timer
tests. Four old tests used a timer-ID control capped at 50; Qt IDs exceeded it.
The fixture now supports positive int IDs plus its ten-unit callback marker.
All ten timer tests passed after rebuilding the test target. The other 55 tests
passed in the initial run; these overlapping runs are not 75 unique tests.

The staged app delivered exact 3,500- and 65,536-byte replies using an explicit
5,000 ms admission deadline. All 135 incoming and 135 outgoing frames matched
native logs. The maximum reply spanned 808.31 ms at the receiver, with no
overflow or timer clamp warnings. The sender's 900 ms partial-send limit was
unchanged. The default 900 ms admission deadline expired at 124/128 frames
because it also includes encoding and queue time; callers must budget those
costs explicitly. This is one diagnostic run, not a throughput or latency SLA.
See [native timer record](../runs/R05-NATIVE-SEND-TIMER.json) and
[reply run history](../runs/R05-HOST-FRAGMENT-SENDER.json). Native mid-reply
cancellation and fault lifecycle replay remain with the host sender task.

> End of autonomously AI-generated implementation notes.
