# R05 host encoder

> Autonomously AI-generated implementation evidence; installed host execution remains unverified.

The pure `AIDJ.encodeWire` helper implements R01 framing using host-compatible
JavaScript syntax, arrays, ArrayBuffer and DataView. It needs no Node APIs,
BigInt or TextEncoder. A base-128 digit accumulator preserves the full 128-bit
session token without rounding it through a Number. Safe-integer arithmetic
preserves sequence values through 2^53 minus one. Payloads fragment at 512 bytes,
use the frozen seven-bit packing and CRC, and obey the 65,536-byte maximum.

Diagnostic numeric and text opcodes require explicit opt-in. Standard opcodes
retain their fixed direction and JSON encoding. Unicode conversion rejects lone
surrogates; numeric conversion rejects nonfinite and noncanonical negative zero.
Bounded JSON serialization reads property descriptors and rejects accessors,
hidden fields, callable values, cycles, sparse/extended arrays, invalid strings
and depth/node/byte excess. It does not call getters or toJSON during ordinary
plain-object serialization.

This helper accepts trusted host-owned objects, not hostile JavaScript objects.
Unlike Node's `util.types.isProxy`, host-compatible reflection does not provide
reliable Proxy detection; passing a Proxy may execute its reflection traps.
The receive path must decode bytes into bounded plain data and apply semantic
admission. No external JavaScript object or control handler belongs at this
encoder boundary. The helper returns caller-owned byte arrays and performs no
MIDI send, host mutation, handshake, authorization or action dispatch.

## Validation

Six host-codec tests passed. Both frozen golden vectors matched exactly. Complete
frames matched the Node encoder for all standard allowed opcode roles, selected
finite binary64 values, Unicode crossing a fragment boundary, 0–65,536-byte
boundary cases, full-width session tokens, wide sequences and exact JSON limits.
Invalid headers, directions, diagnostics, Unicode, numbers and JSON shapes were
rejected. Fixture accessors and toJSON counters remained zero.

The integrated suite passed all 136 tests with zero failures. Typecheck, build
and whitespace checks passed. Direct source review was used because graph
coverage reported the new files missing. VM tests establish codec behavior on
Node's JavaScript engine, not actual Qt compatibility or native MIDI operation.

## Acceptance boundary

Only `R05-HOST-ENCODER` is accepted. R05 still requires its bounded host decoder,
allowlisted dispatch wrapper, shared decode vectors, malformed-input protection
and installed-host checks. Cue telemetry transport and native manual-CUE tests
remain required. No connection or latency milestone passes from these tests.

> End of autonomously AI-generated implementation evidence.
