# 00-foundation

> Autonomously AI-generated planning cards. Task specifications with recorded execution status; completion requires acceptance evidence.

[Worker rules](../WORKER-TASKS.md) · [Catalog](README.md)

## F01: Freeze the local test profile

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** None. **Leases:** Exact path reservation. **Status:** accepted.

**Owns:** `docs/ai-dj/work/baseline.md`

**Scope:** One Mac, one exact Mixxx version and one legacy skin; select a profile, do not install dependencies.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Record OS/CPU/audio setup and installed tools without secrets; compare available stable/alpha features against RESEARCH.md.
2. Choose exact host version, test-profile location and two safe local fixture tracks; record deferred alpha/QML profiles.
3. Select proposed budgets from DEFAULTS R3-Q17 and specify how later M19 will measure/accept them, including clock uncertainty. Do not claim to measure nonexistent runtime behavior in F01.

**Validate:**

1. Verify host version using actual executable or record installation pending; distinguish inspected source from runtime.
2. Confirm fixtures do not overwrite a live performance profile and decisions preserve all-local testing.
3. Record unavailable host/fixture evidence explicitly and materialize a setup prerequisite for F11; documentation-only baseline selection can finish without falsely claiming installation.

**Evidence:** `docs/ai-dj/work/evidence/F01.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## F02: Freeze module ownership and worker validation commands

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** F01. **Leases:** Exact path reservation. **Status:** accepted.

**Owns:** `docs/ai-dj/work/layout.md`

**Scope:** One independent TypeScript package under ai-dj/ in this fork; no framework selection exercise.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Define core, execution, midi, hosts/mixxx, planner, analysis, catalog, local-ui and test boundaries.
2. Reserve package manifests and mapping entrypoints to integrators; name focused typecheck/test/build commands that F03 must supply.

**Validate:**

1. Check imports keep planner out of MIDI callbacks and MIDI out of planner.
2. Check ownership supports three disjoint workers plus coordinator, with no upstream PR automation.

**Evidence:** `docs/ai-dj/work/evidence/F02.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## F03: Create the isolated TypeScript package scaffold

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** F02. **Leases:** package-manifest. **Status:** accepted.

**Owns:** `ai-dj/package.json`, `ai-dj/tsconfig.json`, `ai-dj/.gitignore`, `ai-dj/test/smoke.test.ts`, `ai-dj/package-lock.json`, `ai-dj/.node-version`, `ai-dj/scripts/test.mjs`

**Scope:** Only compiler/test scripts and one empty-package smoke; no application modules or native install.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Create private package and strict TS configuration with bounded test selection.
2. Implement typecheck, test and build scripts promised by F02; exclude logs, tracks and credentials from version control.

**Validate:**

1. Run the empty-package typecheck/test/build and record exact commands.
2. Verify root Mixxx build and package files remain untouched; if install is slow use JOB-LAUNCH and JOB-REVIEW.

**Evidence:** `docs/ai-dj/work/evidence/F03.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## F04: Launch candidate native MIDI installation

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** F03. **Leases:** package-manifest, install-job. **Status:** accepted.

**Owns:** `docs/ai-dj/work/jobs/native-install.json`, `ai-dj/package.json`, `ai-dj/package-lock.json`

**Scope:** One pinned Node and @julusian/midi candidate; launch only if work may exceed this task.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Check current binding documentation and choose a compatible Node/package candidate.
2. Install in ai-dj/ with logs; if still running save persistent PID/session, start time, exact command and log path using long-job rules.

**Validate:**

1. Verify the job handle really exists or record the exit code.
2. Record pinned versions and next observer/reviewer; never call installation successful from a launch alone.

**Evidence:** `docs/ai-dj/work/evidence/F04.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## F05: Verify native binding installation result

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** F04. **Leases:** install-job. **Status:** accepted.

**Owns:** `docs/ai-dj/work/native-binding.md`

**Scope:** Review one terminal installation and load the binding; do not debug a chain of unrelated build errors.

**Prerequisites:** F04 install job is terminal and its exit/log artifacts are available. While it is running, use a separate JOB-OBSERVE child and continue independent tasks; do not occupy F05 waiting for completion.

**Evidence gates:** Terminal native-install result accepted, successful import required before accepting F05.

**Perform:**

1. Resume the same F04 handle through JOB-OBSERVE if needed, then collect its terminal status.
2. Import the binding in chosen Node runtime and enumerate available MIDI endpoints without opening a performance port.

**Validate:**

1. Require exit 0 and successful native import, recording versions and architecture.
2. On failure record first root error and create one FIX task; ARM compatibility remains unproven.

**Evidence:** `docs/ai-dj/work/evidence/F05.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## F06: Define semantic action contracts

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** F02. **Leases:** Exact path reservation. **Status:** accepted.

**Owns:** `ai-dj/core/actions.ts`, `docs/ai-dj/work/contracts/actions.md`

**Scope:** Only action envelope and operation semantics.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Define desired-state, trigger, momentary and relative actions with IDs, deadlines and bounded arguments.
2. Define preconditions, track/ownership generation and outcome states without implementing executor logic.

**Validate:**

1. Walk play, cue, load and relative jog examples; a sent command must not mean completed.
2. Check runtime validators can reject unknown actions and nonfinite/out-of-range values independently of TypeScript.

**Evidence:** `docs/ai-dj/work/evidence/F06.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## F07: Define observed state and capability contracts

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** F06. **Leases:** Exact path reservation. **Status:** accepted.

