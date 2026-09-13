# First implementation dispatch packets

> Autonomously AI-generated dispatch planning at the user's request.

These are the first four assignments, covering B001–B003. They are prepared for future implementation; **none is dispatched now**. Each inherits [GOALS](../../GOALS.md), [worker rules](WORKER-TASKS.md) and [execution gates](EXECUTION-PLAN.md). The next eligible card is F01 after implementation is authorized. Do not launch all four at once.

## F01 — freeze the local test profile

**Worker:** `gpt-5.6-sol`, high reasoning. **Target:** 25 minutes; **maximum:** 30 including handoff. **Prerequisites:** build instruction, registered deadline and current planning revision. **Owns:** `docs/ai-dj/work/baseline.md` and `docs/ai-dj/work/evidence/F01.md`. **Runtime lease:** none; this assignment is read-only environment discovery and documentation, with no installs or device reconfiguration.

Read [scope](../../GOALS.md), [desktop boundary](HOST-STRATEGY.md), [research version notes](RESEARCH.md) and [timing/capacity defaults](DEFAULTS.md). Record the current checkout/revision before inspecting anything. Use the graph only for relevant source questions, with generation/coverage and missed-range fallback; avoid an unbounded codebase survey.

Steps:

1. Record macOS version, CPU architecture/model and available memory using `sw_vers`, `uname -m`, and selected `sysctl` keys. Record `node --version`, `npm --version` and relevant build-tool availability. Do not collect serial numbers, credentials or unrelated library contents.
2. Inspect the installed Mixxx app's version metadata if present; otherwise state “not installed.” Choose the exact test version and legacy skin from supported evidence. Distinguish the inspected fork source from an actually available executable.
3. Define an isolated test-profile location and two operator-provided local fixture tracks if available. Record identity/path requirements without copying music into Git. Missing tracks become a named prerequisite for F11, not guessed filenames or falsely satisfied evidence.
4. Record the proposed timing and capacity budgets, clock domains and measurement recipe requirements. Measurements happen in later cards. List any setup/download tasks needed before F11 and preserve the same-machine Mixxx desktop scope.

Acceptance:

- Baseline names a precise selected profile and separates observed facts, selected defaults and missing inputs.
- No installation, controller change or production-profile overwrite occurred.
- Every missing runtime prerequisite has an owner/next card. F01 can be accepted as a planning baseline with these prerequisites explicit; F11 cannot run until they are resolved.
- Handoff contains exact commands/results and the source revision; F02 becomes the next eligible card.

## F02 — bind module ownership and checks

**Worker:** `gpt-5.6-sol`, high reasoning. **Target/cap:** 25/30 minutes. **Dependency:** F01 accepted. **Owns:** `docs/ai-dj/work/layout.md` and `docs/ai-dj/work/evidence/F02.md`. **Runtime lease:** none.

Read F01's accepted baseline and [architecture](PLAN.md#2-boundaries-and-data-flow). Bind the proposed `ai-dj/` module boundaries and the exact package/mapping/UI integration owners. No runtime implementation belongs in F02.

Steps:

1. Record core, MIDI, executor, host adapter, catalog/sets, analysis/planner, recorder and UI dependencies. The planner has no MIDI handle; history has no route to performance output.
2. Reserve package manifests and shared entrypoints to one integrator. Define separate checkout or serialized validation rules for other workers.
3. Specify the scripts F03 must provide: `npm run typecheck`, `npm run build`, `npm test -- <focused-selector>`, executed from `ai-dj/`. Bind the actual test runner and selector syntax in the layout before claiming these are runnable commands.
4. Identify contract-first parallel work: F03 scaffold and F06 action envelope. Neither may expand into transport/mapping/executor implementation.

Acceptance:

- Each module has an owner, allowed import directions and an explicit integration boundary.
- Test invocation semantics are concrete enough for F03 to implement and demonstrate; placeholders do not count as working scripts.
- F03 and F06 own disjoint paths and have a defined integration check before downstream consumers use them.

## B003 worker A — F03 TypeScript scaffold

**Worker:** `gpt-5.6-terra`, high reasoning. **Target/cap:** 25/30 minutes. **Dependency:** F02 accepted. **Lease:** `package-manifest`. **Owns:** `ai-dj/package.json`, `ai-dj/tsconfig.json`, `ai-dj/.gitignore`, `ai-dj/test/smoke.test.ts` and `docs/ai-dj/work/evidence/F03.md`. Any additional runner config or lockfile must be named in the ownership reservation before editing.

Create only the isolated private package, strict TypeScript/test configuration and scripts promised by F02. Exclude music, profiles, logs and credentials from version control. Do not add native MIDI, AI models, host mapping or product screens in this card. If dependency installation takes too long, launch a durable job and hand off; the card remains unaccepted until required results and checks are reviewed.

Acceptance:

- The exact `typecheck`, `test` and `build` commands from F02 pass in the scaffold.
- The smoke check verifies the test/build path; it is not evidence of DJ behavior.
- Root Mixxx build/package configuration is unchanged. Future native dependency work belongs to F04.
- Integrator records the accepted revision and command outputs before F04/F08 consume it.

## B003 worker B — F06 action contract

**Worker:** `gpt-6-astra`, high reasoning. **Target/cap:** 25/30 minutes. **Dependency:** F02 accepted. **Owns:** `ai-dj/core/actions.ts`, `docs/ai-dj/work/contracts/actions.md` and `docs/ai-dj/work/evidence/F06.md`. **Runtime lease:** none.

Define desired-state, trigger, momentary and relative actions with bounded arguments, action IDs, deadlines, source/mode/track/ownership generations, preconditions and result states. Separate planned, sent, accepted, observed and uncertain outcomes. This card defines the envelope; F08 handles runtime validation and reliability cards implement execution.

Acceptance:

- Walk play, cue press/release, stable track load and relative jog examples through the contract. A transmitted request never implies completed playback.
- Include stale generation, unsupported capability, non-finite value, missing release and unknown outcome examples with explicit handling expectations.
- Use no direct MIDI handle, arbitrary host function name or executable model text in the contract.
- Integrate the contract with the accepted F03 compiler configuration and run typecheck before downstream use. If F03 is still running, hand off the contract for review and defer this integration check; do not wait past the worker cap or claim the check already passed.

## Common dispatch and handoff envelope

Before each dispatch, the coordinator binds the current accepted revision, exact paths, relevant decision excerpts, available model, worker start/deadline and resource reservations. Tell each worker: **You are not alone in the codebase. Do not revert others' edits; adapt to the current integrated revision.**

Handoff includes card ID, start/end time, source and integrated revisions, actual paths changed, completed and remaining steps, exact checks/results, evidence path, active job handles/cursors and any required child cards. The coordinator reviews these before accepting the card. A worker timeout is a handoff boundary, not permission to mark the task complete.

After B003 acceptance, continue with F04 and F07 as shown on the [board](../../TASKS.md). The full subsequent sequence is in [reference batches](tasks/batches.md); it never overrides actual readiness or evidence requirements.

> End of autonomously AI-generated dispatch planning.
