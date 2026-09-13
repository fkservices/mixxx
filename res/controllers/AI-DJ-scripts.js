// Autonomously AI-generated mapping with initial controls and opt-in extended endpoint.
// M10 reproducibly assembles trusted source fragments between the markers below.
var AIDJ = (function() {
    var order = ["play-volume", "fader-cue", "sync", "conventional-feedback"];
    var modules = {};
    var active = false;
    var cleanupFailed = false;
    var started = [];
    var connections = [];
    var timers = [];
    var api = {};
    var wireConfiguration = null;
    var wireEndpoint = null;
    var wireClock = null;
    var wireGeneration = 0;
    api.incomingData = function() {};
    api.configureWire = function(options) {
        if (active || wireConfiguration) throw new Error("Configure wire only once before initialization");
        if (!options || typeof options.now !== "function" || typeof options.onFault !== "function" ||
                !Array.isArray(options.handlers) || options.handlers.length > 8 ||
                typeof options.clockDomainId !== "string" || !/^[A-Za-z0-9_.:-]{1,128}$/.test(options.clockDomainId) ||
                (options.clockKind !== "monotonic" && options.clockKind !== "diagnostic-wall")) throw new Error("Invalid wire configuration");
        if (options.clockKind === "diagnostic-wall" && options.allowDiagnostic !== true) throw new Error("Wall clock requires diagnostic-only mode");
        var handlers = options.handlers.map(function(h) {
            if (!h || (options.clockKind === "diagnostic-wall" && h.opcode !== 112 && h.opcode !== 113)) throw new Error("Diagnostic clock cannot register semantic handlers");
            return {opcode:h.opcode,validate:h.validate,handle:h.handle};
        });
        wireConfiguration = {now:options.now,onFault:options.onFault,handlers:handlers,allowDiagnostic:options.allowDiagnostic,
            clockKind:options.clockKind,clockDomainId:options.clockDomainId};
    };
    api.wireStatus = function() {
        var status = wireEndpoint ? wireEndpoint.status() : null;
        return {enabled:status !== null && !status.closed,clock:wireClock,clockProvenance:"caller-supplied-unverified",endpoint:status};
    };
    api.sendWire = function(message) {
        if (!active || !wireEndpoint) throw new Error("Wire endpoint disabled");
        if (wireClock.kind === "diagnostic-wall" && message.opcode !== 112 && message.opcode !== 113) throw new Error("Diagnostic clock cannot send semantic messages");
        return wireEndpoint.send(message);
    };
    // Autonomously AI-generated native short-message reset route.
    api.resetInput = function(channel, control, value, status, group) {
        if (!active || !wireEndpoint || status !== 0xFF || control !== 0 || value !== 0 || group !== "[Master]") return;
        return wireEndpoint.receive(new Uint8Array([0xFF]), 1, wireGeneration);
    };
    // End of autonomously AI-generated reset route.
    // Autonomously AI-generated opt-in native loss handler; no MIDI reset attribution.
    api.inputError = function(reason) {
        if (wireEndpoint && (reason === "portmidi-overflow" || reason === "portmidi-read-error")) wireEndpoint.invalidate();
    };
    // End of autonomously AI-generated loss handler.
    api.profileId = "mixxx-2.5.6-latenight-conventional-v1";
    api.metadataSchemaVersion = 2;
    api.register = function(name, module) {
        if (active || order.indexOf(name) === -1 || Object.prototype.hasOwnProperty.call(modules, name)) {
            throw new Error("AI DJ invalid or duplicate fragment registration");
        }
        if (!module || typeof module.init !== "function" || typeof module.shutdown !== "function" || typeof module.input !== "function") {
            throw new Error("AI DJ fragment requires init, shutdown and input");
        }
        modules[name] = module;
    };
    api.trackConnection = function(connection) {
        if (!active || !connection || typeof connection.disconnect !== "function") {
            throw new Error("AI DJ invalid connection registration");
        }
        connections.push(connection);
        return connection;
    };
    api.trackTimer = function(timer) {
        if (!active || typeof timer !== "number" || !isFinite(timer) || timer <= 0 || Math.floor(timer) !== timer) {
            throw new Error("AI DJ invalid timer registration");
        }
        timers.push(timer);
        return timer;
    };
    api.shutdown = function() {
        active = false;
        var failed = cleanupFailed;
        wireConfiguration = null;
        api.incomingData = function() {};
        var closingWire = wireEndpoint;
        wireEndpoint = null;
        wireClock = null;
        if (closingWire) {
            try {
                closingWire.close();
                var wireFault = closingWire.status().fault;
                if (wireFault && wireFault.indexOf("cleanup-failed") !== -1) failed = true;
            } catch (error) { failed = true; }
        }
        while (started.length) {
            try { started.pop().shutdown(); } catch (error) { failed = true; console.log("AI DJ fragment shutdown error: " + error); }
        }
        while (timers.length) {
            try { engine.stopTimer(timers.pop()); } catch (error) { failed = true; console.log("AI DJ timer cleanup error: " + error); }
        }
        while (connections.length) {
            try { connections.pop().disconnect(); } catch (error) { failed = true; console.log("AI DJ connection cleanup error: " + error); }
        }
        cleanupFailed = failed;
        console.log("AI DJ shutdown; cleanup=" + (failed ? "failed" : "complete"));
        return !failed;
    };
    api.init = function(id, debugging) {
        var requestedWire = wireConfiguration;
        if (!api.shutdown()) throw new Error("AI DJ cleanup failed before initialization");
        active = true;
        try {
            for (var i = 0; i < order.length; i++) {
                if (Object.prototype.hasOwnProperty.call(modules, order[i])) {
                    var module = modules[order[i]];
                    started.push(module);
                    module.init(id, debugging, api);
                }
            }
            if (requestedWire) {
                if (wireGeneration >= 9007199254740991) throw new Error("Wire generation exhausted");
                requestedWire.generation = ++wireGeneration;
                var endpoint = api.createWireEndpoint(requestedWire);
                var token = wireGeneration;
                wireEndpoint = endpoint;
                wireClock = Object.freeze({kind:requestedWire.clockKind,id:requestedWire.clockDomainId});
                api.incomingData = function(data, length) {
                    if (!active || wireEndpoint !== endpoint || wireGeneration !== token) return;
                    return endpoint.receive(data, length, token);
                };
            }
        } catch (error) {
            api.shutdown();
            throw error;
        }
        console.log("AI DJ initialized; fragments=" + started.length + "; profile=" + api.profileId);
    };
    api.input = function(channel, control, value, status, group) {
        if (!active || typeof value !== "number" || !isFinite(value) || value < 0 || value > 127 || Math.floor(value) !== value) return;
        // Fragments must independently accept only their frozen status/address/group.
        for (var i = 0; i < started.length; i++) {
            if (started[i].input(channel, control, value, status, group) === true) return;
        }
    };
    return api;
}());
// AI-DJ-FRAGMENTS-BEGIN
// Fragment: play-volume.js
// Autonomously AI-generated fixed F09 play/volume fragment. Raw adapter, not authority.
AIDJ.register("play-volume", (function() {
    var routes = [
        {channel: 0, status: 0xB0, address: 0x20, group: "[Channel1]", key: "play"},
        {channel: 0, status: 0xB0, address: 0x21, group: "[Channel1]", key: "volume"},
        {channel: 1, status: 0xB1, address: 0x20, group: "[Channel2]", key: "play"},
        {channel: 1, status: 0xB1, address: 0x21, group: "[Channel2]", key: "volume"}
    ];
    var active = false;
    return {
        init: function(id, debugging, lifecycle) {
            for (var i = 0; i < routes.length; i++) {
                var route = routes[i];
                route.connection = null;
                // Probe only declared profile controls. A numeric zero read is never presence.
                try {
                    var connection = engine.makeConnection(route.group, route.key, function() {});
                    if (connection && typeof connection.disconnect === "function") {
                        lifecycle.trackConnection(connection);
                        route.connection = connection;
                    }
                } catch (error) {
                    console.log("AI DJ play-volume unavailable: " + route.group + "," + route.key);
                }
            }
            active = true;
        },
        shutdown: function() {
            active = false;
            for (var i = 0; i < routes.length; i++) routes[i].connection = null;
            // Common lifecycle disposes all tracked connection handles.
        },
        input: function(channel, control, value, status, group) {
            if (!active || typeof value !== "number" || !isFinite(value) || value < 0 || value > 127 || Math.floor(value) !== value) return false;
            for (var i = 0; i < routes.length; i++) {
                var route = routes[i];
                if (channel !== route.channel || status !== route.status || control !== route.address || group !== route.group) continue;
                if (!route.connection || route.connection.isConnected !== true) return true;
                if (route.key === "play") engine.setValue(route.group, "play", value > 0 ? 1 : 0);
                else engine.setParameter(route.group, "volume", value / 127);
                return true;
            }
            return false;
        }
    };
}()));