**Owns:** `ai-dj/core/state.ts`, `ai-dj/core/capabilities.ts`, `docs/ai-dj/work/contracts/state.md`

**Scope:** Only state/capability types and freshness rules.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Separate requested, observed, stale, missing and uncertain state; include session/revision and identity.
2. Define canonical capability IDs, aliases, dynamic instances, read/write semantics and four evidence dimensions.

**Validate:**

1. Demonstrate missing-control zero is unknown, and aliases do not increase coverage count.
2. Validate snapshot/delta and manual-control examples without assuming feedback identifies its author.

**Evidence:** `docs/ai-dj/work/evidence/F07.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## F08: Create runtime message validators

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** F07, F03. **Leases:** Exact path reservation. **Status:** split.

**Owns:** `ai-dj/core/validate.ts`, `ai-dj/test/core/validate.test.ts`

**Scope:** Validate only agreed action/state envelopes.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Implement bounded parsing of external action and state inputs; reject unknown fields according to frozen contract.
2. Add fixtures for malformed IDs, oversized payloads, invalid numbers and absent generations.

**Validate:**

1. Run focused validator tests and typecheck.
2. Confirm rejected input cannot invoke arbitrary script/function names or mutate observed state.

**Evidence:** `docs/ai-dj/work/evidence/F08.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## F09: Define conventional MIDI addresses including sync

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** F07. **Leases:** Exact path reservation. **Status:** accepted.

**Owns:** `docs/ai-dj/work/contracts/conventional.md`, `ai-dj/hosts/mixxx/conventional-profile.json`

**Scope:** Five initial controls: play, volume, crossfader, cue, sync.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Freeze channels, addresses, value scaling and feedback for the five controls; distinguish sync mode/trigger behavior.
2. Include note release/velocity-zero, unavailable control detection and desired-state play semantics.

**Validate:**

1. Check no address collisions and verify exact control semantics against chosen host docs/source.
2. Give expected bytes and outcomes at 0/mid/max; explicitly exclude MIDI clock synchronization.

**Evidence:** `docs/ai-dj/work/evidence/F09.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## F10: Define inventory record and pagination rules

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** F07. **Leases:** Exact path reservation. **Status:** accepted.

**Owns:** `docs/ai-dj/work/inventory/schema.json`, `docs/ai-dj/work/inventory/README.md`

**Scope:** Schema and extraction boundaries only.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Specify canonical IDs, aliases, version/UI profile, instance counts, control or service operation and command/feedback/UI/runtime evidence.
2. Define source/manual/menu cross-checks, 20-row pages, cursor/continuation records and family closure evidence.

**Validate:**

1. Validate one ordinary control, one dynamic effect and one modal operation example.
2. Require unresolved and extension-needed records; no generated declaration alone can prove inventory completeness.

**Evidence:** `docs/ai-dj/work/evidence/F10.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## F11: Prepare one disposable Mixxx runtime fixture

**Worker:** L3 / `gpt-5.6-sol` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** F01, F09, F05. **Leases:** mixxx-runtime. **Status:** planned.

**Owns:** `docs/ai-dj/work/runtime-fixture.md`

**Scope:** One host profile, two tracks, fixed audio settings; no controller mapping implementation.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Selected Mixxx executable/profile and two operator-provided usable tracks available; any install/setup jobs reviewed.

**Perform:**

1. Prepare isolated profile with chosen skin; record track identities, tempo and safe output routing.
2. Configure the two directional virtual MIDI endpoints and record exact pairing; capture baseline audio-overload counters.
3. Follow work/contracts/ports.md: hold two directional native virtual endpoints with a pairable logical name; record actual host pairing and durable port-process identity.

**Validate:**

1. Verify commands and feedback have distinct routes without an echo path.
2. Open relevant controls and save baseline UI/audio evidence; unavailable installation becomes JOB work.

**Evidence:** `docs/ai-dj/work/evidence/F11.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## F12: Create evidence capture conventions

**Worker:** L2 / `gpt-5.6-terra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** F07, F03. **Leases:** Exact path reservation. **Status:** accepted.

**Owns:** `ai-dj/diagnostics/events.ts`, `ai-dj/test/diagnostics/events.test.ts`, `docs/ai-dj/work/evidence-format.md`

**Scope:** Structured event capture only; no performance dashboard.

**Prerequisites:** Dependencies accepted on the integrated revision; common dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. Record monotonic event time, session/correlation, host/profile and revisions; buffer output off the hot path.
2. Define raw artifact manifests and clock domains; redact unnecessary paths/metadata.

**Validate:**

1. Check ordering and dropped-event reporting with a bounded fixture.
2. Confirm command sent, host observed, UI observed and audio observed remain different event types.

**Evidence:** `docs/ai-dj/work/evidence/F12.md`. Stop expanding scope by minute 20. If any remaining execution or validation cannot finish by minute 25, create bounded continuation cards using SPLIT; hand off by minute 27. Supervisor stops worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

> End of autonomously AI-generated planning cards.
