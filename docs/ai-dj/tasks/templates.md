# Expansion templates

> Autonomously AI-generated templates. Bind every parameter before dispatch.

[Dispatch rules](../WORKER-TASKS.md) require concrete child IDs, exact ownership, dependencies, evidence and deadline monitoring. Templates do not constitute completed work.

## INV-PAGE: Inventory one bounded feature page

**Worker:** L1 / `gpt-5.6-luna` / medium. **Budget:** 25 minutes, maximum 30.

**Scope:** At most twenty canonical rows or one smaller source scope.

**Bind:** parent_id, family, cursor, exact_paths, profile

**Perform:**

1. Continue from recorded cursor and exact version using graph/coverage then source fallback.
2. Record aliases, instances, UI routes, gaps and next cursor.

**Validate:**

1. No unverified negative/exhaustive claims.
2. Mark end only after bounded source/menu/runtime cross-check.

## INV-MERGE: Merge one bounded inventory or expansion batch

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes, maximum 30.

**Scope:** At most twenty input pages/rows; continue if more.

**Bind:** parent_id, input_ids, output_path, cursor

**Perform:**

1. Deduplicate canonical IDs without dropping aliases or gaps.
2. Preserve all cursors and allocate next merge page.

**Validate:**

1. Every input represented and coverage dimensions independent.
2. Closure requires every page terminal and expected families/instances accounted for.

## OP-SPEC: Specify one host service operation

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes, maximum 30.

**Scope:** One narrowly defined host action/read and confirmation.

**Bind:** parent_id, operation, exact_symbols, exact_paths, capability_id

**Perform:**

1. Verify exact host symbols/threads/lifetimes with graph and missed-range reads.
2. Freeze request, outcome, UI observation and cancellation; allocate BUILD/TEST.

**Validate:**

1. No arbitrary function dispatch or live DB writes.
2. Bound payloads, timeouts, ownership and actual evidence.

## OP-BUILD: Implement one specified host operation

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes, maximum 30.

**Scope:** One method/handler or smaller; split bridge wiring if needed.

**Bind:** parent_id, spec_id, exact_paths, focused_checks, capability_id

**Perform:**

1. Implement frozen service route on correct thread, preserving Qt ownership.
2. Add bounded MIDI response and host notifications; submit entrypoint change to integrator.

**Validate:**

1. Focused host unit/harness checks for errors/cancel/lifetime.
2. Build via durable job; no waiting past worker cap.

## OP-TEST: Verify one host operation in Mixxx

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes, maximum 30.

**Scope:** One operation and one success/failure pair.

**Bind:** parent_id, build_id, exact_paths, profile, operation

**Perform:**

1. Use accepted build/profile and capture request, observed identity/result and native UI.
2. Exercise one relevant stale/error case.

**Validate:**

1. No accepted-as-applied substitution.
2. Record revision and causal/UI evidence or explicit failure.

## CAP-SPEC: Specify one capability action and feedback

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes, maximum 30.

**Scope:** One feature instance or a proven uniform small group.

**Bind:** parent_id, capability_id, instance_ids, exact_paths, inventory_revision

**Perform:**

1. Freeze semantic/MIDI mapping, units, readback and visible host surface.
2. Decide existing control route or demonstrated OP gap; allocate child chain.

**Validate:**

1. Canonical ID and runtime profile match inventory.
2. Include permissions, dangerous-action explicit intent, and negative/release tests.

## CAP-BUILD: Implement one capability adapter

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes, maximum 30.

**Scope:** One mapping/decoder pair, exact owned files.

**Bind:** parent_id, spec_id, exact_paths, capability_id

**Perform:**

1. Implement frozen command/feedback mapping and semantic label.
2. Retain raw bytes, correlation and source uncertainty.

**Validate:**

1. Focused range, malformed, unavailable and release fixtures.
2. No unsupported capability fabricated from zero-valued reads.

## CAP-TEST: Verify one capability contract

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes, maximum 30.

**Scope:** One action/readback contract and failure case.

**Bind:** parent_id, build_id, exact_paths, capability_id

**Perform:**

1. Run focused host/Node contract checks and integration on accepted fragments.
2. Register evidence against command and feedback dimensions.

**Validate:**

1. Handle rejected/unchanged/stale/relative or momentary semantics as applicable.
2. Contract success is not runtime/native-UI evidence.

## CAP-RUNTIME: Prove one feature in actual Mixxx

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes, maximum 30.

