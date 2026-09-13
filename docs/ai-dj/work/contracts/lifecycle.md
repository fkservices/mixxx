# Extended protocol lifecycle v1

> Autonomously AI-generated R02 state-machine contract. This specifies required behavior; no live endpoint, reconciler or authority registry is implemented here.

[R01](wire.md) defines bytes. [F06](actions.md) defines actions/outcomes and [F07](state.md) defines observations, identities and continuity. Their exact guards remain mandatory. A valid frame is data, not an admission token. Ordinary MIDI and the current manual fixture service cannot claim these extended guarantees.

## Connection state and automation state

Keep connection state separate from armed/mode/ownership state. Receiving data, finishing a handshake, restoring a snapshot, switching modes or seeing a matching value never clears a latched disarm.

| Connection state | Allowed work | Exit condition |
| --- | --- | --- |
| Disconnected | Local history/UI and explicit disarm; no performance sends | Open exact intended endpoints; new local connection generation |
| Negotiating | HELLO/WELCOME, bounded diagnostics, local disarm | Matching challenge, supported protocol and exact profile context |
| Synchronizing | Capability pages, snapshot request/pages, heartbeats, disarm and scoped cleanup | Complete validated catalog and baseline; trustworthy freshness/context |
| Ready | Validated semantic actions subject to independent authority and deadlines | Any gap, loss, identity/configuration change or protocol conflict invalidates affected readiness |
| Recovering | Cancel pending performance; snapshots/handshake as required, diagnostics and eligible cleanup | Fresh validated context/baseline; recovery still leaves disarm latched |
| Closed | No retained frame buffers, subscriptions or callbacks | A deliberate new connection begins a new generation |

Each transition is serialized in the communicator, with host admission guarded at the actual host dispatch point. A Node-side check followed by an unguarded later host write does not satisfy this contract. Missing atomic host support leaves that operation unavailable and visible as an extension requirement.

Only one controlling session is active for the configured AI endpoint. A second HELLO cannot silently evict or seize an active session. It receives a bounded busy result only after the request is recognized as a well-formed negotiation message. Recovery takeover must retire the old session and its queued work under a deliberate local operator decision or verified loss policy. A physical controller remains an independent source; it does not compete for the AI protocol session token.

## Negotiation and context

HELLO uses frame session zero, sequence zero and opcode `01`. Permit one outstanding challenge per endpoint generation and at most one new attempt per second. Timeout after 2,000 ms; close the attempt, stay disarmed, and retain a bounded failure reason. No performance request is queued for automatic execution when negotiation eventually succeeds.

HELLO carries a new cryptographically generated 128-bit client challenge, protocol/action/state schema versions supported, requested profile identity, direction role, implementation version, and requested frame/message/catalog bounds. R06 must provide a closed runtime-validated payload schema for these fields; a wildcard profile or arbitrary property bag is not acceptable. Retry creates a fresh challenge and retires the previous attempt. Neither an endpoint name nor a development SysEx prefix authenticates its owner.

WELCOME echoes the exact pending challenge and supplies a fresh nonzero 128-bit session token, host instance identity, host build/version/platform and profile revision, current connection/configuration/capability epochs, state stream identity, supported schemas and negotiated bounds. Its frame token equals the issued token and its host wire sequence is 1. The client accepts it only for its current pending endpoint generation/challenge. Retired or unsolicited WELCOME messages are ignored and cannot update the profile or reconnect the service. A repeated identical WELCOME can be ignored; conflicting data for one challenge retires negotiation.

The host token must come from a suitable native/random provider, never a timestamp or `Math.random` fallback. If the host scripting environment cannot supply the required identity, clock or atomic guards, specify a host extension and keep affected semantics unavailable. Token unpredictability helps separate sessions but does not provide cryptographic authentication against a local MIDI observer. Local endpoint access controls and source provenance remain separate release work.

Successful negotiation does not imply complete capabilities. Enumerate canonical definitions, aliases, exact dynamic instances, explicit presence and evidence dimensions under one immutable catalog revision. Missing required features remain unknown/absent/extension-needed; do not advertise a broad family as verified because one control worked. Configuration or effect/instance changes advance the affected revisions. Discard partial old-catalog work and synchronize again. Negotiated size/depth/node limits are the lower supported limits, never values above R01 maxima.

Wire session tokens map one-to-one to the current F06/F07 session identity and connection context. Retain that binding as trusted session state; a planner cannot mint or substitute it. All later messages carry the current nonzero token. Client wire sequence starts at 1; subsequent host messages start at 2. Increment per new complete message, not per fragment. Never wrap. Retire and renegotiate before exhaustion, cancelling old work. Wire-message sequences are distinct from action sequence IDs and F07 state-stream sequence/revision counters.

## Duplicate handling and message ordering

