# Paginated Mixxx discovery records

> Autonomously AI-generated inventory contract at the user's request.

[Schema v1](schema.json) defines a discovery page, not a declaration that a feature works. It preserves all 22 families in [the coverage plan](../../CONTROL-COVERAGE.md) and the identity/evidence meanings of [F07](../contracts/state.md). F10 specifies the format; inventory cards must collect real source, manual, menu and runtime evidence. No actual capability inventory or Mixxx behavior is certified here.

## Record meanings

A page freezes `inventoryId`, `inventoryRevision`, the F07 host context and one feature family. Its maximum is **20 records**, including alias rows. A capability has one canonical `mixxx.*` ID, a label, specification status, typed read/write semantics, a control binding or bounded service-operation reference, native UI location or visibility gap, instance enumeration and discovery evidence. Group/key strings and spec IDs are descriptive records; accepting this JSON never authorizes their execution.

Inventory records intentionally contain discovery annotations beyond the F07 wire catalog. They are not directly assignable to `CapabilityCatalog`. A reviewed conversion must resolve specification references to the closed action union and validate every catalog binding. `specified` means semantics are documented. `candidate`, `unresolved` and `extension-needed` remain first-class records; none can be converted to a supported operation by changing a label. `verified` is not an aggregate specification status: availability, command, feedback, native UI and runtime assessments remain independent.

Each singleton or dynamic instance has separate assessments. A passed dimension requires retained evidence for that exact context and target. An actual command pass needs a host effect; outbound bytes are insufficient. Feedback needs valid presence and actual host state, including relevant manual changes. Native UI needs a real corresponding Mixxx view in the selected skin. Runtime needs that scenario's host/device/audio/timing evidence. A screenshot of the build journal is not a Mixxx UI pass. `not-applicable` requires explicit rationale and review evidence and cannot waive a required delivery gate.

Aliases point one hop to a canonical record with evidence of equivalence. They add **zero** to the canonical feature denominator. For dynamic controls, preserve the instance ID, generation, selected definition and parent incarnation. Replacing an effect invalidates its old parameter instances. Count known canonical features and required instances separately, retaining absent, unknown and extension-needed entries. Incomplete instance enumeration makes the total a lower bound; do not report full coverage.

## Page and cursor contract

- Page zero has `previousPageId: null`; subsequent page numbers advance by one and name the immediately preceding accepted page. Page IDs and opaque cursors are immutable and never recycled within an inventory revision.
- Every page retains exact source scopes, revision/tag, input/output cursors, whether that scope was exhausted and retained evidence. Source declarations, the matching version manual, native menus/preferences and runtime instance enumeration are separate sources. If a source lacks a cursor, use a reviewed deterministic scope token; record the extraction boundary explicitly.
- `boundary.status: more` requires a next cursor, named continuation and nonempty remaining scope. The coordinator materializes that continuation before the parent card can close. A short page does not prove exhaustion. Never restart a scan solely because a bounded observer stopped.
- The next cursor is bound to the inventory/context/family/revision and previous page. Reject loops, duplicate or skipped pages, conflicting repeated IDs, and a cursor from another profile. An identical previously accepted page may be reused without double-counting. Content changes at the same identity are conflicts, not updates.
- Profile, source revision, configured counts or instance-generation changes require a new inventory revision and reconciliation. Do not combine rows from different host versions or silently retain old instance evidence. Preserve prior revisions as history.
- A family ends only with `family-exhausted`, null next cursor and a complete discovery closure. Closure lists all page IDs, canonical/alias/instance totals, exhausted cross-checks for all four source kinds, no unknown scopes and complete dynamic enumeration. A zero-row or zero-instance family still requires positive absence/exhaustion evidence.

Discovery closure means the bounded family has been enumerated, including documented implementation gaps. It does **not** mean those gaps are resolved. Unresolved feature behavior may remain as explicit questions and capability expansion tasks after discovery closure; an unresolved *scope or instance count* prevents discovery closure. I23 combines all 22 family closures for one coherent target. C02 additionally requires every required capability/instance implementation and its independent acceptance evidence. These are different gates.

## Required semantic checks beyond JSON Schema

Schema validation enforces shapes, known discriminants, finite-range JSON numbers, ID syntax, array limits, required nonempty evidence, four distinct closure source kinds and explicit continuation/closure forms. The collector/reviewer must additionally verify:

