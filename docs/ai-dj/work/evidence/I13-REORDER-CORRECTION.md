# Repeated playlist occurrences: reorder investigation

> Autonomously AI-generated investigation at the user's request. Native correction and acceptance remain pending.

The source query used by `PlaylistDAO::orderTracksByCurrPos` can match more than one occurrence after an earlier update changes positions. This matters because the AI must preserve every entry, including repeated songs, when arranging a playlist.

The [reproducible probe](../probes/playlist-reorder.py) extracts the UPDATE statement from `src/library/dao/playlistdao.cpp:1174` and the table definition and playlist indexes from `res/schema.xml:73` and `res/schema.xml:526`. It runs only in-memory databases, never the user's library. The [complete result](../runs/I13-REORDER-PROBE.json) records source hashes, SQLite version, all 18 permutations and affected-row counts. Seven permutations mismatch the requested occurrence order; all six distinct-track permutations match.

For A1/B2/A3, request A3/B2/A1. The first UPDATE moves A3 to position 1, sharing A1's track ID and position. The final UPDATE then matches both A1 and A3 and moves both to position 3. Its affected-row count is 2. The transaction succeeds with B2 at position 2 and both A entries at position 3. There is no SQL execution error to trigger the existing rollback branch.

The caller `PlaylistTableModel::orderTracksByCurrPos` at lines 346–361 supplies track ID and original position for every displayed row. This connects the source primitive to the model, but this probe has not invoked the Qt method or native UI. No current installed-binary behavior or source-to-binary equivalence is claimed.

Graph Verify check: project `mixxx-ai-dj`, generation `2026-09-13T16:44:03Z`; search found the DAO and table-model methods with no further result page. Coverage reported a partial DAO, including line 1193 within this operation; the complete method including that range was read directly. The model and schema had no recorded gap, which is not a completeness guarantee. Schema text was checked for all PlaylistTracks changes: the added timestamp and nonunique indexes do not prevent this collision.

`I13-REORDER-CORRECTION` blocks I13 closure. Next: native regression, stable occurrence resolution before writes, transaction/invalid-input tests, and native validation. The existing inventory context and page 1 remain unchanged; this source investigation is separate evidence, not an invented continuation of a stopped host session.

> End of autonomously AI-generated investigation.
