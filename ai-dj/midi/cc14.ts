// Autonomously AI-generated R20 codec. No mapping activation or performance authority.
import { isAsyncFunction } from "node:util/types";
export type Cc14Control = "gain" | "tempo";
export type Cc14Deck = 1 | 2;
// Zero-based channels 4/5 (UI 5/6), deliberately separate from the initial mapping.
export const CC14_PROFILE = Object.freeze({ id: "ai-dj-cc14-v1", timeoutMs: 20,
  gainMsb: 16, gainLsb: 48, tempoMsb: 17, tempoLsb: 49 });
export type Cc14Message = readonly [number, number, number];

function target(deck: Cc14Deck, control: Cc14Control) {
  if (deck !== 1 && deck !== 2) throw new RangeError("Unknown CC14 deck");
  if (control !== "gain" && control !== "tempo") throw new RangeError("Unknown CC14 control");
  return { status: 0xB3 + deck, msb: control === "gain" ? 16 : 17 };
}
export function quantizeCc14(control: Cc14Control, value: number): number {
  if (control !== "gain" && control !== "tempo") throw new RangeError("Unknown CC14 control");
  const min = control === "gain" ? 0 : -1;
  if (!Number.isFinite(value) || value < min || value > 1) throw new RangeError("CC14 value outside profile");
  // Gain is normalized parameter space, not dB; tempo is offset in a separate selected range.
  return control === "gain" ? Math.round(value * 16383) : 8192 + Math.round(value * (value < 0 ? 8192 : 8191));
}
export function expandCc14(control: Cc14Control, raw: number): number {
  if (control !== "gain" && control !== "tempo") throw new RangeError("Unknown CC14 control");
  if (!Number.isInteger(raw) || raw < 0 || raw > 16383) throw new RangeError("Invalid CC14 integer");
  return control === "gain" ? raw / 16383 : (raw - 8192) / (raw < 8192 ? 8192 : 8191);
}
export function encodeCc14(deck: Cc14Deck, control: Cc14Control, value: number): readonly Cc14Message[] {
  const t = target(deck, control), raw = quantizeCc14(control, value);
  return [[t.status, t.msb, raw >> 7], [t.status, t.msb + 32, raw & 127]];
}

/** Sole synchronous writer ownership is required; this cannot serialize other port users. */
export function createCc14Writer(send: (message: Cc14Message) => void) {
  if (typeof send !== "function" || isAsyncFunction(send)) throw new TypeError("A synchronous send function is required");
  let busy = false, failed = false, closed = false;
  return {
    write(deck: Cc14Deck, control: Cc14Control, value: number) {
      if (busy) throw new Error("Reentrant CC14 pair emission");
      if (failed || closed) throw new Error("CC14 writer closed");
      const frames = encodeCc14(deck, control, value);
      busy = true;
      try {
        for (const frame of frames) {
          if (closed) throw new Error("CC14 writer closed during pair");
          // Returning a Promise violates the synchronous transport contract.
          const result: unknown = send(frame);
          if (result !== undefined) {
            // Retire unexpected promise transports; prevent an orphaned rejection.
            if (result instanceof Promise) void result.catch(() => {});
            throw new Error("CC14 send must return synchronously without a value");
          }
        }
        return { frames: 2, delivery: "unconfirmed" } as const;
      } catch (error) {
        failed = true;
        throw new Error("CC14 pair outcome unknown; writer retired without retry", { cause: error });
      } finally { busy = false; }
    },
    close() { closed = true; },
    status() { return { busy, failed, closed: closed || failed }; },
  };
}

export type Cc14Discard = "timeout" | "interleaved" | "superseded" | "invalid-input" | "generation" | "closed" | "fault";
export type Cc14Result =
  | { kind: "decoded"; deck: Cc14Deck; control: Cc14Control; raw: number; value: number;
      correlation: "adjacent-halves-only" }
  | { kind: "pending" | "orphan" | "ignored" | "realtime" | "stale-generation" | "closed" };

