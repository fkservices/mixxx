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
