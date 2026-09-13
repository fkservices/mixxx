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
