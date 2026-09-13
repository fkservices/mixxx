# Three-mode control contract

> Autonomously AI-generated R15 contract. Types and rules only; no mode reducer,
> host admission, arming UI or performance executor is implemented by this task.

[Mode types](../../../../ai-dj/core/modes.ts) reuse the F06 `PerformanceMode`,
identity, generation and monotonic-time types. The [action](actions.md),
[state](state.md) and [lifecycle](lifecycle.md) contracts remain mandatory.
A mode selection describes policy; it grants no standalone permission to send.

## Permissions

| Operation | AI Only | B2B | Playlist Only |
| --- | --- | --- | --- |
| Read current host state, analyze music, organize local set | Yes | Yes | Yes |
| Save a native playlist | Explicit save intent and verified host operation | Same | Same |
| AI load a deck, mix, seek, trigger cue/loop/effect, jog or change tempo | Current armed authority and all operation guards | Same, plus human ownership wins | Forbidden |
| Ordinary human bass change | Observe and recover toward the current plan after fresh guards | Yield that control for the transition | Observe and record; no AI bass output |
| Explicit Disarm, loss or protocol fault | Always closes performance admission | Same | Preserves latch while already disabled |
| Human control directly in Mixxx or its physical controller | Remains connected | Remains connected | Remains connected |

AI Only may override ordinary human adjustments, but cannot bypass explicit
Disarm, stale state, active-deck replacement guards, operation-specific safety,
unknown outcomes or missing capability. After a manual track load, reconcile the
actual new track and choose a fresh bounded recovery; never replay an old load.
B2B respects that load, invalidates dependent steps and replans from the new song.
Playlist Only may organize the list with AI. It does not operate the decks.

Playlist save policy, music-pool restrictions and review-first/automatic set start
are separate user preferences. None can override the mode or disarm latch.
Human Mixxx operations are observed, not rerouted through the AI service. A
physical input cannot be attributed from a matching feedback value alone.

## State and persistence

`ModeSnapshot` separates selection, performance gate and disarm latch. The gate
is disabled in Playlist Only, and disarmed/reconciling/armed in a mixing mode.
The armed branch requires a clear latch and a trusted reconciliation reference.
Types do not validate trust, freshness or transitions; later runtime code must.

Persist only the versioned `ModePreference`. First launch selects B2B. Every
launch, including one restoring AI Only, creates a new session and startup latch
with performance closed. Never restore an armed flag, pending rearm, grant,
transition queue or reconciliation result from preferences or session history.

Every actual selection change advances `modeGeneration`. Every performance-gate
closure/opening or fresh disarm latch advances `armingGeneration`; every accepted
state mutation advances `revision`. Counters are nonnegative safe integers and
never wrap. Before exhaustion, retire the session disarmed. F06 authority must
match current mode and arming generations plus its own authority, ownership,
plan and cancellation generations. Compare session identity before counters.

Disarm creates a fresh latch ID even while already disarmed. Its command does
not require the UI's expected version, so a stale screen cannot prevent stopping
AI output. Only a deliberate rearm targeting the currently observed latch may
request its clearance. A subsequent disarm supersedes that request. Handshakes,
mode selections, successful feedback and timer expiry never clear a latch.

## Switching barrier

Serialize mode changes with admission on both communicator and host. Close new
performance admission before exposing a new mode generation. Invalidate old
grants, cancel queued transition/performance work, retain release obligations,
and record the barrier. Already emitted actions remain sent or uncertain until
observed; cancellation cannot undo their effects. No reverse fader movement,
compensating sync toggle, deck stop or replay is implied by a mode change.

