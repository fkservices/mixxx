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

The full native build completed successfully. Both added controller script-engine
tests passed: JavaScript invocation/progression without script timers and shared
origin across interface replacement. The existing steady-clock resolution test
also passed (three native tests, zero failures). The actual native test binary
hash is in the run record. Mapping use in the custom application now passed; runtime
clock-domain and resume checks remain required. The broader controller-script regression also passed all 43 tests, with
zero failures, errors or disabled tests. These counts overlap: both new clock
tests are included in the broader suite.

CMake 4.4.3 and Ninja 1.13.2 were installed successfully. The source-selected
native ARM release dependency archive responds with HTTP 200 and a size of
1,282,214,190 bytes. The repository pins its SHA256 in `tools/macos_buildenv.sh`;
the configure job downloaded the archive and confirmed the pinned SHA256.
Extraction, CMake configuration and generation completed successfully.
The native test/application build completed with four compiler jobs in the
private build directory; no installed application was modified. The separate
custom bundle reports version 2.7.0 and now launches with an isolated profile.
The machine has Apple command-line compiler tools, but no selected full Xcode.
Any concrete configure/compiler failure must be recorded rather than treated as
successful native verification.

The [partial run record](../runs/R05-NATIVE-CLOCK.json) records the compiled helper
fixture hashes and terminal configure/build/clock-test/regression results.
No build or test process remains running. The custom-application mapping clock
probe passed; the native-clock task remains in review for resume handling.

## Native application launch

The initial private bundle installation failed resolving a bundled dependency.
Quoting the configured path lists in `BundleInstall.cmake.in` preserved paths
containing spaces; the repeated install completed with exit code zero. The raw
build bundle lacked installed resources. Startup samples were kept privately;
these observations alone do not establish every startup failure cause.

The staged application now runs as **AI DJ Mixxx**, with development bundle ID
`com.fkservices.mixxxaidj.dev`, its own container/profile and unchanged official
sandbox entitlements. The installed stock application was not modified.
A real preferences screenshot records 48 kHz and a 21.3 ms buffer; the earlier
stock fixture used 5.33 ms, so timing results must not be transferred between them.
The first diagnostic helper observed no feedback before being stopped. The copied
controller configuration still referenced the stock profile. With the host stopped,
that path was corrected to the isolated custom mapping; the retry passed.

The actual mapping reported `engine.getMonotonicTime` as a function. Samples
progressed from 0.000042 to 24.207334 milliseconds. Node independently decoded
exact numeric (`-1.5`) and Unicode (`é🎧`) return payloads with their expected
session and sequence IDs. The source-backed native clock was used by the endpoint;
the caller-provided provenance label itself remains untrusted. Private capture
and filtered host log hashes are in the run record.

The helper exited successfully, the custom host stopped, and its temporary
diagnostic bootstrap was replaced with the repository mapping. Production deadline
behavior, malformed-input coverage and resume invalidation remain unverified.
Launch and settings screenshots do not prove those behaviors.

> End of autonomously AI-generated implementation notes.
