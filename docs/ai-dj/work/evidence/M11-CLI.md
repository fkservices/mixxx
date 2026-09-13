# M11 separate CLI acceptance

> Autonomously AI-generated acceptance evidence.

Reviewed revision `a6bcf07`. The coordinator reviewed the service, CLI and integration tests directly because graph coverage for these new files is unavailable. M11-CLI implements a bounded private Unix socket, separate TypeScript client, native MIDI startup and durable JSONL capture. The service starts disarmed. UI/client lifetime does not own MIDI transport lifetime.

## Evidence

The integrated suite passed 101 tests, with typecheck and build passing. Integration tests cover a separate CLI process exiting while transport remains open; raw feedback becoming stale; capture persistence and permissions; idempotent shutdown; capture failure disarming and refusing arm; socket collision preserving the first service; oversized/batched requests rejected without sending; and disarm cancelling an older arm blocked on a capture write. Independent status remains responsive during that held write.

The native runner PID 4355 opened its virtual ports. Separate status clients exited zero and reported the same running PID, transport open, armed false and no capture error. All nine controls remained unknown. Native startup and client independence are observed; a Mixxx feedback connection is not yet proved for this runner.

## Exact invocation shape

Run from the repository root using the installed Node runtime. Create a private temporary socket directory and choose a new capture filename; the capture writer refuses to overwrite existing files.

```sh
node ai-dj/main.ts serve-fixture /tmp/PRIVATE-DIRECTORY/control.sock /ABSOLUTE/NEW-CAPTURE.jsonl
node ai-dj/local-ui/cli.ts /tmp/PRIVATE-DIRECTORY/control.sock status
node ai-dj/local-ui/cli.ts /tmp/PRIVATE-DIRECTORY/control.sock disarm
```

The currently observed instance uses `/tmp/dj-m11-pbhx9i1t/control.sock`. Its private job record is under `~/Library/Application Support/Mixxx-AI-DJ/jobs/m11-runtime/job.json`. Inspect that existing job before launching a replacement. The runner exits on SIGINT/SIGTERM or its two-hour limit. Tests verify cleanup using injected handles; native shutdown remains a later handoff observation.

## Acceptance boundary

M11 and this child require fake-transport command/observation validation, native startup, durable capture and separate client lifetime. Those checks pass. Actual Mixxx command effects and returned feedback belong to M12/M13 and remain unverified. The previous progress checkpoint conservatively held M11 for native reconnection; review of the unchanged catalog establishes that this is a prerequisite for the next runtime tests, not an additional M11 exit criterion.

This remains a manual fixture interface with unverified caller host identity and raw MIDI observations. Cue/sync require later host guards. AI, B2B ownership, authoritative state, audible behavior, physical hardware, saturation latency and full session replay are not accepted by this result.

> End of autonomously AI-generated acceptance evidence.
