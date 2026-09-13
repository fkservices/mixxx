# Bounded MIDI fragment sender

> Autonomously AI-generated implementation notes; native acceptance pending.

The TypeScript sender owns a bounded FIFO of at most four messages and 330,000
encoded bytes. Admission reserves one of 32 bounded result slots, so an unread
result stream cannot grow indefinitely. Every request carries a generation and
monotonic deadline. Encoding uses the existing strict wire encoder, with explicit
diagnostic opt-in; queued frames are isolated from later caller mutations.

The scheduler emits at most one frame per 5 ms slot. A late callback never emits
a catch-up burst. Cancellation removes pending work immediately; a cancellation
or close occurring inside the synchronous writer is finalized when that write
returns, preserving attempted/sent counts. Send failures retire the sender and
all pending work with no retries. A send return always means delivery unconfirmed.

A partial send expires after a 200 ms gap or 900 ms total assembly time, before
the host's 250 ms idle / 1,000 ms absolute boundaries. All work also obeys its
caller deadline. Clock regression or failure retires the sender. It must be the
sole port writer; it cannot constrain traffic emitted through another owner.
Later R10 scheduling must integrate this owner, not create a second queue that
can bypass cancellation or deadlines. No authority or performance policy is added.

Six tests cover the maximum 65,536-byte / 128-frame message with exact Node decode,
no same-slot burst, stalled-loop expiry, cancellation, queue/result bounds, stale
generations, clock regression, send failure and reentrant close. All 171 software
tests, typecheck and build passed. The initial readonly-array typing mismatch was
fixed before those checks passed. The timing tests use an explicit test clock;
they do not prove native throughput, OS scheduling or receiver delivery.

Required next checks are actual native seven-frame and maximum-message transfers,
exact byte/frame correlation, no overflow, and native cancellation/loss handling.
The 5 ms interval is a candidate budget, not a demonstrated transport guarantee.
The native host-to-client encoder path still needs bounded transmission review;
this Node sender alone does not bound native replies.

## Native maximum-message proof

The real automatic sender transferred a 3,500-byte diagnostic string (seven
frames) and a 65,536-byte string (128 frames) to the rebuilt native host. Mixxx
validated each string contained only the expected character and returned its
exact length and sequence. All 135 outbound frame byte arrays match the native
incoming frame logs exactly. No PortMidi overflow appeared in this run.

The receipt messages were short: this proves the client-to-host maximum message,
not the native outbound maximum. It is one run per size, not a loaded latency or
soak result. Native cancellation and outbound pacing remain required. The helper
and host exited, and the diagnostic bootstrap was removed. The
[partial run record](../runs/R05-FRAGMENT-SENDER.json) preserves exact evidence hashes.

> End of autonomously AI-generated implementation notes.
