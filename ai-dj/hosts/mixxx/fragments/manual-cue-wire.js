// Autonomously AI-generated diagnostic-only cue stream. Owns a dedicated endpoint and observer.
AIDJ.createManualCueWire = function(options) {
    if (!options || options.diagnostic !== true || typeof options.session !== "string" ||
            !/^[0-9a-f]{32}$/.test(options.session) || !Number.isSafeInteger(options.generation) ||
            options.generation < 0 || typeof options.now !== "function" ||
            typeof options.clockDomainId !== "string" || !/^[A-Za-z0-9_.:-]{1,128}$/.test(options.clockDomainId)) {
        throw new Error("Invalid diagnostic cue configuration");
    }
    var session = options.session, generation = options.generation, now = options.now;
    var clock = options.clockDomainId, endpoint = null, observer = null;
    var active = false, started = false, fault = null, cleanupFailed = false, timer = null;
    var pending = [], inFlight = null, wireSequence = 0, sent = 0, pumping = false;
    function shutdown() {
        active = false; started = true;
        if (timer !== null) {
            var old = timer; timer = null;
            try { engine.stopTimer(old); } catch (error) { cleanupFailed = true; }
        }
        if (observer) {
            try { if (!observer.shutdown()) cleanupFailed = true; } catch (error) { cleanupFailed = true; }
        }
        if (endpoint) {
            try {
                endpoint.close();
                var state = endpoint.status();
                if (state.sender.fault === "timer-cleanup" ||
                        (state.fault && state.fault.indexOf("cleanup") >= 0)) cleanupFailed = true;
            } catch (error) { cleanupFailed = true; }
        }
        pending = []; inFlight = null;
        return !cleanupFailed;
    }
    function fail(reason) {
        if (fault === null) fault = reason;
        shutdown();
    }
    function text(record) {
        if (record.observedAtMs !== undefined && record.observedAtMs > 9007199254740991) throw new Error("Cue clock exceeds protocol range");
        var value = JSON.stringify(record);
        if (record.value === 0 && 1 / record.value === -Infinity) value = value.replace(/"value":0(?=[,}])/, '"value":-0');
        if (value.length > 1024) throw new Error("Cue record too large");
        return value;
    }
    function schedule() {
        if (!active || timer !== null) return;
        timer = engine.beginMidiSendTimer(function() {
            timer = null;
            if (active) pump();
        });
        if (!Number.isSafeInteger(timer) || timer <= 0) {
            timer = null;
            throw new Error("Invalid cue stream timer");
        }
    }
    function pump() {
        if (!active || pumping) return;
        pumping = true;
        try {
            var host = observer.status(), wire = endpoint.status();
            if (!host.active || host.fault || wire.closed || wire.fault) { fail("cue-stream-dependency-failed"); return; }
            var results = endpoint.drainSendResults();
            for (var i = 0; i < results.length; i++) {
                if (!inFlight || results[i].id !== inFlight || results[i].reason !== "sent") {
                    fail("cue-stream-send-incomplete"); return;
                }
                inFlight = null; sent++;
            }
            if (inFlight === null) {
                if (!pending.length) {
                    // Drain the complete queue before appending its later overflow interval.
                    var batch = observer.drain(256);
                    pending = batch.records;
                    if (batch.gap) pending.push({schemaVersion:1,kind:"gap",generation:batch.gap.generation,
                        clockDomainId:clock,firstSequence:batch.gap.firstSequence,
                        lastSequence:batch.gap.lastSequence,count:batch.gap.count});
                }
                if (pending.length) {
                    if (wireSequence >= 9007199254740991) { fail("cue-wire-sequence-exhausted"); return; }
                    var count = Math.min(8, pending.length);
                    var payload = '{"schemaVersion":1,"kind":"batch","records":[' + pending.slice(0,count).map(text).join(",") + "]}";
                    var reply = endpoint.send({opcode:113,session:session,sequence:wireSequence++,payload:payload});
                    if (!reply.queued) { fail("cue-stream-admission-failed"); return; }
                    inFlight = reply.id; pending.splice(0,count);
                }
            }
            schedule();
        } catch (error) { fail("cue-stream-pump-failed"); }
        finally { pumping = false; }
    }
    function start() {
        if (started) throw new Error("Cue stream requires a new instance to restart");
        started = true;
        try {
            observer = AIDJ.createManualCueObserver({now:now,clockDomainId:clock});
            endpoint = AIDJ.createWireEndpoint({generation:generation,now:now,allowDiagnostic:true,handlers:[],
                onFault:function() { fail("cue-endpoint-failed"); }});
            observer.start(); active = true; pump();
            if (!active) throw new Error("Cue stream failed to start");
        } catch (error) { fail("cue-stream-start-failed"); throw error; }
    }
    return {start:start,shutdown:shutdown,invalidate:function() { fail("native-input-loss"); },
        receive:function(data,length,inputGeneration) {
            if (!active) return {closed:true,dispatched:0};
            return endpoint.receive(data,length,inputGeneration);
        },status:function() { return {active:active,started:started,fault:fault,cleanupFailed:cleanupFailed,
            pending:pending.length,inFlight:inFlight !== null,nextWireSequence:wireSequence,sent:sent,
            delivery:"unconfirmed",observer:observer ? observer.status() : null}; }};
};
// End of autonomously AI-generated file.