Wire sequence identifies immutable message content within one session and direction. Different fragments share that identity. Fragments can arrive out of order under R01's bounds. Wire order does not establish state order, actor identity or dispatch authority.

Maintain a bounded recent wire window of 1,024 completed message sequences and their immutable content digests. An identical duplicate is ignored without executing, refreshing observations or extending validity. Conflicting content for a retained sequence invalidates the session. A completed sequence below the window is stale and cannot execute again. Missing sequences inside the window may arrive late but must still pass their semantic deadlines and epoch checks. Never wait for missing bulk-data sequences to process a current disarm or heartbeat. R11 must implement and test the window, digest identity and rollover arithmetic; the framer alone supplies no replay protection.

Action identity is separately `(sessionId, actionId, action sequence)`. Host admission maintains an increasing action-sequence high-water mark and a bounded cache of 4,096 recent admitted/rejected identities, immutable operation digests and known receipts/outcomes. A new action sequence must exceed the high-water mark. An identical cached repeat may return retained evidence, never re-execute the action. A reused identity with changed content is a protocol conflict. Older uncached action sequences are rejected as stale, not re-executed. Eviction removes detailed response availability, not the no-replay high-water mark. No trigger, load, cue press or relative jog automatically retries after uncertainty. A desired-state retry still requires the exact F06 reconciliation and current guards.

These caches do not substitute for durable session recording. History can retain older outcomes after the bounded live deduplication cache has evicted them. A new session never replays the prior journal or treats old command IDs as fresh work.

## Snapshot transactions and delta races

CAPABILITIES and SNAPSHOT_PAGE carry bounded transactions with explicit `begin`, `items` and `end` phases. Each phase is a separate R01 JSON message; no partial JSON enters state. The transaction includes its unique immutable ID, exact session/host/profile/catalog/stream context, base state revision and state-stream sequence, expected page/item totals, ordered page index and a digest of the exact ordered item bytes. End repeats the immutable identity/totals/digest. Page boundaries cannot split a logical record. The digest is SHA-256 over each items-phase page's exact decoded UTF-8 payload bytes in page-index order, preceded by that page byte length as four unsigned little-endian octets. Begin/end messages are excluded from the digest; items-phase pages do not contain the digest. Preserve original page bytes through validation; do not hash a reserialized object. The sender freezes all pages before publishing begin. R06/R07 must implement closed field schemas before endpoint dispatch; until then these requirements do not authorize arbitrary payloads.

Initial limits: one capability and one snapshot transaction in flight per endpoint; at most 64 pages, 4 MiB retained encoded page bytes, 65,536 total JSON value nodes and 16,384 records per transaction; each page remains below R01's 65,536 bytes, 4,096 nodes and depth 32. Assembly expires absolutely after 5,000 ms or 1,000 ms without a new valid page. Duplicate pages do not extend deadlines. Validate running totals before allocation. Conflicting pages, missing/extra records, invalid references, mismatched context or failed digest discard the whole transaction with an explicit capacity/continuity error. Never partially publish it.

These larger aggregate bounds do not silently expand F08's current single-message validators. R07/R08 must add a bounded aggregate validation path or materialize a validation continuation before accepting paged runtime support. Every existing F07 identity, presence, alias, instance, cross-record and resulting-projection invariant must hold across pages. If a required catalog exceeds supported bounds, report a capacity gap and create explicit expansion work; do not truncate the denominator or accept full coverage.

A host begins a snapshot by freezing a coherent copy of its reconciled projection at state revision r and stream sequence s. Individual readings keep their actual sample times; this is not a claim that all audio controls were physically read at one instant. Copying cannot refresh them. State changes after the freeze continue as deltas based on that immutable baseline. Buffer at most 256 deltas and 1 MiB of encoded delta data while a snapshot is assembling; absolute snapshot timeout still applies. Overflow creates a gap and requests a new snapshot, never drops an old delta and continues.

On valid end, validate and atomically replace the entire F07 context at r/s, then apply buffered deltas in contiguous F07 order. Each must name that snapshot, its exact previous sequence/base revision and current catalog. A missing/conflicting delta prevents Ready state; do not splice across a gap. Snapshot transport phase messages do not consume F07 state-stream sequences, only wire sequences. Every published state delta increments F07 sequence and revision by one. Already accepted newer state cannot be rolled back by a late snapshot or its pages. An empty delta advances order but refreshes no readings.

A same-stream replacement snapshot must advance both sequence and revision. Restart/reconnect/profile change uses a new context and invalidates old state. Omitted entries become unknown or are removed from the projection, never fabricated zero or empty-deck observations. A manual track replacement transaction invalidates all dependent readings and grants atomically, including when the same file is reloaded. A late old-binding reading remains historical evidence and cannot acquire the new binding.

## Outcomes, epochs and cancellation

