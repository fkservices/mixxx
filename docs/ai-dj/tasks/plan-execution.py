# Autonomously AI-generated task-plan compiler. It never dispatches workers or runs a DJ.
import argparse
import hashlib
import json
from pathlib import Path

base=Path(__file__).resolve().parent
parser=argparse.ArgumentParser()
parser.add_argument('--check',action='store_true')
args=parser.parse_args()
raw=(base/'catalog.json').read_bytes()
catalog=json.loads(raw)
ordered=catalog['tasks']
by={t['id']:t for t in ordered}
ledger_path=base.parent/'work/state.json'
ledger=json.loads(ledger_path.read_text()) if ledger_path.exists() else {'phase':'planning','tasks':{}}
current={key:ledger['tasks'].get(key,{}).get('status','planned') for key in by}
accepted_ids=[key for key,status in current.items() if status=='accepted']
expansion_path=base.parent/'work/expansions.json'
children=json.loads(expansion_path.read_text())['tasks'] if expansion_path.exists() else []
child_accepted={t['id'] for t in children if t['status']=='accepted'}
gates={key:{t['id'] for t in children if key in t['blocks']} for key in by}
frontier=[key for key,t in by.items() if current[key] in ('planned','eligible') and set(t['depends_on'])<=set(accepted_ids) and gates[key]<=child_accepted]
# Deterministic reference batches. Acceptance/jobs/evidence must be checked again at actual dispatch.
accepted=set();remaining=[t['id'] for t in ordered];batches=[]
while remaining:
    batch=[];locks=set();paths=set()
    for key in remaining:
        t=by[key]
        if not set(t['depends_on'])<=accepted:
            continue
        if locks.intersection(t['locks']) or paths.intersection(t['owns']):
            continue
        batch.append(key);locks.update(t['locks']);paths.update(t['owns'])
        if len(batch)==3:
            break
    assert batch, 'Unresolvable dependency graph'
    batches.append({'id':f'B{len(batches)+1:03}','task_ids':batch,'worker_slots':len(batch),'exclusive_resources':sorted(locks),'status':'reference_only'})
    accepted.update(batch)
    remaining=[key for key in remaining if key not in accepted]
checkpoints=[
    ('G0','Baseline and working contracts',['F01','F02','F03','F07','F09','F10','F12'],'Named profile, package checks and typed contracts; no MIDI success claim.'),
    ('G1','First real MIDI proof',['M20'],'Five controls, observed feedback, timing review and initial all-family inventory.'),
    ('G2','Reliable shared control',['R24','R26'],'Real-controller B2B, AI Only, Playlist Only, mode changes and deterministic disarm.'),
    ('G3','Native playlist and deterministic set',['P18','D07'],'Ordered native occurrences, stable loads, saves, accounting and reviewed transitions.'),
    ('G4','AI set with live and historical UI',['A14','U08','U09','U10','U11','U12'],'Constrained AI, requested settings, session capture and human-reviewed musical choices.'),
    ('G5','Full Mixxx feature evidence',['C02'],'All 22 families, every required canonical capability and four independent evidence dimensions.'),
    ('G6','Desktop release candidate',['L12'],'Clean setup, whole-set/soak/endurance, completed dynamic work and human listening acceptance.')]
plan={
 'disclosure':'Autonomously AI-generated reference execution plan. Actual states derive from the acceptance ledger; batch membership is not runtime evidence.',
 'schema_version':1,'catalog_sha256':hashlib.sha256(raw).hexdigest(),
 'authorization':'implementation_authorized' if ledger['phase']=='implementation' else 'planning_only','current_task_status':current,
 'accepted_task_ids':accepted_ids,'dependency_frontier':frontier,'dispatchable_now':[key for key in frontier if ledger['tasks'].get(key,{}).get('dispatch_ready',False)],
 'dynamic_task_status':{t['id']:t['status'] for t in children},
 'dynamic_dependency_frontier':[t['id'] for t in children if t['status'] in ('planned','eligible') and set(t['depends_on'])<=set(accepted_ids)|child_accepted],
 'global_requirements':['User instruction to start implementation','Current integrated revision and scoped context','Independent worker deadline monitor','Reserved exact paths/resources','Available model and required evidence'],
 'maximum_workers':3,'coordinator_slots':1,
 'batches':batches,
 'checkpoints':[dict(id=i,title=t,requires=ids,acceptance=a,status=('accepted' if set(ids)<=set(accepted_ids) else 'in_progress' if any(current[k]!='planned' for k in ids) else 'not_started')) for i,t,ids,a in checkpoints],
 'caveats':['Reference batches are logical order, not calendar promises.','An item in a batch is not runnable until dependencies and evidence are actually accepted.','Long jobs retain resource leases across worker handoffs. Recompute readiness after every result.','Three workers is a ceiling, not a target. Never fill a slot with blocked or conflicting work.','Templates/continuations/defects add cards and force regeneration.'],
 'generation_end':'End of autonomously AI-generated reference execution plan.'}
outputs={base/'execution.json':json.dumps(plan,ensure_ascii=False,indent=2)+'\n'}
lines=['# Reference execution batches','','> Autonomously AI-generated task planning. Actual worker states are tracked in the live ledger.','','[Start here](../../../TASKS.md) · [Execution rules](../EXECUTION-PLAN.md) · [Worker cards](README.md)','','[Live acceptance ledger](../work/state.json) records actual progress.', '', 'These batches are validated against dependencies, exact owned paths and exclusive resources for the current 171-card catalog. They assume prior batches eventually pass all evidence gates. They are not a timed schedule and do not bypass dynamic children, long jobs or human listening. Regenerate after catalog changes; recompute actual readiness after every handoff.','','| Batch | Proposed parallel cards | Exclusive resources |','| --- | --- | --- |']
for batch in batches:
    links=[f"[{key}]({by[key]['stage']}.md)" for key in batch['task_ids']]
    lines.append(f"| {batch['id']} | {', '.join(links)} | {', '.join(batch['exclusive_resources']) or 'Exact path reservations only'} |")
lines+=['','> End of autonomously AI-generated task planning.','']
outputs[base/'batches.md']='\n'.join(lines)
for path,value in outputs.items():
    if args.check:
        assert path.exists() and path.read_text()==value, f'Stale execution artifact: {path}'
    else:
        path.write_text(value)
print(('Checked' if args.check else 'Rendered'),len(batches),'reference batches;',len(accepted_ids),'accepted;',sum(v=='running' for v in current.values()),'running.')
# End of autonomously AI-generated task-plan compiler.
