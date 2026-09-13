# Sync profile integration evidence

> Autonomously AI-generated implementation evidence at the user's request.

Input revision: `13225a5`. Coordinator implementation; prerequisites F09, sync contract and sync validation accepted. No runtime lease or worker dispatch.

The [profile](../../../../ai-dj/hosts/mixxx/conventional-profile.json) now binds `deck.set_sync_enabled` to action schema 2 on both mapped decks. Metadata schema 2 adds an explicit action schema version to all nine semantic entries; legacy actions retain version 1. The wire profile ID, all routes, scaling, presence, feedback, examples and host bindings are unchanged. The [contract](../contracts/conventional.md) documents version handling and the difference between the two mapped decks and the full configured sync roster.

Both sync entries remain `extension-needed`, with required operation `mixxx.sync-guard.v1`. Binding defines encoding only. Production dispatch remains unavailable until complete trusted topology, actual guard observations, current binding/authority, queue/race handling and effect bounds are verified. Cue's independent lease guard is unchanged. No runtime, native UI, audio or musical evidence is claimed.

## Reproducible verification

Run this from the repository root. It asserts the complete allowed metadata change against the accepted input, then reruns F09's full bounded shape/address/vector checks on the unchanged wire projection. The earlier evidence file is not modified.

```python
import copy, json, subprocess
from pathlib import Path

path = 'ai-dj/hosts/mixxx/conventional-profile.json'
old = json.loads(subprocess.check_output(['git', 'show', '13225a5:' + path]))
current = json.loads(Path(path).read_text())
expected = copy.deepcopy(old)
expected['schemaVersion'] = 2
for c in expected['controls']:
    sync = c['host']['writeKey'] == 'sync_enabled'
    c['semantic']['schemaVersion'] = 2 if sync else 1
    if sync:
        c['semantic']['action'] = 'deck.set_sync_enabled'
        c['semantic']['operationSpecId'] = 'mixxx.sync-guard.v1'
assert current == expected
assert len(Path(path).read_bytes()) <= 65536
normalized = copy.deepcopy(current)
normalized['schemaVersion'] = 1
for c in normalized['controls']:
    c['semantic'].pop('schemaVersion')
    if c['host']['writeKey'] == 'sync_enabled':
        assert c['semantic']['status'] == 'extension-needed'
        c['semantic']['action'] = None
        c['semantic']['operationSpecId'] = 'mixxx.sync-enabled.v1'
assert normalized == old
source = Path('docs/ai-dj/work/evidence/F09.md').read_text()
code = source.split('```python\n', 1)[1].split('\n```', 1)[0]
read = "Path('ai-dj/hosts/mixxx/conventional-profile.json').read_bytes()"
assert code.count(read) == 1
exec(compile(code.replace(read, 'json.dumps(normalized).encode()'),
             'F09-wire-projection-check', 'exec'))
print('PASS metadata v2: exact sync selector, legacy versions and both host gates')
```

Executed successfully: nine instances, 11 command routes, nine feedback and nine presence routes without collisions; 27 zero/mid/max vectors; 128 round trips and 32,769 continuous quantization inputs per curve; all 512 cue note-edge packets. Full package suite: 57 passed. Typecheck, build, planning validation, render checks and Markdown/whitespace checks passed.

Metadata readers must understand schema 2; no production profile reader exists yet. M03 must retain explicit guard rejection rather than interpreting non-null sync action metadata as ready to execute. The existing feedback decoder's profile-vector regression passes because its wire projection did not change.

> End of autonomously AI-generated implementation evidence.
