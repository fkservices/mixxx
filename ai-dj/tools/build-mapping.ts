// Autonomously AI-generated deterministic assembler; only trusted repository sources.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
export const FRAGMENT_ORDER = ["play-volume", "fader-cue", "sync", "conventional-feedback"] as const;
const BEGIN = "// AI-DJ-FRAGMENTS-BEGIN";
const END = "// AI-DJ-FRAGMENTS-END";

export function renderMapping(bootstrap: string, fragments: readonly string[]): string {
  if (fragments.length !== FRAGMENT_ORDER.length || fragments.some(x => !x.trim())) throw new Error("Exactly four nonempty fragments are required");
  if (bootstrap.split(BEGIN).length !== 2 || bootstrap.split(END).length !== 2) throw new Error("Expected unique assembly markers");
  const start = bootstrap.indexOf(BEGIN) + BEGIN.length;
  const end = bootstrap.indexOf(END);
  if (end < start) throw new Error("Reversed assembly markers");
  for (const source of fragments) if (source.includes(BEGIN) || source.includes(END)) throw new Error("Fragment contains assembly markers");
  return bootstrap.slice(0,start) + "\n" + fragments.map((source,i) => `// Fragment: ${FRAGMENT_ORDER[i]}.js\n${source.trimEnd()}\n`).join("\n") + bootstrap.slice(end);
}

export async function buildMapping(check = false): Promise<void> {
  const output = new URL("../../res/controllers/AI-DJ-scripts.js",import.meta.url);
  const current = await readFile(output,"utf8");
  const fragments = await Promise.all(FRAGMENT_ORDER.map(name => readFile(new URL(`../hosts/mixxx/fragments/${name}.js`,import.meta.url),"utf8")));
  const generated = renderMapping(current,fragments);
  if (check) { if (current !== generated) throw new Error("Mapping bundle is stale; run tools/build-mapping.ts"); }
  else if (current !== generated) await writeFile(output,generated);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.slice(2).some(arg => arg !== "--check")) throw new Error("Usage: build-mapping.ts [--check]");
  await buildMapping(process.argv.includes("--check"));
  console.log(process.argv.includes("--check") ? "Mapping bundle matches all four source fragments" : "Assembled four mapping fragments");
}
