# Native input-loss propagation

> Autonomously AI-generated implementation notes; native input-loss propagation accepted.

PortMidi read errors now clear partial SysEx assembly before any later input is
processed. Overflow invokes an explicit `portmidi-overflow` notification; other
read failures use `portmidi-read-error`. No synthetic MIDI reset is generated.
The legacy engine calls optional `inputError(reason)` functions on configured
mapping prefixes. Mappings without a handler are left unchanged.

AI DJ recognizes the two native reasons and faults its current endpoint with
`native-input-loss`. Old input cannot revive that endpoint. Conventional controls
remain separate; production authority and recovery are later required work.

A new native regression injects partial SysEx, overflow, then a fresh frame and
checks notification ordering and fresh-frame contents. A software regression
checks endpoint retirement and cleanup. All 165 software tests passed. The native rebuild completed with exit code zero,
and all 55 tests in the PortMidi/controller-script suites passed, including the
new partial-frame overflow test. Actual overflow in the staged rebuilt application also passed: the native hook
closed the endpoint, and the post-loss message did not dispatch.

The native rebuild uses the existing private build directory. Its output is in
`input-loss-build.log`; build session 12769 and test session 73206 both exited
with code zero. No native build or regression process remains running.

> End of autonomously AI-generated implementation notes.
