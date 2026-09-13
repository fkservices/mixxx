// Autonomously AI-generated mapping with the four initial control/feedback fragments.
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
// AI-DJ-FRAGMENTS-END
// End of autonomously AI-generated bootstrap.
