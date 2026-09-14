# O07-LIFECYCLE — Recorder lifecycle progress

> Autonomously AI-generated partial implementation evidence at the user's request.

This task is not accepted. Pause/resume mechanics and actual ENOSPC are implemented and tested below. Trusted current-host snapshot admission, service integration and live MIDI responsiveness remain open. Stalled-worker deadlines are now verified below.

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

## Actual worker deadline faults

Source base `acccd3058f`. Two tests launch isolated Node child processes with a test-only preload. The preload writes an evidence marker from the worker and then blocks that thread in `Atomics.wait`, either before recorder initialization or before dispatching its first inbound packet. Both cases use the unchanged production SessionJournal and its actual Worker. There is no new production worker factory, debug endpoint or stall setting.

With a configured 2,000 ms deadline, startup rejects ready with worker-timeout. An in-flight stall rejects close, retires capture and preserves two never-submitted offers plus one unconfirmed offer; zero append acknowledgements are invented. Both callers continue receiving timer callbacks while awaiting retirement. Every test requires the worker-written stall marker, so an unrelated startup error cannot masquerade as the intended fault. Test child execution has a separate 15-second outer deadline, and worker termination and temporary-directory cleanup finish before return.

The [final run record](../runs/O07-DEADLINES.json) contains both observations, source hashes and test summary. Build and **all 250 package tests passed**. Elapsed observations include startup/scheduling time and are not a hard-realtime guarantee or a MIDI latency measurement. Caller heartbeat counts establish progress only within these fault fixtures. Host snapshot admission, service integration and sustained native MIDI responsiveness remain incomplete; this evidence does not close O07.

## Native virtual MIDI during recorder saturation

The [bounded coexistence probe](../probes/recorder-midi-load.mjs) uses the installed @julusian/midi 3.8.1 binding and an exactly matched, newly named private CoreMIDI destination. It never connects to Mixxx or a physical controller. Each comparison sends 1,000 uniquely identifiable MIDI messages at nominal 10 ms intervals while measuring send-to-callback elapsed time on one Node monotonic clock. The loaded phase offers synthetic raw-event fixtures in 16-event bursts every 2 ms, limited to 100,000 offers, against a recorder configured for four pending/in-flight packets and 32 KiB ingress bytes. These background events are synthetic; the measured loopback traffic is not claimed to be the captured physical-controller stream.

Both [run 1](../runs/O07-MIDI-LOAD-01.json) and [run 2](../runs/O07-MIDI-LOAD-02.json) delivered all 1,000 messages in both phases, with zero invalid/unmatched messages. Run 1 p99 loopback was 0.472 ms idle and 0.400 ms saturated. Run 2 was 0.767 ms idle and 0.431 ms saturated. Lower saturated figures are observations, not evidence that recorder load improves timing. Every sample is retained, including dispatch jitter; run 2 had an idle maximum dispatch lateness of 20.879 ms. Timer wakeups can precede a fractional scheduled target, so negative dispatch lateness remains visible rather than being clamped away.

Run 1 recovered all 17,970 admitted fixture records and accounted for 55,230 omitted offers. Run 2 recovered all 17,600 admitted records and accounted for 54,848 omitted offers. The maximum observed pending count was four and pending input bytes were 4,268 in each run. Recovery found no storage corruption or torn-tail gaps; explicit capture-gap events and gaps-present status remained. Both runs closed/destroyed their native handles and removed their temporary recordings. The second run followed a probe-only correction that routes an unexpected load-timer error through normal cleanup instead of throwing from an asynchronous callback; both observations remain archived.

These short, fixed-order comparisons prove delivery and recorder accounting for the private native loopback under the tested load. They do not close production communicator/service integration, host observation, human cancellation, audible onset, long-session capacity or physical-controller capture gates. No production code changed in this step; the unchanged implementation's last package run passed 250 tests. The native probe itself was executed twice and planning validation passed. Current source and installed binding documentation supplied the evidence because graph coverage was unavailable.

> End of autonomously AI-generated partial implementation evidence.
