# O04-CAPTURE-HOOK — native observation before MIDI mapping

Autonomously AI-generated implementation and validation report.

The PortMidi controller now exposes setup-only start/stop capture methods and copies every returned backend packet before status parsing or SysEx reprocessing. Capture is opt-in and not yet exposed by the companion bridge. Normal controller mapping remains on its existing path. No observer MIDI sends, file writes, serialization or per-message QObject calls were added.

Each input open receives an opaque endpoint identity. Each capture activation has its own stream UUID and a preallocated 4,096-slot SPSC buffer. The fixed packet is 40 bytes on this ARM64 target, below the 64-byte design bound. A global limit of 32 live or retained retired buffers bounds packet storage to 5 MiB on this target; cold metadata contains two UUID strings per buffer. Retained closed buffers count against the limit, so retaining history cannot create unlimited native rings.

The producer advances sequence for each packet or error offer and drops newest on full capacity. Atomic published snapshots use at most two attempts. All snapshot fields are atomic, avoiding a non-atomic seqlock data race. Slot publication precedes the corresponding watermark. The consumer drains at most 64 records through one consistent snapshot. Final closed status preserves trailing dropped counts. Backend read loss has unknown event count and a separate read-error counter; filter restoration errors are distinguished by errorSource. Neither is synthesized as a MIDI reset.

Enabling capture explicitly sets PortMidi's filter mask to zero. Failed activation returns no capture handle. Disabling restores the original default PM_FILT_ACTIVE policy; failed restoration returns false and leaves capture active, with error evidence. Close retires the buffer even after restoration failure. Newly admitted active sensing does not reach legacy mappings, including packets already queued when capture is disabled. A new input-open generation resets that suppression state.

## Evidence

- Native `mixxx-test` build succeeded using the existing pinned dependency environment. Initial regeneration failed because BUILDENV_URL was absent; rerun supplied the existing 2.7-rel dependency URL and directory. No dependency download or app installation was performed.
- All 20 PortMidiControllerTest/RawMidiCaptureBufferTest tests passed, including eight new cases. Existing short/SysEx parser and input-loss tests remain green.
- Native mock tests verify repeated identical messages, timing/active-sensing messages, parser reprocessing, 1,201-byte SysEx before legacy 1,024-byte truncation, read overflow, filter failure, disabled capture, close/reopen identity and unchanged dispatch expectations.
- Ring tests offer 5,000 records into 4,096 slots, verify exactly 904 drops and the next accepted sequence 5,001 after wrap/drain. Final watermark and closed-producer behavior are checked.
- A concurrent producer/consumer test accounts for all 100,000 offers as delivered or dropped, checks immutable sequence/word relationships and validates consistent snapshots. This is a bounded stress run, not a race-detector proof or long audio soak.
- The ARM64 compiled `offer`, `publish` and `finish` function bodies contain zero external call instructions. Together with lock-free uint64 atomics and the cold-path initialization of the monotonic clock, this supports the no-allocation/no-lock producer requirement for this build. It does not prove latency on other hardware.
- Exact results and hashes: [O04-CAPTURE-HOOK.json](../runs/O04-CAPTURE-HOOK.json). Existing non-fatal linker alignment warning remains.

Graph project `mixxx-ai-dj` generation `2026-09-13T16:44:03Z` found the native poll/read symbols but reported stale/partial controller coverage. Current controller/device source and the modified test scope were read directly. No exhaustive graph claim.

## Remaining integration

O04-CAPTURE-BRIDGE must call setup and polling lifecycle operations serially on the manager thread, enforce local endpoint selection, handle/filter error outcomes, attach descriptors and mapping/configuration generations, fairly drain rings and marshal read-only immutable batches to the configured AI feedback endpoint. The hook asserts capture owner-thread consistency; it does not assume the Controller QObject's affinity equals the polling thread. O04 ingress must link these native packets to the recorder contract and retire decoder pairing on losses. Mapping reload and other lifecycle resynchronization belong to that integration. The custom installed app has not been rebuilt or replaced; physical-controller, B2B timing and audio acceptance remain pending.

End of autonomously AI-generated implementation and validation report.
