// Autonomously AI-generated read-only observer factory. Integration owns its lifecycle.
// ES5-compatible host source: no Node APIs, native writes or MIDI output.
AIDJ.createManualCueObserver = function(options) {
    var keys = ["cue_default", "cue_gotoandstop", "cue_point", "cue_mode", "cue_preview", "cue_indicator", "play", "play_latched"];
    var max = 9007199254740991;
    var now = options.now;
    var clock = options.clockDomainId;
    if (typeof now !== "function" || typeof clock !== "string" || !/^[A-Za-z0-9_.:-]{1,128}$/.test(clock)) throw new Error("Invalid observer clock");
    var generation = 0, sequence = 0, lastTime = -1;
    var active = false, fault = null, cleanupFailed = false, timer = null;
    var routes = [], queue = [], gap = null;
    function finite(n) { return typeof n === "number" && isFinite(n); }
    function connected(route) { return route.connection && route.connection.isConnected === true; }
    function timestamp() {
        var at;
        try { at = now(); } catch (error) { fault = "clock-failed"; active = false; return null; }
        if (!finite(at) || at < 0 || at < lastTime) { fault = "clock-invalid-or-regressed"; active = false; return null; }
        lastTime = at;
        return at;
    }
    function emit(route, trigger, presence, value) {
        if (!active) return;
        if (sequence === max) { fault = "sequence-exhausted"; active = false; return; }
        var at = timestamp();
        if (at === null) return;
        var record = {schemaVersion:1, generation:generation, sequence:sequence++, deck:route.deck,
            controlKey:route.key, clockDomainId:clock, observedAtMs:at, trigger:trigger,
            presence:presence, value:value};
        if (queue.length >= 256) {
            if (gap === null) gap = {generation:generation, firstSequence:record.sequence, lastSequence:record.sequence, count:1};
            else { gap.lastSequence = record.sequence; gap.count++; }
        } else queue.push(record);
    }
    function sample(route, trigger) {
        if (!active) return;
        if (!connected(route)) { emit(route, "unavailable", "unavailable", null); return; }
        try {
            var value = engine.getValue(route.group, route.key);
            emit(route, trigger, finite(value) ? "present" : "unknown", finite(value) ? value : null);
        } catch (error) { emit(route, trigger, "unknown", null); }
    }
    function subscribe(deck, key, token) {
        var route = {deck:deck, group:"[Channel" + deck + "]", key:key, connection:null};
        routes.push(route);
        try {
            // Mixxx makeConnection preserves FIFO events. The unbuffered variant
            // skips superseded values and is unsuitable for button edges.
            route.connection = engine.makeConnection(route.group, route.key, function(value) {
                if (!active || generation !== token || !connected(route)) return;
                // Preserve the callback edge; rereading here can replace it with a later zero.
                emit(route, "callback", finite(value) ? "present" : "unknown", finite(value) ? value : null);
            });
        } catch (error) { route.connection = null; }
        if (route.connection && typeof route.connection.disconnect !== "function") {
            cleanupFailed = true;
            fault = "invalid-connection-handle";
            active = false;
            return;
        }
        sample(route, "initial");
    }
    function shutdown() {
        active = false;
        if (timer !== null) {
            try { engine.stopTimer(timer); } catch (error) { cleanupFailed = true; }
            timer = null;
        }
        for (var i = 0; i < routes.length; i++) {
            var connection = routes[i].connection;
            routes[i].connection = null;
            if (connection && typeof connection.disconnect === "function") {
                try { connection.disconnect(); } catch (error) { cleanupFailed = true; }
            }
        }
        routes = [];
        return !cleanupFailed;
    }
    function start() {
        if (active || routes.length || timer !== null) throw new Error("Observer already started; shut down before restart");
        if (cleanupFailed || fault !== null) throw new Error("Observer fault requires a new instance");
        if (queue.length || gap !== null) throw new Error("Drain prior generation before restart");
        if (generation === max) throw new Error("Observer generation exhausted");
        generation++; sequence = 0; active = true;
        var token = generation;
        try {
            for (var deck = 1; deck <= 2 && active; deck++) {
                for (var i = 0; i < keys.length && active; i++) subscribe(deck, keys[i], token);
            }
            if (!active) throw new Error("Observer initialization failed: " + fault);
            timer = engine.beginTimer(100, function() {
                if (!active || generation !== token) return;
                for (var i = 0; i < routes.length && active; i++) sample(routes[i], "refresh");
            });
            if (!finite(timer) || timer <= 0 || Math.floor(timer) !== timer) { timer = null; throw new Error("Invalid observer timer"); }
        } catch (error) { shutdown(); throw error; }
    }
    function drain(limit) {
        if (!finite(limit) || Math.floor(limit) !== limit || limit < 1 || limit > 256) throw new Error("Drain limit must be 1..256");
        var records = queue.splice(0, limit);
        var reportedGap = gap;
        gap = null;
        // Caller receives detached records; no retained object can be mutated through this result.
        return {records:records, gap:reportedGap};
    }
    return {start:start, shutdown:shutdown, drain:drain, status:function() {
        return {active:active, generation:generation, nextSequence:sequence, queued:queue.length,
            gapPending:gap !== null, fault:fault, cleanupFailed:cleanupFailed};
    }};
};
// End of autonomously AI-generated file.
