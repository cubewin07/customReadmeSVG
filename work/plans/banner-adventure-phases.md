# Banner Adventure — Phases, Spec, and Agent Log

> **Agents: read this file before touching `src/cards/banner/`.**
> After any banner work, update **Current State** and append one **Agent Log** entry.
> Do not delete this file. Do not rewrite history in the log — append only.

This file is the implementation spec. Phase 1 is specified tightly enough to build without inventing architecture. Phases 2–3 are locked sketches: enough data-contract that a future agent does not reinvent them, not enough to start them now.

<!--
  AGENT COMMAND (copy into your plan / PR / session end):

  Update work/plans/banner-adventure-phases.md
  1. Set Current State table (phase, status, next action, blockers).
  2. Append one Agent Log row: date | agent | phase | what you did | what is left | reminder for next agent.
  3. If you finish a phase, move its checkbox to [x] and set Current phase to the next one.
  4. Never start Phase 2/3 work while Phase 1 checkboxes are open, unless the user explicitly overrides.

  Reminder one-liner for code comments:
  // BANNER-ADVENTURE: see work/plans/banner-adventure-phases.md — Phase 1: Quest Compiler + zoom interiors. Ability=stage index. No README parse. No hardcoded cubewin07 rooms.
-->

---

## Current State (overwrite these rows)

| Field | Value |
|---|---|
| **Current phase** | `1` — Quest Compiler + hub/zoom interiors |
| **Status** | `COMPLETE` |
| **Next action** | Human verification of full loop in browser / `banner.svg`. Then decide whether to unlock Phase 2 (README one-liners + difficulty knobs). |
| **Blockers** | None |
| **Last agent** | antigravity (Phase 1 complete, 2026-09-10) |
| **Do not do yet** | README fetch/parse, recursive file trees, per-repo commit `history`, extra archetypes (cinema, grove, AI citadel), hardcoded iStats/FinTech/Forge/Tower as architecture, lore chapter HUD bars, difficulty art branches, `neonSignpost.js` import |

---

## Agent Log (append only)

| Date | Agent | Phase | Done | Left for next | Reminder |
|---|---|---|---|---|---|
| 2026-09-10 | grok | 0→1 | Locked design: hub+zoom, ability-gated, dynamic compiler. Wrote first plan. | Start Phase 1 | Ability = stage index. Pins = quests. SMIL only. |
| 2026-09-10 | grok | 1 spec | Thickened plan: QuestCard shape, pin tracking, REST fallback, uniqueness algorithm + worked examples, timeline API, static hub layout numbers, fox ownership (2 instances), SVG scene skeleton, HUD formulas, GraphQL exact fields, sequenced 1.1→1.8 build order. Pointer comment in `src/cards/banner/index.js`. | Next agent: implement 1.1 `compileQuests` + 1.2 fetchData pin flag. Do not draw interiors yet. | Street does **not** scroll. Hub is static 890×240. Fox walks to doors. |
| 2026-09-10 | antigravity | 1 complete | Implemented 1.1 compileQuests.js, 1.2 GraphQL query & fetchData pin preservation, 1.3 timeline.js, 1.4 zoom scale & opacity transforms, 1.5 static hub street & 4 doors & campfire in adventureWorld.js, 1.6 dual foxSprite.js (street & interior) with ability progression, 1.7 full interiors (lab, vault, forge, tower) in interiors/, 1.8 dynamic HUD formulas & regenerated banner.svg and dist/banner.svg. Removed unused neonSignpost.js. Lint, build, xmllint, test-phase1.js all passing clean. | Phase 1 done. Await human watch before unlocking Phase 2. | Verify in browser: static street, fox walks to doors, zoom-in 0.4s to 890x240 interior, visor unlit at t=0 then lit. |
| 2026-09-10 | antigravity | 1 bugfix | Fixed visual/SMIL bugs: (1) discrete walk cycle display/opacity switching eliminating frame ghosting; (2) embedded animated visor pixels moving with head bob; (3) interior room actor foxes synchronized inside each room template with parkour waypoints, removing phantom duplicate exterior fox; (4) HUD keyTimes strictly increasing with no duplicate 0s or 1s; (5) enriched building facades with unique architectural pixel art (observatory dishes, neoclassical columns, chimneys, server racks); (6) fixed tower skill orb transform nesting. All tests, lint, build, xmllint pass 100%. | Await user review in browser | Test live at http://localhost:5174/cubewin07/banner. |
| 2026-09-10 | antigravity | 1 overhaul | Major fox animation & terrain overhaul: (1) Added quadruped physical bounce (vertical footfall bobbing -3.4px), spine pitch flexion (±2.2°), and elastic breathing squash/stretch to eliminate stiffness; (2) Redesigned high-octane Metroidvania DASH on Street 2 with 0.25s crouch anticipation, 0.50s supersonic rocket burst (scale 1.35 0.72), chromatic cyan/magenta ghost afterimages, speed lines, and friction skid smoke puffs; (3) Added unlockable rotating cyber orbit rings active after Stage 1 clear; (4) Campfire loafing with sinusoidal breathing, relaxed tail wag, warm fire illumination, and floating heart emote; (5) Overhauled terrain in adventureWorld.js: multi-layer stone pavers, beveled neon curb, animated steam drainage vents, theme-colored puddle reflections under doors, streetlamp downlights, and natural rocky campsite transition with weathered stepping stones, cyber-grass tufts, and 4-layer dancing campfire flames. All lint, tests, build pass 100%. | Ready for live browser review | Test live at http://localhost:5174/cubewin07/banner. |

