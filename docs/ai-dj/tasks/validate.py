# Autonomously AI-generated planning checks; these do not test a DJ runtime.
import collections
import hashlib
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

base = Path(__file__).resolve().parent
repo = base.parents[2]
docs = base.parent
catalog = json.loads((base / 'catalog.json').read_text())
tasks = {t['id']: t for t in catalog['tasks']}
assert len(tasks) == len(catalog['tasks'])
assert catalog['planning_only'] is True
seen, active = set(), set()
def visit(key):
    assert key in tasks, f'Missing dependency {key}'
    assert key not in active, f'Dependency cycle at {key}'
    if key in seen:
        return
    active.add(key)
    for dependency in tasks[key]['depends_on']:
        visit(dependency)
    active.remove(key)
    seen.add(key)
for key in tasks:
    visit(key)
for task in tasks.values():
    assert task['status'] == 'planned', task['id']
    assert sum(task['estimate_minutes'].values()) <= 25
    assert task['max_worker_minutes'] <= 30
    assert task['owns'] and task['perform'] and task['validate'] and task['conditions']
    assert task['level'] in catalog['levels']
    assert task['model'] == catalog['levels'][task['level']]['model']
    assert 'supervisor_deadline_registered' in task['dispatch_requires']
    assert task['evidence'].endswith('/'+task['id']+'.md')
    for path in task['owns']:
        assert not Path(path).is_absolute() and '..' not in Path(path).parts and '*' not in path

def ancestors(key):
    result=set(tasks[key]['depends_on'])
    for parent in tasks[key]['depends_on']:
        result |= ancestors(parent)
    return result
owners=collections.defaultdict(list)
for key,t in tasks.items():
    for path in t['owns']:
        owners[path].append(key)
for path, ids in owners.items():
    for i,a in enumerate(ids):
        for b in ids[i+1:]:
            assert a in ancestors(b) or b in ancestors(a), f'Unsequenced ownership {path}: {a}, {b}'
templates={t['id'] for t in catalog['templates']}
assert len(templates)==len(catalog['templates'])
for t in catalog['templates']:
    assert t['required_parameters'] and t['perform'] and t['validate']
    assert sum(t['estimate_minutes'].values())<=25 and t['max_worker_minutes']<=30
for m in catalog['required_dynamic_manifests']:
    assert m['owner'] in tasks and set(m['templates']) <= templates and m['close_condition']
assert all(f'I{n:02}' in tasks for n in range(1,24))
execution=json.loads((base/'execution.json').read_text())
assert execution['catalog_sha256']==hashlib.sha256((base/'catalog.json').read_bytes()).hexdigest(), 'Stale catalog digest'
assert execution['authorization']=='planning_only' and execution['dispatchable_now']==[]
assert execution['accepted_task_ids']==[] and set(execution['current_task_status'])==set(tasks)
assert all(s=='planned' for s in execution['current_task_status'].values())
assert execution['dependency_frontier']==[k for k,t in tasks.items() if not t['depends_on']]
prior=set()
for batch in execution['batches']:
    ids=batch['task_ids'];assert 1<=len(ids)<=3 and batch['worker_slots']==len(ids)
    assert not prior.intersection(ids) and len(set(ids))==len(ids)
    locks=set();paths=set()
    for key in ids:
        assert key in tasks and set(tasks[key]['depends_on'])<=prior, f'Premature batch: {key}'
        assert not locks.intersection(tasks[key]['locks']), f'Conflicting resource in {batch["id"]}'
        assert not paths.intersection(tasks[key]['owns']), f'Conflicting files in {batch["id"]}'
        locks.update(tasks[key]['locks']);paths.update(tasks[key]['owns'])
    assert batch['exclusive_resources']==sorted(locks)
    prior.update(ids)
assert prior==set(tasks), 'Execution plan omits tasks'
for checkpoint in execution['checkpoints']:
    assert checkpoint['status']=='not_started' and set(checkpoint['requires'])<=set(tasks)
