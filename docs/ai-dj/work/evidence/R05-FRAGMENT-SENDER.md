# Bounded client MIDI sender acceptance

> Autonomously AI-generated acceptance evidence.

The sole-writer sender bounds messages, encoded bytes and retained results,
reserves result capacity at admission, checks caller generation/deadline and
spaces frames without catch-up bursts. Cancellation, close, send faults and
clock regression retire queued work; partial-send idle/absolute bounds remain
stricter than receiver expiry. Local send results explicitly leave delivery
unconfirmed. Six focused tests exercise these cases, full payload decode,
stalled-loop expiry, reentrant close, queue capacity and unread result pressure.
All 178 current software tests, typecheck and build pass.

Native seven-frame and maximum 128-frame requests reconstructed exactly, with
all 135 frames matching native input logs and no overflow. Native cancellation
stopped after five frames, released queued bytes and prevented dispatch of the
partial message; a fresh seven-frame message then completed. The underlying
connection loss integration must close this sender in later production runtime
work; no session authority or recovery is supplied by this module.

[Native run record](../runs/R05-FRAGMENT-SENDER.json) and
[implementation](../integrations/fragment-sender.md) provide counts and hashes.
This accepts the bounded client sender only. R10 must integrate it as the sole
port writer. Host replies, loaded timing, recovery and musical gates remain
separate; short native receipts were not outbound maximum-message evidence.

> End of autonomously AI-generated acceptance evidence.
