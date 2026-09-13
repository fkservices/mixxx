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
    var generation = options.generation, sender = null, sendId = 0;
    var parser = AIDJ.createWireParser({direction:0,generation:generation,now:options.now,allowDiagnostic:diagnostic});
    function fail(reason) {
        if (fault !== null) return;
        fault = reason; closed = true;
        try { parser.close(); } catch (error) { fault += "; parser-cleanup-failed"; }
        if (sender) sender.close();
        try { onFault(fault); } catch (error) { /* Failure reporting cannot resume dispatch. */ }
    }
    function usable() {
        if (parser.status().failed) fail("parser-failed");
        if (sender && sender.status().fault) fail("sender-" + sender.status().fault);
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
    sender = AIDJ.createWireSender({generation:generation,now:options.now,allowDiagnostic:diagnostic,
        send:function(bytes) {
            if (!usable()) throw new Error("Endpoint retired before send");
            try { midi.sendSysexMsg(bytes,bytes.length); }
            catch (error) { fail("send-failed-outcome-unknown"); throw error; }
        }});
    function send(message, deadline) {
        if (!usable()) throw new Error("Endpoint closed");
        var checked = parser.tick();
        if (checked.failed) { fail("parser-failed"); throw new Error("Endpoint clock or parser failed"); }
        if (sendId >= 9007199254740991) { fail("send-id-exhausted"); throw new Error("Send ID exhausted"); }
        var id = "reply:" + (++sendId);
        sender.enqueue(id,{direction:1,opcode:message.opcode,session:message.session,sequence:message.sequence,payload:message.payload},
            deadline === undefined ? options.now()+900 : deadline,generation);
        return {id:id,queued:!sender.status().closed,delivery:"unconfirmed"};
    }
    return {receive:receive,send:send,cancelSend:function(id) {return sender.cancel(id);},drainSendResults:function() {return sender.drainResults();},invalidate:function() { fail("native-input-loss"); },close:function() {
        if (closed) return;
        closed = true;
        sender.close();
        try { parser.close(); } catch (error) { fail("parser-cleanup-failed"); }
    },status:function() { usable(); return {closed:closed,fault:fault,generation:generation,parser:parser.status(),sender:sender.status()}; }};
};
// End of autonomously AI-generated file.
