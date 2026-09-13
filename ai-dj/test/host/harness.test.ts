// Autonomously AI-generated lifecycle tests at the user request.
import assert from "node:assert/strict";
import test from "node:test";
import { createHostHarness } from "./harness.ts";

test("mapping bootstrap initializes and shuts down twice without writes or resources", () => {
  const h = createHostHarness();
  for (let i = 0; i < 2; i++) {
    h.mapping.init("AI DJ", true);
    h.mapping.input(0, 0x20, 127, 0xb0, "[Channel1]");
    assert.equal(h.mapping.shutdown(), true);
    assert.equal(h.connections.size, 0); assert.equal(h.timers.size, 0);
  }
  assert.equal(h.writes.length, 0); assert.equal(h.packets.length, 0);
  assert.equal(h.logs.filter(x => x.includes("initialized; fragments=0")).length, 2);
});

test("fragment lifecycle order and handle cleanup survive reinit and partial initialization failure", () => {
  const fragment = (name: string, fail = false) => `AIDJ.register('${name}', {
    init: function(id, debug, life) {
      console.log('init:${name}');
      life.trackConnection(engine.makeConnection('[Channel1]', 'play', function() {}));
      life.trackTimer(engine.beginTimer(100, function() {}));
      ${fail ? "throw new Error('fixture init failure');" : ""}
    }, shutdown: function() { console.log('stop:${name}'); }, input: function() { return false; }
  });`;
  const h = createHostHarness([fragment("sync"), fragment("play-volume")]);
  h.mapping.init("AI DJ", false); h.mapping.init("AI DJ", false);
  assert.equal(h.connections.size, 2); assert.equal(h.timers.size, 2);
  assert.deepEqual(h.logs.filter(x => /^(init|stop):/.test(x)), ["init:play-volume", "init:sync", "stop:sync", "stop:play-volume", "init:play-volume", "init:sync"]);
  h.mapping.shutdown(); h.mapping.shutdown();
  assert.equal(h.connections.size, 0); assert.equal(h.timers.size, 0);
  const failed = createHostHarness([fragment("play-volume"), fragment("sync", true)]);
  assert.throws(() => failed.mapping.init("AI DJ", false), /fixture init failure/);
  assert.equal(failed.connections.size, 0); assert.equal(failed.timers.size, 0);
});

test("fragment registration rejects unknown, duplicate and active mutation", () => {
  const h = createHostHarness();
  const module = { init() {}, shutdown() {}, input() { return false; } };
  assert.throws(() => h.mapping.register("unknown", module));
  h.mapping.register("sync", module);
  assert.throws(() => h.mapping.register("sync", module));
  h.mapping.init("AI DJ", false);
  assert.throws(() => h.mapping.register("play-volume", module));
  h.mapping.shutdown();
});

test("cleanup failure drains other handles and prevents subsequent reinitialization", () => {
  const h = createHostHarness([`AIDJ.register('sync', {
    init: function(id, debug, life) {
      life.trackConnection(engine.makeConnection('[Channel1]', 'play', function() {}));
      life.trackTimer(engine.beginTimer(100, function() {}));
    }, shutdown: function() { throw new Error('fixture cleanup failure'); }, input: function() { return false; }
  });`]);
  h.mapping.init("AI DJ", false);
  assert.equal(h.mapping.shutdown(), false);
  assert.equal(h.connections.size, 0); assert.equal(h.timers.size, 0);
  assert.throws(() => h.mapping.init("AI DJ", false), /cleanup failed/);
  assert.throws(() => h.mapping.init("AI DJ", false), /cleanup failed/);
});
