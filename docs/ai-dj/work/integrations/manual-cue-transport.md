# Diagnostic cue transport

> Autonomously AI-generated implementation checkpoint. Native capture is still pending.

The ten-fragment mapping includes the fixed cue observer and a dedicated diagnostic
stream. `AIDJ.configureCueDiagnostic({diagnostic:true, session, clockDomainId, now})`
configures one initialization. Session is exactly 32 lowercase hexadecimal digits;
the clock label is a bounded identifier. Native deployment must supply the verified
custom host clock. Caller labels do not establish clock provenance.

The stream creates its own endpoint with no incoming semantic handlers. It sends
canonical closed JSON text using existing diagnostic opcode 113. It exposes no
record-injection API. `configureWire` and `configureCueDiagnostic` are mutually
exclusive, preventing two extended senders from interleaving fragments on the port.
Conventional short-message controls and feedback remain installed.

One observer queue holds at most 256 observations. The bridge drains a complete
batch, appends its overflow interval, and retains at most 257 pending records. It
admits only one message at a time and drains the dedicated sender's result queue.
Older observations precede their loss report; newer observations follow it.
The observer can accumulate another bounded batch while the first is sent. Under
load, gaps are expected and reported rather than silently replacing button edges.
The native five-millisecond timer schedules progress without a catch-up burst.

Raw cue positions preserve finite floating-point values, including negative values
and signed zero, without conversion to seven-bit MIDI values or seconds. Host time
and receiver receipt time remain separate. The receiver rejects malformed, duplicate,
noncanonical, wrong-context and reordered records. All events remain unverified
observations, with no inferred human actor or performance authority.

Shutdown, MIDI reset, native input loss and failed transmission retire the stream.
The final tail may be incomplete after a fault: local `sent` counts describe output
attempt completion, never delivery acknowledgement. The current receiver detects
sequence gaps only when subsequent valid records arrive; it does not prove a faulted
stream's final tail arrived. Production heartbeat, reconciliation and capture durability
remain later tasks. Restart needs a new stream instance and fresh mapping configuration.

Validation at this checkpoint: all 189 software tests, TypeScript typecheck/build,
and exact mapping regeneration passed. VM integration drives host callback values
through the actual observer, encoder, sender, endpoint and strict Node receiver.
A 400-callback burst proves overflow ordering; lifecycle tests prove stopped output,
cleanup reporting, default-disabled reload and conventional volume coexistence.
These are software fixtures, not native MIDI, physical-controller, latency or musical
acceptance. M13-CUE-TRANSPORT remains in progress until actual host capture is reviewed;
M13-CUE-NATIVE separately validates manual UI actions and native cue meaning.

> End of autonomously AI-generated implementation checkpoint.