| Starting state and input | Required result |
| --- | --- |
| Armed AI Only selects B2B, or armed B2B selects AI Only | Close old admission, change epochs, reconcile, then continue automatically under fresh authority; no extra rearm when the latch is clear |
| Any mixing mode selects Playlist Only | Close admission immediately, cancel pending performance, retain latch and human holds; preserve existing playback |
| Playlist Only with clear latch selects a mixing mode | Selection records start intent; reconcile before opening performance |
| Playlist Only with a latched disarm selects a mixing mode | Remain disarmed; selection cannot clear the latch |
| Disarmed mixing mode changes selection | Keep its latch and closed gate |
| Operator rearms a mixing mode with the current latch ID | Keep latch during reconciliation; atomically clear it and open only on current successful reconciliation |
| Operator requests rearm in Playlist Only | Reject as not a mixing mode; keep selection and latch |
| Operator selects the already selected mode | Idempotent selection; no epoch advance, queue reset, start intent or implicit rearm |
| Another selection arrives during reconciliation | Retire that reconciliation, advance the selection epoch, reconcile only the new choice; never revive a retired request |
| Disarm, host loss, clock fault or resume occurs during reconciliation | Retire the request and latch disarm; late success cannot reopen performance |

Reconciliation has a 2,000 ms monotonic deadline. Failure/timeout leaves a fresh
`reconciliation-failed` latch unless a more specific fault already latched one.
A failure cannot replace a newer operator latch. No delayed automatic retry may
start performance afterward. Explicit rearm begins a new bounded request.

A pending start/continue intent survives a superseding mixing-mode selection
only within the same uninterrupted, clear-latch reconciliation chain.
It never survives a fault, disarm, restart or a return to Playlist Only. A later
Playlist Only-to-performance selection is its own deliberate start intent.

Every ready result must match the current session, complete expected version,
request ID and pending intent. Its evidence request ID must equal that same ID.
Resolve host/connection/capability/snapshot/state references against trusted
current state, on the named local clock with a proven mapping for host times.
Require finite ordered times and fresh unexpired observations under F06/F07.
Recheck manual holds, pending operations, cleanup and current track identities
at consumption. Mode version equality alone does not prove those are unchanged.
Fresh normal authority is still required separately for each new action.

## Human ownership across switches

In B2B, a bass intervention immediately cancels AI output for that resource and
dependent conflicting steps. Keep the hold for the rest of the actual current
transition, after touch release and the configured quiet interval without input
(3 seconds by default),
and reclaim only at a later real transition start after fresh reconciliation.
The quiet interval alone never permits takeover in the same transition. Missing
touch-release evidence is an explicit inference/uncertainty, not invented touch.
Latched manual transport intervention follows its stronger ownership policy.

Mode changes preserve human-hold records, transition identity and pending manual
track changes. A synthetic transition ID or mode toggle cannot create a later
musical boundary. AI Only applies its AI-priority policy to ordinary parameter
holds after reconciliation, but does not erase their records. Returning to B2B
in the same transition restores their protection. Entering Playlist Only also
preserves holds; selecting B2B later does not reset the quiet interval or history.

Release cleanup can finish an already accepted momentary lease after mode changes
or disarm, under its exact release-only authority and host guards. It cannot
create another press, change an unrelated control or claim a transition finished.
Unresolved cleanup blocks conflicting new actions and is shown as unresolved.
Recording raw/semantic session events continues across all modes and disarm.
History replay never feeds ModeCommand or performance admission.

## Contract walkthroughs

1. AI Only, bass reduced by user, transition queued: observe actual bass, retire
   stale assumptions and recover with a new guarded action if still armed. A
   simultaneous switch to B2B first cancels the queued action; preserve the bass
   intervention and its transition hold before granting new B2B work.
2. B2B, bass reduced during transition T: no further AI bass commands in T, even
   after 3 seconds. Switch to AI Only: cancel old queue and reconcile before a
   fresh AI-priority action. Switch back before T ends: the human hold still
   blocks bass. At actual T+1, reclaim only after release, quiet and fresh state.
3. Playlist Only, user mixes and lowers bass: observe/record, no AI deck load or
   bass command. Selecting B2B with a clear latch requests fresh reconciliation
   and respects that hold. With a user/startup latch it stays disarmed instead.
4. An old ready result arrives after Disarm or a second mode selection: mismatched
   request/version cannot reopen admission. Even an identical desired bass value
   does not revive the cancelled action or prove who changed it.

These walkthroughs validate the contract against the requested policies. Runtime
validation, reducer tests, host admission, UI behavior and measured handover are
separate required tasks; this document is not evidence that they already work.

> End of autonomously AI-generated R15 contract.
