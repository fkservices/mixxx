# From task catalog to execution

> Autonomously AI-generated execution planning at the user's request.

Implementation is now authorized by “perform tasks.md as proposed.” F01 is the initial task. [TASKS.md](../../TASKS.md) is the concise board. [execution.json](tasks/execution.json) contains seven checkpoints and 81 validated reference batches for the current 171 cards. It derives current states from [the acceptance ledger](work/state.json); reference batch order is separate from actual readiness. [GOALS.md](../../GOALS.md) continues to control product scope.

## What the batches mean

A batch contains at most three tasks whose static prerequisites lie in earlier batches, whose owned paths do not overlap, and whose exclusive resources do not conflict. The compiler uses stable catalog order for deterministic output. It is a reference sequence, not an optimized calendar schedule or an assertion that every prerequisite already exists.

The first six batches are expanded on the [board](../../TASKS.md#first-handoffs). Follow per-card prerequisites when a task is waiting; unrelated work need not wait for an entire numbered batch. Do not execute a catalog row simply because its batch number has arrived.

Earlier candidate examples were unsuitable for concurrent dispatch: F11 transitively depends on F06, and I01/I02/I03 each require the same live Mixxx fixture. Those examples are replaced by generated batches checked against both dependencies and resources.

## Readiness and task states

Separate the catalog's intended work from observed execution state. The execution ledger tracks actual planned/running/waiting/accepted states. A dependency frontier alone is not dispatch permission; reserve resources and check evidence before dispatch.

| State | Meaning and next action |
| --- | --- |
| Planned | Defined, with no implementation claimed |
| Eligible | Dependencies accepted and scope/inputs bound; coordinator still checks authorization and resources |
| Running | One worker owns the card and deadline |
| Waiting for job | A durable job continues; its handle/lease remain attached, worker has handed off |
| Waiting for evidence | Hardware, integration or human result is missing; specify the exact evidence and responsible card |
| In review | Deliverable exists with focused check results; acceptance is not yet granted |
| Accepted | Reviewer accepts the deliverable on an identified integrated revision; required children are closed |
| Split | Parent stays incomplete; concrete continuation cards own remaining steps and checks |

Use this execution lifecycle with an acceptance ledger with task/child IDs, status, source revision, integrated revision, evidence, open conditions and active job/resource ownership. Update catalog/board/validators together, retaining the original required scope and honest live states.

## Coordinator decision after each handoff

1. Read the result and check the exact scope, revision, performed checks and artifacts. A worker's “done” is not sufficient if tests or evidence are missing.
2. Close accepted dependencies only when all required descendants and integration checks are satisfied. Preserve failed and waiting states.
3. Recompute the eligible set from actual accepted IDs, not from batch numbers. Check entry requirements in the catalog and relevant dynamic manifests.
4. Reserve exact paths and resources for up to three independent cards. Use isolated worker checkouts for code tasks that need stable validation inputs; integrate accepted changes serially. Do not create those checkouts during planning.
5. Bind focused commands and scoped source/decision context, verify model availability and register a supervisor deadline. Revalidate the live dependency graph after materializing children.
6. Dispatch or continue existing jobs. Do not restart a job because its observer ended. Report a meaningful new result rather than unchanged polling status.

A contract and scaffold may be authored concurrently in B003 because they own separate outputs. Their future checks must run against their recorded inputs, then against the accepted integrated result. A worker must not claim stable checks while reading another worker's half-written files.

## Explicit evidence gates

Static task completion cannot stand in for dynamic or external evidence. Catalog `entry_requirements` makes the important cases visible on rendered cards:

| Work | Additional evidence required |
| --- | --- |
| F11 / runtime inventory | Chosen executable/profile and usable tracks; completed setup jobs |
| F05 | Terminal native-install result and successful native import; observers handle waiting |
| M20 | All required timing-correction children accepted; initial inventory scope closed |
| O04 / R23 | Actual controller/model/mapping plus implemented raw-input capture and real-host tests |
| P13 / P16 | Native read/load/save children integrated; terminal host build reviewed |
| A05 / A12 | Analysis children and local model install/download results available |
| C02 | All canonical features and required descendants; zero unresolved required coverage gaps |
| L08 / L10 | Original uninterrupted job terminal, with complete review pages and artifacts |
| D07 / A14 / L11 | Human response required before acceptance; prepare a packet and hand off rather than waiting inside one worker |
| L12 | All static and required dynamic work accepted on coherent integrated evidence |

F01 may document a selected baseline while clearly reporting that Mixxx or fixture tracks are unavailable. It must then create a concrete setup prerequisite for F11; it cannot pretend the runtime is installed. Timing budgets are selected before measurement and cannot be quietly loosened after failure.

## Resource reservation

`mixxx-runtime` covers profile, ports, controller, audio device, native UI and capture. All 46 catalog cards with that lease are serialized in the reference plan. Inventory source reads can run separately only after splitting off their live UI portion into explicit cards. Do not remove the lease just to make a batch look parallel.

A long job owns its lease until terminal status and cleanup are verified. Workers observing its logs may run alongside independent source or documentation work. Configuration, source rebuilds affecting that job, or a second performance run cannot use its resources. Package, mapping, application and UI entrypoints retain a single integrator. Separate worker checkouts do not provide separate physical MIDI or audio devices.

## Scope and time corrections

Every card is capped at 30 minutes, including reads, tools, validation and handoff; 25 minutes is the target. At dispatch, revisit the estimate using actual interfaces and test commands. A multi-panel UI, uncertain host extension or new analysis provider must split before work begins if it cannot plausibly fit. The current card count is not a promise that no further decomposition will be needed.

Use the existing templates for one demonstrated gap, one capability, one analysis feature, one defect or one review page. Bind concrete IDs and exact file ownership before dispatch, then insert them into the parent manifest and graph. Do not manufacture capability names or source paths merely to make an unknown part of Mixxx look fully planned.

No new product requirements are introduced by the reference schedule. Serato, Pi deployment and external AI hardware remain outside the current build. Existing playlist, B2B, session UI and full Mixxx coverage requirements remain required regardless of how many bounded assignments they take.

## Plan maintenance

After catalog edits, regenerate and validate from the repository root:

```sh
python3 docs/ai-dj/tasks/render.py
python3 docs/ai-dj/tasks/plan-execution.py
python3 docs/ai-dj/tasks/render.py --check
python3 docs/ai-dj/tasks/plan-execution.py --check
python3 docs/ai-dj/tasks/validate.py
```

The execution JSON includes a catalog digest to catch stale sequencing. These commands generate planning documents only; they do not dispatch agents, install dependencies or control Mixxx.

> End of autonomously AI-generated execution planning.
