# Autonomously AI-generated progress renderer at the user's request.
import argparse
import hashlib
import json
from pathlib import Path

base = Path(__file__).resolve().parent
docs = base.parent
repo = base.parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
catalog = json.loads((base/'catalog.json').read_text())
ledger = json.loads((docs/'work/state.json').read_text())
expansions = json.loads((docs/'work/expansions.json').read_text())['tasks']
execution = json.loads((base/'execution.json').read_text())

def entry(task, state, dynamic=False):
    evidence = state.get('evidence', task['evidence'])
    verified = (state.get('status') == 'accepted' and (repo/evidence).is_file()
                and hashlib.sha256((repo/evidence).read_bytes()).hexdigest() == state.get('evidence_sha256'))
    return dict(id=task['id'], title=task['title'], stage=task.get('stage', 'setup'),
                status=state.get('status', 'planned'), model=task['model'],
                evidence=evidence.removeprefix('docs/ai-dj/') if verified else None,
                verified=verified, checks=state.get('checks', []),
                updated=state.get('updated_at', state.get('accepted_at', state.get('started_at'))),
                dynamic=dynamic)

rows = [entry(t, ledger['tasks'].get(t['id'], {})) for t in catalog['tasks']]
children = [entry(t, t, True) for t in expansions]
accepted = {t['id'] for t in rows if t['verified']}
milestones = [dict(id=c['id'], title=c['title'], requires=c['requires'],
                   accepted=all(k in accepted for k in c['requires'])) for c in execution['checkpoints']]
gallery_path = docs/'work/screenshots.json'
gallery = json.loads(gallery_path.read_text())['items'] if gallery_path.exists() else []
for item in gallery:
    assert item['kind'] in ('native_ui', 'app_ui', 'mockup', 'progress_page')
    path = Path(item['path'])
    assert not path.is_absolute() and '..' not in path.parts and (docs/path).is_file()
    assert item.get('caption') and item.get('captured_at') and item.get('evidence')
transport_path = docs/'work/runs/R05-REPLY-LIFECYCLE.json'
transport_checks = json.loads(transport_path.read_text())['scenarios'] if transport_path.exists() else []
transport_summary = [dict(scenario=s['scenario'], status=s['status'],
                          frames=s['partialReplyFrames'],
                          fresh_reply=bool(s['receivedSequences']),
                          stopped=s['noFramesAfterStop']) for s in transport_checks]
updated = max((t['updated'] for t in rows+children if t['updated']), default=None)
payload = dict(schema_version=1, goal=ledger['authorization'], goal_status=ledger['goal_status'],
               updated_at=updated, tasks=rows, children=children, milestones=milestones,
               controller=ledger['external_requirements']['physical_controller'],
               music=ledger['external_requirements']['musical_fixtures'], screenshots=gallery, transport_checks=transport_summary)
timings = []
for task_id, label in [('M15', 'Idle'), ('M16', 'CPU load')]:
    path = docs/f'work/runs/{task_id}.json'
    if path.exists():
        summary = json.loads(path.read_text()).get('visual_summary')
        if summary:
            timings.append(dict(label=label, **summary))
payload['timing'] = dict(status=' '.join(t['label'] + ': ' + t['status'] for t in timings),
    rows=[dict(r, label=t['label'] + ' · ' + r['label']) for t in timings for r in t['rows']]) if timings else None
ui_path = docs/'work/runs/M17.json'
ui_run = json.loads(ui_path.read_text()) if ui_path.exists() else None
payload['ui_timing'] = dict(observed=ui_run['measurement']['observed'], bounded=ui_run['measurement']['boundedWithin150Ms'], rows=[dict(trial=r['trial'], target=r['target'], upper=r['visibleDelayUpperMs'], within=r['upperWithin150Ms'], screenshot=r['publicScreenshot']) for r in ui_run['measurement']['results']]) if ui_run else None
data = json.dumps(payload, ensure_ascii=False, indent=2)
template = (docs/'progress.template.html').read_text()
html = template.replace('__PROGRESS_DATA__', data.replace('<', '\\u003c'))
for path, value in [(docs/'work/progress.json', data+'\n'), (docs/'progress.html', html)]:
    if args.check:
        assert path.exists() and path.read_text() == value, f'Stale progress artifact: {path}'
    else:
        path.write_text(value)
print(('Checked' if args.check else 'Rendered'), 'visual progress:', len(accepted), 'accepted static cards;', len(gallery), 'screenshots')
# End of autonomously AI-generated progress renderer.
