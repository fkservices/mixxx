# Autonomously AI-generated planning-artifact renderer; no DJ runtime implementation.
import argparse
import json
from pathlib import Path

base = Path(__file__).resolve().parent
check = argparse.ArgumentParser()
check.add_argument('--check', action='store_true')
args = check.parse_args()
data = json.loads((base / 'catalog.json').read_text())
outputs = {}
index = ['# Bounded implementation cards', '', '> Autonomously AI-generated planning cards. All tasks are planned, not performed.', '', '[Dispatch and time limits](../WORKER-TASKS.md) apply to every card. Canonical source: [catalog.json](catalog.json).', '', '| Stage | Cards |', '| --- | --- |']
for stage in sorted({t['stage'] for t in data['tasks']}):
    tasks = [t for t in data['tasks'] if t['stage'] == stage]
    index.append(f'| [{stage}]({stage}.md) | {len(tasks)} |')
    lines = [f'# {stage}', '', '> Autonomously AI-generated planning cards. No implementation claimed.', '', '[Worker rules](../WORKER-TASKS.md) · [Catalog](README.md)', '']
    for t in tasks:
        lines += [f"## {t['id']}: {t['title']}", '', f"**Worker:** {t['level']} / `{t['model']}` / {t['reasoning_effort']}. **Budget:** 25 minutes; maximum 30 including handoff.", '', f"**Dependencies:** {', '.join(t['depends_on']) or 'None'}. **Leases:** {', '.join(t['locks']) or 'Exact path reservation'}. **Status:** planned.", '', f"**Owns:** {', '.join('`'+p+'`' for p in t['owns'])}", '', '**Scope:** '+t['scope'], '', '**Prerequisites:** '+t['conditions'], '', '**Perform:**', '']
        lines += [f'{i}. {v}' for i,v in enumerate(t['perform'],1)]
        lines += ['', '**Validate:**', ''] + [f'{i}. {v}' for i,v in enumerate(t['validate'],1)]
        lines += ['', f"**Evidence:** `{t['evidence']}`. {t['split_rule']}", '', '**Completion:** '+t['dynamic_completion'], '']
    lines += ['> End of autonomously AI-generated planning cards.', '']
    outputs[base / f'{stage}.md'] = '\n'.join(lines)
index += ['', '[Expansion templates](templates.md) materialize additional bounded work; their eventual count is unknown.', '', '> End of autonomously AI-generated planning cards.', '']
outputs[base/'README.md']='\n'.join(index)
lines=['# Expansion templates','','> Autonomously AI-generated templates. Bind every parameter before dispatch.','','[Dispatch rules](../WORKER-TASKS.md) require concrete child IDs, exact ownership, dependencies, evidence and deadline monitoring. Templates do not constitute completed work.','']
for t in data['templates']:
    l=data['levels'][t['level']]
    lines += [f"## {t['id']}: {t['title']}",'',f"**Worker:** {t['level']} / `{l['model']}` / {l['reasoning_effort']}. **Budget:** 25 minutes, maximum 30.",'','**Scope:** '+t['scope'],'','**Bind:** '+', '.join(t['required_parameters']), '', '**Perform:**', '']+[f'{i}. {v}' for i,v in enumerate(t['perform'],1)]+['','**Validate:**','']+[f'{i}. {v}' for i,v in enumerate(t['validate'],1)]+['']
lines+=['> End of autonomously AI-generated templates.',''];outputs[base/'templates.md']='\n'.join(lines)
for path,value in outputs.items():
    if args.check:
        assert path.exists() and path.read_text()==value, f'Stale generated file: {path}'
    else:
        path.write_text(value)
print(('Checked' if args.check else 'Rendered'),len(outputs),'planning files')
# End of autonomously AI-generated planning-artifact renderer.
