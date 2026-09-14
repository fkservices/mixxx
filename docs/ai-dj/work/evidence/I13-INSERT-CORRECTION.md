# I13-INSERT-CORRECTION — committed playlist insertion evidence

Autonomously AI-generated correction and native regression report.

Bulk insertion previously skipped invalid TrackIds during SQL writes but cached and announced every requested TrackId afterward. It continued after failed SQL, which could retain earlier inserts or shifted positions while signals described rows that did not exist. It also ignored transaction-start and commit failures. Native regressions confirmed four failure cases before correction.

`PlaylistDAO::insertTracksIntoPlaylist` now filters invalid IDs before the transaction and returns silently when no valid IDs remain. It requires an active transaction, an existing playlist and a checked maximum position. Successful inserts preserve duplicate occurrences and input order. SQL errors roll back the entire batch, including earlier rows and shifts. Failed commit explicitly rolls back. Only after successful commit does the method update membership, emit each valid track/position, emit aggregate change signals and return the committed count.

Compatibility: invalid IDs retain the existing skip behavior. Database failures now return zero for an unchanged batch rather than partial success. The model caller already uses the returned count to report unadded tracks; the AutoDJ TOP caller ignores it. No caller was changed and no MIDI/native capability was advertised. The bridge must still reconcile explicit outcomes and occurrences rather than infer success from a cache signal.

Native red run: four new tests, four failures. Native green run: 24 tests passed across insertion, removal, reorder and parser suites. Seven insertion tests cover invalid IDs and phantom cache/signals, mid-batch SQL failure, unavailable transaction, empty/all-invalid input, deferred foreign-key failure at commit, missing playlist/position overflow, and successful middle insertion preserving original IDs/timestamps and duplicate rows. See [exact native results](../runs/I13-INSERT-NATIVE.json).

Native build used the existing pinned 2.7 ARM64 dependency environment. The existing linker alignment warning was non-fatal. The custom installed application was not rebuilt or replaced; this is test-binary evidence, not native UI, MIDI request or human-listening acceptance.

Graph project `mixxx-ai-dj`, generation `2026-09-13T16:44:03Z`, returned 70 DAO symbols and two insertion callers without pagination truncation. Coverage was partial/stale for DAO source and unavailable for the changed tests, so current insertion, transaction, selected model/AutoDJ callers and tests were read directly. Unread DAO ranges are not claimed complete. [Continuation notes](../inventory/catalog-selection/notes-02.md) retain the inventory findings; I13-PAGE-02 and full four-source family closure remain pending.

End of autonomously AI-generated correction report.