1. Every row family and evidence context matches its page. Every evidence/artifact/run/spec reference resolves to retained, relevant material and binds the exact capability/instance; an invented ID is not proof. Timestamps require a calendar-valid UTC format checker (the fixture registers one explicitly because optional format dependencies may be absent); timing measurements also need F12 clock/calibration manifests.
2. All canonical/alias/page/evidence identities are unique as appropriate. No alias collision, dangling target, chain or cycle; referenced canonical targets may be on another verified page in the same inventory. No capability duplication across families without an explicit reviewed canonical assignment.
3. Numeric `minimum <= maximum`, valid neutral value, normalized bounds within `[0,1]`, and meaningful step/tolerance. Read/write behavior, precondition/postcondition/deadline/retry specs must agree with the chosen host and F06 action semantics. Unknown value shapes remain explicit extension work.
4. Dynamic instance IDs/incarnations/parents match the current configuration; complete `count` equals the number of unique discovered instances. Assessments are per exact incarnation. Missing instances and source parse/coverage gaps require continuation; no declared completion can erase them.
5. The complete page chain and every source cursor actually exhaust their frozen scopes. Cross-check source declarations against versioned manuals, UI menus/preferences and configured runtime instances, including aliases, modal actions and controls omitted from generated declarations. Record coverage limitations and read missed source ranges.
6. Closure page IDs and totals equal the verified union; all required family pages/continuations are accepted; no unknown scopes or incomplete dynamic enumerations remain. All four cross-checks cover the whole family, not just the last page. A schema-valid closure with unverified evidence remains unaccepted.

Before parsing external bytes, enforce a 1 MiB UTF-8 page limit, depth 24, plain JSON only and strict finite numeric validation; never use JSON with NaN/Infinity extensions. Schema collections also bound source/evidence lists to 100, enum choices/instances to 256, and closure page IDs to 4,096. These are explicit first-profile capacity limits, not measured full-inventory capacity. Exceeding any limit requires a visible capacity result and a bounded continuation/protocol extension; never truncate and emit `complete`. Later collectors own parsing, reference resolution and closure enforcement; this schema alone implements none of them.

## Reproducible synthetic examples

The following fixture validates one ordinary control, one dynamic effect parameter, and one modal service gap. All evidence IDs and claims are **synthetic**; these examples deliberately leave behavioral assessments untested. The ordinary control is unresolved until its exact write semantics are reviewed. The effect preserves an unknown remaining instance scope. The modal file workflow is extension-needed rather than claiming that opening a dialog loads a bank.

Run the block from the repository root with Python and `jsonschema` (F10 used installed 4.26.0). It validates payload shapes and demonstrates required semantic rejection for context, duplicate, count and closure mismatches; it is a fixture, not a production inventory collector.

