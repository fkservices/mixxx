# O07-LIFECYCLE — Recorder lifecycle progress

> Autonomously AI-generated partial implementation evidence at the user's request.

This task is not accepted. Pause/resume mechanics and actual ENOSPC are implemented and tested below. Trusted current-host snapshot admission, stalled-worker deadline evidence, service integration and live MIDI responsiveness remain open.

## Failure accounting implemented

Source base `c2ebeb4907`. The caller now retains accepted input counts after failure, separating never-submitted queued offers from the single in-flight offer whose append result is uncertain. Append acknowledgements accumulate independently. Synchronized-close acknowledgement is null until the worker confirms its complete close; this is not a statement of physical capture completeness or directory durability. Queued records removed during retirement no longer disappear from status accounting.

At every observable state, accepted offers equal append-acknowledged offers plus currently queued offers plus the in-flight event offer plus never-submitted-on-failure offers plus unconfirmed-on-failure offers. These counters describe input events only; recorder-generated state/gap events are counted separately in stored recorder sequence. An acknowledged append may still reside in an unsealed chunk. After failure, recovery determines verified storage extent; these counters are not a license to blindly replay uncertain inputs.

Omitted offers now distinguish worker-reported omission ranges from ranges not yet acknowledged. This prevents a caller from claiming an overflow marker is stored merely because it has been queued. A producer-sequence gap also propagates through the worker acknowledgement to capture status; known gaps no longer leave the caller at unknown completeness. Capture remains gaps-present through a successful close, and no healthy state manufactures a complete-within-scope claim.

Three additional real-worker tests verify immediate abort with 19 queued and one uncertain event; acknowledged append versus synchronized close and producer-gap status; and omission acknowledgement timing. The existing five worker tests remain. All of these are worker/file fixtures, not native MIDI or audible tests. Graph coverage is unavailable; current source was inspected directly.

Final build passed and all **245 package tests passed**. [Run record](../runs/O07-ACCOUNTING.json) retains source hashes and the final summary. These checks do not close the outstanding lifecycle requirements.

## Actual full-disk test

[Reproducible macOS probe](../probes/recorder-enospc.mjs) creates a private 32 MiB HFS+ image and verifies its capacity before writing. It starts the actual recorder worker, acknowledges one fixture event, then fills only that mounted image with bounded writes. The first image-creation command used an unsupported format option; it failed before mounting and cleaned up. The corrected command uses the documented blank-image type.

The final run reached **zero free bytes** and the operating system returned ENOSPC both to the filler and to the worker's append. Of 20 accepted offers, one had an append acknowledgement, 18 remained unsent and one was uncertain. Status was failed/gaps-present, new offers were refused and close rejected. Recovery retained two complete records (the started event and first fixture event), reported unsealed chunk, truncated tail and missing end, and granted no performance authority. The image was detached and its temporary directory removed successfully.

[Run record](../runs/O07-ENOSPC.json) includes exact status, source hashes and measurements. Failure was observed 52.86 ms after the submission batch began; the slowest offer call took 2.61 ms. Seven caller heartbeat samples had a maximum interval of 23.25 ms. Those observations show that the caller continued receiving timer callbacks during this short fault scenario. They are not a sustained responsiveness distribution, native MIDI cancellation measurement or an audible-latency gate. HFS+ disk-full behavior does not establish APFS power-loss durability. No ordinary package tests were rerun because production code did not change; the actual worker/disk probe supplied new evidence for the unchanged implementation.

## Pause and snapshot-gated resume

Source base `643297d54b`. `pause()` immediately closes normal capture admission, drains already admitted events and records an unknown-length gap plus a paused event. Its receipt identifies that pause and its recorder cutoff. Continued offers are omitted with bounded range accounting. Pause has a reserved control slot, so ongoing omitted traffic cannot starve the pause barrier. Closing while paused records the omitted range and ends the recording without claiming continuous capture.

`resume(prepare)` calls the trusted snapshot supplier only after pause acknowledgement. The supplier receives that pause's cutoff and has a one-second preparation deadline. A stale cutoff, hung supplier or oversized snapshot does not reopen capture. The worker checks recording identity, visualization-only access, cutoff and bounded snapshot identity; writes the snapshot exclusively and synchronizes it; then records resumed with the pause-gap reference. Snapshot through-sequence advances past the flushed omission records and retains the pause gap. Omission traffic arriving during resume remains separately accounted. A failed snapshot write retires capture; existing snapshots are never overwritten.

This API relies on a trusted supplier for current observed-state content and full snapshot/reference admission. Calling a supplier within a deadline does not itself prove host freshness. Current tests use snapshots explicitly containing unknown host state. O08/O09 and service integration still need complete snapshot validation, indexing, recovery/import handling and current host evidence; these resume sidecar files do not claim a completed history query service. They grant no performance authority and leave recording gaps visible.

Three additional real-worker tests cover pause under saturated input, persisted matching resume snapshot and gap retention, stale cutoff and hung supplier rejection, and failed exclusive snapshot write. Final build passed; **all 248 package tests passed**, including eleven worker tests. [Pause run record](../runs/O07-PAUSE.json) preserves hashes and the test summary. Native MIDI, audio, actual host snapshot freshness and sustained recorder load remain separate evidence gates. O07-LIFECYCLE and O07 remain incomplete.

> End of autonomously AI-generated partial implementation evidence.