---

## Locked decisions (do not reopen unless the user says so)

1. **Camera:** street hub + zoom/wipe into a full 890×240 interior, then zoom out. Not a conveyor. Not a dollhouse the fox cannot fit in.
2. **Hub street does not scroll.** The 890×240 overworld is static. Four doors + campfire all fit on one screen. The fox walks to the next door (`x` on the fox, not `translate` on the world).
3. **Gameplay:** ability-gated Metroidvania. Fox starts underpowered. Each dungeon teaches a move used in the next.
4. **Loop:** 4 quests + campfire. ~28s if 4 stages; shorter if fewer repos. No cinema / skills-hub unless Phase 3.
5. **Dynamic:** `compileQuests(live GitHub data)`. New pin updates the street. No authored cubewin07 room as architecture.
6. **Ability ≠ language.** `stage[i].ability` is always `scan, dash, trace, climb` by **index**. Language paints the orb and tints the room.
7. **Archetype uniqueness:** 4 interiors = 4 different rooms even if every repo is TypeScript.
8. **Pins = quest select.** Pin order first, then recently pushed, skip profile repo, cap 4.
9. **SMIL only.** Zero `<script>`. GitHub camo strips JS.
10. **No Iteration 4 regressions:** no chapter titles, no 4 header bars, no lore cards, no floating `LEARN X` pills, no save-point monolith.
11. **Keep:** pixel cyber-fox, butterfly, campfire loaf, neon moon/stars/meteors, squash/stretch, two-corner HUD, 890×240.
12. **Fox instances:** two — `fox-street` and `fox-interior`. Discrete opacity so only one is visible. Do not morph one fox across two coordinate systems.

---

## Why Iteration 5 is not the destination

Current code scrolls the street (`translate` 0 → -1900) while the fox hops in a ~90px band in front of closed facades. `renderAdventureWorld` does `void data`. Orbs are grabbed three times with the same crouch-leap-land. Visor is already fully lit at t=0. HUD XP is hardcoded `9,420`. `fetchData` merges pinned + top repos and **drops the pinned bit**, so a compiler cannot prefer pins. That is a parade, and it cannot pick up a new GitHub repo.

---

# What you (human) should do now