```python
import copy
import json
from datetime import datetime
from pathlib import Path
from jsonschema import Draft202012Validator, FormatChecker

schema = json.loads(Path('docs/ai-dj/work/inventory/schema.json').read_text())
Draft202012Validator.check_schema(schema)
formats = FormatChecker()

@formats.checks('date-time', raises=ValueError)
def utc_timestamp(value):
    return isinstance(value, str) and value.endswith('Z') and (
        datetime.fromisoformat(value[:-1] + '+00:00').utcoffset().total_seconds() == 0)

validator = Draft202012Validator(schema, format_checker=formats)
context = {
    'sessionId': 'synthetic-session', 'hostInstanceId': 'synthetic-host',
    'connectionGeneration': 0, 'capabilityRevision': 1,
    'profile': {'profileId': 'synthetic-profile', 'profileRevision': 1,
                'host': 'mixxx', 'version': '2.5.6', 'buildId': 'synthetic-build',
                'platform': 'macos', 'skinId': 'LateNight',
                'skinRevision': 'synthetic-skin', 'configurationId': 'synthetic-config'},
}
evidence = {'evidenceId': 'synthetic-e1', 'artifactId': 'synthetic-artifact',
            'runId': 'synthetic-run', 'context': context,
            'capturedAt': '2026-09-13T19:10:00Z', 'description': 'Synthetic fixture only'}
untested = {'status': 'untested', 'reason': 'No runtime test'}
assessment = {'availability': {'status': 'unknown', 'reason': 'Not probed'},
              **{key: copy.deepcopy(untested)
                 for key in ('command', 'feedback', 'nativeUi', 'runtime')}}
ordinary = {
    'kind': 'capability', 'capabilityId': 'mixxx.deck.playing',
    'family': 'deck-transport', 'label': 'Playing state', 'status': 'unresolved',
    'semantics': {'read': {'kind': 'state', 'value': {'kind': 'boolean'},
                          'delivery': 'poll-and-change-events', 'maxAgeMs': 5000,
                          'existence': 'explicit-presence-required'},
                  'write': {'kind': 'unresolved', 'reason': 'Review action contract'}},
    'binding': {'kind': 'control', 'group': '[Channel1]', 'key': 'play',
                'sourceEvidence': [evidence]},
    'instances': {'kind': 'singleton', 'assessment': assessment},
    'uiSurface': {'kind': 'located', 'panel': 'Deck 1', 'locator': 'Play button',
                  'sourceEvidence': [evidence]},
    'discoveryEvidence': [evidence], 'unresolvedQuestions': [],
}
effect = copy.deepcopy(ordinary)
effect.update(capabilityId='mixxx.effect.parameter', family='effects',
              label='Effect parameter', status='candidate')
effect['binding'] = {'kind': 'unresolved', 'reason': 'Resolve configured effect',
                     'continuationId': 'effect-binding'}
effect['semantics']['read'] = {'kind': 'unresolved', 'reason': 'Resolve parameter range'}
effect['instances'] = {
    'kind': 'dynamic', 'inventoryRevision': 1,
    'discovered': [{'instanceId': 'effect-param-1', 'generation': 2,
                    'kind': 'effect-parameter',
                    'parent': {'instanceId': 'effect-slot-1', 'generation': 2},
                    'definitionId': 'synthetic-filter', 'assessment': assessment}],
    'enumeration': {'status': 'incomplete', 'reason': 'Other effect slots pending',
                    'continuationId': 'effect-instances'},
}
effect['uiSurface'] = {'kind': 'unresolved', 'reason': 'Inspect parameter panel',
                       'continuationId': 'effect-ui'}
modal = copy.deepcopy(ordinary)
modal.update(capabilityId='mixxx.sampler.load-bank', family='sampler-bank-files',
             label='Load sampler bank', status='extension-needed')
modal['binding'] = {'kind': 'service-operation', 'operationSpecId': 'load-bank-spec',
                    'implementation': 'extension-needed', 'sourceEvidence': [evidence]}
modal['semantics'] = {'read': {'kind': 'unresolved', 'reason': 'Need load result'},
                     'write': {'kind': 'extension-needed',
                               'operationSpecId': 'load-bank-spec',
                               'reason': 'Dialog trigger is not file selection/completion'}}
modal['uiSurface'] = {'kind': 'visibility-extension-needed',
                      'reason': 'Need operation status and chosen bank',
                      'continuationId': 'bank-ui'}

def page(record):
    return {'schemaVersion': 1, 'kind': 'inventory-page', 'inventoryId': 'inventory1',
            'inventoryRevision': 1, 'context': context, 'family': record['family'],
            'pageId': 'page0', 'pageNumber': 0, 'previousPageId': None, 'rowLimit': 20,
            'sources': [{'sourceId': 'source1', 'kind': 'source',
                         'scope': 'Synthetic bounded first page', 'revision': 'fixture-v1',
                         'cursorBefore': None, 'cursorAfter': 'cursor1',
                         'exhausted': False, 'evidence': [evidence]}],
            'records': [copy.deepcopy(record)],
            'boundary': {'status': 'more', 'nextCursor': 'cursor1',
                         'continuationId': 'inventory-next',
                         'remainingScopes': ['Manual, native menus and runtime remain']}}

pages = [page(record) for record in (ordinary, effect, modal)]
closed = copy.deepcopy(pages[0])
closed['sources'][0].update(exhausted=True, cursorAfter=None)
closed['boundary'] = {
    'status': 'family-exhausted', 'nextCursor': None,
    'closure': {'kind': 'family-discovery-closure', 'pageIds': ['page0'],
                'canonicalCount': 1, 'aliasCount': 0, 'requiredInstanceCount': 1,
                'crosschecks': [{'kind': kind, 'scopeManifestId': 'synthetic-scope',
                                 'exhausted': True, 'evidence': [evidence]}
                                for kind in ('source', 'manual', 'native-menu', 'runtime-enumeration')],
                'unknownScopes': [], 'dynamicEnumerationComplete': True,
                'closureEvidence': [evidence]}}
full_page = copy.deepcopy(pages[0])
full_page['records'] = [dict(copy.deepcopy(ordinary), capabilityId=f'mixxx.synthetic.{i}')
                        for i in range(20)]
alias_page = copy.deepcopy(pages[0])
alias_page['records'].append({'kind': 'alias', 'aliasId': 'Channel1.play',
                              'canonicalId': ordinary['capabilityId'],
                              'equivalenceEvidence': [evidence]})
for item in pages + [closed, full_page, alias_page]:
    validator.validate(item)
valid_count = len(pages) + 3

def must_reject(item):
    assert list(validator.iter_errors(item)), 'Expected schema rejection'

invalid = []
item = copy.deepcopy(pages[0]); item['records'] *= 21; invalid.append(item)
item = copy.deepcopy(pages[0]); item['context'].pop('connectionGeneration'); invalid.append(item)
item = copy.deepcopy(pages[0]); item['records'][0]['executeScript'] = 'arbitrary'; invalid.append(item)
item = copy.deepcopy(pages[0]); item['records'][0]['capabilityId'] = 'mixxx.'; invalid.append(item)
item = copy.deepcopy(pages[0]); item['boundary']['nextCursor'] = None; invalid.append(item)
item = copy.deepcopy(pages[0]); item['records'][0]['instances']['assessment']['command'] = {
    'status': 'passed', 'finding': 'Unproven', 'evidence': []}; invalid.append(item)
item = copy.deepcopy(pages[0]); item['sources'][0]['evidence'][0]['capturedAt'] = 'bad-date'; invalid.append(item)
item = copy.deepcopy(pages[0]); item['records'][0]['discoveryEvidence'] = []; invalid.append(item)
item = copy.deepcopy(pages[0]); item['boundary'] = {
    'status': 'family-exhausted', 'nextCursor': None,
    'closure': {'kind': 'family-discovery-closure', 'pageIds': ['page0'],
                'canonicalCount': 1, 'aliasCount': 0, 'requiredInstanceCount': 1,
                'crosschecks': [], 'unknownScopes': ['unread menus'],
                'dynamicEnumerationComplete': False, 'closureEvidence': [evidence]}}
invalid.append(item)
item = copy.deepcopy(closed)
item['boundary']['closure']['crosschecks'] = [item['boundary']['closure']['crosschecks'][0]] * 4
invalid.append(item)
item = copy.deepcopy(pages[0]); item['sources'][0]['evidence'][0]['capturedAt'] = '2026-02-30T19:00:00Z'
invalid.append(item)
item = copy.deepcopy(pages[0]); item['inventoryId'] = 'inventory1\n'; invalid.append(item)
for item in invalid:
    must_reject(item)

# Examples of checks that JSON Schema cannot infer from referenced data.
semantic_rejections = 0
item = copy.deepcopy(pages[0]); item['records'][0]['family'] = 'effects'
validator.validate(item)
assert item['records'][0]['family'] != item['family']; semantic_rejections += 1
item = copy.deepcopy(pages[0]); item['records'] *= 2
validator.validate(item)
ids = [r['capabilityId'] for r in item['records']]
assert len(set(ids)) != len(ids); semantic_rejections += 1
item = copy.deepcopy(pages[1]); item['records'][0]['instances']['enumeration'] = {
    'status': 'complete', 'count': 2, 'evidence': [evidence]}
validator.validate(item)
instances = item['records'][0]['instances']
assert instances['enumeration']['count'] != len(instances['discovered']); semantic_rejections += 1
item = copy.deepcopy(pages[0])
item['records'][0]['discoveryEvidence'][0]['context'] = copy.deepcopy(context)
item['records'][0]['discoveryEvidence'][0]['context']['capabilityRevision'] = 8
validator.validate(item)
assert item['records'][0]['discoveryEvidence'][0]['context'] != item['context']; semantic_rejections += 1
item = copy.deepcopy(closed); item['boundary']['closure']['canonicalCount'] = 99
validator.validate(item)
assert item['boundary']['closure']['canonicalCount'] != len(item['records']); semantic_rejections += 1
print(f'PASS: {valid_count} valid examples, {len(invalid)} schema rejections, '
      f'{semantic_rejections} required semantic rejection examples')
```

The assertions demonstrate why schema validity is insufficient. They do not replace the required cross-page collector/reviewer logic, evidence resolution or actual source/runtime checks. F10 acceptance certifies this format and its examples only.

> End of autonomously AI-generated inventory contract.
