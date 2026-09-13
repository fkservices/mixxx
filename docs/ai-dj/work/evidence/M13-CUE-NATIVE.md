# Native cue observation acceptance

> Autonomously AI-generated bounded acceptance evidence.

Source revision: `8f5c4a68254417eb91165a0407c1ebdc731a8c15`.

[Manual cue transport evidence](../runs/M13-CUE-TRANSPORT.json) verifies native
marker placement, CUE press/release and right-click cue return in mode 0. The
receiver preserves the cue position, default button, return button, indicator,
preview and transport as separate observations with unknown actor provenance.
No expected record is injected into the communicator. The initial saturated
single-record transport was replaced by batching; the successful native run
received 15,670 observations with no loss or decode error.

[Raw preview regression](../runs/M13-CUE-NATIVE.json) verifies the unchanged
conventional MIDI note routes on both decks with the integrated batched mapping.
Each deck received an eight-second press followed by release. The native UI
showed active waveform/playback during the hold and paused cue positions afterward.
Received play and cue-preview values were 1 during the hold and 0 after release.
Both decks ended with play, preview, default cue, return cue and play-latched zero.
The fixed runner emitted exactly four MIDI commands; all four match native input
logs. All 6,618 captured output frames match native output logs, yielding 13,192
ordered observations with zero gaps or decoder errors. Native shutdown reported
complete cleanup; the helper exited zero. The isolated profile was restored to
the repository mapping without private activation instrumentation.

These tests use the selected cue mode 0. Native default CUE behavior depends on
mode and current transport state; the observations preserve those facts rather
than mapping every CUE gesture to cue-preview. Alternate-mode behavior is not
claimed tested. Raw preview is a separate conventional control, not production
cue authority. Lifecycle fixtures cover stale generations and default-disabled
reload. Production identity, ownership, freshness and human attribution remain
later reliability work.

One earlier attempt crashed before any cue command while the accessibility client
queried a library selection. The native stack starts at
`-[QMacAccessibilityElement accessibilitySelectedChildren]`. Root cause remains
unresolved; the successful retry used native file dialogs. The crash is retained
in the structured evidence and tracked by L12-NATIVE-ACCESSIBILITY. This bounded
cue acceptance does not imply the custom host is release-ready.

M13 still requires final five-control and selected-sync review on the integrated
custom host. Physical controller, latency, endurance and musical gates remain open.

> End of autonomously AI-generated acceptance evidence.
