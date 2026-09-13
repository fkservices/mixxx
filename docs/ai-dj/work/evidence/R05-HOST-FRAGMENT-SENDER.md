# Bounded native reply sender acceptance

> Autonomously AI-generated acceptance evidence.

The generated native adapter shares the bounded client sender implementation,
uses the explicit native five-ms one-shot API and keeps one pending timer.
It preserves queue/result caps, deadlines, partial expiry, cancellation and
unconfirmed delivery semantics. Missing API support and timer failure retire
work. Five focused host tests and assembly regressions cover maximum decode,
stalls, cancellation, stale callbacks, creation/cleanup failure and lifecycle.
The new cleanup-latch regression failed before ddd1dd3 and now passes both
normal shutdown and shutdown after an earlier input-loss fault. All 178 software
tests, typecheck, build and exact generated mapping checks pass.

The rebuilt app returned the entire 65,536-byte payload with all 128 fragments;
135 frames matched in each direction across both sizes. Explicit admission
budget was 5,000 ms and maximum reply span 808.31 ms. Default 900 ms admission
budget can expire during a maximum transfer; encoding and queue time must be
budgeted by the caller. The partial-send bound remains 900 ms.

Native cancellation stopped after six frames, then accepted a fresh message.
MIDI reset stopped after three frames; real PortMidi overflow after four;
production mapping shutdown after six. Those retired endpoints did not reply
to later fresh input. Cancellation/reset/overflow had exact native log/packet
correlation. Shutdown was independently acknowledged by two diagnostic short
MIDI receipts; the first unflushed-log run is retained as limited evidence.
Shutdown was called from a native timer, not an OS crash or physical unplug.

[Maximum reply history](../runs/R05-HOST-FRAGMENT-SENDER.json),
[lifecycle record](../runs/R05-REPLY-LIFECYCLE.json) and
[implementation](../integrations/host-fragment-sender.md) preserve boundaries.
This accepts bounded host sending and mapping lifecycle only. Durable outcome
reconciliation, physical hardware, load/soak, suspend and musical proof remain.

> End of autonomously AI-generated acceptance evidence.
