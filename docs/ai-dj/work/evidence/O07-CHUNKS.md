# O07-CHUNKS — Recoverable recording storage

> Autonomously AI-generated implementation evidence at the user's request.

`ai-dj/session/chunks.ts` implements exclusive creation of a local recording directory, append-only NDJSON records, a provisional 16 MiB chunk cap and 256 KiB encoded record cap. Every chunk has a separate seal with exact byte length, SHA-256, record count and recorder sequence bounds. Sealing synchronizes data before writing/synchronizing the descriptor. Successful close writes a separate end marker; a closed recording does not imply a completed set or complete physical capture.

The writer admits only one pending operation and rejects concurrent calls instead of growing an implicit disk queue. Encoded events require the recording envelope and contiguous recorder sequence; it does not perform the complete O01 payload/reference admission. Identical raw payloads at distinct sequences remain distinct records. Write/seal failure latches the writer unavailable. Existing directories and seal files are never overwritten.

Read-only recovery uses bounded file reads and yields unknown event objects, chunk verification status and explicit gap records. Missing chunks, invalid seals, broken sequence/framing, invalid UTF-8, a torn final line or missing end marker cannot report clean storage. Complete lines in an unsealed/corrupt chunk are salvage data marked unsealed; readers must not treat them as verified imported session events. Recovery stops after the first uncertain chunk and grants no performance authority. It does not repair or truncate source files.

## Validation and remaining work

Five storage fixtures verify exact repeated payload retention across rotation, exclusive creation, concurrent-write and sequence rejection, record size limits, torn-tail salvage, checksum corruption, missing chunks, and an injected seal-file I/O failure. Final TypeScript build and full package tests passed. Initial compilation found unsupported TypeScript parameter properties and an unavailable Array.fromAsync library declaration; both were corrected without changing package targets.

These are local storage tests, including a constructed crash-tail fixture and injected filesystem conflict. They are not power-loss, actual ENOSPC, worker crash or MIDI responsiveness proof. File/directory publication is conservative on crash but directory fsync durability is not claimed. Recovery is for local trusted recording directories, not arbitrary hostile uploaded filesystem trees. Global event identity, producer sequence tracking and full payload validation remain caller responsibilities.

O07 stays split and incomplete. O07-WORKER must place this writer exclusively in the recorder worker, bound the producer queue and IPC separately, persist pause/overflow gaps and status, verify disk-full/shutdown/recovery and measure that recorder load cannot stall MIDI. The communicator must not call these disk methods directly. Graph coverage was unavailable for the new storage scope; direct source and accepted O01 contract reads supplied evidence.

> End of autonomously AI-generated implementation evidence.
