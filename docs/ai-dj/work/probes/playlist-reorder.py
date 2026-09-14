# Autonomously AI-generated source-query probe at the user's request.
"""Run only against in-memory SQLite; never opens a Mixxx library."""
import hashlib
import itertools
import json
import re
import sqlite3
import subprocess
from pathlib import Path

repo = Path(__file__).resolve().parents[4]
revision = '8ea8216ee6600fb1f5903322eb344704c419d4f6'
source_bytes = subprocess.check_output(
    ['git', 'show', revision + ':src/library/dao/playlistdao.cpp'], cwd=repo)
schema_bytes = subprocess.check_output(
    ['git', 'show', revision + ':res/schema.xml'], cwd=repo)
source = source_bytes.decode()
body = source.split('void PlaylistDAO::orderTracksByCurrPos(', 1)[1].split(
    '\nvoid PlaylistDAO::moveTrack(', 1)[0]
query = ''.join(re.findall(r'"([^"\n]*)"', body.split('query.prepare(', 1)[1].split('));', 1)[0]))
schema = schema_bytes.decode()
ddl = re.search(r'CREATE TABLE PlaylistTracks\s*\(.*?\);', schema, re.S).group()
indexes = re.findall(r'CREATE INDEX IF NOT EXISTS idx_PlaylistTracks_.*?;', schema, re.S)

def run(tracks, requested):
    db = sqlite3.connect(':memory:')
    db.executescript(ddl + '\n'.join(indexes))
    before = [(i, 1, track, i) for i, track in enumerate(tracks, 1)]
    db.executemany('INSERT INTO PlaylistTracks VALUES (?,?,?,?)', before)
    affected = []
    with db:
        for new_pos, row_id in enumerate(requested, 1):
            affected.append(db.execute(query, dict(new_pos=new_pos, old_pos=row_id,
                track_id=tracks[row_id - 1], pl_id=1)).rowcount)
    after = [dict(row_id=r[0], track_id=r[1], position=r[2]) for r in db.execute(
        'SELECT id, track_id, position FROM PlaylistTracks ORDER BY position,id')]
    expected = [dict(row_id=row_id, track_id=tracks[row_id - 1], position=position)
                for position, row_id in enumerate(requested, 1)]
    db.close()
    return dict(tracks=list(tracks), requested_row_ids=list(requested),
        affected_rows=affected, expected=expected, actual=after, matches=after == expected)

cases = [run(tracks, order) for tracks in [(101, 202, 303), (101, 202, 101), (101, 101, 101)]
         for order in itertools.permutations((1, 2, 3))]
print(json.dumps(dict(
    disclosure='Autonomously AI-generated query reproduction; not a native Mixxx test.',
    source_sha256=hashlib.sha256(source_bytes).hexdigest(),
    schema_sha256=hashlib.sha256(schema_bytes).hexdigest(),
    sqlite_version=sqlite3.sqlite_version, query=query, schema=ddl, indexes=indexes,
    case_count=len(cases), mismatches=sum(not c['matches'] for c in cases), cases=cases,
    disclosure_end='End of autonomously AI-generated probe output.'), indent=2))
# End of autonomously AI-generated source-query probe.