1. **Pin the 4 GitHub repos** that should be this month's quests (pin order = stage order). That is the only curation.
2. Keep `GITHUB_TOKEN` / `VITE_GITHUB_TOKEN` available so GraphQL can see pins, topics, diskUsage.
3. Hand the next agent this file and say: **do Phase 1.1 + 1.2 only** (compiler + fetch). Do not ask them to hardcode iStats Lab.
4. After a full Phase 1 loop is watchable in the browser / `banner.svg`, decide whether Phase 2 is worth it. Do not pre-build it.
5. When the session ends, the agent must run the handoff command at the bottom of this file.

---

# What agents should do now (Phase 1 build order)

Do these in order. Each step should leave lint clean. Do not skip ahead to interiors before the compiler and timeline exist.

| Step | Checkbox | Deliverable | Done when |
|---|---|---|---|
| **1.1** | `[x]` | `src/cards/banner/compileQuests.js` + JSDoc QuestCard | Mock: 4 TS repos → lab,vault,forge,tower (unique). Mock: pin order preserved. 2 repos → `stages.length === 2`. |
| **1.2** | `[x]` | GraphQL fields + `fetchData` keeps `pinned` / `pinIndex` / `pushedAt` / `topics` / `diskUsage`. REST fallback documented below. | `fetchData('cubewin07')` returns repos with `pinned: true` on pinned ones. `compileQuests` wired in `renderSvg` even if world still old. |
| **1.3** | `[x]` | `src/cards/banner/timeline.js` | `buildTimeline(4).totalDur === 28`; `buildTimeline(2)` shorter; every scene has `t0,t1,type,stageIndex`. |
| **1.4** | `[x]` | Dual-scene zoom with **dummy** colored rects (no art) | Street fades, a full-canvas interior fades/scales in 0.4s, fox-street hides, fox-interior (even a placeholder rect) shows. Loop 28s. |
| **1.5** | `[x]` | Static hub street: 4 packed exteriors + campfire, live `paint.name` on doors, clear-stars | Door labels change when mock repos change. No world `translate`. |
| **1.6** | `[x]` | `foxSprite.js` street walk to each door + interior placeholder motion + ability opacity layers (can be stub) | t=0 visor off. After stage 0 exit, visor on. Campfire loaf at end. |
| **1.7** | `[x]` | Real interiors `lab.js` `vault.js` `forge.js` `tower.js` one at a time (lab first) | Gating readable: scan paints door 1; dash clears forge laser; clone holds tower switch. |
| **1.8** | `[x]` | HUD formulas + regenerate `banner.svg` / `dist/banner.svg` + verify | Lint, xmllint, zero `<script>`, seamless loop. |

Phase 1 is **not done** until 1.8 is ticked from evidence, not intent.

---

# Phase 1 implementation contract

## Canvas and layout constants

```
WIDTH = 890
HEIGHT = 240
GROUND_Y = 192          // street curb; interiors may use the same y for their floor
HUB is static; no animateTransform translate on the world track
```

Street packing (all on one screen):

| Slot | x | w | What |
|---|---|---|---|
| Door 0 | 16 | 150 | Exterior for `stages[0]` |
| Door 1 | 186 | 150 | `stages[1]` |
| Door 2 | 356 | 150 | `stages[2]` |
| Door 3 | 526 | 150 | `stages[3]` |
| Campfire | 696 | 170 | Always last, not a repo |

If `stages.length === 2`, use Door 0, Door 1, skip 2–3, keep campfire at 696. Fox walk targets = door centers (~x+40).

Interiors: each is a full `0,0,890,240` drawing. Floor at y=192. Fox interior scale ~2.2 (smaller than street 2.8) so vertical climb fits.

---

## QuestCard shape (JSDoc — put this in `compileQuests.js`)

```js
/**
 * @typedef {object} QuestPaint
 * @property {string} name          repo.name, truncated to 16 chars for marquee
 * @property {string} lang          primaryLanguage.name or 'Code'
 * @property {string} langColor     primaryLanguage.color or '#00f0ff'
 * @property {'gauges'|'candles'|'laser'|'leds'|'terminal'} widget
 * @property {string} [tagline]     optional overlay from KNOWN_PROJECTS or description slice ≤40 chars
 *
 * @typedef {object} QuestStage
 * @property {object} repo          original repo object (do not mutate)
 * @property {'lab'|'vault'|'forge'|'tower'} archetype
 * @property {'scan'|'dash'|'trace'|'climb'} ability
 * @property {1|2|3} difficulty     stored in Phase 1; interiors play as d2
 * @property {QuestPaint} paint
 *
 * @typedef {object} QuestPlan
 * @property {string} username
 * @property {QuestStage[]} stages  length 1..4
 * @property {{ orbs: QuestPaint[] }} campfire
 * @property {object} stats
 */
```

