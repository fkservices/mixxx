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