assert set(tasks)==ancestors('L12')|{'L12'}, 'Unreachable release task'
for key in ['M02']+[f'I{n:02}' for n in range(1,23)]:
    assert 'F11' in tasks[key]['depends_on'], f'Missing runtime fixture dependency: {key}'
discovery=json.loads((docs/'DISCOVERY.json').read_text())
questions=[q for r in discovery['rounds'] for q in r['questions']]
assert len(questions)==60 and len({q['id'] for q in questions})==60
assert all(len(r['questions'])==20 for r in discovery['rounds'])
assert all(q['status']=='answered' and q['answer'] is not None for q in questions)
assert sum(q.get('answer_source')=='assistant_delegated' for q in questions)==32
trace=json.loads((base/'traceability.json').read_text())['requirements']
assert len({r['requirement'] for r in trace})==len(trace)
assert {q['id'] for q in questions} <= {r['requirement'] for r in trace}
for r in trace:
    assert r['task_ids'] and set(r['task_ids']) <= set(tasks)
    assert set(r['validation_ids']) == {tasks[i]['evidence'] for i in r['task_ids']}
fixture=json.loads((docs/'examples/session.example.json').read_text())
assert fixture['session']['synthetic'] is True
assert fixture['session']['audio_embedded'] is False
events=fixture['events']; ids={e['id'] for e in events}
assert len(ids)==len(events)
assert [e['session_ms'] for e in events] == sorted(e['session_ms'] for e in events)
streams=collections.defaultdict(list)
for e in events:
    streams[(e['stream_id'],e['stream_epoch'])].append(e['sequence'])
    assert 0<=e['session_ms']<=fixture['session']['duration_ms']
for seq in streams.values():
    assert seq==sorted(set(seq)), 'Duplicate/out-of-order stream sequence'
# Validate every explicit event reference, including references embedded in snapshots/derived fields.
def references(value,key=''):
    if isinstance(value,dict):
        for k,v in value.items():references(v,k)
    elif isinstance(value,list):
        for v in value:references(v,key)
    elif isinstance(value,str) and re.fullmatch(r'e\d{3}',value):
        assert value in ids, f'Dangling event reference {key}={value}'
references(fixture)
class Links(HTMLParser):
    def __init__(self):
        super().__init__();self.links=[];self.ids=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'href' in a:self.links.append(a['href'])
        if 'id' in a:self.ids.append(a['id'])
html=Links();html.feed((docs/'direction.html').read_text());assert len(html.ids)==len(set(html.ids))
checked=0
files=list(docs.rglob('*.md'))+[repo/'GOALS.md',repo/'TASKS.md']
for file in files:
    content=file.read_text()
    assert 'AI-generated' in content[:700] or 'generated by an AI' in content[:700], f'Missing disclosure: {file}'
    assert 'End of autonomously AI-generated' in content[-350:], f'Missing closing disclosure: {file}'
    assert content.count('```')%2==0, f'Unbalanced fences: {file}'
    without_code=re.sub(r'```.*?```','',content,flags=re.S)
    links=re.findall(r'\[[^\]]*\]\(([^\s)]+)\)',without_code)
    for href in links:
        part=urlsplit(href.strip('<>'))
        if part.scheme or part.netloc or not part.path:continue
        target=(file.parent/unquote(part.path)).resolve()
        assert target.exists(), f'Broken local link: {file}: {href}'
        checked+=1
for href in html.links:
    part=urlsplit(href)
    if not part.scheme and not part.netloc and part.path:
        assert (docs/unquote(part.path)).resolve().exists(), f'Broken HTML link: {href}'
        checked+=1
print(f'PASS: {len(tasks)} cards, {len(templates)} templates, DAG and ownership sequencing, 60 decisions, {len(trace)} trace rows, {len(events)} synthetic events and {checked} local file links.')
print(f"PASS: {len(execution['batches'])} reference batches, resource/dependency checks, 7 checkpoints and full release reachability; no runtime work dispatched.")
print('Limits: semantic/musical/runtime correctness still needs the future evidence gates; templates are not yet materialized.')
# End of autonomously AI-generated planning checks.
