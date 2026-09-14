# Desktop screen and local service contract v1

> Autonomously AI-generated U01 design at the user's request. This specifies implementation work; it is not a running UI or an implemented HTTP API.

## Delivery and ownership

Use browser-native HTML, CSS and TypeScript ES modules, compiled with the existing TypeScript toolchain. No UI framework or Electron wrapper is required. Start with small view modules, semantic HTML controls and explicit state reducers; use Canvas only for dense timeline drawing, with equivalent accessible lists and details. This minimizes new dependencies while preserving the requested desktop launcher plus persistent Node service. A framework migration needs evidence of a concrete limitation, not a prerequisite for U02.

The launcher starts a loopback-only service that serves the UI and authenticates its clients. Mixxx plays audio; the communicator owns performance admission and MIDI. Planner, recorder and analysis run outside that critical path. The browser never receives a MIDI output handle or calls a planner to disarm. Closing the browser leaves the persistent service running; show that fact in setup and provide a distinct service-shutdown action that first disarms and finishes bounded cleanup. UI disconnect alone is not host-feedback loss.

Normative inputs: [modes](modes.md), [sets](sets.md), [session](session.md), [session UI requirements](../../SESSION-UI.md), [defaults](../../DEFAULTS.md). Their identities, generations, outcomes and limits are reused without renamed parallel domain models. This contract defines transport envelopes and screens; concrete runtime validators and handlers belong to U02 and service owners. Never wire a screen to an unimplemented handler and label it connected.

## Screens and persistent controls

| View | Required content and actions | Boundary |
| --- | --- | --- |
| Setup | Mixxx connection/build, negotiated capabilities, selected MIDI endpoints and mapping versions, physical controller identity, pickup support, local library access and diagnostics | Display observed support or unverified; physical controller connects directly to Mixxx |
| Playlist / set | Native playlist picker; M3U8 fallback; source snapshot/revision; distinct occurrence rows; AI arrange; manual move, skip, add and opener/next/closer pins; save policy and refresh | Missing/unresolved rows remain visible; preserve original playlist; no implicit deck load |
| Plan review | Proposed order, duplicate soft flags, entry/exit/cue provenance, duration or range, tempo limits, style, energy presets/custom curve, lyric emphasis, preparation status and conflicts | AI-selected or user-defined choices; unsupported capability and infeasibility are explicit; mutations invalidate affected future plans |
| Live booth | Observed deck/track lanes, playhead/source position, planned sections and actual overlaps; AI reasons, action stages, ownership bands, recording health and remaining set | Distinguish proposal, queued, sent, accepted, observed, rejected and unknown; do not draw a proposal as actual movement |
| Session history | Local session list, import/export, seek/play visualization, speed, zoom, actor/device/deck/control/stage/result/time filters, inspector, gaps, track spans, notes/ratings | No performance commands or rearm; works without Mixxx; historical audio playback is a separate optional local player |
| Settings | Musical defaults/overrides, controller/pickup, capture/audio opt-in, retention, waveform assets, local preference evidence/edit/reset/disable, export privacy | Existing user cues preserved; explicit Save cues is distinct from triggering a cue |

A persistent header shows selected mode, observed armed/disarmed/reconciling state, connection freshness, current live session and **Disarm AI**. Disarm remains reachable from filters, dialogs and live history inspection. The UI must not imply Disarm stops Mixxx audio: it closes AI performance admission and invokes only verified release cleanup. When a read-only standalone history window exists, it shows that it has no live control connection; it does not impersonate the live header.

Labels supplement color. All controls have accessible names and keyboard focus; use text status and a keyboard-navigable event list beside the timeline. Reduced motion disables automatic scrolling. Titles, notes and imported metadata render as text, never HTML. No decorative waveform is presented as measured audio; unavailable waveform assets use duration/position lanes.

## HTTP surface and session access

Proposed namespace: `/api/v1`. Bind only the configured loopback address; use the actual launch port, not a hard-coded production port. Serve UI and API from that exact origin. Validate Host on all requests, Origin on browser mutations and WebSocket upgrade, and reject wildcard/null/unexpected origins. Do not enable permissive CORS. Bind IPv6 loopback only when separately configured and verified.

