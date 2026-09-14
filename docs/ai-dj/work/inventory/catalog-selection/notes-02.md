# I13 continuation — insertion findings

Autonomously AI-generated bounded source-review notes; not an accepted inventory page or family closure.

Page 2 remains pending at the existing page-1 context/cursor. Current source revision before this review was `a6d29e4afa`; the installed custom host has not been replaced with subsequent DAO corrections. Do not claim source/runtime equivalence or reuse the old host session as live evidence.

The selected `PlaylistDAO::insertTracksIntoPlaylist` review found that invalid track IDs were skipped during insertion but still added to the membership cache and emitted through `trackAdded`. A SQL failure could also leave earlier successful inserts and position shifts while later notifications described all requested rows. Four native regression cases reproduced incorrect outcomes before the correction. This prompted `I13-INSERT-CORRECTION` rather than treating the primitive as a ready bridge capability.

Required service distinction: bulk insertion accepts a list of track IDs and an insertion position, not stable occurrence IDs with a revision guard. Even after this DAO correction, the companion still needs explicit source revision/occurrence reconciliation, native operation results, and authoritative post-write snapshots. A cache signal is not a completed MIDI request acknowledgement.

Caller review: `PlaylistTableModel::addTracksWithTrackIds` derives native insertion position from the current model and uses the returned count to report unadded tracks. `PlaylistDAO::addTracksToAutoDJQueue` calls insertion for TOP and ignores the returned count. Neither caller makes this primitive an acknowledged, remote-safe action. These call sites were inspected without changing them.

Other bounded reads: single/bulk deletion, rename, single/bulk lock changes, append wrappers, removal by track ID versus position, and single insertion. They have differing return/error/signal semantics; no equivalence or complete family inventory is claimed. Graph lookup returned 70 DAO symbols without pagination truncation, with two inbound insertion call sites. Partial/stale DAO coverage required direct source; inspected insertion and transaction methods are authoritative for this correction.

Next inventory work still includes the canonical mutation rows and aliases, selected-track identity, shuffle/reorder, sidebar/table menus, matching-version manual, and actual runtime target enumeration. Maintain distinct ordered-occurrence and DISTINCT membership candidates. Preserve the macOS accessibility issue and materialize further bounded pages if required.

End of autonomously AI-generated continuation notes.
