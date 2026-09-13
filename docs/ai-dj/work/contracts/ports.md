# Local MIDI endpoint topology

> Autonomously AI-generated integration correction at the user's request.

## Selected topology and reason

For the first local Mac fixture, use two distinct native CoreMIDI virtual endpoints with the shared logical name **AI DJ**: a Node Output is the command source that Mixxx reads; a Node Input is the feedback destination that Mixxx writes. Keep the handles, directions and endpoint identities separate even though the displayed logical name matches. Do not forward received feedback back to the command output.

This supersedes F01's unverified selection of two differently named IAC buses. The [Mixxx 2.5.6 enumerator](https://github.com/mixxxdj/mixxx/blob/2.5.6/src/controllers/midi/portmidienumerator.cpp#L111) matches input/output names (or recognized naming patterns), then constructs one paired controller. Two arbitrary bus names do not establish a usable feedback destination for the command mapping. The installed `@julusian/midi` 3.8.1 README documents macOS `openVirtualPort(portName)` support for input/output; its examples distinguish a receiving virtual input from a sending virtual output. Actual endpoint names and Mixxx pairing still need observation.

```text
Node command Output (AI DJ)  ->  Mixxx controller input
Node feedback Input (AI DJ) <-  Mixxx paired controller output
Physical Hercules controller -> Mixxx independent controller input
```

## F11 and M02 requirements

- F05 must first prove the native binding loads and enumerates on the selected runtime. F11 now depends on that accepted result.
- Use one disposable controller instance. Record exact host-visible endpoint names, directions and identities, plus the owning process/job. Never choose a connection solely by a stale numeric port index.
- Start endpoints before Mixxx enumeration. Confirm the Mixxx log links the intended input and output; equal names are a selected convention, not proof of connection.
- The process holding virtual ports must persist for the fixture lifetime. Store its handle/log/start identity and retain the MIDI/runtime lease across observer handoffs. Closing the UI tab cannot own port lifetime.
- Record a bounded two-direction probe and verify that feedback is not reinterpreted as a new command or echoed indefinitely. A native loopback test alone does not prove host behavior.
- If the OS adds prefixes or Mixxx pairs incorrectly, record exact names and investigate one bounded correction. Do not silently enable a shared IAC feedback loop or modify physical-controller routing.
- Startup/disconnect remains disarmed. F11 prepares the fixture; M02 and later reliability cards own the production lifecycle, feedback, cancellation and reconnect implementation.

## Observed fixture and lifecycle handoff

[F11 evidence](../evidence/F11.md) now records actual Mixxx 2.5.6 pairing: input index 0 and output index 1, both named `AI DJ`, with one diagnostic command/response and no echo. Those indexes are observations of that enumeration, not stable identities.

The temporary Node helper currently owns both virtual endpoints. The production communicator must take over their creation and lifetime under the runtime lease. Opening an Output connected to the helper's `AI DJ` destination would send into the helper's receive queue, not into Mixxx's command input; it is not the selected command route. M02 must explicitly create the command source and feedback destination, reject duplicate external names, close the old fixture helper through its durable job, and verify host pairing after replacement. Exact-name discovery alone cannot prove routing direction.

## Evidence boundary

The local graph, project `mixxx-ai-dj`, generation `2026-09-13T16:44:03Z`, returned `PortMidiEnumerator.queryDevices` and `shouldLinkInputToOutput`. Exact snippets were read and relevant coverage reported no recorded issue with matching metadata. The direct caller relationship to `queryDevices` was confirmed in source; unrelated heuristic graph callees were not relied on. The official 2.5.6 tagged source was separately read because the checkout identifies as 2.7-alpha. This is source-backed setup planning, not an executed port or Mixxx test.

> End of autonomously AI-generated integration correction.