Launcher supplies a high-entropy, single-use bootstrap credential through a URL fragment. The UI immediately removes it from the visible URL and exchanges it in a POST body at `/bootstrap`; credentials never enter query strings, logs or saved sessions. Exact-origin/Host checks also apply to bootstrap. On success use a short-lived session credential retained in memory and an HttpOnly SameSite=Strict session cookie; require a per-session request token in mutation headers. Closing/reloading the page obtains a fresh launcher-authorized session rather than restoring control credentials from history or localStorage. Revoke all client sessions on service restart. Local service access is not performance authority.

| Route | Request / response contract |
| --- | --- |
| `POST /bootstrap` | One-use launch credential → UI session, service instance, request token and expiry; no arm |
| `GET /state` | Atomic UI snapshot: service instance, publication sequence, current mode/latch, freshness, host/session references, set/plan revisions, capture state, negotiated capabilities |
| `POST /commands` | Closed command union and request envelope → receipt only; outcome arrives separately |
| `POST /disarm` | Current authenticated client plus request ID; no expected state revision required → latched communicator result or explicitly unconfirmed outcome |
| `POST /subscriptions` | Authenticated request → one-use short-lived event-upgrade ticket |
| `WS /events` | Exact-origin upgrade with session cookie; authenticate first frame with ticket before data is sent; snapshot then ordered publications |
| `GET /sessions`, `GET /sessions/:id/events` | Opaque cursor pages, filters and bounded time window; maximum 1,000 events per page; reported total scope and completeness |
| `GET /sessions/:id/snapshot` | Compatible preceding visualization snapshot with sequence/clock context and gap flags |
| `POST /imports`, `GET /exports/:id` | Bounded streaming session import/export jobs, progress/status and explicit format errors; never deserialize into executable commands |

Native file selection uses opaque, scope-limited local asset references supplied by the launcher. A browser-supplied arbitrary filesystem path is not a file-access grant. Large music/session uploads use bounded streaming/job paths rather than embedding bytes in `/commands`. Import admission validates schema, bounds, references, profiles and paths before history is available. No imported script or decoder code runs.

## Commands, receipts and conflicts

A normal request carries `schemaVersion: 1`, `requestId`, `serviceInstanceId`, `kind`, the current domain-specific expected revisions/generations and a bounded payload. The service assigns human provenance from its authenticated UI boundary; the client cannot mint AI/host observation identities or authority grants. Set requests reuse occurrence identity, expected set/plan/history/protection versions and explicit admission/skip intent. Mode and rearm requests reuse R15 versions and the currently observed latch identity. Musical edits are validated on the service, not merely in controls.

Allowed command families: import/select source, refresh source, arrange/review/edit plan, save local/new-native playlist, change musical policy, select mode, request rearm/start, pin/release manual ownership, pause/resume capture, opt-in audio, notes/ratings/preferences, and supported explicit cue saving. Each handler independently enforces mode, current capabilities and operation guards. Playlist Only denies AI performance/load families even if a client sends them manually. An initial implementation may expose only implemented families and must report the others unavailable.

A receipt is `received`, `rejected`, or `duplicate` with request ID and service instance; receipt is never proof that a MIDI action occurred. Subsequent result carries the corresponding domain outcome and evidence links. UI displays pending/unknown until authoritative evidence arrives. Repeat delivery of an identical request returns its existing receipt/outcome; a conflicting payload using the same ID is rejected. After timeout or disconnect, query its outcome before attempting a new request; never automatically resend arm, load, save or cue mutations.

Use readable error codes: `invalid-request` (400), `unauthenticated` (401), `forbidden-mode-or-origin` (403), `revision-conflict` (409), `needs-resolution` (422), `capacity-exceeded` (413), `rate-limited` (429), `host-unavailable` (503). Include request ID, field-level issues where safe and retry/reconciliation guidance. A stale revision refreshes the preview and preserves the user's draft; it never silently overwrites newer edits.

Disarm uses a separate priority ingress and communicator cancellation path, bypassing planner, ordinary command backlog, recorder and UI-render queues. It requires valid local authentication but no stale UI version match. Display “Disarm requested” until confirmed. If service connectivity is lost, show “AI state unknown — disarm unconfirmed” and direct the operator to the Mixxx/launcher recovery controls; do not paint a false successful stop. R15's latch and release obligations remain authoritative.

