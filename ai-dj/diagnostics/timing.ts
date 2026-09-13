// Autonomously AI-generated bounded timing capture; no MIDI, UI or audio execution.
export const TIMING_METRICS = ["dispatch-lateness", "loopback-rtt", "command-observation"] as const;
export type TimingMetric = typeof TIMING_METRICS[number];
export interface TimingStamp { readonly clockDomainId: string; readonly atMs: number }
export interface TimingSample {
  readonly metric: TimingMetric;
  readonly sampleId: string;
  /** Scheduled dispatch, loopback send, or actual command dispatch respectively. */
  readonly start: TimingStamp;
  /** Actual dispatch, loopback return, or independently observed feedback respectively. */
  readonly end: TimingStamp;
}
export interface TimingOptions {
  readonly runId: string;
  readonly clockDomainId: string;
  readonly now: () => number;
  readonly capacityPerMetric: number;
  /** Per-sample deadline allowances, not percentile acceptance targets. */
  readonly budgetsMs: Readonly<Record<TimingMetric, number>>;
}
export interface CapturedTimingSample extends TimingSample {
  readonly capturedAtMs: number;
  readonly valueMs: number;
  readonly missedDeadline: boolean;
}
interface Bucket {
  samples: CapturedTimingSample[];
  seen: Set<string>;
  dropped: number;
  externalDropped: number;
}
export type TimingAdmission = "accepted" | "capacity-dropped";

function finiteNonnegative(value: number): boolean { return Number.isFinite(value) && value >= 0; }
function id(value: string): boolean { return typeof value === "string" && /^[A-Za-z0-9_.:-]{1,128}$/.test(value); }

/** One run, one monotonic local clock. Never subtract clocks or divide RTT by two.
 * Pairing is the caller's responsibility: MIDI state-only matches are not causal
 * acknowledgements. Unpaired/lost samples must be reported with noteDropped().
 */
export function createTimingCapture(options: TimingOptions) {
  const { runId, clockDomainId, now, capacityPerMetric } = options;
  if (!id(runId) || !id(clockDomainId) || typeof now !== "function") throw new TypeError("Invalid timing run or clock");
  if (!Number.isSafeInteger(capacityPerMetric) || capacityPerMetric < 1 || capacityPerMetric > 100_000) {
    throw new RangeError("Timing capacity must be 1..100000 per metric");
  }
  const budgetsMs = Object.freeze({ ...options.budgetsMs });
  for (const metric of TIMING_METRICS) if (!finiteNonnegative(budgetsMs[metric])) throw new RangeError("Invalid timing budget");
  const buckets = new Map<TimingMetric, Bucket>(TIMING_METRICS.map(metric => [metric, { samples: [], seen: new Set(), dropped: 0, externalDropped: 0 }]));
  let lastNow = -Infinity;
  let clockFault = false;
  let counterOverflow = false;
  const bucket = (metric: TimingMetric) => {
    const b = buckets.get(metric);
    if (!b) throw new TypeError("Unknown timing metric");
    return b;
  };
  function add(a: number, b: number): number {
    if (b > Number.MAX_SAFE_INTEGER - a) { counterOverflow = true; return Number.MAX_SAFE_INTEGER; }
    return a + b;
  }
  function captureNow(): number {
    if (clockFault) throw new Error("Timing clock fault is latched; start a new run");
    let value: number;
    try { value = now(); } catch { clockFault = true; throw new Error("Timing clock failed"); }
    if (!finiteNonnegative(value) || value < lastNow) {
      clockFault = true;
      throw new Error("Timing clock must be finite, nonnegative and monotonic");
    }
    return value;
  }
  function record(sample: TimingSample): TimingAdmission {
    const b = bucket(sample.metric);
    const { metric, sampleId } = sample;
    const start = { ...sample.start }, end = { ...sample.end };
    if (!id(sampleId)) throw new TypeError("Invalid timing sample ID");
    if (start.clockDomainId !== clockDomainId || end.clockDomainId !== clockDomainId) throw new Error("Cross-clock measurement is not permitted");
    if (!finiteNonnegative(start.atMs) || !finiteNonnegative(end.atMs)) throw new RangeError("Invalid timing timestamp");
    if (metric !== "dispatch-lateness" && end.atMs < start.atMs) throw new RangeError("Negative elapsed interval");
    if (b.seen.has(sampleId)) throw new Error("Duplicate retained timing sample ID");
    const capturedAtMs = captureNow();
    if (end.atMs > capturedAtMs) throw new RangeError("Observed endpoint is in the future");
    lastNow = capturedAtMs;
    if (b.samples.length === capacityPerMetric) { b.dropped = add(b.dropped, 1); return "capacity-dropped"; }
    const valueMs = end.atMs - start.atMs;
    b.samples.push(Object.freeze({ metric, sampleId, start: Object.freeze(start), end: Object.freeze(end), capturedAtMs,
      valueMs, missedDeadline: valueMs > budgetsMs[metric] }));
    b.seen.add(sampleId);
    return "accepted";
  }
  function noteDropped(metric: TimingMetric, count = 1): void {
    const b = bucket(metric);
    if (!Number.isSafeInteger(count) || count < 1) throw new RangeError("Dropped count must be a positive safe integer");
    b.externalDropped = add(b.externalDropped, count);
  }
  function summary() {
    const metrics = TIMING_METRICS.map(metric => {
      const b = bucket(metric);
      const sorted = b.samples.map(sample => sample.valueMs).sort((a, z) => a - z);
      const percentile = (p: number) => sorted.length ? sorted[Math.ceil(p * sorted.length) - 1]! : null;
      return Object.freeze({ metric, budgetMs: budgetsMs[metric], retainedSamples: sorted.length,
        capacityDroppedSamples: b.dropped, externallyDroppedSamples: b.externalDropped,
        missedDeadlinesInRetainedSamples: b.samples.filter(sample => sample.missedDeadline).length,
        p50Ms: percentile(0.5), p95Ms: percentile(0.95), p99Ms: percentile(0.99), maxMs: sorted.at(-1) ?? null });
    });
    return Object.freeze({ runId, clockDomainId, capacityPerMetric, clockFault, counterOverflow,
      sampleLoss: metrics.some(m => m.capacityDroppedSamples > 0 || m.externallyDroppedSamples > 0),
      quantileMethod: "nearest-rank" as const, statisticsScope: "first retained samples per metric" as const,
      evidenceScope: "caller-paired local-clock intervals; no one-way, UI or audio inference" as const,
      metrics: Object.freeze(metrics) });
  }
  return Object.freeze({ record, noteDropped, summary,
    samples: (metric: TimingMetric) => Object.freeze([...bucket(metric).samples]) });
}
// End of autonomously AI-generated file.
