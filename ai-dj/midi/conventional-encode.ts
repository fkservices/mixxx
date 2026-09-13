// Autonomously AI-generated at the user's request. Pure encoding; no MIDI I/O.
import { validateSemanticAction, type ValidationError } from "../core/validate.ts";

export type MidiCommandPacket = readonly [number, number, number];
export type ConventionalWireControl =
  | "deck-1.play" | "deck-2.play" | "deck-1.volume" | "deck-2.volume"
  | "deck-1.sync" | "deck-2.sync" | "deck-1.cue" | "deck-2.cue" | "mixer.crossfader";
export type ConventionalEncodingResult =
  | { readonly ok: true; readonly packet: MidiCommandPacket; readonly controlId: ConventionalWireControl; readonly authorization: "unproven" }
  | { readonly ok: false; readonly reason: "invalid-action"; readonly errors: readonly ValidationError[] }
  | { readonly ok: false; readonly reason: "invalid-deck-bindings" | "unmapped-deck" | "unsupported-action" }
  | { readonly ok: false; readonly reason: "extension-needed"; readonly operationSpecId: "mixxx.cue-lease-guard.v1" | "mixxx.sync-guard.v1" };

/** Raw fixture/adapter serializer, NOT semantic admission or permission to send.
 * Cue false emits canonical Note Off, or explicit Note On zero when requested.
 * There is no automatic release, toggle, retry, scheduler or stateful pairing.
 */
export function encodeConventionalWire(
  control: ConventionalWireControl,
  value: boolean | number,
  releaseEncoding: "note-off" | "note-on-zero" = "note-off",
): MidiCommandPacket | null {
  if (releaseEncoding !== "note-off" && releaseEncoding !== "note-on-zero") return null;
  if (control === "mixer.crossfader") {
    if (releaseEncoding !== "note-off" || !normalized(value)) return null;
    return packet(0xb2, 0x24, Math.floor((value <= 0.5 ? 128 * value : 126 * value + 1) + 0.5));
  }
  // Exact lookup: no parsing arbitrary deck/control names into host calls.
  const routes: Record<string, readonly [number, number, "boolean" | "volume" | "cue"]> = {
    "deck-1.play": [0xb0, 0x20, "boolean"], "deck-2.play": [0xb1, 0x20, "boolean"],
    "deck-1.volume": [0xb0, 0x21, "volume"], "deck-2.volume": [0xb1, 0x21, "volume"],
    "deck-1.sync": [0xb0, 0x22, "boolean"], "deck-2.sync": [0xb1, 0x22, "boolean"],
    "deck-1.cue": [0x90, 0x23, "cue"], "deck-2.cue": [0x91, 0x23, "cue"],
  };
  if (typeof control !== "string" || !Object.hasOwn(routes, control)) return null;
  const [status, address, kind] = routes[control]!;
  if (kind === "volume") return releaseEncoding === "note-off" && normalized(value) ? packet(status, address, Math.floor(127 * value + 0.5)) : null;
  if (typeof value !== "boolean" || (kind !== "cue" && releaseEncoding !== "note-off")) return null;
  return packet(kind === "cue" && !value && releaseEncoding === "note-off" ? status - 0x10 : status, address, value ? 127 : 0);
}

/** deckIds maps opaque reconciled deck identities to the two fixed wire slots.
 * Validation and encoding do not verify this mapping, authority, freshness or host state.
 * The executor must establish those facts immediately before sending any packet.
 */
export function encodeConventionalCommand(input: unknown, deckIds: readonly [string, string]): ConventionalEncodingResult {
  const validation = validateSemanticAction(input);
  if (!validation.ok) return Object.freeze({ ok: false, reason: "invalid-action", errors: validation.errors });
  const ids = bindingIds(deckIds);
  if (!ids) return Object.freeze({ ok: false, reason: "invalid-deck-bindings" });
  const op = validation.value.operation;
  if (op.action === "deck.set_sync_enabled") return Object.freeze({ ok: false, reason: "extension-needed", operationSpecId: "mixxx.sync-guard.v1" });
  if (op.action === "deck.cue_press" || op.action === "deck.cue_release") return Object.freeze({ ok: false, reason: "extension-needed", operationSpecId: "mixxx.cue-lease-guard.v1" });
  let control: ConventionalWireControl;
  let value: boolean | number;
  if (op.action === "mixer.set_parameter") { control = "mixer.crossfader"; value = op.args.normalizedValue; }
  else if (op.action === "deck.set_playing" || (op.action === "deck.set_parameter" && op.args.parameter === "volume")) {
    const slot = ids.indexOf(op.deckId);
    if (slot < 0) return Object.freeze({ ok: false, reason: "unmapped-deck" });
    if (op.action === "deck.set_playing") { control = slot === 0 ? "deck-1.play" : "deck-2.play"; value = op.args.playing; }
    else { control = slot === 0 ? "deck-1.volume" : "deck-2.volume"; value = op.args.normalizedValue; }
  } else return Object.freeze({ ok: false, reason: "unsupported-action" });
  const encoded = encodeConventionalWire(control, value);
  // Admission has already established the ranges; retain a defensive no-packet failure.
  if (!encoded) return Object.freeze({ ok: false, reason: "unsupported-action" });
  return Object.freeze({ ok: true, packet: encoded, controlId: control, authorization: "unproven" });
}

function normalized(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}
function packet(status: number, address: number, value: number): MidiCommandPacket {
  return Object.freeze([status, address, value] as const);
}
function bindingIds(value: unknown): readonly [string, string] | null {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length !== 2 || Reflect.ownKeys(value).length !== 3) return null;
  const first = Object.getOwnPropertyDescriptor(value, "0");
  const second = Object.getOwnPropertyDescriptor(value, "1");
  if (!first || !second || !("value" in first) || !("value" in second)) return null;
  const valid = (id: unknown): id is string => typeof id === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}(?![\s\S])/.test(id);
  if (!valid(first.value) || !valid(second.value) || first.value === second.value) return null;
  return [first.value, second.value];
}
