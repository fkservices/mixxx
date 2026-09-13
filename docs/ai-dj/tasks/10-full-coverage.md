# 10-full-coverage

> Autonomously AI-generated planning cards. Task specifications with recorded execution status; completion requires acceptance evidence.

[Worker rules](../WORKER-TASKS.md) · [Catalog](README.md)

## C01: Expand inventory into capability work

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** I23, R24, P24, O02. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `docs/ai-dj/work/capability-expansion.json`

**Scope:** At most twenty capability rows per dispatch; continue with INV-MERGE.

**Prerequisites:** Dependencies accepted on integrated revision; dispatch prerequisites in WORKER-TASKS.md apply.

**Evidence gates:** Accepted dependency evidence and dispatch checks.

**Perform:**

1. For each canonical feature allocate CAP-SPEC/BUILD/TEST/RUNTIME children or link accepted implementation evidence.
2. Include hidden/modal/settings operations, feedback, native UI and raw capture hook; OP templates implement demonstrated host gaps.

**Validate:**

1. Every row has four independent evidence dimensions and owner.
2. No unknown or unsupported row is dropped from denominator.

**Evidence:** `docs/ai-dj/work/evidence/C01.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

## C02: Close full capability evidence

**Worker:** L4 / `gpt-6-astra` / high. **Budget:** 25 minutes; maximum 30 including handoff.

**Dependencies:** C01. **Leases:** Exact path reservation. **Status:** planned.

**Owns:** `docs/ai-dj/work/gates/M5.md`

**Scope:** Review at most twenty family closure summaries; continuation required for remainder.

**Prerequisites:** All capability expansion pages materialized and required CAP/OP children accepted; any failure keeps this gate open.

**Evidence gates:** All capability expansion pages and required CAP/OP descendants accepted, with zero unresolved required feature gaps.

**Perform:**

1. Verify expansion manifest closure, audited inventory pages and all required CAP/OP results.
2. Reconcile manual/menu/runtime cross-checks for every one of 22 families.

**Validate:**

1. Require zero unresolved required command/feedback/native-UI/runtime gaps before full-coverage acceptance.
2. Conditional scheduler/analysis and instance-specific controls remain represented; no declaration-only 100% claim.

**Evidence:** `docs/ai-dj/work/evidence/C02.md`. At minute 20 split unfinished work that cannot finish validation by minute 25. Hand off by minute 27; supervisor stops this worker at minute 30.

**Completion:** All required children/continuations, long-job results and affected integration checks must be accepted; conditional children require trigger evidence or explicit not-triggered finding.

> End of autonomously AI-generated planning cards.