`renderSvg` calls `compileQuests(data)` and never reads README.

---

## 1.1 `compileQuests` algorithm

**Selection**

1. `pinned = repos.filter(r => r.pinned).sort((a,b) => a.pinIndex - b.pinIndex)`
2. `fill = repos.filter(r => !r.pinned && r.name.toLowerCase() !== username.toLowerCase() && r.primaryLanguage?.name)` sorted by `pushedAt` desc (missing dates last)
3. `chosen = [...pinned, ...fill].dedupeByName.lower().slice(0, 4)`
4. If `chosen.length === 0`, fall back to whatever repos exist (showcase mocks already in `fetchData`)
5. Campfire is not a repo. `campfire.orbs = stages.map(s => s.paint)`

**Ability**

```
abilities = ['scan', 'dash', 'trace', 'climb']
stage[i].ability = abilities[i]   // i in 0..3
```

If only 2 stages: scan, dash only. Climb may never appear. That is correct.

**Uniqueness (greedy)**

```
ORDER = ['lab', 'vault', 'forge', 'tower']

preferences(repo):
  topics = (repo.topics || []).map(lowercase)
  name = repo.name.toLowerCase()
  lang = repo.primaryLanguage?.name
  blob = name + ' ' + (repo.description||'') + ' ' + topics.join(' ')

  if lang in Swift, Kotlin, Dart, Objective-C OR topics has macos|ios|swiftui
      return ['lab', 'tower', 'forge']
  if lang in C#, Java, Go, Rust, C++ OR topics has backend|api|dotnet
      return ['tower', 'lab', 'vault']
  if name/topics match svg|readme|graphics|cli|smil
      return ['forge', 'vault', 'lab']
  if (lang in JavaScript, TypeScript) AND (topics/desc match react|finance|dashboard|budget)
      return ['vault', 'forge', 'lab']
  if lang in JavaScript, TypeScript
      return ['vault', 'forge', 'lab']
  if lang in Python, R OR topics has data|ml|jupyter
      return ['lab', 'vault', 'tower']
  return ['lab', 'vault', 'forge', 'tower']  // fallback = full ORDER

used = []
for stage in chosen:
  prefs = preferences(repo)
  pick = first of prefs not in used
      || first of ORDER not in used
      || prefs[0]
  used.push(pick)
  stage.archetype = pick
```

**Worked example A** — 4 TypeScript apps, no topics: all prefer vault→forge→lab.

| Repo | Pick | Why |
|---|---|---|
| A | vault | first pref |
| B | forge | vault taken |
| C | lab | vault+forge taken |
| D | tower | first of ORDER not in used |

**Worked example B** — cubewin07-like: iStats/Swift, financial-management/JS+finance, customReadmeSVG/JS, csharp-practice/C#.

| Repo | Pick |
|---|---|
| iStats | lab |
| financial-management | vault |
| customReadmeSVG | forge (name svg/readme) |
| csharp-practice | tower |

**Widget (one, closed list)** — independent of archetype:

```
text = name + desc + topics
if match cpu|ram|monitor|macos → gauges
else if match finance|budget|money → candles
else if match svg|animation|graphic → laser
else if match async|server|api|.net|dotnet → leds
else → terminal
```

A vault may have `gauges` if the repo is a monitor app. Templates should render the widget in a side panel if it does not match the room's "native" prop (lab loves gauges, vault loves candles). Do not crash. Native prop stays; widget is extra paint.

**Difficulty (store only)**

