# M11 service-core evidence

> Autonomously AI-generated implementation evidence at the user's request.

Input revision `fb10682`. M11 was split into M11-SERVICE and M11-CLI because the persistent service core and separate IPC client/capture writer require distinct integration checks. The parent remains incomplete until both close. Coordinator implementation; no runtime lease or live endpoint change.

[Service core](../../../../ai-dj/main.ts) accepts an injected M02-compatible transport opener, clock and caller-supplied diagnostic context. It defaults disarmed. Bounded single-line commands support explicit arm/disarm/status and manual fixture play/volume/crossfader setters. It rejects cue and sync with host-guard-required, unknown controls, malformed/range-invalid data and multiline/oversized requests. The returned service object owns transport lifetime; closing it is explicit and idempotent.

The conservative local store decodes raw feedback, requires current present status before accepting values, clears values on unknown/unavailable presence, and independently expires presence and values after 500 ms. A refresh of presence alone cannot refresh the value. A requested value never updates observed state. Status labels both raw observation and supplied host context as unverified; this is not an F07 authoritative-state store or the production AI executor.

F12 bounded diagnostics record incoming and outgoing raw packets, then a separate command-sent event only after transport send returns. The outgoing raw record precedes the send and is not proof of delivery. Manual command/attempt IDs identify local fixture attempts, not production semantic actions or actor attribution. The source tag identifies the communicator route. Overflow reports an explicit capture gap and disarms. Transport loss, send uncertainty and invalid monotonic clocks latch disarm/loss; no reconnection, retry or automatic rearm occurs. Context validation uses a temporary discarded buffer before opening a transport; it does not fabricate a retained host observation.

[Four integration tests](../../../../ai-dj/test/integration/conventional.test.ts) use fake transport to verify disarmed rejection, bytes and independent returned state, explicit sent records, value-before-presence rejection, unknown clearing, exact 500 ms expiry, stale values despite new presence, loss/send failure, bounded capture gaps, invalid commands and cue/sync guard rejection.

| Local check | Result |
| --- | --- |
| `npm test` | 96 passed |
| `npm run typecheck` | Passed |
| `npm run build` | Passed |

Graph coverage was missing/untracked for new service/test and diagnostics paths in generation `2026-09-13T16:44:03Z`; direct source and contract reads supplied the implementation evidence.

## Required continuation

M11-CLI must add bounded local IPC, durable capture draining, actual native startup and a separate client. Its acceptance requires showing that closing a client leaves the service and transport connected. No such process/client proof is claimed here. The current diagnostic keeper is unchanged and still capped at 16 packets. Production mode/ownership/track guards, semantic action dispatch and host evidence reconciliation remain the later executor work; this manual fixture interface does not replace them.

> End of autonomously AI-generated implementation evidence.
