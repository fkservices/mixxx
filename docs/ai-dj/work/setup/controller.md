# Selected physical controller

> Autonomously AI-generated setup note at the user's request.

The user identified **Hercules DJControl Mix Ultra** on 2026-09-13. Physical connection, CoreMIDI endpoints, mapping correctness, feedback and B2B pickup behavior have not been observed.

The [manufacturer technical FAQ](https://support.hercules.com/en/kb/1806-en/) documents computer USB connection for testing and charging, while describing mobile devices as its reference platform. It also states that the controller has no built-in sound card. Computer USB MIDI enumeration is therefore our first compatibility test; desktop DJ support must be demonstrated locally. Bluetooth is a separate route requiring its own tests.

Mixxx documents a [DJControl MIX mapping](https://manual.mixxx.org/2.5/en/hardware/controllers/hercules_djcontrol_mix), including a USB requirement. That is a different named model: do not assume its addresses, pad modes or feedback also match the Ultra. Capture actual Ultra MIDI messages and compare controls before reusing any mapping. Exact-model tests belong to O04/R23 and may require a custom mapping child.

The physical controller connects to Mixxx alongside the AI command/feedback routes. Raw input capture must include human messages that leave values unchanged, and B2B must cancel automation for touched controls through the current transition. Feedback alone must not be mislabeled as proof of a human input. Mac audio output remains separately configured.

> End of autonomously AI-generated setup note.