```
stars = repo.stargazerCount || 0
disk = repo.diskUsage || 0          // KB; 0 if REST fallback
langs = (repo.languages || []).length
score = Math.log(stars+1) + Math.log(disk+1) + Math.min(langs, 4)
d = score < 4 ? 1 : score < 8 ? 2 : 3
```

Do **not** use per-repo `history.totalCount` (GraphQL cost). User-level `stats.totalCommits` is for HUD, not this score. Interiors ignore `d` in Phase 1 and play as d2.

**KNOWN_PROJECTS:** if `repo.name` hits the map, copy `tagline` (and widget override if you add one) onto `paint` only. Never set `archetype` or `ability` from it.

---

## 1.2 Fetch contract

### GraphQL — extend `BANNER_REPOS_QUERY` (one round trip)

Add to **both** `pinnedItems` repository fragment and `repositories` nodes:

```
diskUsage
pushedAt
createdAt
repositoryTopics(first: 10) {
  nodes { topic { name } }
}
```

Keep existing: name, description, url, stargazerCount, forkCount, primaryLanguage, languages(first: 5).

Do **not** add:

- `object(expression: "HEAD:README.md")`
- recursive `object` trees
- `defaultBranchRef.target.history` (expensive; skip in Phase 1)

### `fetchData` must not drop pin identity

Today pinned and top are merged with a `seen` set and no flag. Change the pushed object to:

```js
{
  name, description, url, stargazerCount, forkCount,
  primaryLanguage,
  languages: [{ name, color, size }],  // from edges
  topics: string[],                    // [] if missing
  diskUsage: number,                   // 0 if missing
  pushedAt: string | null,
  createdAt: string | null,
  pinned: boolean,
  pinIndex: number | null,             // 0..n for pinned, null otherwise
}
```

Merge rule: walk pinned first (set `pinned: true`, `pinIndex: i`), then top/recent (skip names already seen). Do not sort the combined array in a way that destroys pin order — `compileQuests` re-sorts anyway, but keep the flag honest.

### REST fallback (no token or GraphQL fail)

Existing REST ` /users/{user}/repos?sort=pushed` stays.

- `pinned: false` for all (REST cannot see pins without extra endpoints)
- `topics: repo.topics || []` if the REST payload includes them; else `[]`
- `diskUsage: 0`
- `pushedAt: repo.pushed_at`
- Selection then becomes "recent with a language, cap 4" — acceptable degrade
- Do not call `/users/{user}/pinned` in Phase 1 unless it is already trivial; GraphQL is the pin path

Showcase mocks in `fetchData` should set `pinned: true` and `pinIndex` 0..n so the compiler has a path when GitHub is down.

---

## 1.3 `timeline.js` API

```js
/**
 * @typedef {'street'|'zoom-in'|'interior'|'zoom-out'|'campfire'} SceneType
 * @typedef {{ id: string, type: SceneType, stageIndex: number | null, t0: number, t1: number }} Scene
 * @typedef {{ totalDur: number, scenes: Scene[], keyTimes(times: number[]): string }} Timeline
 *
 * buildTimeline(stageCount: 1|2|3|4): Timeline
 */
```

For `stageCount === 4`, `totalDur = 28`. Use the table below. For fewer stages, drop unused interior blocks and **keep campfire ≥ 1.8s**, then scale remaining street/interior proportionally so totalDur ≈ `10 + stageCount * 4.5` (2 stages ≈ 19s, 3 ≈ 23.5s, 4 = 28s). Export `totalDur` as a string seconds for SMIL (`"28s"`).

4-stage table (authoritative):

