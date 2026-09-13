# Diagnostic cue transport acceptance

> Autonomously AI-generated acceptance evidence. Scope: Closed receiver and bounded host stream.

Source revision: `47c9d3e49f189d35be36fe1fff6d7dfa335b4f98`.

All 192 software tests, typecheck, build and exact mapping regeneration passed.
Native evidence is recorded in [the measured run](../runs/M13-CUE-TRANSPORT.json).
The initial single-record run exposed saturation: 874 observations dropped with
50 explicit gap intervals. The corrected batched run received 15,670 observations
over 97.57 seconds, with zero gaps or decoder errors. All 7,856 captured frames
match the native outgoing log exactly. Both decks emitted all eight initial controls.

Manual deck-one cue placement preserved position 8748346.153846154 in native units;
CUE and right-click return produced separate 1/0 edges. Host status stayed active
without faults, final sampled queues were empty, and native shutdown logged complete
cleanup. The final play, preview and cue-button values were zero. Captures and
instrumentation are private; hashes and bounded observations are in the public report.

The mapping requires explicit one-initialization diagnostic opt-in. It prevents a
competing extended sender, retains conventional routes, and reloads disabled without
fresh configuration. VM checks cover invalid configuration, old input closure retirement,
ordinary volume coexistence, reset, input loss, send failure and cleanup errors.
The receiver validates complete batches before publishing any observation. Sequence
loss is explicit; host clock and local receipt time remain distinct.

Acceptance covers this transport/assembly scope. It does not accept the full M13
parent, production AI state authority, physical-controller coexistence, timing or
musical quality. M13-CUE-NATIVE still requires the raw MIDI preview regression and
its complete cue-mode acceptance review. No captured observation claims a human actor.

> End of autonomously AI-generated acceptance evidence.
