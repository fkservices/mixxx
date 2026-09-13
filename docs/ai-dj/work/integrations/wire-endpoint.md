# Extended endpoint native integration findings

> Autonomously AI-generated investigation. Integration is not accepted.

The upstream 2.5.6 tag resolved to commit
`3ebac449e7e5fe2a0186596657696e87ce8b0e56`. Its legacy script engine wraps
`incomingData` callbacks with a Uint8Array conversion and supplies the original
byte length. Its MIDI receiver invokes this path for a scripted SysEx mapping.
Ordinary short messages follow their existing separate mapping path. Assembly
must add the scripted SysEx XML route and `AIDJ.incomingData` hook while preserving
the existing conventional registrations. These are source findings, not proof
that our new mapping is installed or executing.

Relevant version-pinned sources:

- [Legacy script engine](https://github.com/mixxxdj/mixxx/blob/3ebac449e7e5fe2a0186596657696e87ce8b0e56/src/controllers/scripting/legacy/controllerscriptenginelegacy.cpp)
- [MIDI controller routing](https://github.com/mixxxdj/mixxx/blob/3ebac449e7e5fe2a0186596657696e87ce8b0e56/src/controllers/midi/midicontroller.cpp)
- [Legacy script interface](https://github.com/mixxxdj/mixxx/blob/3ebac449e7e5fe2a0186596657696e87ce8b0e56/src/controllers/scripting/legacy/controllerscriptinterfacelegacy.cpp)
- [Control callback buffering](https://github.com/mixxxdj/mixxx/blob/3ebac449e7e5fe2a0186596657696e87ce8b0e56/src/control/controlobjectscript.cpp)

## Cue edges

The normal `makeConnection` passes `skipSuperseded=false`; the unbuffered variant
passes true and uses a compressing proxy. The cue observer must keep the normal
FIFO connection. Its direct callback-value capture and bounded output queue
then preserve received edges until explicitly reported overflow. A regression
fixture makes the coalescing API throw if used and verifies that a missing FIFO
API produces unavailable records rather than a fallback. No native short-edge
delivery test has passed yet.

## Clock requirement resolved for the custom host

The stock 2.5.6 diagnostic used Date.now only for explicitly labeled diagnostic
framing. The custom 2.7 host now exposes a source-backed steady-clock API, verified
by native Qt tests and actual mapping invocation. Numeric and Unicode payloads
also made a native MIDI round trip with that clock. See the accepted
[native clock evidence](../evidence/R05-NATIVE-CLOCK.md). Caller-provided clock
labels alone remain untrusted; deployment must identify the verified custom host.
Sleep/resume invalidation is required by R12-SUSPEND-RESUME and is not satisfied
by the clock helper or these diagnostics.

## Next integration work

The assembly and initial native golden probes are implemented below. Investigate
the remaining activation integration checks, then complete native JSON, malformed-input, expiry,
reset and lifecycle fixtures over actual MIDI before accepting the endpoint.

## Implemented assembly and activation boundary

The reproducible bundle now contains seven source fragments: four conventional
modules plus the encoder, decoder and endpoint helper. XML adds one scripted
SysEx route; all eleven conventional command registrations remain. The bootstrap
exposes `configureWire`, `incomingData`, `sendWire` and `wireStatus`.

Configuration is explicit, applies to one initialization and is consumed. Reload
without a fresh configuration leaves the endpoint disabled. Shutdown retires its
parser and input closure. The caller supplies a named clock and registered
validators/handlers. Status labels clock provenance caller-supplied/unverified;
declaring a clock kind is not proof that its source has been verified.

A separately labeled diagnostic-wall mode requires diagnostic opt-in, accepts
only diagnostic handler opcodes and refuses semantic output. It can support
bounded framing investigations without pretending Date.now satisfies production
clock requirements. Native clock verification passed for the custom 2.7 host. No wall clock
or performance handler is automatically installed by this change.

Three new integration tests exercise the actual assembled bundle: opt-in
round-trip through Node decoding, conventional coexistence, timer cleanup,
retired closures, disabled reload, diagnostic clock restrictions and the XML
route. Five assembly tests and all 154 integrated tests passed. Typecheck, build,
host-parser regeneration and mapping regeneration checks passed. These are VM
fixtures. The additional native evidence below establishes a narrower runtime result.

## Native diagnostic probe

The seven-fragment bundle initialized in the installed Mixxx 2.5.6 host. The
native probe found ArrayBuffer, DataView, Map, Set and Number.isSafeInteger.
`performance` was undefined, so `performance.now` was unavailable. This does not
prove that every possible native clock surface is absent. Production clock
verification remains required by this integration task.

A private bootstrap explicitly activated diagnostic-wall mode with Date.now and
only opcode 112/113 handlers. The Node virtual-port runner sent two fixed frames.
Native Mixxx decoded them, invoked the diagnostic handlers and encoded replies;
the Node parser received `-1.5` and `é🎧` with identical session and sequence IDs.
The terminal capture confirms two SysEx replies, conventional feedback alongside
them and zero reported transport losses. No performance command was sent.

This proves numeric and Unicode text framing through actual native input/output.
It does not establish native JSON, malformed-input, expiry, reset, capacity,
production timing, authority or musical correctness. The native task remains
planned behind the incomplete integration; this probe is integration evidence.

The initial runner lacked interactive stdin; it was stopped with verified exit
before a replacement with a PTY was launched. Both host processes and both runner
processes exited. The current repository bundle was restored to the isolated
profile without the private activation bootstrap, and the host remains stopped.
Reopen virtual ports before launching the next host fixture. Approved music
files remain available but no current loaded-deck state is claimed.

The [native run record](../runs/R05-ENDPOINT-INTEGRATE.json) contains source,
installed and private capture hashes, payload results, limits and cleanup state.
The progress gallery includes the real enabled-mapping screenshot. Its visual
state alone is not packet or timing evidence.

## Additional assembly review

Two assembled-bundle regressions now cover failed endpoint activation and clock
regression. Duplicate registration makes initialization fail after conventional
modules start; the test verifies zero remaining connections/timers, no setter
writes, and no implicit endpoint restoration on the next initialization. A clock
sample followed by a backward step retires dispatch before its handler runs;
a later valid timestamp cannot revive it. Shutdown clears the remaining resources.

The clock test initially omitted the first sample and therefore did not establish
a regression; correcting that fixture made the intended scenario meaningful.
All 163 software tests, typecheck and build passed. These remain VM evidence;
native malformed-message, JSON and lifecycle cases are still required.

## Native JSON and checksum probe

The custom 2.7 host received a private opcode 9 JSON codec fixture containing
Unicode, a number, a boolean and null. A frame with one CRC byte corrupted
produced `checksum-mismatch` and zero dispatches. The immediately following valid
frame dispatched once; Node decoded the identical object, session and sequence.
The host remained open between rejection and the valid frame. This fixture does
not implement the production opcode 9 service or authorize performance control.

The terminal capture contains one JSON reply. Filtered host logs, probe source,
runner and installed mapping hashes are recorded in the
[partial native record](../runs/R05-ENDPOINT-NATIVE.json). The helper exited with
code zero; the verified host process stopped before restoring the repository
mapping without the temporary bootstrap. No performance message was sent.
Native expiry, reset, capacity and lifecycle cases still remain; this supporting
probe does not accept the native endpoint card or its integration prerequisite.

## Native fragmented-message idle expiry

A two-fragment JSON fixture sent its first frame, waited 600 ms, then sent its
remaining frame. The native 350 ms observation, before that tail arrived, showed
zero incomplete messages and zero retained payload bytes with one pending
diagnostic. The late tail reported `message-timeout` and dispatched nothing.
A fresh sequence sent both fragments and dispatched once; Node received exactly
that new sequence and the complete object, including its 700-byte padding field.

This proves native automatic idle expiry and successful fragmented recovery for
this bounded case. It does not prove every absolute-expiry or saturation case.
The helper and host exited, and the repository mapping was restored. Capture,
probe, runner and filtered native-log hashes are added to the existing partial
native run record. Reset, capacity and lifecycle evidence remain required.

## Native reassembly capacity

Five different sequences each sent only their first fragment. Native observations
showed slot counts 1, 2, 3, 4, 4: the fifth produced `reassembly-capacity`, no
dispatch, and no extra allocation. Stored payload remained 3,092 bytes for four
773-byte messages. After 600 ms, four timeout diagnostics were observed and a
fresh two-fragment sequence completed. Node received only the fresh sequence 15,
with its exact payload. The final parser state retained zero payload bytes.

This verifies the four-slot boundary and recovery at these payload sizes, not
maximum aggregate memory or a long soak. The helper and host exited and the
repository mapping was restored. Hashed artifacts are in the capacity section
of the partial native record. Reset, lifecycle and absolute-expiry cases remain.

## Native absolute deadline and newly observed integration failures

A 3,573-byte JSON message arrived as seven fragments about 180 ms apart. Native
callbacks spanned 1,080 ms, with `message-timeout` on the seventh fragment and no
dispatch. Activity within the idle interval did not extend the absolute deadline.

Two subsequent rapid seven-frame sends each produced only six mapping callbacks
and no complete reply. The precise loss point is unconfirmed; sender pacing alone
must not be treated as a reliability fix. Capture and native receive evidence
need correlation to locate the missing frame before acceptance.

The native host logged incoming MIDI reset (`0xFF`) between those bursts, but no
endpoint reset diagnostic occurred and later input showed the endpoint enabled.
Thus parser-level reset fixtures do not establish native reset handling. The
actual short-message routing must propagate reset to endpoint retirement.

Both findings keep integration unaccepted. No performance handlers were installed.
The helper exited, host stopped, and diagnostic bootstrap was removed. Filtered
logs and capture hashes are in the absolute/reset section of the partial record.

## Native reset routing fix

Source inspection showed PortMidi delivers realtime reset as a short message with
control/value zero. Short messages use exact status/control mappings; the SysEx
route cannot receive that reset. The XML now explicitly maps `0xFF` / `0x00` to
`AIDJ.resetInput`, which feeds reset into the active endpoint parser and retires
it. Other statuses and inactive mappings do not use this route. The eleven
conventional registrations and SysEx registration remain.

The native check received sequence 30 before reset, logged the parser fault on
reset, and rejected sequence 31 with `closed: true` and zero dispatch. Node
received only sequence 30. This fixes the observed reset gap; rapid seven-frame
loss and lifecycle checks remain. All 164 software tests, typecheck/build and
mapping generation check passed. Both native processes exited and the diagnostic
bootstrap was removed. Exact mapping and private evidence hashes are recorded.

## Burst loss localized to native input overflow

The archived full native log contains PortMidi buffer-overflow warnings for both
failed bursts and a subsequent interrupted-SysEx warning. Byte-for-byte comparison
of Node send captures with native incoming frame logs shows frame indexes 0–5
arrived and index 6 was missing in each burst. Each burst contains 4,439 wire bytes,
or 1,110 packed four-byte PortMidi events; the host opens a 1,024-event input queue.
This capacity mismatch is consistent with the explicit native overflow errors.
The input error branch currently logs and returns without notifying the endpoint.

Required continuations R05-NATIVE-INPUT-LOSS and R05-FRAGMENT-SENDER now block R05.
They cover explicit loss propagation/partial-state cleanup and bounded transmission
with deadlines, cancellation and native maximum-message checks. A bigger buffer
or successful paced fixture alone cannot establish safe recovery after lost input.
The full log stays private; its hash and frame-correlation report are preserved in
the run record. No new runtime was started for this read-only diagnosis.

> End of autonomously AI-generated investigation.
