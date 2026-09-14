# Repeated playlist occurrences: reorder investigation

> Autonomously AI-generated investigation at the user's request. Native DAO correction accepted; installed-app inventory and MIDI integration remain pending.

The source query used by `PlaylistDAO::orderTracksByCurrPos` can match more than one occurrence after an earlier update changes positions. This matters because the AI must preserve every entry, including repeated songs, when arranging a playlist.

The [reproducible probe](../probes/playlist-reorder.py) extracts the pre-fix UPDATE statement from pinned revision `8ea8216ee6600fb1f5903322eb344704c419d4f6` of `src/library/dao/playlistdao.cpp:1174` and the table definition and playlist indexes from `res/schema.xml:73` and `res/schema.xml:526`. It runs only in-memory databases, never the user's library. The [complete result](../runs/I13-REORDER-PROBE.json) records source hashes, SQLite version, all 18 permutations and affected-row counts. Seven permutations mismatch the requested occurrence order; all six distinct-track permutations match.

For A1/B2/A3, request A3/B2/A1. The first UPDATE moves A3 to position 1, sharing A1's track ID and position. The final UPDATE then matches both A1 and A3 and moves both to position 3. Its affected-row count is 2. The transaction succeeds with B2 at position 2 and both A entries at position 3. There is no SQL execution error to trigger the existing rollback branch.

The caller `PlaylistTableModel::orderTracksByCurrPos` at lines 346–361 supplies track ID and original position for every displayed row. This connects the source primitive to the model, but this probe has not invoked the Qt method or native UI. No current installed-binary behavior or source-to-binary equivalence is claimed.

Graph Verify check: project `mixxx-ai-dj`, generation `2026-09-13T16:44:03Z`; search found the DAO and table-model methods with no further result page. Coverage reported a partial DAO, including line 1193 within this operation; the complete method including that range was read directly. The model and schema had no recorded gap, which is not a completeness guarantee. Schema text was checked for all PlaylistTracks changes: the added timestamp and nonunique indexes do not prevent this collision.

`I13-REORDER-CORRECTION` is accepted for this native DAO correction. I13 remains open for its other inventory requirements. The existing inventory context and page 1 remain unchanged; this source investigation is separate evidence, not an invented continuation of a stopped host session.

## Native regression and correction

[Native red/green evidence](../runs/I13-REORDER-NATIVE.json) preserves exact test results and final source/binary hashes. Against the old implementation, the permutation and invalid-reference tests failed; the lock/rollback test passed. After the correction, all 14 tests passed: four native DAO tests plus ten existing playlist parser tests. The permutation test covers all 18 orders and checks stable row IDs, track IDs, unique sequential positions and unchanged per-entry timestamp metadata.

The corrected DAO reads lock state and all occurrences in one transaction, rejects missing/duplicate/wrong-track references before any write, then updates by immutable row ID and requires exactly one affected row per update. It rolls back on write failure and emits the moved notification only after commit. Tests cover locked and absent playlists, invalid TrackId, missing and repeated positions, incorrect input size, empty input, inability to start a transaction, no notification for rejected references, and an injected second-write failure that must roll back the first write.

Built using the existing native CMake build, target `mixxx-test`, four jobs. Ran with `QT_QPA_PLATFORM=offscreen` and filter `PlaylistReorderTest.*:PlaylistTest.*`; final exit 0. These tests execute compiled C++ against minimal temporary tables matching the fields this operation uses. They do not exercise full schema migrations or the installed application UI. The existing app bundle has not been replaced. The historical Python probe remains pinned to the old revision and reproduces its saved result byte-for-byte.

The graph guided native fixture discovery; relevant methods and database helpers were read directly, including the partial ScopedTransaction source. Native fixture and source changes require a refreshed inventory revision before any future source-to-app equivalence claim; page 1 stays preserved as historical evidence.

> End of autonomously AI-generated investigation.