/** One pending MSB, strict MSB then LSB, no per-control backlog. Input is untrusted bytes. */
export function createCc14Decoder(options: {
  generation: number; now: () => number; automaticExpiry?: boolean;
}) {
  if (!Number.isSafeInteger(options.generation) || options.generation < 0 || typeof options.now !== "function" ||
      (options.automaticExpiry !== undefined && typeof options.automaticExpiry !== "boolean")) throw new Error("Invalid CC14 options");
  let generation = options.generation, lastTime = -1, closed = false;
  const now = options.now;
  let fault: "clock" | "midi-reset" | null = null;
  let pending: { deck: Cc14Deck; control: Cc14Control; status: number; msb: number; value: number; at: number } | null = null;
  let discarded = 0, countsSaturated = false, lastDiscard: Cc14Discard | null = null;
  let timer: ReturnType<typeof setInterval> | undefined;
  function discard(reason: Cc14Discard) {
    if (!pending) return;
    pending = null; lastDiscard = reason;
    if (discarded < Number.MAX_SAFE_INTEGER) discarded++; else countsSaturated = true;
  }
  function fail(reason: "clock" | "midi-reset") {
    fault = reason; closed = true; discard("fault"); if (timer) clearInterval(timer);
  }
  function tick() {
    if (closed) return;
    let time: number;
    try { time = now(); } catch { fail("clock"); return; }
    if (!Number.isFinite(time) || time < 0 || time > Number.MAX_SAFE_INTEGER || time < lastTime) { fail("clock"); return; }
    lastTime = time;
    if (pending && time - pending.at >= CC14_PROFILE.timeoutMs) discard("timeout");
  }
  tick();
  if (!closed && options.automaticExpiry !== false) { timer = setInterval(tick, 5); timer.unref(); }
  return {
    push(bytes: readonly number[], inputGeneration: number): Cc14Result {
      if (closed) return { kind: "closed" };
      if (inputGeneration !== generation) return { kind: "stale-generation" };
      tick(); if (closed) return { kind: "closed" };
      if (!Array.isArray(bytes) || bytes.length < 1 || bytes.length > 3 ||
          Array.from({ length: bytes.length }, (_, i) => i).some(i => !Object.hasOwn(bytes, i) || !Number.isInteger(bytes[i]) || bytes[i]! < 0 || bytes[i]! > 255)) { discard("invalid-input"); return { kind: "ignored" }; }
      if (bytes.length === 1 && bytes[0] === 0xFF) { fail("midi-reset"); return { kind: "closed" }; }
      if (bytes.length === 1 && bytes[0]! >= 0xF8 && bytes[0]! <= 0xFE) return { kind: "realtime" };
      const [status, cc, value] = bytes;
      if (bytes.length !== 3 || (status !== 0xB4 && status !== 0xB5) || value! > 127 ||
          ![16,17,48,49].includes(cc!)) { discard("interleaved"); return { kind: "ignored" }; }
      const deck: Cc14Deck = status === 0xB4 ? 1 : 2;
      const control: Cc14Control = cc === 16 || cc === 48 ? "gain" : "tempo";
      if (cc! < 32) {
        discard("superseded"); pending = { deck, control, status, msb: cc!, value: value!, at: lastTime };
        return { kind: "pending" };
      }
      if (!pending) return { kind: "orphan" };
      if (pending.status !== status || pending.msb + 32 !== cc) { discard("interleaved"); return { kind: "orphan" }; }
      const raw = (pending.value << 7) | value!; pending = null;
      return { kind: "decoded", deck, control, raw, value: expandCc14(control, raw), correlation: "adjacent-halves-only" };
    },
    tick,
    resetGeneration(next: number) {
      if (closed) throw new Error("CC14 decoder retired");
      if (!Number.isSafeInteger(next) || next <= generation) throw new Error("Generation must increase");
      tick(); if (closed) throw new Error("CC14 decoder retired");
      discard("generation"); generation = next;
    },
    close() { closed = true; discard("closed"); if (timer) clearInterval(timer); },
    status() { return { generation, closed, fault, pending: pending !== null, discarded, countsSaturated, lastDiscard }; },
  };
}
// End of autonomously AI-generated R20 codec.
