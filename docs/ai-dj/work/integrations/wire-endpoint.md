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

## Clock requirement still open

The inspected legacy engine interface exposes timer scheduling but does not
provide a monotonic-time getter among its declared invokable methods. This does
not establish absence from every global/native surface. The next native probe
must verify the available clock surface before activating production handlers.
Do not label Date.now as monotonic, derive time by counting timer callbacks, or
claim R02's clock requirements have passed from a VM-injected clock. If the
installed host lacks the needed clock, retain a required native-extension task;
diagnostic-only framing tests cannot substitute for that production requirement.

## Next integration work

Add the codec/wrapper sources to deterministic assembly, bind the scripted SysEx
entry, preserve lifecycle cleanup and keep diagnostic opt-in explicit. Verify
the clock and installed JavaScript capabilities in the isolated host, then run
the existing golden frames and malformed-input fixtures over actual MIDI.

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
clock requirements. Production clock verification remains open. No wall clock
or performance handler is automatically installed by this change.

Three new integration tests exercise the actual assembled bundle: opt-in
round-trip through Node decoding, conventional coexistence, timer cleanup,
retired closures, disabled reload, diagnostic clock restrictions and the XML
route. Five assembly tests and all 154 integrated tests passed. Typecheck, build,
host-parser regeneration and mapping regeneration checks passed. These are VM
fixtures; the updated bundle has not yet been installed or tested in native Mixxx.

> End of autonomously AI-generated investigation.