**Scope:** One capability or small proven-equivalent instance group.

**Bind:** parent_id, test_id, exact_paths, capability_id, profile

**Perform:**

1. Exercise command, physical/manual change, returned state and native UI; audio when material.
2. Verify active version/profile and store evidence.

**Validate:**

1. Mark each of four dimensions independently with artifact IDs.
2. Unsupported/missing UI gets an explicit host-extension follow-up, not a denominator deletion.

## ANALYSIS: Implement one prepared analysis adapter

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes, maximum 30.

**Scope:** One feature/provider and bounded fixture batch.

**Bind:** parent_id, feature, provider, exact_paths, fixture_ids

**Perform:**

1. Verify current official API and local resource requirements; freeze source/confidence/units.
2. Implement isolated adapter and fingerprinted result; long jobs use JOB templates.

**Validate:**

1. Compare to reference markers and handle missing/low confidence.
2. No invented tempo/lyrics/waveforms from MIDI.

## SCHED: Specify one timing-failure correction

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes, maximum 30.

**Scope:** One measured deadline failure, no broad native rewrite.

**Bind:** parent_id, failed_gate, exact_paths, correction

**Perform:**

1. Use failed timing evidence to isolate required host/native scheduling operation.
2. Specify one bounded correction and allocate OP/CAP build/test children.

**Validate:**

1. Preserve TS contracts and audio-thread rules.
2. Re-run same measured gate; language choice alone is not proof.

## JOB-LAUNCH: Launch one durable long job

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes, maximum 30.

**Scope:** Launch and check readiness only.

**Bind:** parent_id, job_id, exact_paths, command, recipe, lease

**Perform:**

1. Record exact argv/cwd/revision/profile/log/PID-or-session/start/output manifests and intended end.
2. Assign lease to the job, not worker; register next observer.

**Validate:**

1. Handle exists or terminal error recorded.
2. No duplicate live job and no launch-as-success claim.

## JOB-OBSERVE: Observe an existing durable job

**Worker:** L1 / `gpt-5.6-luna` / medium. **Budget:** 25 minutes, maximum 30.

**Scope:** At most twenty minutes observation; shorter polls allow status updates.

**Bind:** parent_id, job_id, handle, output_cursor, exact_paths

**Perform:**

1. Read the same handle, output cursor and progress; never restart on timeout.
2. Save cursor/status and next observer if still running.

**Validate:**

1. A worker timeout is not job failure or completion.
2. Verify process identity before any explicit stop.

## JOB-REVIEW: Review one job result or evidence page

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes, maximum 30.

**Scope:** One terminal status or at most ten flagged excerpts.

**Bind:** parent_id, job_id, handle, exact_paths, expected_outputs, cursor

**Perform:**

1. Read exit code/artifact manifest and compare exact gate criteria.
2. Continue paginated reviews if needed, linking all reviewed ranges.

**Validate:**

1. Missing artifact or unknown exit cannot pass.
2. Publish actual revision and unresolved evidence.

## FIX: Fix one reproduced failure

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes, maximum 30.

**Scope:** One root cause with an exact reproduction.

**Bind:** parent_id, failure_id, exact_paths, reproduction, checks

**Perform:**

1. Reproduce on accepted baseline; own exact files.
2. Make smallest fix then run focused checks and affected integration gate.

**Validate:**

1. Failure reproduced before and absent after.
2. No unrelated edits or weakened gate.

## SPLIT: Split unfinished work before cap

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes, maximum 30.

**Scope:** Handoff and allocate bounded continuation only.

**Bind:** parent_id, exact_paths, remaining_scope

**Perform:**

1. Record current revision, actual edits/results, remaining checks and job handles.
2. Create children with exact dependencies/ownership and <=25-minute estimates.

**Validate:**

1. Parent stays incomplete until required children accepted.
2. No clock reset on the same worker to bypass thirty-minute cap.

## INTEGRATE: Integrate a small accepted fragment batch

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes, maximum 30.

**Scope:** At most three accepted fragments and one entrypoint.

**Bind:** parent_id, child_ids, exact_paths, entrypoint, checks

**Perform:**

1. Acquire package/mapping/UI entry lease; apply only reviewed fragments on current integrated revision.
2. Reconcile interfaces and run affected tests/typecheck/build.

**Validate:**

1. Do not revert concurrent edits.
2. Record source commits and integration evidence; stale child validation is insufficient.

> End of autonomously AI-generated templates.
