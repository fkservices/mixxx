// Autonomously AI-generated host harness; deterministic stubs, not Mixxx proof.
import vm from "node:vm";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

type Callback = (...args: unknown[]) => void;
export interface MappingLifecycle {
  init(id: string, debug: boolean): void;
  shutdown(): boolean;
  input(channel: number, control: number, value: number, status: number, group: string): void;
  register(name: string, module: { init: Callback; shutdown: Callback; input: (...args: unknown[]) => boolean }): void;
}
export function createHostHarness(fragments: readonly string[] = []) {
  const values = new Map<string, number>();
  const parameters = new Map<string, number>();
  const connections = new Set<{ readonly isConnected: boolean; group: string; key: string; callback: Callback; disconnect(): void; trigger(): void }>();
  const unavailableControls = new Set<string>();
  const timers = new Map<number, Callback>();
  const writes: Array<{ api: string; group: string; key: string; value: number }> = [];
  const packets: number[][] = [];
  const logs: string[] = [];
  let nextTimer = 1;
  const keyOf = (group: string, key: string) => JSON.stringify([group, key]);
  const read = (store: Map<string, number>, group: string, key: string) => store.get(keyOf(group, key)) ?? 0;
  const write = (api: string, store: Map<string, number>, group: string, key: string, value: number) => {
    writes.push({ api, group, key, value }); store.set(keyOf(group, key), value);
    for (const c of connections) if (c.group === group && c.key === key) c.callback(value, group, key);
  };
  const engine = {
    getValue: (g: string, k: string) => read(values, g, k),
    getParameter: (g: string, k: string) => read(parameters, g, k),
    setValue: (g: string, k: string, v: number) => write("setValue", values, g, k, v),
    setParameter: (g: string, k: string, v: number) => write("setParameter", parameters, g, k, v),
    makeConnection(g: string, k: string, callback: Callback) {
      if (unavailableControls.has(keyOf(g, k))) return undefined;
      const connection = { get isConnected(): boolean { return connections.has(connection); }, group: g, key: k, callback, disconnect() { connections.delete(connection); }, trigger() { callback(read(values, g, k), g, k); } };
      connections.add(connection); return connection;
    },
    beginTimer(interval: number, callback: Callback) { assert.ok(Number.isFinite(interval) && interval > 0); const id = nextTimer++; timers.set(id, callback); return id; },
    stopTimer(id: number) { timers.delete(id); },
  };
  const context = vm.createContext({ engine, midi: { sendShortMsg: (...packet: number[]) => packets.push(packet) }, console: { log: (...v: unknown[]) => logs.push(v.join(" ")) } });
  const source = readFileSync(new URL("../../../res/controllers/AI-DJ-scripts.js", import.meta.url), "utf8");
  vm.runInContext(source, context, { timeout: 1000, filename: "AI-DJ-scripts.js" });
  for (const [i, fragment] of fragments.entries()) vm.runInContext(fragment, context, { timeout: 1000, filename: `fragment-${i}.js` });
  const mapping = context.AIDJ as MappingLifecycle;
  return { mapping, engine, values, parameters, connections, timers, writes, packets, logs,
    setAvailable: (group: string, key: string, available: boolean) => { if (available) unavailableControls.delete(keyOf(group, key)); else { unavailableControls.add(keyOf(group, key)); for (const c of [...connections]) if (c.group === group && c.key === key) c.disconnect(); } },
    evaluate: (script: string) => vm.runInContext(script, context, { timeout: 1000 }),
    tick: () => { for (const callback of [...timers.values()]) callback(); },
  };
}
