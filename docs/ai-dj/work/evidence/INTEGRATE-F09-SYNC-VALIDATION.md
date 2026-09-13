# Sync action validator integration evidence

> Autonomously AI-generated implementation evidence at the user's request.

Input revision: `463ae0712756875d1c5d3d0d9e6742258def2163`. Dependencies F08 and INTEGRATE-F09-SYNC-CONTRACT accepted. Implemented and reviewed by the coordinator; no worker dispatch or runtime lease transfer occurred.

## Implemented behavior

[Validator](../../../../ai-dj/core/validate.ts) dispatches version 1 to the unchanged legacy repertoire and version 2 exclusively to `deck.set_sync_enabled`. Outcome shapes accept versions 1 and 2; all other versions remain invalid. Both sync booleans require performance authority, exactly one sync-context guard, a nonempty roster of at most 16 unique participants, matching deck preconditions, one composite grant per participant and one engine grant. The target must have a known loaded binding.

Every guard fact has a distinct observation ID. The validator checks exact field sets, booleans, generation/ID bounds, enabled/mode agreement, leader consistency, loaded eligibility and numeric limits, empty-peer restrictions, pending-change false and policy limits. Existing bounded plain-JSON parsing, immutable copies, state admission and legacy cleanup behavior remain in place. No new MIDI output, timers, host access or state mutation is introduced.

## Verification

[Tests](../../../../ai-dj/test/core/validate.test.ts) add seven cases containing positive and negative fixture matrices. Coverage includes both booleans, 1/2/16 participants, rejection at 17, a 16-participant envelope with 128-character IDs within the existing transport budget, frozen copies, cross-version rejection, extra fields, unrelated actions/resources, cleanup authority, PlaylistOnly, invalid generations, missing/duplicate/unrelated roster and ownership entries, loaded/empty consistency, leader mode conflicts, duplicate observations across fields/decks, BPM/rate/phase/policy bounds, and all eight outcome statuses.

Using Node/npm from `/Users/faizkhalid/.local/bin`, from `ai-dj/`:

| Check | Result |
| --- | --- |
| `npm test -- test/core/validate.test.ts` | 35 passed, including all 28 prior validator tests |
| `npm test` | 57 passed |
| `npm run typecheck` | Passed |
| `npm run build` | Passed |

An initial invocation incorrectly supplied `--scope`; the launcher forwards arguments to Node, which rejected that flag before running tests. The corrected explicit test-file invocation above passed. The local toolchain path was explicitly selected for subsequent checks.

Graph project `mixxx-ai-dj` reported generation `2026-09-13T16:44:03Z`; coverage for the new validator, tests, actions and capabilities was unavailable/not tracked. Direct source and accepted contract review supplied the evidence instead.

## Boundaries

This validates request structure and internal consistency only. It does not establish completeness against a trusted topology, resolve observations to actual host facts, compare generations with current state, authenticate grants, impose the trusted policy, enforce cross-resource ownership, or authorize a send. Those remain executor/host-operation responsibilities. Outcome/action identity and schema matching must be enforced by the authoritative action registry; accepting an outcome shape does not perform that lookup or prove causation.

The conventional profile remains unchanged pending INTEGRATE-F09-SYNC-PROFILE. Production sync still requires verified topology, telemetry, queue/race protection and effect bounds through the planned host guard. No native UI, audio, latency, controller or musical result is claimed by this integration. Historical contract prose describing pending validator work records its earlier acceptance state; this evidence and the current ledger supersede that status without changing the contract semantics.

> End of autonomously AI-generated implementation evidence.
