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
assert isinstance(catalog['planning_only'],bool)
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
ledger_path=docs/'work/state.json'
ledger=json.loads(ledger_path.read_text()) if ledger_path.exists() else {'phase':'planning','tasks':{}}
assert set(ledger['tasks'])<=set(tasks)
valid_states={'planned','eligible','running','waiting_for_job','waiting_for_evidence','in_review','accepted','split'}
assert all(row['status'] in valid_states for row in ledger['tasks'].values())
accepted={k for k,row in ledger['tasks'].items() if row['status']=='accepted'}
assert set(execution['accepted_task_ids'])==accepted
assert execution['current_task_status']=={key:ledger['tasks'].get(key,{}).get('status','planned') for key in tasks}
assert execution['authorization']==('implementation_authorized' if ledger['phase']=='implementation' else 'planning_only')
expansion_path=docs/'work/expansions.json'
children=json.loads(expansion_path.read_text())['tasks'] if expansion_path.exists() else []
child_by={t['id']:t for t in children}
assert len(child_by)==len(children) and not set(child_by).intersection(tasks)
child_accepted={t['id'] for t in children if t['status']=='accepted'}
gates={key:{t['id'] for t in children if key in t['blocks']} for key in tasks}
combined={key:set(t['depends_on'])|gates[key] for key,t in tasks.items()}
combined.update({t['id']:set(t['depends_on']) for t in children})
closed=set();visiting=set()
def visit_expanded(key):
    assert key in combined and key not in visiting, f'Invalid expanded DAG: {key}'
    if key in closed:return
    visiting.add(key)
    for dep in combined[key]:visit_expanded(dep)
    visiting.remove(key);closed.add(key)
for key in combined:visit_expanded(key)
for t in children:
    assert t['parent'] in tasks and t['blocks'] and set(t['blocks'])<=set(tasks)
    assert t['status'] in valid_states and sum(t['estimate_minutes'].values())<=25 and t['max_worker_minutes']<=30
    assert t['owns'] and t['perform'] and t['validate'] and t['model']==catalog['levels'][t['level']]['model']
    if t['status']=='accepted':
        assert combined[t['id']]<=accepted|child_accepted
        assert t.get('checks') and t.get('accepted_at') and t.get('source_revision')
        assert hashlib.sha256((repo/t['evidence']).read_bytes()).hexdigest()==t['evidence_sha256']
assert execution['dynamic_task_status']=={t['id']:t['status'] for t in children}
assert execution['dynamic_dependency_frontier']==[t['id'] for t in children if t['status'] in ('planned','eligible') and set(t['depends_on'])<=accepted|child_accepted]
expected=[key for key,t in tasks.items() if execution['current_task_status'][key] in ('planned','eligible') and set(t['depends_on'])<=accepted and gates[key]<=child_accepted]
assert execution['dependency_frontier']==expected
assert set(execution['dispatchable_now'])<=set(expected)
for key,row in ledger['tasks'].items():
    if row['status']=='accepted':
        assert set(tasks[key]['depends_on'])<=accepted, f'Accepted before dependencies: {key}'
        assert gates[key]<=child_accepted, f'Accepted before required children: {key}'
        assert row.get('evidence')==tasks[key]['evidence']
        ep=repo/row['evidence'];assert ep.is_file(), f'Missing acceptance evidence: {key}'
        assert hashlib.sha256(ep.read_bytes()).hexdigest()==row['evidence_sha256'], f'Changed accepted evidence: {key}'
        assert row.get('checks') and row.get('accepted_at') and row.get('source_revision')

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
    assert checkpoint['status'] in ('not_started','in_progress','accepted') and set(checkpoint['requires'])<=set(tasks)
    if checkpoint['status']=='accepted':assert set(checkpoint['requires'])<=accepted
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
print(f"PASS: {len(execution['batches'])} reference batches, resource/dependency checks, 7 checkpoints and full release reachability; {len(accepted)} accepted tasks.")
print(f'Expanded DAG: {len(children)} materialized children, {len(child_accepted)} accepted. Runtime and musical evidence gates remain required.')
# End of autonomously AI-generated planning checks.
