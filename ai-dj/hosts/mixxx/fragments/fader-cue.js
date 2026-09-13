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
