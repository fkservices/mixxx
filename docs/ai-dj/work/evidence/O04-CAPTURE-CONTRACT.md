# O04-CAPTURE-CONTRACT — backend packet conversion

Autonomously AI-generated implementation and evidence report.

Accepted scope: unreleased session-v1 packet payload, closed payload admission, and bounded observation-only conversion. No native hook or physical-controller integration is claimed.

Implemented in `ai-dj/core/session.ts` and `ai-dj/diagnostics/backend-midi.ts`. Valid backend words always remain evidence, even when their MIDI content cannot be framed. Invalid representations are rejected by the closed payload boundary. Raw derivatives have separate IDs and producer ordering, link their source packet and keep actor/context authority unknown. Constant parser state handles SysEx without accumulating a message. Gaps and context changes retire partial parsing and request downstream pairing reset.

Verification: TypeScript build passed. Full Node suite passed 270/270 tests (log `/tmp/ai-dj-packet-tests.log`). Seven new focused tests passed again after adding filter-context reset and all channel-status families. Coverage includes 1/2/3-byte framing, unused high-byte padding, note-on zero, 80 KiB fragmented SysEx, embedded/standalone real-time messages, EOX padding, malformed statuses/data, duplicate sequence, gaps, endpoint and clock epochs, filter changes, explicit reset, truncation by a new status, signed timestamp wrap, and rejected packet fields/ranges. Existing fixture/recorder tests remained green.

Source basis: pinned native dependency `portmidi.h` PmEvent documentation (lines 754–842). The graph project `mixxx-ai-dj`, generation `2026-09-13T16:44:03Z`, reported no diagnostics symbols and unavailable/untracked TypeScript coverage. Exact session/projection/header source was inspected instead; no graph completeness claim.

Limits: envelopes must already be admitted. Full session import admission is O09. PortMidi supplies no actual short-message length; backend zero-filled missing bytes cannot be distinguished from legitimate zero values. This preserves backend order, not original wire order. Downstream O04 ingress must consume `resetPairing` and perform recorder duplicate reconciliation. Physical capture, filter configuration, native ring/bridge and controller/audio timing remain outstanding.

End of autonomously AI-generated evidence report.
