# Implementation worker plan

> Autonomously AI-generated planning document at the user's request.

The active user goal authorizes executing this implementation plan. There are **171 static cards and 17 expansion templates** in [catalog.json](tasks/catalog.json). Their current execution states are recorded in [the ledger](work/state.json). [Rendered cards](tasks/README.md) give steps, checks, ownership and dependencies; [traceability](TRACEABILITY.md) covers every discovery decision. Feature, host-operation, analysis, long-job and defect expansion makes the eventual task count variable.

## Worker selection

The levels below are planning assignments based on models available in this Codex session. Recheck availability at dispatch; these are not speed, price or 30-minute completion guarantees. Escalate an uncertain task to a stronger worker without expanding its scope.

| Level | Model | Reasoning | Suitable work |
| --- | --- | --- | --- |
| L1 | `gpt-5.6-luna` | medium | Bounded inventory pages, fixtures and job observation |
| L2 | `gpt-5.6-terra` | high | Focused TypeScript/JavaScript modules, UI components and tests |
| L3 | `gpt-5.6-sol` | high | Integration, state/race handling, host operations and runtime evidence |
| L4 | `gpt-6-astra` | high | Contracts, uncertain source boundaries, musical policy and critical reviews |

## Hard worker time boundary

Each assignment targets 25 elapsed minutes: 4 reading, 12 execution, 6 validation, 3 handoff. **Thirty minutes is the maximum**, including tools and handoff. Estimates are planning judgments, not demonstrated throughput. A task is dispatchable only when its inputs and exact files are known. If it cannot plausibly fit, instantiate SPLIT before starting implementation.

The supervisor records a monotonic start/deadline and registers a deadline monitor before dispatch. At minute 20, stop broadening the change; split remaining work if validation cannot finish by minute 25. Handoff by minute 27. At minute 30, the supervisor interrupts the worker. A prompt alone cannot enforce this limit: if no independent monitor/interrupt mechanism is available, do not dispatch under a claimed hard cap. Never reset a worker's clock to disguise an overrun.

Handoff records actual edits/revision, completed versus remaining steps, exact checks/results, owned files and leases, evidence paths, dynamic child IDs and persistent job handles/cursors. Partial implementation or a running build is not a completed task.

## Dispatch contract

Use one coordinator and at most three workers concurrently. Each worker receives one concrete card, not an entire milestone. The user requested execution of TASKS.md as proposed; apply this dispatch policy during implementation.

Before dispatch:

1. Confirm implementation is authorized and the task's dependencies are accepted on the integrated revision.
2. Read GOALS, relevant discovery/defaults and applicable AGENTS instructions. Recheck model availability.
3. For source discovery, obtain current graph project/generation, bounded symbol/trace evidence and coverage; read missed ranges. Attach this evidence and limitations. Documentation-only tasks may use direct file reads.
4. Bind exact ownership, input/output files, focused check commands, conditional triggers and runtime profile. A template with unresolved placeholders is not dispatchable.
5. Reserve overlapping paths and leases. Include the instruction: “You are not alone in the codebase. Do not revert others' edits; adapt to the current integrated revision.”
6. Register the worker deadline and a handoff destination. Reserve time for validation and handoff.

Suggested dispatch text:

```text
Implement only CARD_ID at INTEGRATED_REVISION, following GOALS and its cited decisions.
You own EXACT_PATHS. You are not alone; do not revert others' edits.
Inputs: ACCEPTED_DEPENDENCIES and SOURCE/COVERAGE_EVIDENCE.
Required output and checks: copy the card's bounded steps and validation commands.
Leases: RESERVED_LEASES. Deadline: START_PLUS_30_MINUTES, including handoff.
By minute 20 split work that cannot finish validation by minute 25. Hand off by 27.
Long jobs persist independently; do not wait past the cap or restart on observer timeout.
Report exact changes, checks, gaps, evidence and next children. Never mark partial work complete.
```

## Parallel batches and shared resources

The dependency DAG gives order; it does not alone authorize parallel writes. Coordinator checks exact path overlap and imported contract revisions before every batch. Files listed as owned by earlier tasks transfer only after those tasks are accepted. Contributions to shared entrypoints go through an INTEGRATE task.