// Fragment: fader-cue.js
// Autonomously AI-generated raw fixture fragment. Production cue requires a host lease guard.
AIDJ.register("fader-cue", (function() {
    var active = false;
    var routes = [
        {group: "[Master]", key: "crossfader", connection: null},
        {group: "[Channel1]", key: "cue_preview", connection: null, pendingRelease: false},
        {group: "[Channel2]", key: "cue_preview", connection: null, pendingRelease: false}
    ];
    function connected(route) { return route.connection && route.connection.isConnected === true; }
    return {
        init: function(id, debugging, lifecycle) {
            for (var i = 0; i < routes.length; i++) {
                var route = routes[i];
                route.connection = null;
                route.pendingRelease = false;
                try {
                    var connection = engine.makeConnection(route.group, route.key, function() {});
                    if (connection && typeof connection.disconnect === "function") {
                        lifecycle.trackConnection(connection);
                        route.connection = connection;
                    }
                } catch (error) { console.log("AI DJ fader-cue unavailable: " + route.group + "," + route.key); }
            }
            active = true;
        },
        shutdown: function() {
            active = false;
            var failed = false;
            for (var i = 1; i < routes.length; i++) {
                var route = routes[i];
                if (!route.pendingRelease) continue;
                try {
                    if (!connected(route)) throw new Error("cue release connection unavailable");
                    engine.setValue(route.group, "cue_preview", 0);
                    route.pendingRelease = false;
                } catch (error) { failed = true; console.log("AI DJ cue shutdown release unconfirmed: " + route.group); }
            }
            for (var j = 0; j < routes.length; j++) routes[j].connection = null;
            // A setter call is not verified release completion. This catches local failure only.
            if (failed) throw new Error("AI DJ cue cleanup unconfirmed");
        },
        input: function(channel, control, value, status, group) {
            if (!active || typeof value !== "number" || !isFinite(value) || value < 0 || value > 127 || Math.floor(value) !== value) return false;
            if (channel === 2 && status === 0xB2 && control === 0x24 && group === "[Master]") {
                if (connected(routes[0])) engine.setParameter("[Master]", "crossfader", value <= 64 ? value / 128 : (value - 1) / 126);
                return true;
            }
            if ((channel !== 0 && channel !== 1) || control !== 0x23 || (status !== 0x90 + channel && status !== 0x80 + channel)) return false;
            var route = routes[channel + 1];
            if (group !== route.group) return false;
            if (!connected(route)) return true;
            var pressed = status === 0x90 + channel && value > 0;
            if (pressed) route.pendingRelease = true; // Includes a setter throwing after an uncertain write.
            engine.setValue(route.group, "cue_preview", pressed ? 1 : 0);
            if (!pressed) route.pendingRelease = false;
            return true;
        }
    };
}()));

