# Native MIDI send timer acceptance

> Autonomously AI-generated acceptance evidence.

The opt-in fixed five-ms precise timer is exposed through the real Qt script
interface, accepts only a function, runs once and uses existing stop/destruction
ownership. The legacy 20 ms timer floor is unchanged. Native tests inspect the
registered interval/type and verify one-shot execution, cancellation and invalid
callback rejection. Both new tests passed. Four pre-existing timer tests clipped
opaque Qt timer IDs at 50; the corrected fixture passed all ten timer tests.
The other 55 selected native tests passed in the initial run.

The isolated rebuilt app sent an exact 65,536-byte reply: 128 frames in 808.31 ms
at the receiver. Both request and reply directions matched 135 native frames
across the two tested payload sizes. This used an explicit 5,000 ms admission
deadline; the 900 ms partial-send bound was unchanged. The default 900 ms
admission deadline expired at 124 frames, a preserved caller-budget limitation.
Missing native API support retires queued state in the software regression.

[Native record](../runs/R05-NATIVE-SEND-TIMER.json),
[maximum reply history](../runs/R05-HOST-FRAGMENT-SENDER.json), and
[implementation](../integrations/native-send-timer.md) identify the evidence.
Only the timer extension is accepted; this is not a realtime timing guarantee,
loaded benchmark, suspend/resume recovery or musical acceptance.

> End of autonomously AI-generated acceptance evidence.
