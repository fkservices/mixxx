import assert from "node:assert/strict";
import test from "node:test";

export const smokeImportWiring = "source-ts-extension";

test("runs an ESM TypeScript test through Node's built-in runner", async () => {
  assert.equal(new URL(import.meta.url).protocol, "file:");
  const loaded = await import("./smoke.test.ts");
  assert.equal(loaded.smokeImportWiring, "source-ts-extension");
});