// Fragment: sync.js
// Autonomously AI-generated raw sync setter. Production execution requires mixxx.sync-guard.v1.
AIDJ.register("sync", (function() {
    var active = false;
    var routes = [
        {group: "[Channel1]", channel: 0, connection: null},
        {group: "[Channel2]", channel: 1, connection: null}
    ];
    function connected(route) { return route.connection && route.connection.isConnected === true; }
    // Local host sample only: no action acknowledgement, attribution, topology or tempo/phase proof.
    AIDJ.readSyncState = function(deck) {
        if (deck !== 1 && deck !== 2) return {kind: "unknown", reason: "unsupported-deck"};
        var route = routes[deck - 1];
        if (!active || !connected(route)) return {kind: "unknown", reason: "connection-unavailable"};
        try {
            var value = engine.getValue(route.group, "sync_enabled");
            if (value !== 0 && value !== 1) return {kind: "unknown", reason: "invalid-host-value"};
            return {kind: "control-value", deck: deck, enabled: value === 1, actor: "unknown", correlation: "none"};
        } catch (error) { return {kind: "unknown", reason: "host-read-failed"}; }
    };
    return {
        init: function(id, debugging, lifecycle) {
            for (var i = 0; i < routes.length; i++) {
                var route = routes[i]; route.connection = null;
                try {
                    var connection = engine.makeConnection(route.group, "sync_enabled", function() {});
                    if (connection && typeof connection.disconnect === "function") {
                        lifecycle.trackConnection(connection); route.connection = connection;
                    }
                } catch (error) { console.log("AI DJ sync unavailable: " + route.group); }
            }
            active = true;
        },
        shutdown: function() {
            active = false;
            for (var i = 0; i < routes.length; i++) routes[i].connection = null;
            // Never emit an opposite value: rapid enable/disable can request one-shot sync.
        },
        input: function(channel, control, value, status, group) {
            if (!active || (channel !== 0 && channel !== 1) || status !== 0xB0 + channel || control !== 0x22 || typeof value !== "number" || !isFinite(value) || value < 0 || value > 127 || Math.floor(value) !== value) return false;
            var route = routes[channel];
            if (group !== route.group) return false;
            if (!connected(route)) return true;
            engine.setValue(route.group, "sync_enabled", value > 0 ? 1 : 0);
            return true;
        }
    };
}()));

// Fragment: conventional-feedback.js
// Autonomously AI-generated F09 feedback. Samples controls, never command intent.
AIDJ.register("conventional-feedback", (function() {
    var active = false;
    var generation = 0;
    var routes = [
        {group:"[Channel1]",key:"play",status:0xB8,address:0x20,presence:0x70,kind:"boolean"},
        {group:"[Channel1]",key:"volume",status:0xB8,address:0x21,presence:0x71,kind:"volume"},
        {group:"[Channel1]",key:"cue_preview",status:0xB8,address:0x23,presence:0x72,kind:"boolean"},
        {group:"[Channel1]",key:"sync_enabled",status:0xB8,address:0x22,presence:0x73,kind:"boolean"},
        {group:"[Channel2]",key:"play",status:0xB9,address:0x20,presence:0x70,kind:"boolean"},
        {group:"[Channel2]",key:"volume",status:0xB9,address:0x21,presence:0x71,kind:"volume"},
        {group:"[Channel2]",key:"cue_preview",status:0xB9,address:0x23,presence:0x72,kind:"boolean"},
        {group:"[Channel2]",key:"sync_enabled",status:0xB9,address:0x22,presence:0x73,kind:"boolean"},
        {group:"[Master]",key:"crossfader",status:0xBA,address:0x24,presence:0x74,kind:"crossfader"}
    ];
    function sample(route) {
        if (!active) return;
        var data = null;
        if (route.connection && route.connection.isConnected === true) {
            try {
                // Callback payload may be raw gain; re-read with the profile's exact API.
                var value = route.kind === "boolean" ? engine.getValue(route.group,route.key) : engine.getParameter(route.group,route.key);
                if (route.kind === "boolean") {
                    if (value === 0 || value === 1) data = value === 1 ? 127 : 0;
                } else if (typeof value === "number" && isFinite(value) && value >= 0 && value <= 1) {
                    data = route.kind === "volume" ? Math.floor(127*value+0.5) : Math.floor((value <= 0.5 ? 128*value : 126*value+1)+0.5);
                }
            } catch (error) { data = null; }
        }
        // Failed subscription/read is unknown, never evidence of confirmed absence.
        midi.sendShortMsg(route.status,route.presence,data === null ? 64 : 127);
        if (data !== null) midi.sendShortMsg(route.status,route.address,data);
    }
    function subscribe(route, lifecycle, epoch) {
        route.connection = null;
        try {
            var connection = engine.makeConnection(route.group,route.key,function() { if (epoch === generation) sample(route); });
            if (connection && typeof connection.disconnect === "function") {
                lifecycle.trackConnection(connection); route.connection = connection;
            }
        } catch (error) { console.log("AI DJ feedback subscription unavailable: "+route.group+","+route.key); }
    }
    function refresh() { if (active) for (var i=0;i<routes.length;i++) sample(routes[i]); }
    return {
        init: function(id, debugging, lifecycle) {
            generation += 1;
            var epoch = generation;
            for (var i=0;i<routes.length;i++) subscribe(routes[i],lifecycle,epoch);
            active = true;
            refresh();
            lifecycle.trackTimer(engine.beginTimer(100,function() { if (epoch === generation) refresh(); }));
        },
        shutdown: function() {
            active = false;
            generation += 1;
            for (var i=0;i<routes.length;i++) routes[i].connection = null;
        },
        input: function() { return false; } // Never echo a received command.
    };
}()));

