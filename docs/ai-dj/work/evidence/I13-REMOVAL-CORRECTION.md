# Repeated playlist occurrences: membership after removal

> Autonomously AI-generated investigation and correction at the user's request.

Source base `4491bb9fa0`. During I13 continuation discovery, the native removal helper revealed that `m_playlistsTrackIsIn.remove(trackId, playlistId)` removes every cached pair for that track and playlist. The cache is populated once per occurrence and is queried by `isTrackInPlaylist` and `getPlaylistsTrackIsIn`. Removing one occurrence therefore erased membership even when another occurrence remained in the actual playlist.

## Confirmed native behavior

The new C++ regression creates A/B/A through the real DAO, removes position 1, and checks both the ordered database result and cached membership. Before the fix the database contained B/A, but `isTrackInPlaylist(A, playlist)` returned false. This test failed against the pre-change implementation. Removing the final A should make membership false; removing only the first must not.

The correction finds and erases one matching cache entry after the existing deletion path. No other playlist's membership is removed. The SQL removal algorithm, external method signatures and signal shapes remain unchanged. This fixes occurrence-counted cache maintenance; it does not implement the AI's explicit skip policy, a versioned mutation service or MIDI operation admission.

## Hypothesis that did not reproduce in native Qt

An initial Python sqlite3 probe modified positions while iterating `SELECT position ... WHERE track_id=A`; A/A/B became A instead of B, and other layouts left A occurrences behind. That was evidence to investigate, not proof of Mixxx behavior. The actual native Qt tests passed all 32 five-entry layouts of A/B for remove-by-track before any source fix. The native removal SQL was therefore left unchanged. The differing driver/cursor behavior has not been explained or generalized to other versions.

The all-occurrence regression checks stable surviving row IDs, track IDs, sequential positions, unchanged timestamps, removal signals and membership. It includes no matches, all matches, alternating entries and adjacent repeats. Another test removes all A entries from one playlist and verifies the second playlist A/B/A and its membership remain intact. These tests document explicit remove-all-by-track behavior, which is distinct from removing one playlist occurrence.

## Evidence and bounds

[Native red/green record](../runs/I13-REMOVAL-NATIVE.json) contains the original failing test output, final test results, source hashes and final native test-binary hash. Red: three new tests, one failure (surviving membership); both all-occurrence removal tests already passed. Green: **17 tests passed**, zero failures/errors/disabled, comprising three removal regressions, four existing reorder regressions and ten existing playlist parser tests.

Built the existing native `mixxx-test` target with four jobs, then ran `PlaylistRemovalTest.*:PlaylistReorderTest.*:PlaylistTest.*` with `QT_QPA_PLATFORM=offscreen`. This exercises compiled C++ and Qt SQL against isolated minimal in-memory tables. No user music files, real library database, native UI playlist, controller or MIDI endpoint was modified. The installed custom app was not rebuilt or replaced; runtime source-to-binary agreement remains pending. The linker emitted its existing alignment-reduction warning but the build and tests exited successfully. The TypeScript implementation is unchanged and retains its prior 263-test result; it was not rerun for this C++ correction.

Graph project `mixxx-ai-dj`, generation `2026-09-13T16:44:03Z`, located 53 DAO methods and traced the by-ID helper's callers to the single-playlist and all-playlists removal paths. DAO coverage is partial and changed; current method bodies, cache population, cache consumers and direct caller ranges were read. The changed test file has no usable current graph coverage and was read directly. No full inventory completeness claim is made.

I13 remains split for native menus, stable selected-track identity, further mutation discovery and matching-version source/UI evidence. This correction is a required I13 child and does not close I13-PAGE-02, P02, playlist UI or the full application goal.

> End of autonomously AI-generated investigation and correction.