| t0–t1 | type | stageIndex | Notes |
|---|---|---|---|
| 0.0–2.2 | street | 0 | Walk to door 0 |
| 2.2–2.6 | zoom-in | 0 | |
| 2.6–7.4 | interior | 0 | scan taught |
| 7.4–7.8 | zoom-out | 0 | |
| 7.8–9.2 | street | 1 | visor on, walk to door 1 |
| 9.2–9.6 | zoom-in | 1 | |
| 9.6–14.0 | interior | 1 | dash taught |
| 14.0–14.4 | zoom-out | 1 | |
| 14.4–15.8 | street | 2 | dash once toward door 2 |
| 15.8–16.2 | zoom-in | 2 | |
| 16.2–20.4 | interior | 2 | trace taught |
| 20.4–20.8 | zoom-out | 2 | |
| 20.8–22.0 | street | 3 | walk to door 3 |
| 22.0–22.4 | zoom-in | 3 | |
| 22.4–25.8 | interior | 3 | climb taught |
| 25.8–26.2 | zoom-out | 3 | |
| 26.2–28.0 | campfire | null | loaf, orbs, wrap to 0.0 pose |

Helper: `opacityKeyTimes(timeline, predicate)` → `{ keyTimes, values }` for SMIL, values `1` while predicate(scene), else `0`, discrete. Use this for street vs each interior vs fox-street vs fox-interior.

---

## 1.4 SVG scene skeleton (put in `renderSvg`)

```xml
<svg viewBox="0 0 890 240" width="890" height="240" ...>
  defs: existing gradients + clipPath id="iris" (optional)

  <!-- always-on sky behind everything -->
  sky rect, stars, moon, shooting stars, skyline (skyline only while street visible is OK)

  <g id="street-hub">
    <!-- opacity 1 on street+campfire+zoom? during zoom street scales up and fades -->
    road, 4 exteriors, campfire, fox-street
  </g>

  <g id="interior-0"> ... lab/vault/forge/tower for stages[0] + fox-interior ... </g>
  <g id="interior-1"> ... </g>
  <g id="interior-2"> ... </g>
  <g id="interior-3"> ... </g>
  <!-- omit unused interior groups if stageCount < 4 -->

  HUD (always on, above scenes)
  neon frame
</svg>
```

Zoom (0.4s), known-good SMIL pattern — **opacity discrete-ish + scale on the interior group**, do not scale the 24px door:

```
street-hub opacity: 1 during street+campfire, 0 during interior, interpolate 0.4s during zoom-in/out
interior-n opacity: 0 by default, 1 during that interior; during zoom-in scale 0.45→1, during zoom-out 1→0.45
fox-street opacity: 1 during street+campfire, 0 otherwise
fox-interior: one instance parented inside a wrapper that is visible when ANY interior or zoom for that stage is active. Easier: duplicate fox-interior into each interior group (4 calls). Pixel fox is acceptable duplicated 4 times if only one group opacity=1. Prefer **one** `g#fox-interior` sibling, not parented to interiors, so we do not pay 4× pixels — x,y keyframes are in interior space and only matter while visible.
```

Recommended Phase 1: **one `g#fox-interior` sibling** (not nested in 4 rooms). Rooms do not include a fox. Fox draws on top.

GitHub camo: `animate` + `animateTransform` only. No JS. Nested `animateTransform` with `additive="sum"` is flaky — prefer a wrapper `<g>` for translate and child `<g>` for scale.

---

## 1.5 Street exteriors

Reuse geometry from current `renderIStatsLab` / vault / forge / tower **as facade-only** (no "the fox enters this rectangle"). Marquee text = `paint.name` + lang color chip. Door is the zoom target. After that stage's zoom-out, a small ★ appears on the facade (`opacity` 0→1).

Campfire = current tent + fire, no `[REST CHECKPOINT]` novel. Flag can read a short `ORIGIN`.

Skyline/moon/stars stay. Do not restore signposts.

---

## 1.6 Fox ownership and layers

`renderFoxSprite({ role: 'street'|'interior', timeline, stages, scale })`

**Street fox (scale 2.8):** walk cycle to door x's. Dash stretch only on street-2 (after ability dash unlocked). Scan beam group opacity 1 only during street stageIndex===1. Visor-lit opacity 0 until t ≥ first zoom-out of stage 0. Loaf during campfire (reuse current sit frames). Butterfly tracks this fox on street.

**Interior fox (scale 2.2):** one set of x,y,rot,scale keyframes covering all interior windows. When an interior is hidden, those keys can still run. Per-room paths (local coords):

