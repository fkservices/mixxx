// Autonomously AI-generated mapping bootstrap. No performance fragments installed yet.
// M10 appends fragments in this fixed order, between the assembly markers below.
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
// Fixed order: play-volume.js, fader-cue.js, sync.js, conventional-feedback.js.
// Each file calls AIDJ.register with its fixed name and init/shutdown/input methods.
// init(id, debugging, lifecycle) registers every connection/timer with lifecycle.
// shutdown() performs fragment-specific cleanup before common handle disposal.
// input(channel, control, value, status, group) returns true only when handled.
// AI-DJ-FRAGMENTS-END
// End of autonomously AI-generated bootstrap.
