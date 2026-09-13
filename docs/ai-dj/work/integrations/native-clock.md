# Native script clock bridge

> Autonomously AI-generated implementation notes. Native acceptance is pending.

The installed stock Mixxx 2.5.6 probe found `performance` undefined. The inspected
legacy interface declares no monotonic getter. Its version-pinned
[base initialization](https://github.com/mixxxdj/mixxx/blob/3ebac449e7e5fe2a0186596657696e87ce8b0e56/src/controllers/scripting/controllerscriptenginebase.cpp)
installs console support and controller/color objects; it does not install a
performance clock. This is evidence for adding a supported clock bridge to our
fork, not a claim about every possible Qt or Mixxx clock surface.

## Implemented source

`engine.getMonotonicTime()` returns read-only milliseconds, including fractional
precision, from `std::chrono::steady_clock`. The helper's static origin is its
first call in the process. Calls across script-interface replacement share that
origin. No MIDI, playback, timer scheduling or authority change occurs.

The clock is unrelated to Unix time and Node's performance clock. A restarted
host requires a new host/clock-domain identity. Cross-process comparisons still
require a measured mapping and uncertainty; matching units do not establish one.
Suspend accounting is platform-specific. Resume must invalidate active sessions
and queued actions before continuing; this bridge alone does not implement that
policy. A clock sample cannot arm the system or authenticate its source.

The companion remains TypeScript. This small C++ bridge requires a custom Mixxx
binary; the installed 2.5.6 application has not acquired the new API. Our fork's
current source targets the 2.7 development build, so its eventual native fixture
must have a separate profile and new version/build evidence. Existing 2.5.6
acceptance does not automatically carry over.

## Verification so far

Apple clang 17 compiled a standalone fixture against the actual new clock header
with C++20, `-Wall -Wextra -Werror`. The executable passed 100,000 nondecreasing,
finite samples and elapsed-time progression after a 20 ms thread sleep. This
checks the real clock helper, not Qt registration or the installed application.

Two tests were added to the existing controller script-engine suite: JavaScript
invocation and progression without script timer callbacks, plus a shared origin
across interface replacement. These tests have not yet run. Full native compile,
Qt invocation, mapping use and runtime clock-domain checks remain required.

CMake 4.4.3 and Ninja 1.13.2 were installed successfully. The source-selected
native ARM release dependency archive responds with HTTP 200 and a size of
1,282,214,190 bytes. The repository pins its SHA256 in `tools/macos_buildenv.sh`;
the configure job downloaded the archive and confirmed the pinned SHA256.
Extraction, CMake configuration and generation completed successfully.
The native test/application build is now running with four compiler jobs in the
private build directory; no installed application was modified.
The machine has Apple command-line compiler tools, but no selected full Xcode.
Any concrete configure/compiler failure must be recorded rather than treated as
successful native verification.

The [partial run record](../runs/R05-NATIVE-CLOCK.json) records the compiled helper
fixture hashes and the tracked native configure job. A live job is not build
success; inspect its terminal result before advancing.

> End of autonomously AI-generated implementation notes.