// Fragment: wire-encode.js
// Autonomously AI-generated R01 host encoder; pure bytes, no transport or authority.
AIDJ.encodeWire = (function() {
    var MAX = 65536;
    var roles = {1:[0],2:[1],3:[1],4:[0],5:[1],6:[1],7:[0],8:[1],9:[0,1],10:[0],11:[1],12:[0,1],112:[0,1],113:[0,1]};
    function fail(message) { throw new Error(message); }
    function finite(n) { if (typeof n !== "number" || !isFinite(n) || (n === 0 && 1 / n === -Infinity)) fail("Invalid number"); return n; }
    function utf8(s) {
        if (typeof s !== "string" || s.length > MAX) fail("Invalid or oversized text");
        var out = [];
        for (var i = 0; i < s.length; i++) {
            var cp = s.charCodeAt(i);
            if (cp >= 0xd800 && cp <= 0xdbff) {
                var low = s.charCodeAt(++i);
                if (!(low >= 0xdc00 && low <= 0xdfff)) fail("Invalid Unicode");
                cp = 0x10000 + (cp - 0xd800) * 1024 + low - 0xdc00;
            } else if (cp >= 0xdc00 && cp <= 0xdfff) fail("Invalid Unicode");
            if (cp < 128) out.push(cp);
            else if (cp < 2048) out.push(192 | (cp >> 6), 128 | (cp & 63));
            else if (cp < 65536) out.push(224 | (cp >> 12), 128 | ((cp >> 6) & 63), 128 | (cp & 63));
            else out.push(240 | (cp >> 18), 128 | ((cp >> 12) & 63), 128 | ((cp >> 6) & 63), 128 | (cp & 63));
            if (out.length > MAX) fail("Payload exceeds limit");
        }
        return out;
    }
    function own(o) {
        if (o === null || typeof o !== "object") fail("Expected plain data");
        var proto = Object.getPrototypeOf(o);
        if (proto !== null && proto !== Object.prototype && !(Array.isArray(o) && proto === Array.prototype)) fail("Expected plain data");
        if (Object.getOwnPropertySymbols && Object.getOwnPropertySymbols(o).length) fail("Symbol key");
        var keys = Object.getOwnPropertyNames(o);
        if (keys.length > 4097) fail("Too many keys");
        var result = Object.create(null);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i], d = Object.getOwnPropertyDescriptor(o, key);
            if (!d || !Object.prototype.hasOwnProperty.call(d, "value") || (!d.enumerable && !(Array.isArray(o) && key === "length"))) fail("Accessor or hidden field");
            result[key] = d.value;
        }
        return result;
    }
    function json(root) {
        if (root === null || typeof root !== "object" || Array.isArray(root)) fail("JSON root must be an object");
        var chunks = [], bytes = 0, nodes = 0, active = [];
        function emit(s) { bytes += utf8(s).length; if (bytes > MAX) fail("Payload exceeds limit"); chunks.push(s); }
        function visit(v, depth) {
            if (depth > 32 || ++nodes > 4096) fail("JSON resource limit");
            if (v === null || typeof v === "boolean") { emit(JSON.stringify(v)); return; }
            if (typeof v === "number") { emit(JSON.stringify(finite(v))); return; }
            if (typeof v === "string") { utf8(v); emit(JSON.stringify(v)); return; }
            if (typeof v !== "object" || active.indexOf(v) !== -1) fail("Invalid or cyclic JSON");
            var d = own(v), keys = Object.keys(d); active.push(v);
            if (Array.isArray(v)) {
                if (d.length > 4096 || keys.length !== d.length + 1) fail("Sparse or extended array");
                emit("[");
                for (var i = 0; i < d.length; i++) {
                    if (!Object.prototype.hasOwnProperty.call(d, String(i))) fail("Sparse array");
                    if (i) emit(","); visit(d[i], depth + 1);
                }
                emit("]");
            } else {
                emit("{");
                for (var j = 0; j < keys.length; j++) {
                    if (j) emit(","); utf8(keys[j]); emit(JSON.stringify(keys[j])); emit(":"); visit(d[keys[j]], depth + 1);
                }
                emit("}");
            }
            active.pop();
        }
        visit(root, 1); return utf8(chunks.join(""));
    }
    function digits(value, width) {
        var out = [];
        for (var i = 0; i < width; i++) { out.push(value % 128); value = Math.floor(value / 128); }
        if (value !== 0) fail("Integer overflow"); return out;
    }
    function sessionDigits(hex) {
        // Multiply base-128 digits by 16 for each hex nibble; never round 128 bits through Number.
        var out = [], i, j;
        for (i = 0; i < 19; i++) out.push(0);
        for (i = 0; i < hex.length; i++) {
            var carry = parseInt(hex.charAt(i), 16);
            for (j = 0; j < 19; j++) { var n = out[j] * 16 + carry; out[j] = n % 128; carry = Math.floor(n / 128); }
            if (carry) fail("Session overflow");
        }
        return out;
    }
    function pack(bytes) {
        var out = [];
        for (var start = 0; start < bytes.length; start += 7) {
            var count = Math.min(7, bytes.length - start), mask = 0, i;
            for (i = 0; i < count; i++) mask |= (bytes[start + i] >> 7) << i;
            out.push(mask); for (i = 0; i < count; i++) out.push(bytes[start + i] & 127);
        }
        return out;
    }
    function crc(bytes) {
        var n = 65535;
        for (var i = 0; i < bytes.length; i++) { n ^= bytes[i] << 8; for (var j = 0; j < 8; j++) n = ((n << 1) ^ ((n & 32768) ? 4129 : 0)) & 65535; }
        return n;
    }
    return function(input, allowDiagnostic) {
        if (allowDiagnostic === undefined) allowDiagnostic = false;
        var d = own(input), fields = ["direction", "opcode", "session", "sequence", "payload"];
        if (Object.keys(d).length !== 5 || fields.some(function(k) { return !Object.prototype.hasOwnProperty.call(d, k); })) fail("Invalid header fields");
        var direction = d.direction, opcode = d.opcode, session = d.session, sequence = d.sequence;
        if ((direction !== 0 && direction !== 1) || typeof opcode !== "number" || !Object.prototype.hasOwnProperty.call(roles, opcode) || roles[opcode].indexOf(direction) < 0) fail("Unsupported route");
        if (typeof session !== "string" || !/^[0-9a-f]{32}$/.test(session)) fail("Invalid session");
        finite(sequence); if (sequence < 0 || sequence > 9007199254740991 || Math.floor(sequence) !== sequence) fail("Invalid sequence");
        if (typeof allowDiagnostic !== "boolean" || (opcode >= 112 && !allowDiagnostic)) fail("Diagnostic disabled");
        var encoding, payload;
        if (opcode === 112) {
            finite(d.payload); encoding = 1;
            var buffer = new ArrayBuffer(8); new DataView(buffer).setFloat64(0, d.payload, true);
            payload = Array.prototype.slice.call(new Uint8Array(buffer));
        } else if (opcode === 113) { encoding = 2; payload = utf8(d.payload); }
        else { encoding = 3; payload = json(d.payload); }
        var count = Math.max(1, Math.ceil(payload.length / 512)), frames = [];
        for (var index = 0; index < count; index++) {
            var fragment = payload.slice(index * 512, (index + 1) * 512);
            var body = [125,65,73,68,74,1,direction,opcode,encoding].concat(sessionDigits(session), digits(sequence,8), digits(payload.length,3), digits(index,2), digits(count,2), digits(fragment.length,2), pack(fragment));
            frames.push([240].concat(body, digits(crc(body),3), [247]));
        }
        return frames;
    };
}());
// End of autonomously AI-generated file.