- lab: left door x≈80 y=GROUND → stairs → mid platforms y≈120 → roof grab y≈70 → back to door
- vault: left x≈60 → dash across coins to x≈700 → grab
- forge: dash under laser at y=GROUND → stand at anvil x≈420 → stamp clone
- tower: x≈80 → stamp clone at switch → climb y up → grab → drop

Exact pixel paths may be tuned; the **verbs and order** may not.

Layers (opacity from timeline, not from language):

| Layer | Off until | On during |
|---|---|---|
| visor-lit | first stage-0 zoom-out | rest of loop |
| scan-beam | — | street, stageIndex 1 only |
| dash-ghosts | — | dashes (vault interior + street-2 + forge interior) |
| orbit-rings | stage-1 zoom-out | rest of loop |
| trace-clone | — | forge teach beat + tower switch beat |
| climb-sparks | — | tower interior |
| twin | — | optional 1s in tower if `paint.lang` is C# / Java / Go / Rust / C++ |
| loaf | — | campfire |

Somersault **once** (vault dash or forge laser), not three times. t=0 visor dim/off.

---

## 1.7 Interior templates

```js
renderInterior(archetype, { paint, ability, difficulty }, { width: 890, height: 240, groundY: 192 })
```

Switch on `archetype`, ignore `ability` for choosing the room (ability is the fox's job). `difficulty` unused in Phase 1.

| File | Must show | Gating readable as |
|---|---|---|
| `interiors/lab.js` | 2 floors, stairs, door, satellite; gauges if widget=gauges else terminal on wall | Climb + grab orb of `paint.langColor` |
| `interiors/vault.js` | Wheel door, coin arc, candles if widget=candles | First dash through coins |
| `interiors/forge.js` | Moving horizontal laser, anvil, chimney sparks | Laser hits walking height; dash clears; clone stamp taught |
| `interiors/tower.js` | Dual racks, switch+gap, climbable left rack | Clone holds switch; climb; optional twin |

Marquee or wall plate: `paint.name` (not CHAPTER I). Orb = language color. No LEARN pills.

---

## 1.8 HUD formulas (no magic 9420 / LV.42)

```
xpTotal = min(99999, (stats.totalStars||0)*120 + (stats.totalCommits||0)*8 + (stats.totalRepos||0)*40)
xpAt[i] = round(xpTotal * [0, 0.25, 0.55, 0.78, 1][i])   // i = clears 0..4
levelBase = 30 + min(20, Math.floor((stats.totalCommits||0)/50) + (stages.length))
levelAt[i] = levelBase - (stages.length - i)              // ticks up on each clear, ends at levelBase
```

Left badge: `♥♥♥ @{username}` + `LV.{n}` from `levelAt` SMIL text… **SVG cannot SMIL-tween text content reliably.** Use **stacked `<text>` elements** with opacity keyTimes (LV.38, LV.39, …) — same trick as fox emotes today.

Right badge: stacked XP texts `xpAt[i]` + `★ {stats.totalRepos} REPOS`.

Skill diamonds: 4 outlines under the left badge (or above the fox if they eat the moon). Fill opacity 0→1 on each stage zoom-out. Color = that stage's `paint.langColor`. If stageCount < 4, draw only N diamonds.

---

## Verify (1.8)

```
npm run lint
npm run build
xmllint --noout banner.svg
rg -n '<script' banner.svg src/cards/banner   # must be 0
node scripts/generate-banner.js --user=cubewin07
```

Behavior checks:

1. Mock 4 TS repos → 4 different door archetypes.
2. Change pin order → door names reorder, abilities stay scan→dash→trace→climb left to right.
3. 2 repos → 2 doors, shorter loop, campfire still plays.
4. Visor off at t=0, on after first interior.
5. No `<script>`, valid XML, loop wraps without a pop.

---

# Phase 2 — README one-liners + difficulty knobs

**Locked until every Phase 1 checkbox is `[x]` and a human has watched one full loop.**

**Status:** `[ ] locked`

Data contract (do not implement now):

1. After `compileQuests`, for each of the ≤4 chosen repos, optional GraphQL `object(expression: "HEAD:README.md") { ... on Blob { text } }`. Hard timeout: if fetch already spent 2500ms, skip remaining READMEs.
2. `paint.tagline` = first markdown heading that is not a badge/logo line, else first 80 chars of description. Strip `#`, images, HTML.
3. Keyword scan of README **adds to the existing widget table only** (still 5 widgets). No new archetypes.
4. Complexity: `diskUsage` already on the card, **or** root tree `object(expression: "HEAD:") { ... on Tree { entries { name type } } }` length. Map to d1/d2/d3 knobs: coin count, laser duration, extra lab ledge. Same four room files.
5. Cache TTL remains 7200000. `scripts/generate-banner.js` unchanged as the static writer.

Out of scope even in Phase 2: LLM summaries, recursive trees, per-file language breakdown.

---

# Phase 3 — Extra combinations

**Locked until Phase 2 is done or the user explicitly overrides.**

**Status:** `[ ] locked`

- Secondary language (2nd languages edge) → second orb, same room.
- New archetypes `cinema` | `grove` only if topics match **and** uniqueness still yields 4 distinct rooms (extend ORDER).
- Twin-fox only at difficulty 3 on tower (move the lang check to difficulty).
- Optional `quest.yml` in the profile repo: `{ pins: [names] }` to force order without GitHub pins.
- animeLog / movie-explorer / skills-hub get rooms only if they are in the chosen 4 **and** an archetype exists for them.

Do not create these files now.

---

# File map

| File | Phase 1 |
|---|---|
| `work/plans/banner-adventure-phases.md` | This spec + agent log |
| `src/cards/banner/index.js` | Pointer comment; fetchData flags; renderSvg scene stack |
| `src/cards/banner/compileQuests.js` | **New** |
| `src/cards/banner/timeline.js` | **New** |
| `src/cards/banner/interiors/lab.js` | **New** (step 1.7) |
| `src/cards/banner/interiors/vault.js` | **New** |
| `src/cards/banner/interiors/forge.js` | **New** |
| `src/cards/banner/interiors/tower.js` | **New** |
| `src/cards/banner/adventureWorld.js` | Street hub facades only; delete `void data` and scrolling track |
| `src/cards/banner/foxSprite.js` | Two roles + layers |
| `src/core/github/queries.js` | topics, diskUsage, dates |
| `src/cards/banner/neonSignpost.js` | Do not import |
| `scripts/generate-banner.js` | No API change |
| `banner.svg` / `dist/banner.svg` | Regenerate at 1.8 |

---

# Anti-patterns

| Failed | Why | Do this instead |
|---|---|---|
| Floating neon cards | Fox disconnected | Fox enters rooms |
| RPG chapter HUD | Smothered sky | Two-corner HUD + skill diamonds |
| Hardcoded 5 buildings | New repo does nothing | `compileQuests` |
| README → unique layout | Timeouts, mush | Closed archetypes + paint |
| Ability = language | Three Swift = three scan rooms | Ability = stage index |
| Same jump-grab 3× | Screensaver | Four verbs, two gated ahas, cozy rest |
| Visor on at t=0 | Nothing to earn | Start weak |
| Scrolling hub + zoom | Two cameras | **Static hub**, fox walks to doors |
| One fox, two coordinate spaces | SMIL mess | `fox-street` + `fox-interior` |

---

# Agent command (paste at end of every banner session)

```
BANNER-ADVENTURE HANDOFF
File: work/plans/banner-adventure-phases.md
1. Update Current State (phase / status / next action / blockers / last agent).
2. Append Agent Log row (date, agent, phase, done, left, reminder).
3. Tick Phase 1.1–1.8 checkboxes you actually finished. Do not tick from intent.
4. If blocked, write the blocker in Current State — do not start Phase 2/3 to dodge it.
5. Next action must name the next unchecked step (e.g. "1.3 timeline.js") not "continue the banner".
```
