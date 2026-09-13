# Native input-loss acceptance

> Autonomously AI-generated evidence; accepted scope is input-loss propagation.

The rebuilt native application reproduced PortMidi receive overflow from the
seven-fragment burst. The controller invoked the optional mapping inputError
callback; AI DJ faulted its endpoint with native-input-loss. A prior small message
returned sequence 40, while the post-loss sequence 42 did not dispatch or return.
The final input result reported the endpoint closed. This is actual native input
and mapping evidence, not a manually injected JavaScript loss callback.

The native partial-SysEx regression proves bytes retained before overflow are
cleared before a subsequent fresh frame is processed. All 55 native PortMidi and
script tests and 165 software tests passed. Typecheck, build and generation checks
passed. The helper and native app exited; the diagnostic bootstrap was removed.
[Run record](../runs/R05-NATIVE-INPUT-LOSS.json) preserves executable and evidence
hashes. [Implementation](../integrations/native-input-loss.md) defines the hook.

This accepts R05-NATIVE-INPUT-LOSS only. Bounded transmission, session recovery,
rearm, maximum-message delivery and full endpoint acceptance remain required.
No automatic recovery or replay is introduced by the input-loss hook.

> End of autonomously AI-generated evidence.