## Event subscription, freshness and budgets

Every publication carries `serviceInstanceId`, subscription epoch, strictly increasing publication sequence, publication clock reference, event kind and typed payload. Publication sequence is transport order, distinct from recorder ingest and producer sequences. Initial snapshot is an atomic watermark; deltas apply only to that matching base. Reconnect sends the last acknowledged watermark; replay is allowed only from a retained contiguous window of the same service instance. Otherwise send `resync-required`, clear derived live authority and obtain a fresh snapshot. Ignore identical duplicates; conflicting duplicates, gaps or backwards sequences require resynchronization.

Keep live state subscriptions and historical event paging separate. History rendering can lag or be paused without mutating performance. Every capture gap stays in the timeline even when filtered events are hidden. Resume from capture pause requires the recorder's fresh snapshot and explicit gap; it cannot imply uninterrupted capture. Proposed UI budgets are 1 MiB maximum publication, 4 MiB/2,000 pending publications per client (whichever first), and 1,000 events per history page. Disconnect slow subscribers with explicit resync status rather than block the communicator. Raw recording is not coalesced to satisfy UI limits; visual curves may be downsampled with their scope labeled.

Send a UI heartbeat at most one second apart; after three missed seconds mark the UI connection stale, freeze last-known values with age and disable authority-dependent actions. This is a display threshold, not permission to keep executing on stale host state: the communicator's stricter freshness/heartbeat rules govern output independently. Reconnect or a new service instance never rearms. Closing only the tab does not disarm a healthy persistent service. Service/host loss and restart do disarm through their own rules.

## Walkthrough acceptance matrix (design review)

| Scenario | Import → arrange → review | Start / perform | History and required evidence |
| --- | --- | --- | --- |
| AI Only, startup latch | Select native snapshot or unresolved M3U8 rows; AI orders every occurrence; resolve duration/preflight conflicts | Explicit current-latch rearm plus guarded start; ordinary manual bass may be overridden after fresh state; Disarm always wins | Record both user input and later AI action; history never replays either |
| B2B | Same set flow; show protected loaded/active rows and human pins | Explicit initial rearm; touched bass held throughout transition T; later transition AND released/inferred quiet ≥3s AND fresh state required; human new song respected and displaced occurrence retained | Ownership band, raw gesture, inferred/confirmed attribution and changed plan remain inspectable |
| Playlist Only | AI arranges and saves a local set or explicitly creates a new native playlist | No arm/load/mix control; operator mixes directly in Mixxx; AI organization continues | Manual performance and plan edits recorded; no AI performance output |
| Impossible requested time | Preserve all rows and meaningful sections; show exact conflicting constraints | Block automated start pending explicit resolution, including automatic-start preference | Record selected resolution and revised plan, never call omitted entries played |
| Mode change while armed | Preserve current set, holds and actual history | Follow R15 barrier; armed mixing-to-mixing may resume after fresh reconciliation with clear latch; Playlist Only closes output; mode selection cannot clear a latch | Show cancelled intent separately from already sent actions |
| Inspect past while live | Preserve live set | Scrubbing does not pause performance or recorder; persistent live Disarm still works; explicit return-to-live | Cursor labeled historical while header identifies live state; no history-to-command callback |
| Network gap/restart | Keep drafts and last-known display with stale age | Disable stale actions, reconcile outcome IDs; restart remains latched; no automatic resend or rearm | Show stream discontinuity; never join incompatible clock epochs silently |

These are contract walkthroughs, not executed browser tests. U02 must test origin/authentication, bounded subscription and snapshot recovery. U03–U07 implement the views; U08 proves live/history agreement and zero MIDI during all history interactions. U09–U12 cover settings and setup. R16/R18/R25 supply actual mode, handover and transport enforcement. L02 validates the access boundary; O07/O09/O10 supply recoverable recording, safe import/export and indexed queries. All runtime and musical gates remain open until their own evidence is accepted.

> End of autonomously AI-generated desktop contract.
