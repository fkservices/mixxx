# Final integrated five-control acceptance

> Autonomously AI-generated bounded native acceptance evidence.

Source revision: `512713595b186f1a7d1eeae5f9ea29a5dc57d2ed`. [Measured run](../runs/M13-FINAL-HOST.json).

The actual custom Mixxx 2.7 host ran the ten-fragment mapping, with both approved
fixtures loaded using native file dialogs. All five manual controls agreed with
native visuals and received feedback before any MIDI command was sent:

- Play changed from paused to active and back.
- Deck-one volume moved from 127 to 48 through an intermediate 87.
- Crossfader moved from 64 to 113.
- Native CUE set a visible marker and emitted distinct cue-default 1/0 edges;
  cue position arrived independently of cue-preview.
- A mouse sync tap changed tempo from 117 to 102 BPM and emitted a brief sync
  1/0 pair. Final false did not erase the tap's tempo effect.

Exactly one MIDI command then enabled sustained deck-one sync. The UI remained
lit at 102 BPM, with returned sync true for 6,787.64 ms until a mouse click turned
it off. The companion sent no disable or echo command and did not reassert sync.
Capture continued beyond the private runner's 30-second release limit; observed
manual cancellation had already cleared its cleanup obligation.

All 21,826 conventional packets and 9,765 SysEx frames match the native outgoing
log exactly. Cue transport produced 19,453 ordered observations with zero gaps or
decoder errors. The single input command matches the native incoming log.

Mouse actions restored deck-one tempo to 117 BPM/rate zero, both deck volumes to
127, crossfader to 64, both play/preview values to zero and both sync values off.
The native screenshot agrees. The cue marker remains in this disposable profile.
Native shutdown reported complete cleanup; the helper exited zero and the
profile mapping was restored without private activation instrumentation.

Together with accepted M13-CUE-NATIVE, this closes current-host cue, sync and
manual feedback agreement. This is not implemented B2B arbitration, production
AI authority, physical-controller coexistence, latency, endurance or musical
acceptance. L12-NATIVE-ACCESSIBILITY still blocks release for the preserved Qt
accessibility selection crash; file-dialog loading here does not resolve it.

> End of autonomously AI-generated acceptance evidence.