// Fragment: wire-decode.js
// Autonomously AI-generated by scripts/build-host-parser.mjs; do not edit.
// Node parser SHA-256: ceb41978776e7d7015d4932afc43cbb8374f2b50caa0b0825607a3da3b75c87e
(function(){
"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
function sessionHex(bytes) {
    const digits = Array(32).fill(0);
    for (let i = 28; i >= 10; i--) {
        let carry = bytes[i];
        for (let j = 0; j < 32; j++) {
            const n = digits[j] * 128 + carry;
            digits[j] = n % 16;
            carry = Math.floor(n / 16);
        }
        if (carry)
            throw Error("session-overflow");
    }
    return digits.reverse().map(n => n.toString(16)).join("");
}
function wellFormed(s) {
    for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        if (c >= 0xd800 && c <= 0xdbff) {
            const d = s.charCodeAt(++i);
            if (!(d >= 0xdc00 && d <= 0xdfff))
                return false;
        }
        else if (c >= 0xdc00 && c <= 0xdfff)
            return false;
    }
    return true;
}
function strictUtf8(bytes) {
    const out = [];
    for (let i = 0; i < bytes.length;) {
        const first = bytes[i++];
        let cp, length, min;
        if (first < 128) {
            cp = first;
            length = 0;
            min = 0;
        }
        else if (first >= 0xc2 && first <= 0xdf) {
            cp = first & 31;
            length = 1;
            min = 128;
        }
        else if (first >= 0xe0 && first <= 0xef) {
            cp = first & 15;
            length = 2;
            min = 2048;
        }
        else if (first >= 0xf0 && first <= 0xf4) {
            cp = first & 7;
            length = 3;
            min = 65536;
        }
        else
            throw Error("invalid-utf8");
        if (i + length > bytes.length)
            throw Error("invalid-utf8");
        for (let j = 0; j < length; j++) {
            const c = bytes[i++];
            if (c < 128 || c > 191)
                throw Error("invalid-utf8");
            cp = cp * 64 + (c & 63);
        }
        if (cp < min || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff))
            throw Error("invalid-utf8");
        if (cp < 65536)
            out.push(String.fromCharCode(cp));
        else {
            cp -= 65536;
            out.push(String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 1023)));
        }
    }
    return out.join("");
}
const roles = { 1: [0], 2: [1], 3: [1], 4: [0], 5: [1], 6: [1], 7: [0], 8: [1], 9: [0, 1], 10: [0], 11: [1], 12: [0, 1], 112: [0, 1], 113: [0, 1] };
const bad = (reason) => { throw new Error(reason); };
function integer(bytes, at, width) {
    let n = 0;
    for (let i = width - 1; i >= 0; i--)
        n = n * 128 + bytes[at + i];
    return n;
}
function frame(bytes, direction, diagnostic) {
    if (bytes[1] !== 0x7d || bytes.slice(2, 6).join(",") !== "65,73,68,74")
        return null;
    if (bytes.length < 50)
        bad("truncated-frame");
    if (bytes[6] !== 1)
        bad("unsupported-version");
    const opcode = bytes[8], encoding = bytes[9];
    if (bytes[7] !== direction || !hasOwn(roles, opcode) || !roles[opcode].includes(direction))
        bad("unsupported-route");
    if (opcode >= 112 && !diagnostic)
        bad("diagnostic-disabled");
    if (encoding !== (opcode === 112 ? 1 : opcode === 113 ? 2 : 3))
        bad("unsupported-encoding");
    if (bytes[28] > 3 || bytes[36] > 15 || bytes[bytes.length - 2] > 3)
        bad("noncanonical-integer");
    const total = Number(integer(bytes, 37, 3)), index = Number(integer(bytes, 40, 2)), count = Number(integer(bytes, 42, 2)), length = Number(integer(bytes, 44, 2));
    if (total > 65536 || count !== Math.max(1, Math.ceil(total / 512)) || index >= count || length !== (index === count - 1 ? total - index * 512 : 512))
        bad("invalid-length");
    if (bytes.length !== 50 + length + Math.ceil(length / 7))
        bad("invalid-length");
    if (encoding === 1 && total !== 8)
        bad("invalid-number-length");
    let crc = 0xffff;
    for (let i = 1; i < bytes.length - 4; i++) {
        crc ^= bytes[i] << 8;
        for (let j = 0; j < 8; j++)
            crc = ((crc << 1) ^ ((crc & 0x8000) ? 0x1021 : 0)) & 0xffff;
    }
    if (crc !== integer(bytes, bytes.length - 4, 3))
        bad("checksum-mismatch");
    const decoded = new Uint8Array(length);
    let cursor = 46;
    for (let start = 0; start < length; start += 7) {
        const n = Math.min(7, length - start), mask = bytes[cursor++];
        if (mask >= Math.pow(2, n))
            bad("noncanonical-mask");
        for (let i = 0; i < n; i++)
            decoded[start + i] = bytes[cursor++] | (((mask >> i) & 1) << 7);
    }
    return { direction, opcode, encoding: encoding, session: sessionHex(bytes), sequence: Number(integer(bytes, 29, 8)), total, index, count, bytes: decoded };
}
// Strict bounded recursive-descent JSON: reject duplicates before object insertion.
function json(source) {
    let at = 0, nodes = 0;
    const whitespace = () => { while (at < source.length && /[ \t\r\n]/.test(source[at]))
        at++; };
    const string = () => {
        if (source[at] !== '"')
            bad("invalid-json");
        const start = at++;
        while (at < source.length) {
            const c = source[at++];
            if (c === '\\') {
                at++;
                continue;
            }
            if (c === '"') {
                let value;
                try {
                    value = JSON.parse(source.slice(start, at));
                }
                catch (_a) {
                    bad("invalid-json-string");
                }
                if (!wellFormed(value))
                    bad("invalid-unicode");
                return value;
            }
        }
        return bad("invalid-json-string");
    };
    const numeric = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/y;
    const value = (depth) => {
        if (depth > 32 || ++nodes > 4096)
            bad("json-resource-limit");
        whitespace();
        const c = source[at];
        if (c === '"')
            return string();
        if (c === '{') {
            at++;
            whitespace();
            const result = Object.create(null);
            if (source[at] === '}') {
                at++;
                return result;
            }
            while (at < source.length) {
                whitespace();
                const key = string();
                if (hasOwn(result, key))
                    bad("duplicate-json-key");
                whitespace();
                if (source[at++] !== ':')
                    bad("invalid-json");
                result[key] = value(depth + 1);
                whitespace();
                const end = source[at++];
                if (end === '}')
                    return result;
                if (end !== ',')
                    bad("invalid-json");
            }
            return bad("invalid-json");
        }
        if (c === '[') {
            at++;
            whitespace();
            const result = [];
            if (source[at] === ']') {
                at++;
                return result;
            }
            while (at < source.length) {
                result.push(value(depth + 1));
                whitespace();
                const end = source[at++];
                if (end === ']')
                    return result;
                if (end !== ',')
                    bad("invalid-json");
            }
            return bad("invalid-json");
        }
        for (const [literal, result] of [["null", null], ["true", true], ["false", false]]) {
            if (source.startsWith(literal, at)) {
                at += literal.length;
                return result;
            }
        }
        numeric.lastIndex = at;
        const match = numeric.exec(source);
        if (!match)
            bad("invalid-json");
        at = numeric.lastIndex;
        const n = Number(match[0]);
        if (!Number.isFinite(n) || Object.is(n, -0))
            bad("invalid-number");
        return n;
    };
    if (source.charCodeAt(0) === 0xfeff)
        bad("json-bom");
    const result = value(1);
    whitespace();
    if (at !== source.length || result === null || typeof result !== "object" || Array.isArray(result))
        bad("invalid-json-root");
    return result;
}
function payload(bytes, encoding) {
    if (encoding === 1) {
        const n = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getFloat64(0, true);
        if (!Number.isFinite(n) || Object.is(n, -0))
            bad("invalid-number");
        return n;
    }
    let text;
    try {
        text = strictUtf8(bytes);
    }
    catch (_a) {
        bad("invalid-utf8");
    }
    return encoding === 2 ? text : json(text);
}
/** One parser per ingress endpoint. Call close on disposal; no host callbacks exist. */
function createSysexParser(options) {
    var _a;
    const direction = options.direction, now = options.now, diagnostic = (_a = options.allowDiagnostic) !== null && _a !== void 0 ? _a : false;
    let generation = options.generation;
    if ((direction !== 0 && direction !== 1) || !Number.isSafeInteger(generation) || generation < 0 || typeof now !== "function" || typeof diagnostic !== "boolean")
        throw new TypeError("Invalid parser configuration");
    let partial = [], partialAt = 0, lastTime = -1, failed = false, closed = false, dropped = 0;
    const slots = new Map(), errors = [];
    const report = (reason) => { if (errors.length < 32)
        errors.push(reason);
    else
        dropped = Math.min(Number.MAX_SAFE_INTEGER, dropped + 1); };
    const clear = () => { partial = []; slots.clear(); };
    const time = () => {
        if (closed || failed)
            return null;
        let t;
        try {
            t = now();
        }
        catch (_a) {
            t = NaN;
        }
        if (!Number.isFinite(t) || t < 0 || t > Number.MAX_SAFE_INTEGER || t < lastTime) {
            failed = true;
            clear();
            report("clock-failed");
            return null;
        }
        lastTime = t;
        return t;
    };
    const expire = () => {
        const t = time();
        if (t === null)
            return null;
        if (partial.length && t - partialAt >= 250) {
            partial = [];
            report("frame-timeout");
        }
        for (const [key, slot] of slots)
            if (t - slot.first >= 1000 || t - slot.last >= 250) {
                slots.delete(key);
                report("message-timeout");
            }
        return t;
    };
    const drain = (messages = [], realtime = [], otherMidi = []) => {
        const result = { messages, realtime, otherMidi, errors: errors.splice(0), droppedDiagnostics: dropped, failed };
        dropped = 0;
        return result;
    };
    const accept = (f, t) => {
        const key = f.session + ":" + f.sequence;
        let slot = slots.get(key);
        if (slot && (slot.header.opcode !== f.opcode || slot.header.encoding !== f.encoding || slot.header.total !== f.total || slot.header.count !== f.count)) {
            slots.delete(key);
            bad("fragment-conflict");
        }
        if (!slot) {
            if (slots.size >= 4)
                bad("reassembly-capacity");
            const { bytes: _decoded } = f, header = __rest(f, ["bytes"]);
            slot = { header, bytes: new Uint8Array(f.total), seen: new Uint8Array(16), received: 0, first: t, last: t };
            slots.set(key, slot);
        }
        const flag = 1 << (f.index % 8), cell = Math.floor(f.index / 8), start = f.index * 512;
        if (slot.seen[cell] & flag) {
            for (let i = 0; i < f.bytes.length; i++)
                if (slot.bytes[start + i] !== f.bytes[i]) {
                    slots.delete(key);
                    bad("fragment-conflict");
                }
            return null;
        }
        slot.bytes.set(f.bytes, start);
        slot.seen[cell] = slot.seen[cell] | flag;
        slot.received++;
        slot.last = t;
        if (slot.received !== f.count)
            return null;
        slots.delete(key);
        const value = payload(slot.bytes, f.encoding);
        return { direction, opcode: f.opcode, encoding: f.encoding, session: f.session, sequence: f.sequence, payload: value, payloadBytes: slot.bytes };
    };
    const interval = options.automaticExpiry === false ? undefined : engine.beginTimer(25, expire);
    if (interval !== undefined && (!Number.isSafeInteger(interval) || interval <= 0))
        throw new Error("invalid-host-timer");
    return {
        push(bytes, inputGeneration) {
            const messages = [], realtime = [], otherMidi = [];
            const t = expire();
            if (t === null)
                return drain();
            if (inputGeneration !== generation) {
                report("stale-generation");
                return drain();
            }
            if (!(bytes instanceof Uint8Array) || bytes.length > 2048) {
                clear();
                failed = true;
                report("input-capacity-gap");
                return drain();
            }
            for (const byte of bytes) {
                if (byte >= 0xf8) {
                    realtime.push(byte);
                    if (byte === 0xff) {
                        clear();
                        failed = true;
                        report("midi-reset");
                        break;
                    }
                    continue;
                }
                if (byte === 0xf0) {
                    if (partial.length)
                        report("nested-start");
                    partial = [byte];
                    partialAt = t;
                    continue;
                }
                if (!partial.length) {
                    if (byte === 0xf7)
                        report("unmatched-end");
                    else
                        otherMidi.push(byte);
                    continue;
                }
                if (byte === 0xf7) {
                    const complete = partial;
                    partial = [];
                    complete.push(byte);
                    try {
                        if (complete.length > 636)
                            bad("frame-capacity");
                        const f = frame(complete, direction, diagnostic);
                        if (f) {
                            const message = accept(f, t);
                            if (message)
                                messages.push(message);
                        }
                    }
                    catch (error) {
                        report(error instanceof Error ? error.message : "invalid-frame");
                    }
                    continue;
                }
                if (byte >= 0x80) {
                    partial = [];
                    report("interrupted-frame");
                    otherMidi.push(byte);
                    continue;
                }
                if (partial.length >= 635) {
                    partial = [];
                    report("frame-capacity");
                    continue;
                }
                partial.push(byte);
            }
            return drain(messages, realtime, otherMidi);
        },
        tick() { expire(); return drain(); },
        status() { return { generation, closed, failed, partialBytes: partial.length, incompleteMessages: slots.size, retainedPayloadBytes: [...slots.values()].reduce((n, s) => n + s.bytes.length, 0), pendingDiagnostics: errors.length, droppedDiagnostics: dropped }; },
        resetGeneration(next) { if (!Number.isSafeInteger(next) || next <= generation)
            throw new TypeError("Generation must increase"); generation = next; clear(); report("generation-reset"); },
        close() { if (closed)
            return; closed = true; clear(); if (interval)
            engine.stopTimer(interval); },
    };
}