Keep F06 requested, sent, accepted, observed, uncertain and terminal admission events separate. A host receipt links the specific session/action/attempt and immutable operation; it proves admission only. A matching actual observation can satisfy a condition with `state-only` correlation without proving the action caused it. `request-linked` requires a real host receipt link; human/AI actor attribution independently needs source-event evidence. Ordinary MIDI offers neither automatically.

For a desired-state setter already satisfied by fresh current state, validate capability, context, authority and deadline first, then record an observed state-only result referencing that actual reading, without a new write. Do not fabricate sent or accepted events. Triggers, relative actions and momentary presses cannot use this shortcut merely because position/value happens to match.

Every performance dispatch rechecks mode epoch, arming generation, cancellation group/generation, plan revision, transition identity/ordinal, control ownership grants, host/catalog/instance context and exact deck/track generation. Changes cancel affected unsent work immediately. Already emitted effects remain observable and potentially uncertain; cancellation never implies reversal. Delayed accepted/outcome messages append history but cannot restore old grants, revive an old plan or complete a new track's action.

B2B respects a human's touched control through the current transition. Reclaim requires a later transition, at least three seconds of quiet and fresh state/ownership checks; a quiet timer alone is insufficient. Manual pause/stop is latched until human playback or explicit release. Manual song changes are respected and trigger replanning. AIOnly may override ordinary adjustments only under current armed authority and bounded curves; observed human state is still recorded. PlaylistOnly has no AI performance or load authority. Mode changes cancel old-epoch work but do not clear global disarm.

Local disarm immediately blocks new performance dispatch, cancels queued work and increments arming/cancellation generations before any asynchronous persistence or UI work. A current-session DISARM is processed ahead of ordinary work at the host. Host-supported cue lease cleanup remains eligible under its exact separate cleanup authority; stale note-off against a different track/press is forbidden. Lost cleanup confirmation stays visible as release-unconfirmed. Sync has no automatic opposite-value cleanup. A new Start/rearm requires deliberate operator intent and current readiness; no background recovery can synthesize it.

## Heartbeats, clocks and failure recovery

In Ready/Synchronizing, exchange host and client heartbeats every 100 ms. Each carries current session/context, an increasing heartbeat counter and the peer counter being acknowledged. Only a validated current-session increasing heartbeat refreshes liveness. A duplicate, unrelated MIDI byte, stale observation or outgoing send does not. At 500 ms without valid peer heartbeat, each side independently latches loss/disarm, cancels queued performance and invokes lease/watchdog cleanup. R12 must prove this path in the actual host, including when Node or the UI disappears. These are policy settings, not measured response guarantees.

Heartbeats establish liveness, not observation freshness. Use F07's actual sample time, presence, validity and local clock-mapping rules. Negotiation and periodic challenge exchanges may establish bounded clock-offset intervals from send/receive times and host sampling timestamps. Use worst-case age and expiry across the entire proven interval, including proven clock drift; do not treat half the round trip as an exact offset. No proven mapping/drift bound means clock-unmapped uncertainty and no time-sensitive admission. Never compare host monotonic values directly to Node's `performance.now()` or wall time. R06/R07 must validate clock support; unsupported host telemetry remains a required extension.

On transport close, host restart, endpoint generation change, clock failure, conflicting identity or essential-state gap, latch disarm and invalidate pending readiness. Preserve history and unresolved outcomes. Stop sending performance commands; expire host leases through their watchdog paths. Recovery opens a new session/context as needed, rebuilds capabilities and atomically installs a fresh snapshot. Essential feedback restored does not automatically rearm, retry a prior action, restore a prior track or resume a curve. UI closure alone does not close the independent communicator service.

## Required race walkthroughs

1. Snapshot freezes revision 100/sequence 40. A volume change becomes delta 41, base 100/revision 101 while pages arrive. Consumer buffers it, validates snapshot end, installs revision 100 and applies delta 41 atomically. If delta 42 arrives with 41 missing, consumer reports a gap and stays disarmed until a new snapshot; it never infers the missing value.
2. Action a requests play for track generation 7. A human loads another track, atomically advancing to generation 8 and cancelling old grants. A late accepted/result for a belongs to generation 7 history only. No replay or old-track restoration occurs; fresh generation-8 state drives replanning.
3. A valid desired volume setter requests 0.4 while fresh actual state is already 0.4. The executor records state-only satisfaction using the original observation identity and sends nothing. The reading's age does not reset. If it is stale or tied to a former track, the shortcut is unavailable.
4. An admitted cue press loses its client. The host heartbeat/watchdog disarms and retires that exact lease. If confirmation cannot be obtained, the client records unresolved cleanup; it never releases an unrelated new press. A history viewer may display these events but has no dispatch path.

R02 acceptance is these semantics and race review. R06–R12, mode/ownership tasks and native runtime gates must implement and prove them before the extended protocol can control a live set.

> End of autonomously AI-generated lifecycle contract.
