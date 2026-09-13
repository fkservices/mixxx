# Extended MIDI framing v1

> Autonomously AI-generated protocol contract. R01 freezes bytes and bounds; it does not implement or validate a live host endpoint.

## Scope and identity

Use MIDI 1.0 SysEx on the dedicated local AI DJ virtual ports. The private development prefix is `F0 7D 41 49 44 4A`: non-commercial development identifier followed by ASCII `AIDJ`. This prefix is a routing discriminator, not authentication or proof of sender identity. Do not route these messages to the physical controller or interpret incoming conventional feedback as an extended command.

The development identifier is for local prototyping. The MIDI Association states that `7D` is not for products released to the public; its newer `7C` identifier also excludes custom SysEx data formats. Public distribution needs an appropriate assigned identifier and a versioned prefix migration before release. This is a release requirement, not a purchase request. [MIDI Association identifier policy](https://midi.org/new-midi-association-sysex-id-policies-as-of-oct-15-2025).

Every multi-byte header integer uses fixed-width little-endian base-128 digits: `sum(byte[i] * 128**i)`. Use arithmetic or BigInt, never JavaScript 32-bit shifts for wide counters. All interior bytes are `00..7F`. Values outside the declared range, including nonzero unused top bits, are rejected rather than truncated. No running status, compression, executable strings or general-purpose host-control lookup exists in this format.

## Frame layout

Offsets are zero-based. Hexadecimal is used for constants; lengths and ranges are decimal.

| Offset | Bytes | Field | Constraint |
| --- | --- | --- | --- |
| 0 | 1 | Start | `F0` |
| 1 | 1 | Development ID | `7D` |
| 2–5 | 4 | Project | `41 49 44 4A` |
| 6 | 1 | Frame version | `01` only |
| 7 | 1 | Direction | `00` client to host; `01` host to client |
| 8 | 1 | Opcode | Exact allowlist below |
| 9 | 1 | Payload encoding | `01`, `02` or `03` below |
| 10–28 | 19 | Session token | Unsigned 128-bit integer; last digit at most 3 |
| 29–36 | 8 | Message sequence | Unsigned safe integer, at most 9,007,199,254,740,991; last digit at most 15 |
| 37–39 | 3 | Total decoded payload bytes | 0 through 65,536 |
| 40–41 | 2 | Fragment index | Zero-based, less than fragment count |
| 42–43 | 2 | Fragment count | 1 through 128, exactly `max(1, ceil(total/512))` |
| 44–45 | 2 | Fragment decoded length | 512 except final fragment; final equals remaining bytes; zero only for an empty message |
| 46 onward | variable | Packed fragment | Exactly `n + ceil(n/7)` bytes for decoded length n |
| following payload | 3 | CRC-16 | Little-endian base-128; last digit at most 3 |
| last | 1 | End | `F7` |

Each complete frame is exactly `50 + n + ceil(n/7)` bytes. The maximum is 636 bytes for a 512-byte fragment. No trailing bytes, padding or extra fields belong to a frame. A stream may contain subsequent frames, each parsed separately.

The 128-bit session token is represented at JSON/API boundaries as exactly 32 lowercase hexadecimal characters (most significant digit first, left zero-padded). Convert that integer to the 19 least-significant-first wire digits; do not reverse UUID text bytes by accident. The all-zero token is reserved for pre-session negotiation. It cannot authorize an action. R02 defines negotiation, token issuance, replay scope, sequence start/exhaustion, correlation and host epoch binding. This framing range does not grant permission to send sequence zero or reuse a sequence. Sequence counters are separate per direction, and all fragments of one message share one sequence.

## Opcodes and payload encodings

| Hex opcode | Name | Direction | Encoding |
| --- | --- | --- | --- |
| `01` | HELLO | Client to host | `03` |
| `02` | WELCOME | Host to client | `03` |
| `03` | CAPABILITIES | Host to client | `03` |
| `04` | SNAPSHOT_REQUEST | Client to host | `03` |
| `05` | SNAPSHOT_PAGE | Host to client | `03` |
| `06` | STATE_DELTA | Host to client | `03` |
| `07` | ACTION | Client to host | `03` |
| `08` | ACTION_OUTCOME | Host to client | `03` |
| `09` | HEARTBEAT | Either, checked against ingress role | `03` |
| `0A` | DISARM | Client to host | `03` |
| `0B` | ERROR | Host to client | `03` |
| `0C` | GOODBYE | Either, checked against ingress role | `03` |
| `70` | TEST_NUMBER | Either, diagnostic fixture only | `01` |
| `71` | TEST_TEXT | Either, diagnostic fixture only | `02` |

All other opcodes, opcode/direction pairs and opcode/encoding pairs reject before payload interpretation. The two test opcodes never dispatch performance operations and are disabled in the normal host endpoint. Their vectors exercise the generic codec without pretending a bare number is an authorized action.

Encoding `01` is exactly eight decoded bytes: finite IEEE-754 binary64, little-endian. Reject NaN, infinities and negative zero. Integers in semantic schemas additionally require exact safe-integer/range validation; a finite float alone does not satisfy an action contract.

Encoding `02` is a complete strict UTF-8 string, measured in encoded bytes, not UTF-16 code units. Reject lone surrogates before encoding and malformed, overlong, surrogate or out-of-range UTF-8 on decoding. Preserve exact code points without Unicode normalization. Empty string is valid; no terminating NUL is appended.

Encoding `03` is strict UTF-8 JSON with one top-level object, no BOM, duplicate object keys, trailing content, executable interpretation, nonfinite numbers or silent replacement decoding. Reject negative-zero numeric values. Enforce 65,536 decoded bytes, depth at most 32 (root depth 1), at most 4,096 value nodes including containers, and bounded exact schemas before dispatch. Do not recursively allocate beyond these bounds. A UTF-8 string or JSON token may cross fragment boundaries; decode only after complete validated reassembly. Serialization uses no unnecessary whitespace; wire identity is the exact byte sequence, not a normalized/reformatted object. R02 and later operation contracts define closed payload schemas. Unimplemented schemas are rejected, never passed through to arbitrary handlers.

## Seven-bit packing

Split each decoded fragment into groups of at most seven octets. Emit one high-bit mask first, followed by each octet's low seven bits. Bit i of the mask contains the high bit of octet i. For a short final group, unused mask bits must be zero. Each fragment starts a new packing group. The decoded length determines the final group's size; never infer padding or permit overlong encodings. Empty payload has no mask byte.

Example: decoded `C3 A9 F0 9F 8E A7` (the text `é🎧`) packs to `3F 43 29 70 1F 0E 27`. All six high bits are set, so the mask is 63. Decoding restores the high bits and then performs strict UTF-8 validation.

## Checksum

Use CRC-16/CCITT-FALSE: polynomial `0x1021`, initial register `0xFFFF`, no reflected input/output, final XOR zero. For each byte, XOR `byte * 256` into the register; repeat eight times: if bit 15 is set, left-shift and XOR `0x1021`, otherwise left-shift; retain the low 16 bits after each step. The check value for ASCII `123456789` is `0x29B1`.

Checksum input is every transmitted byte from offset 1 through the last packed-payload byte, in order. Exclude `F0`, the three checksum digits and `F7`. Header lengths, session, direction and opcode are therefore covered. Encode the resulting 16-bit unsigned integer as three base-128 digits. The checksum detects accidental corruption; it is not a MAC, authentication, acknowledgement or protection against another local MIDI sender.

## Bounded stream parsing and reassembly

R04 must accept complete frames or bounded stream chunks without assuming callback boundaries equal frame boundaries. MIDI realtime bytes `F8..FF` may interleave; route them to their independent handler and exclude them from SysEx length/CRC. In particular, reset `FF` must reach the host-loss/disarm policy; it is never a performance sync command. A nested `F0` abandons the partial frame and begins a new one. Any other status byte in the interior abandons the frame and returns to normal MIDI routing. Unmatched `F7` is ignored with a bounded diagnostic counter.

Allow at most 636 retained bytes for one partial frame. Apply a 250 ms absolute timeout from its initial `F0`, using a receiver monotonic clock. Traffic and realtime bytes do not extend the deadline. On overflow or expiry discard the partial frame. Do not scan an unbounded input inside a UI or MIDI callback: the later parser must impose a documented per-callback processing budget and bounded backlog; exhaustion creates an explicit gap and invokes loss/disarm policy rather than silently skipping command bytes.

Validate prefix, version, direction, opcode, encoding, fixed widths, exact lengths and CRC before reserving a reassembly slot. A fragment may arrive out of order. Key slots by ingress endpoint generation, direction, session token and sequence. Opcode, encoding, total length and fragment count must agree across that key; mismatch discards the whole message. An identical duplicate fragment is ignored; a conflicting duplicate discards the message. Neither extends deadlines.

Retain at most four incomplete messages per ingress endpoint, each at most 65,536 decoded bytes plus fixed metadata and a 128-bit received-fragment bitmap. Retained decoded payload is at most 262,144 bytes per endpoint. Reject a fifth slot without evicting a valid message or automatically executing it. Expire incomplete messages 1,000 ms after their first accepted fragment or 250 ms after the last new accepted fragment, whichever comes first. Expiry runs on a timer even if input stops. A clock failure/backward step invalidates all pending data and invokes loss/disarm policy. Endpoint generation change, shutdown or transport loss clears all partial frames and slots.

These are local virtual-MIDI development limits, not measured throughput/latency promises or support for transmitting large messages on physical DIN MIDI. Negotiation may reduce size/concurrency limits, never raise these v1 maxima. Snapshot/capability pagination must keep each message within the bound; larger datasets use explicit page messages and snapshot transactions in R02, not unlimited reassembly. Interleave small command/heartbeat frames ahead of bulk traffic in the later queue implementation; fragment arrival never itself acknowledges or executes anything.

Only a complete payload with all fragments, valid encoding, accepted closed schema and current lifecycle/authority guards can reach a handler. R02/R11 must prevent replay/re-execution of a completed or expired sequence. Until those policies exist, the codec emits validated data only; there is no performance dispatcher.

## Finite rejection outcomes

| Condition | Result |
| --- | --- |
| Foreign manufacturer/project prefix | Ignore as unrelated MIDI; never reply |
| Unknown version/opcode/direction/encoding | Reject frame with bounded local diagnostic |
| Truncated/header-overflow/frame timeout | Discard partial frame; await a new start |
| Noncanonical digits/mask/length or wrong CRC | Reject frame; no reassembly allocation |
| Reassembly mismatch/conflicting duplicate | Drop that message; invalidate pending outcome |
| Fifth slot or backlog overflow | Explicit capacity failure/gap; no execution or silent eviction |
| Incomplete message expiry/endpoint loss | Drop pending bytes; invoke lifecycle loss handling |
| Invalid UTF-8/JSON/numeric or semantic schema | Reject message; no evaluation or partial operation |

Malformed or unauthenticated traffic never generates an automatic error response (avoids echo storms). Valid-session ERROR messages are semantic responses defined by R02, with finite reason codes and bounded detail. Capture rejection counts and gaps under bounded diagnostics, not unbounded raw dumps.

## Golden frames

The following fixtures use session integer 1, sequence 1, direction client-to-host, fragment index 0/count 1. They are codec tests only. Each line is one complete frame; spaces separate octets.

### Finite number -1.5

Decoded payload: `00 00 00 00 00 00 F8 BF`. CRC: `0xD127`. Frame length: 60 bytes.

```text
F0 7D 41 49 44 4A 01 00 70 01 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 00 00 00 00 08 00 00 00 00 01 00 08 00 40 00 00 00 00 00 00 78 01 3F 27 22 03 F7
```

### UTF-8 text é🎧

Decoded payload: `C3 A9 F0 9F 8E A7`. CRC: `0x08B0`. Frame length: 57 bytes.

```text
F0 7D 41 49 44 4A 01 00 71 02 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 00 00 00 00 06 00 00 00 00 01 00 06 00 3F 43 29 70 1F 0E 27 30 11 00 F7
```

## Downstream acceptance

R03/R04 must independently implement and test these vectors, all boundary lengths (0, 1, 7, 8, 511, 512, 513, 65,536 and rejected 65,537), maximum session/sequence, corruption of covered header/payload, unused bits, fragmentation/reordering/duplicates, resource exhaustion, absolute timeouts and strict decoding. R05 must verify the actual Mixxx SysEx input/output binding and exact installed revision. No code/runtime/timing gate is accepted merely by this framing document.

> End of autonomously AI-generated framing contract.
