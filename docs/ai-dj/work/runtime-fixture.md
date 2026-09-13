# Disposable Mixxx runtime fixture

> Autonomously AI-generated runtime record at the user's request.

Status: accepted fixture preparation. Use the exact isolated container profile below for later host tests. The originally selected external profile in F01 could not create its database under the official application's macOS sandbox. This observed correction supersedes that selected path, without changing the accepted historical F01 report.

```sh
/Applications/Mixxx.app/Contents/MacOS/Mixxx --settings-path "/Users/faizkhalid/Library/Containers/org.mixxx.mixxx/Data/Library/Application Support/Mixxx-AI-DJ/profiles/mixxx-2.5.6-latenight-f01" --controller-debug
```

The normal app-container `Application Support/Mixxx` profile is not used. The [official settings-directory documentation](https://manual.mixxx.org/2.5/en/chapters/appendix/settings_directory) describes the macOS container and profile contents. The current fixture's database, preferences, mappings and analysis are private local data outside Git.

## Live fixture ownership

The coordinator owns the `mixxx-runtime` lease under F11. The durable job is `~/Library/Application Support/Mixxx-AI-DJ/jobs/f11-runtime/job.json`; inspect that manifest and verify each process command before signaling it. Current ports PID: 49495. Current Mixxx PID: 50241. The failed initial Mixxx process 49609 exited before the corrected launch. Do not launch duplicate port helpers or Mixxx instances.

The helper exposes two separate native directions named `AI DJ`. Its sole explicit probe is `B0 77 2A`; the profile-only mapping responds with `B8 77 2A`. It has no performance command API. `SIGUSR1` triggers one probe; `SIGTERM` destroys both handles. A two-hour maximum lifetime also closes the ports. Later lifecycle tests must coordinate ownership and record any replacement; these temporary fixture controls are not the production transport.

## Baseline

- Mixxx 2.5.6 ARM; LateNight / PaleMoon.
- Core Audio / Soundcard Clock / Rubberband (better).
- Main: MacBook Pro Speakers, stereo channels 1–2, 48,000 Hz, 256 frames (5.33 ms); headphones and other output routes unset.
- Native system-reported latency: 22.7083 ms. Baseline underflow count after applying settings and after loading both tracks: 1. No playback soak is implied.
- Two decks are visible; four engine decks remain configured. Initial tests use channels 1 and 2.
- The Music source hashes are unchanged. Live analysis can be newer than the read-only database rows; use native/bridge observations for current state.
- Two approved private Music-library fixtures are recorded in `~/Library/Application Support/Mixxx-AI-DJ/fixtures/fixtures.json`; loaded through native menus with visible analyzed waveforms: A = 117 BPM / A, B = 102 BPM / B-flat. Both are paused. Private library IDs are 321 and 364. These are diagnostic fixtures, not an accepted musical transition pair.
- Hercules DJControl Mix Ultra will be connected later by the operator.

[Current evidence and screenshots](evidence/F11.md). The mapping uses the documented [Mixxx JavaScript MIDI interface](https://github.com/mixxxdj/mixxx/wiki/Midi-Scripting) solely for a diagnostic return packet.

> End of autonomously AI-generated runtime record.