AIDJ.createWireParser=createSysexParser;
}());
// End of autonomously AI-generated file.

// Fragment: wire.js
// Autonomously AI-generated endpoint factory. Registration and semantic policy are separate.
AIDJ.createWireEndpoint = function(options) {
    var incoming = [1,4,7,9,10,12,112,113];
    var diagnostic = options.allowDiagnostic === true;
    var handlers = Object.create(null), closed = false, fault = null, receiving = false;
    var onFault = options.onFault;
    if (typeof onFault !== "function" || !Array.isArray(options.handlers) || options.handlers.length > incoming.length) throw new Error("Invalid endpoint configuration");
    if (options.allowDiagnostic !== undefined && typeof options.allowDiagnostic !== "boolean") throw new Error("Invalid diagnostic mode");
    for (var i = 0; i < options.handlers.length; i++) {
        var h = options.handlers[i];
        if (!h || incoming.indexOf(h.opcode) < 0 || (h.opcode >= 112 && !diagnostic) ||
                Object.prototype.hasOwnProperty.call(handlers, h.opcode) || typeof h.validate !== "function" || typeof h.handle !== "function") throw new Error("Invalid or duplicate handler");
        handlers[h.opcode] = {validate:h.validate, handle:h.handle};
    }
    var generation = options.generation;
    var parser = AIDJ.createWireParser({direction:0,generation:generation,now:options.now,allowDiagnostic:diagnostic});
    function fail(reason) {
        if (fault !== null) return;
        fault = reason; closed = true;
        try { parser.close(); } catch (error) { fault += "; parser-cleanup-failed"; }
        try { onFault(fault); } catch (error) { /* Failure reporting cannot resume dispatch. */ }
    }
    function usable() {
        if (parser.status().failed) fail("parser-failed");
        return !closed;
    }
    function freeze(value) {
        if (value && typeof value === "object") {
            var keys = Object.keys(value);
            for (var i = 0; i < keys.length; i++) freeze(value[keys[i]]);
            Object.freeze(value);
        }
        return value;
    }
    function receive(data, length, inputGeneration) {
        if (!usable()) return {dispatched:0,rejected:0,closed:true};
        if (receiving) { fail("reentrant-input"); return {dispatched:0,rejected:0,closed:true}; }
        // Stale callbacks cannot poison the current endpoint with an oversized old buffer.
        if (inputGeneration !== generation) return {dispatched:0,rejected:0,closed:false,staleGeneration:true};
        if (!(Array.isArray(data) || data instanceof Uint8Array) || !Number.isSafeInteger(length) || length < 0 || length > 2048 || data.length !== length) {
            fail("native-input-capacity-or-shape"); return {dispatched:0,rejected:0,closed:true};
        }
        for (var i = 0; i < length; i++) if (!Number.isInteger(data[i]) || data[i] < 0 || data[i] > 255) {
            fail("native-input-byte"); return {dispatched:0,rejected:0,closed:true};
        }
        receiving = true;
        var dispatched = 0, rejected = 0, result;
        try {
            result = parser.push(new Uint8Array(data), generation);
            // A reset or clock failure invalidates even messages decoded earlier in this callback.
            if (result.failed) { fail("parser-failed"); return {dispatched:0,rejected:0,closed:true,diagnostics:result.errors}; }
            for (var j = 0; j < result.messages.length && usable(); j++) {
                var message = result.messages[j], handler = handlers[message.opcode];
                if (!handler) { rejected++; continue; }
                var header = Object.freeze({direction:0,opcode:message.opcode,encoding:message.encoding,session:message.session,sequence:message.sequence,generation:generation});
                var payload = freeze(message.payload);
                if (handler.validate(payload, header) !== true) { rejected++; continue; }
                if (!usable()) break;
                handler.handle(payload, header); dispatched++;
            }
        } catch (error) { fail("validation-or-handler-failed"); }
        finally { receiving = false; }
        return {dispatched:dispatched,rejected:rejected,closed:closed,diagnostics:result ? result.errors : [],
            droppedDiagnostics:result ? result.droppedDiagnostics : 0};
    }
    function send(message) {
        if (!usable()) throw new Error("Endpoint closed");
        var checked = parser.tick();
        if (checked.failed) { fail("parser-failed"); throw new Error("Endpoint clock or parser failed"); }
        // Host direction is fixed here; caller cannot inject a client command direction.
        var frames = AIDJ.encodeWire({direction:1,opcode:message.opcode,session:message.session,sequence:message.sequence,payload:message.payload}, diagnostic);
        var sent = 0;
        try {
            for (var i = 0; i < frames.length; i++) {
                if (!usable()) break;
                midi.sendSysexMsg(frames[i], frames[i].length); sent++;
            }
        } catch (error) { fail("send-failed-outcome-unknown"); }
        return {sentFrames:sent,totalFrames:frames.length,closed:closed,delivery:"unconfirmed",
            diagnostics:checked.errors,droppedDiagnostics:checked.droppedDiagnostics};
    }
    return {receive:receive,send:send,invalidate:function() { fail("native-input-loss"); },close:function() {
        if (closed) return;
        closed = true;
        try { parser.close(); } catch (error) { fail("parser-cleanup-failed"); }
    },status:function() { usable(); return {closed:closed,fault:fault,generation:generation,parser:parser.status()}; }};
};
// End of autonomously AI-generated file.
// AI-DJ-FRAGMENTS-END
// End of autonomously AI-generated bootstrap.
