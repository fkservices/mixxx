# AI DJ task board

> Autonomously AI-generated task planning at the user's request.

**Current work: implementation authorized and started.** The active goal is “perform tasks.md as proposed.” [GOALS.md](GOALS.md) remains authoritative. The reference catalog has 171 cards and 17 expansion templates. [Execution state and acceptance evidence](docs/ai-dj/work/state.json) are authoritative; a card's presence is not completion.

**Current status:** See the [live evidence ledger](docs/ai-dj/work/state.json) and [visual journal](docs/ai-dj/progress.html) for accepted tasks, active work and test reports. Foundation, MIDI transport and playlist/session modules have partial verified implementations; the complete desktop, physical-controller B2B, endurance and musical acceptance gates remain open.

[Visual progress page](docs/ai-dj/progress.html) stays synchronized with the ledger. Add real screenshots and their evidence context as UI/runtime checks produce them.

## Execution order

| Checkpoint | Outcome | Exit cards | Status |
| --- | --- | --- | --- |
| G0 | Local baseline, package and action/state contracts | F01, F02, F03, F07, F09, F10, F12 | Accepted foundation contracts |
| G1 | Five real MIDI controls, feedback, timing and initial inventory | M20 | Not started |
| G2 | Reliable executor, three modes and real-controller B2B | R24, R26 | Not started |
| G3 | Native playlist selection, saved sets and deterministic mixing | P18, D07 | Not started |
| G4 | AI sets, editable musical choices, live timeline and history | A14, U08–U12 | Not started |
| G5 | Full Mixxx feature coverage with observed UI/runtime evidence | C02 | Not started |
| G6 | Local desktop delivery, endurance and human listening acceptance | L12 | Not started |

Checkpoint order explains the product; it does not force independent work to wait. Full-coverage expansion can proceed alongside AI/UI work once its prerequisites are accepted. No checkpoint passes solely because its static exit card exists: required dynamic children and real evidence must close too.

## First handoffs

| Batch | Worker 1 | Worker 2 | Worker 3 | Required before dispatch |
| --- | --- | --- | --- | --- |
| B001 | F01: local baseline — Sol/high | — | — | Build instruction, deadline monitor, exact scope |
| B002 | F02: module ownership/checks — Sol/high | — | — | F01 accepted |
| B003 | F03: TypeScript scaffold — Terra/high | F06: action contract — Astra/high | — | F02 accepted; separate owned files |
| B004 | F04: native MIDI install launch — Terra/high | F07: state/capability contract — Astra/high | — | F03 and F06 accepted |
| B005 | F05: terminal install review — Terra/high | F08: message validation — Terra/high | F09: conventional MIDI contract — Astra/high | Per-card dependencies; F05 additionally needs a terminal install job |
| B006 | F10: inventory format — Sol/high | F11: isolated Mixxx fixture — Sol/high | F12: diagnostic format — Terra/high | Prior accepted dependencies; F11 needs actual runtime/tracks |

[First dispatch packets](docs/ai-dj/FIRST-BATCH.md) provide the concrete starting assignments. [All 81 reference batches](docs/ai-dj/tasks/batches.md) cover the current static catalog without dependency or exclusive-resource conflicts. Actual dispatch remains event-driven: if F05 is waiting for installation, continue eligible independent work and observe the existing job separately.

## Working rules

- Every worker has a 25-minute target and a 30-minute maximum including tools, checks and handoff. Split work that cannot meet that cap; never call unfinished validation complete.
- Use at most three workers plus one coordinator. One live Mixxx fixture owner at a time. The 46 cards needing that fixture are serialized; do not parallelize inventory UI checks on the same host.
- Workers receive exact files, accepted input revisions, relevant decisions, checks, evidence paths and a registered deadline. Shared entrypoints have one integrator.
- Long installs, builds, downloads and recorded sets keep one durable job handle and resource lease across bounded observer/reviewer tasks.
- No totals or calendar promises follow from the 81 logical batches. Capability discovery, corrections, long jobs and human listening determine additional work.

## Planning artifacts

- [Execution and readiness rules](docs/ai-dj/EXECUTION-PLAN.md)
- [Worker models, ownership and time limits](docs/ai-dj/WORKER-TASKS.md)
- [Individual cards](docs/ai-dj/tasks/README.md)
- [Canonical catalog](docs/ai-dj/tasks/catalog.json) and [reference execution data](docs/ai-dj/tasks/execution.json)
- [Requirement traceability](docs/ai-dj/TRACEABILITY.md)
- [Planning validation](docs/ai-dj/VALIDATION.md)

> End of autonomously AI-generated task planning.
