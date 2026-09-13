# Local Music library fixtures

> Autonomously AI-generated setup record at the user's request.

The user authorized the local iTunes/Music library on 2026-09-13. The active media directory is `~/Music/Music/Media.localized`. A read-only extension inventory found 264 MP3, 31 WAV, one M4A and one M4P file; these counts are not claims that every entry is playable or musical. The library database was not changed.

Two full-length MP3 tracks passed full audio decoding. Private absolute paths and source titles are stored only in `~/Library/Application Support/Mixxx-AI-DJ/fixtures/fixtures.json` (mode 0600, containing directory 0700). No audio was copied into the repository.

| Slot | Duration | Rate | Channels | Size | SHA-256 |
| --- | --- | --- | --- | --- | --- |
| fixture-track-a | 242.832000 s | 48000 Hz | 2 | 9937792 bytes | `af7660a4384f44b1a9d709b66c223d2e1bc71fd38cdd7760f05f066ad1a47a3b` |
| fixture-track-b | 240.071700 s | 44100 Hz | 2 | 4805530 bytes | `7f2fde705c2a9906cae69acc4a107c07ebb8a1846f69b26e2edd469eb80ae72b` |

Both complete-file decodes exited 0 with no error output using `ffmpeg -v error -xerror -i <private-path> -map 0:a:0 -f null -`. Metadata came from `ffprobe`; source SHA-256 came from Python hashlib. No playback or recording was started.

The pair covers real full-length local music and different source sample rates. BPM, key, phrase structure, existing cues and transition suitability remain unmeasured; F11 and later analysis gates must inspect them. Decode success does not establish Mixxx playback, a good transition or an enjoyable set. Cloud/protected files were not adopted as fixtures.

> End of autonomously AI-generated setup record.
