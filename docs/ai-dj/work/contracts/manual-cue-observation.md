# Native CUE observation contract

> Autonomously AI-generated contract. This specifies required implementation and
> native checks; it does not claim telemetry is implemented.

## Problem and source evidence

M13's native marker-placement test changed the visible cue marker while existing
`cue_preview` feedback remained false. Raw MIDI preview itself passed on both
decks, including held playback and release. Preserve both findings.

The [Mixxx 2.5.6 cue implementation](https://github.com/mixxxdj/mixxx/blob/2.5.6/src/engine/controls/cuecontrol.cpp)
connects distinct controls to their handlers. `cue_default` selects a handler
according to `cue_mode`. In the CDJ handler, the current playback/position context
determines whether a press stops/seeks, previews, or sets the cue. `cue_point`
holds an engine position; `cue_indicator` is separately maintained. The
read-only `play_latched` control distinguishes latched playback in the control
logic. These are useful observations, not a universal actor or gesture identity.
The installed LateNight skin uses `cue_default` for left-click CUE and
`cue_gotoandstop` for right-click, displaying `cue_indicator`.

Repository graph coverage is partial and predates the new application files.
Source inspection used the upstream 2.5.6 file and installed skin, rather than
assuming the current checkout equals the installed release.
The retrieved source file SHA-256 is
`12a07523741a4f653271c7c3bbcef2022c82803ad5391144c32ab826257f942f`.

## Required observations

For each of the two initial deck instances, subscribe to this fixed allowlist:

| Key | Recorded meaning | Prohibited inference |
| --- | --- | --- |
| `cue_default` | Host control value/edge | A human necessarily sent it |
| `cue_gotoandstop` | Host control value/edge | Every seek came from this button |
| `cue_point` | Full finite host value in engine-position units | Seven-bit percentage or seconds without verified conversion |
| `cue_mode` | Raw host mode value | One hard-coded CUE behavior across modes |
| `cue_preview` | Existing preview command-control value | Every native cue gesture or actual preview state |
| `cue_indicator` | Native indicator output | Transport or cue ownership |
| `play` | Host playback value | Preview versus latched playback on its own |
| `play_latched` | Host latched-playback output | Which preview source or actor is responsible |

Connection failure and invalid values produce explicit unavailable/unknown
observations. A successful numeric zero is a value only after presence is known.
Keep negative cue positions and sentinel values raw until versioned unit/sentinel
validation is complete; never clamp, round to MIDI CC precision or manufacture
seconds. No write path belongs in this observer.

## Record and transport boundaries

Each record carries schema version, observer generation, deck index, fixed key,
per-generation sequence, host-local observation timestamp with named clock domain,
trigger (`initial`, `callback`, `refresh`, `unavailable`) and presence/value.
Do not claim atomic multi-control state from sequential reads. Callback payloads
must be validated and preserved for transient input-control edges; a later
refresh must not replace an already captured edge with the current zero.

Use bounded records and a bounded output queue: at most 16 connections, 256
queued records and one refresh timer. Overflow records an explicit gap; it
cannot silently appear as complete history. Shutdown disconnects all subscriptions
and invalidates callbacks from the old generation. The sender has no setters,
automatic retries of control actions or MIDI feedback echo path.

The M13 diagnostic readout uses the R01/R05 extended MIDI framing with explicit
diagnostic opt-in. Serialize up to eight closed observations in a canonical batch envelope
(`schemaVersion:1`, `kind:"batch"`, `records`) through the existing diagnostic text opcode; do not invent a parallel SysEx prefix,
reassign conventional CCs or call this a negotiated authoritative state delta.
Each record remains at most 1024 characters; an envelope is capped at 8192.
The receiver validates the entire batch before publishing any observation or
advancing sequence context. The original single-record form remains readable for
older diagnostic captures. Native single-record-per-message traffic saturated
the output slots; batching retains the full 100 ms refresh and callback edges.
The receiving diagnostic adapter validates each closed record and labels its
source unverified. Exact numeric JSON round trips preserve cue-position values.
Host clock values remain host-local; compare receipt intervals only within the
same measured clock. Existing cue press/release bytes retain their meaning.

R07's production snapshot/delta implementation must carry these observations
with its actual host/deck/track identity, revision and freshness rules before
production AI authority consumes them. The diagnostic path cannot arm the AI or
substitute for that integration. Session presentation must retain raw observations
and distinguish an observed cue-position change from a claimed user intention.

## Required child work and acceptance

`M13-CUE-OBSERVER` implements the fixed host observer and synthetic lifecycle,
edge and overflow tests. `M13-CUE-TRANSPORT` integrates the observer through the
R05 endpoint, a closed receiver and the assembled mapping with native lifecycle
compatibility checks. `M13-CUE-NATIVE` verifies manual marker movement, default
CUE press/release and right-click behavior against independent native UI and
received records on the installed profile. It checks no automatic write-back.

The native test must also preserve the already proven raw MIDI preview behavior
and explicitly document mode-specific limits. No child passes by merely observing
the play flag, logging locally inside Mixxx, or writing expected records in the
communicator. Required implementation and native evidence gate M13 acceptance.

> End of autonomously AI-generated contract.
