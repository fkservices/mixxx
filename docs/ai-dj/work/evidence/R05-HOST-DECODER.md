# R05 host decoder

> Autonomously AI-generated implementation evidence; native endpoint validation remains pending.

The deterministic build script adapts the existing R04 parser into an isolated
host helper, `AIDJ.createWireParser`. Checked source substitutions replace wide
integer conversion, strict Unicode decoding and timer ownership. The installed
TypeScript compiler emits ES2015 JavaScript; generation records the source hash
and rejects stale or unsupported adaptation points. `--check` compares exact
generated output without rewriting it. Only a newly created temporary directory
is used for compilation and it is removed in the build's cleanup path.

The host parser preserves 128-bit sessions with a base-16 accumulator, decodes
safe-integer sequence fields without BigInt, validates UTF-8 without TextDecoder,
and uses the host timer API for idle expiry. Its retained R04 logic enforces
frame/fragment bounds, canonical packing, checksums, fixed opcode roles, strict
JSON, four reassembly slots, deadlines, diagnostic limits and generation checks.
Completed decoded payloads remain untrusted semantic data. No handler or setter
is invoked by this module, and it does not send MIDI.

The parser expects bounded Uint8Array chunks. The future endpoint wrapper must
validate native callback length before allocating/copying a larger input and
provide its correct clock and generation. Caller disposal closes the parser and
stops its host timer; timer/cleanup failures must be surfaced by that wrapper.

## Validation

Six conformance tests passed. Actual generated host code and the Node parser
were compared for numeric, Unicode and JSON payloads, full-width identities,
byte-by-byte delivery, realtime interleaving, maximum 65,536-byte reassembly,
out-of-order/duplicate fragments, invalid UTF-8 and JSON, checksum errors,
capacity limits, expiry, stale generations, MIDI reset and clock regression.
The host timer fixture expired idle partial data and was removed on close.
The reproducibility test regenerated and compared the checked-in artifact.

The integrated suite passed all 142 tests with zero failures. Typecheck, build
and whitespace checks passed. The new files had no graph coverage and were
reviewed directly. Tests run generated JavaScript in Node VM contexts with a
mock host timer; they do not establish installed Qt compatibility, native MIDI
callback behavior, realtime timing or actual Mixxx effects.

## Acceptance boundary

Only `R05-HOST-DECODER` is accepted. R05 still needs its allowlisted endpoint
wrapper, semantic-admission boundary, lifecycle integration and installed-host
validation. Cue observation transport and native manual-CUE checks remain open.

> End of autonomously AI-generated implementation evidence.