Use the [validated execution batches](tasks/batches.md) and [task board](../../TASKS.md) instead of illustrative groupings. Their compiler checks accepted-prerequisite ordering, a maximum of three workers, exact owned paths and exclusive resource conflicts. Runtime inventory cards require F11 and cannot run together on the same fixture. [First dispatch packets](FIRST-BATCH.md) bind the starting handoffs. See [execution rules](EXECUTION-PLAN.md) for actual readiness and long-job gates.

Exclusive resources include `package-manifest`, `mapping-entry`, `ui-entry`, `host-build`, MIDI enumeration/configuration and `mixxx-runtime`. The runtime lease covers the exact Mixxx profile, ports, audio device, physical controller, native UI and output recording. Use one live runtime owner. Never run a second test against a profile/port already owned by a long job. Read-only work is parallel only when it does not perturb the measurement.

## Long jobs without long workers

A native install/build, model download, analysis batch, 30-minute soak or 6-hour set can outlive a worker. JOB-LAUNCH saves a durable handle, exact command/cwd, source/profile, start, logs, output manifest, expected end and current status. Ownership of runtime/build resources belongs to the job until completion or an explicit verified stop.

JOB-OBSERVE reads that **same** handle and output cursor for no more than 20 minutes per assignment. Use short tool waits so status remains available; the observer can finish early and leave the next observer ID. An observation timeout is not permission to relaunch. Verify PID/session identity before stopping anything. A stalled or failed job produces a focused investigation, never a duplicate background process.

JOB-REVIEW collects terminal status, outputs and checks the recipe. Large recordings/reports require bounded review pages with a closure manifest. Launch, observation and review are different states. Two 15-minute recordings cannot satisfy one uninterrupted 30-minute run. Human listening can occur across separate sessions; absence of human response keeps that runtime gate pending.

## Dynamic expansion and gates

Unknown feature counts cannot be honestly reduced to a fixed schedule. The catalog's required manifests specify their owners and closure conditions:

- Inventory: all 22 families, canonical IDs/aliases, versions, dynamic instances and paginated scope checks.
- Host operations: ordered playlist read/load/save, cue access/save and capture of raw physical input, including unmapped/unchanged input. Existing verified implementation can satisfy a child; a demonstrated gap requires narrow OP work.
- Capabilities: each required feature gets CAP-SPEC → CAP-BUILD → CAP-TEST → CAP-RUNTIME or links to equivalent accepted evidence. Command, feedback, native UI and runtime evidence remain independent.
- Analysis: per-feature local providers with provenance/confidence, including lyric inputs and waveform assets. Missing data needs an honest fallback; required adapter work remains tracked.
- Timing: measurements determine whether SCHED/OP corrections are necessary. “Not triggered” must cite passing measurements.
- Jobs/fixes: all continuations, integration, durable jobs and review pages must close. No orphan jobs or hidden unfinished excerpts.

Before a child is dispatched, materialize its ID, parent, exact scope, dependencies, owned paths, model/effort, <=25-minute estimate, <=30-minute cap, steps, checks and evidence path using the template. Append it to an expansion manifest and revalidate the complete DAG and ownership reservations. Parent completion depends on all required descendants; prose conditions are not permission to skip them.

Milestone 1 inventories every family but may record implementation gaps. Full-coverage gate C02 must have **zero unresolved required feature gaps**. An unsupported feature remains an explicit gap and keeps full delivery open; it cannot disappear from the denominator. Limited early runtime proofs can be useful without being mislabeled full coverage.

## Validation and completion

Run `python3 docs/ai-dj/tasks/render.py --check`, `python3 docs/ai-dj/tasks/plan-execution.py --check` and `python3 docs/ai-dj/tasks/validate.py` after planning changes. During implementation, F03 supplies focused typecheck/test/build commands; cards must bind exact invocations before dispatch. Apply meaningful failure/race tests and actual Mixxx/UI/audio/controller checks wherever the card requires them. Synthetic JSON or mock tests cannot substitute for these gates.

L12 accepts only a coherent integrated revision with native playlist operations, three modes, physical B2B, all required Mixxx feature evidence, live/history UI, whole-set accounting, endurance, timing and explicit human listening acceptance. Planning completion does not mark any of those runtime gates passed.

> End of autonomously AI-generated planning document.
