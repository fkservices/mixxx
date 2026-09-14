# O07-LIFECYCLE — Recorder lifecycle progress

> Autonomously AI-generated partial implementation evidence at the user's request.

This task is not accepted. Pause/resume with compatible snapshots, stalled-worker deadlines, service integration and live MIDI responsiveness still require implementation or evidence. Actual ENOSPC has now been observed in the bounded test below.

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

> End of autonomously AI-generated partial implementation evidence.
