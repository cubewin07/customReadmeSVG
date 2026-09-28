# Cards Audit Fixes & Readme Card Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address all audit findings across the GitHub SVG cards suite: fix confirmed calculation, formatting, overflow, and static-fallback bugs; replace fake/hardcoded metadata with live GitHub GraphQL data; redesign the Developer card for one clear fact per act with a unified chapter tracker; align card tokens; and provide an automated visual snapshot test harness.

**Architecture:**
- **Core Layer:** Enrich GraphQL queries (`DEVELOPER_QUERY`) and normalizers (`normalizeDeveloperData`) to fetch real commit SHAs, languages, and annual activity. Replace inverted rank percentiles with transparent letter-grade and composite scores.
- **Card Renderers:** Fix text overflow (hologram, bio wrap, month labels) and eliminate redundant UI elements (remove left-panel 14D strip in Developer card; differentiate Profile metrics from Stats; de-clutter Language bytes).
- **Animation & Static-First:** Ensure all SMIL cards (especially Developer card) render their final numbers and full-opacity scene by default at `t=0` without relying on SMIL execution.
- **Unification & Quality Harness:** Establish shared header tokens across secondary cards and add a Node-native snapshot audit script testing long, short, and empty datasets.

**Tech Stack:** JavaScript (ES Modules), Node.js v24 (`node:test`, `node:assert/strict`), SVG / SMIL Animation, Vite, Axios, GitHub GraphQL API.

---

## Global Constraints

- **Git Branch:** All work must be committed to branch `feat/cards-audit-fixes`.
- **Pure SVG/SMIL:** Cards must remain valid standalone SVGs renderable directly by GitHub's `camo` CDN without external JavaScript or dependencies.
- **Zero Inversion / Fake Stats:** No hardcoded tech lists, arbitrary level formulas, or inverted percentiles. Every stat must reflect authentic user data or clear fallbacks.
- **Static First:** Default base state must display final numbers and full-opacity art; SMIL animations must enhance, not be required for legibility.
- **Surgical Changes:** Preserve existing SVG dimensions and theme compatibility unless specifically expanding boundaries to prevent clipping.
- **Verification:** Every task must include automated tests using Node's built-in test runner (`node --test`) and must pass `npm run lint` and `npm run build`.

---

## Task Structure & Phased Plan

### Phase 1: Confirmed Bug Fixes & Resilient Fallbacks

#### Task 1: Fix Stats Card Rank Scoring and Contradictory Percentile
**Files:**
- Modify: `src/core/stats/rank.js:50-54`
- Modify: `src/cards/stats/index.js:127-133, 181-183, 261-264, 308-310, 404-406`
- Test: `tests/stats-rank.test.js`

**Interfaces:**
- Consumes: `{ totalCommits, totalStars, totalForks, totalRepos, followers }`
- Produces: `calculateRank(...) => { level, score, percentile, rankText }` where `rankText` provides an honest, non-contradictory description such as `Score 51.3 / 100` or calibrated population percentile.

- [ ] **Step 1: Write the failing test**
Create `tests/stats-rank.test.js`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRank } from '../src/core/stats/rank.js';
import { statsCard } from '../src/cards/stats/index.js';
import { themes } from '../src/svg/theme.js';

test('calculateRank returns score and grade without inverted percentile contradiction', () => {
  const result = calculateRank({ totalCommits: 500, totalStars: 30, totalForks: 10, totalRepos: 15, followers: 20 });
  assert.ok(result.score > 0 && result.score <= 100);
  assert.ok(['S+', 'S', 'A+', 'A', 'B+', 'B', 'C'].includes(result.level));
  // Score should not produce inverted "Top 49.2%" for Grade A
  assert.ok(typeof result.score === 'number');
  assert.ok(!isNaN(result.score));
});

test('statsCard renders grade and score clearly in SVG', () => {
  const svg = statsCard.renderSvg({ totalCommits: 500, totalStars: 30, totalForks: 10, totalRepos: 15, followers: 20 }, themes.dark);
  assert.ok(svg.includes('Rank'));
  assert.ok(!svg.includes('Top 49.2%')); // Contradictory inverted label removed
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/stats-rank.test.js`
Expected: FAIL

- [ ] **Step 3: Implement minimal fix in `src/core/stats/rank.js` and `src/cards/stats/index.js`**
Update `calculateRank` in `src/core/stats/rank.js`:
Provide `scoreText: `${roundedScore}/100`` and calibrated rank descriptor.
Update `src/cards/stats/index.js` across `renderV1RingSvg`, `renderV1BarsSvg`, `renderV1HeroSvg`, `renderV1DashboardSvg`, and `renderV1CompactSvg` to display `Rank ${rank.level} • Score ${rank.score}/100` instead of `Top ${(100 - rank.percentile).toFixed(1)}%`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/stats-rank.test.js`
Expected: PASS

- [ ] **Step 5: Commit changes**
```bash
git add src/core/stats/rank.js src/cards/stats/index.js tests/stats-rank.test.js
git commit -m "fix(stats): replace inverted percentile with transparent score and grade"
```

---

#### Task 2: Fix Relative Month Formatter and Overflow in Repos Card
**Files:**
- Modify: `src/cards/repos/index.js:37-49, 130-175, 250-285`
- Test: `tests/repos-format.test.js`

**Interfaces:**
- Consumes: ISO date string for `formatRelativeTime(isoString)`
- Produces: String with `mo ago` for months (e.g., `2mo ago` instead of ambiguous `2m ago`) and dynamic name fitting.

- [ ] **Step 1: Write the failing test**
Create `tests/repos-format.test.js`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { reposCard } from '../src/cards/repos/index.js';
import { themes } from '../src/svg/theme.js';

test('reposCard formatRelativeTime formats months as "mo ago"', () => {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const svg = reposCard.renderSvg({
    repos: [{
      name: 'financial-management',
      description: 'Full stack reactive platform',
      stargazerCount: 18,
      forkCount: 4,
      primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
      updatedAt: sixtyDaysAgo,
    }],
  }, themes.dark);

  assert.ok(svg.includes('2mo ago'), 'Should use "2mo ago" instead of "2m ago"');
  assert.ok(!svg.includes('2m ago'));
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/repos-format.test.js`
Expected: FAIL

- [ ] **Step 3: Implement minimal fix in `src/cards/repos/index.js`**
Change `formatRelativeTime`:
```javascript
if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
```
Also adjust name clipping logic: compute adaptive truncate threshold based on available card layout width rather than hard truncating at fixed 18 chars when room is available.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/repos-format.test.js`
Expected: PASS

- [ ] **Step 5: Commit changes**
```bash
git add src/cards/repos/index.js tests/repos-format.test.js
git commit -m "fix(repos): format months as mo ago and improve text truncation"
```

---

#### Task 3: Fix Profile Split Layout Bio Overflow and Text Wrapping
**Files:**
- Modify: `src/cards/profile/index.js:463-470`
- Test: `tests/profile-bio-wrap.test.js`

**Interfaces:**
- Consumes: `p.bio` string up to ~120 characters
- Produces: Multi-line `<text>` with `<tspan>` tags constrained within 310px width container.

- [ ] **Step 1: Write the failing test**
Create `tests/profile-bio-wrap.test.js`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { profileCard } from '../src/cards/profile/index.js';
import { themes } from '../src/svg/theme.js';

test('profileCard split layout wraps bio text into tspans without overflowing', () => {
  const longBio = 'Senior engineer crafting distributed systems, high-performance web applications, and creative developer tools.';
  const svg = profileCard.renderSvg({
    name: 'Le Tan Thang',
    login: 'cubewin07',
    bio: longBio,
    repositories: 28,
    totalStars: 64,
    followers: 42,
    following: 15,
  }, themes.dark, { layout: 'split' });

  // Should wrap into multiple tspans
  assert.ok(svg.includes('<tspan'), 'Long bio must wrap into tspans in split layout');
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/profile-bio-wrap.test.js`
Expected: FAIL

- [ ] **Step 3: Implement minimal fix in `src/cards/profile/index.js`**
Create a bio wrapping helper that breaks text into lines of at most 38 characters:
```javascript
function wrapText(text, maxCharsPerLine = 38, maxLines = 2) {
  if (!text) return '';
  const words = text.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= maxCharsPerLine) {
      cur = (cur + ' ' + w).trim();
    } else {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  return lines.map((l, idx) => `<tspan x="12" dy="${idx === 0 ? 0 : 16}">${escapeXml(l)}</tspan>`).join('');
}
```
Apply to `renderV1SplitSvg`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/profile-bio-wrap.test.js`
Expected: PASS

- [ ] **Step 5: Commit changes**
```bash
git add src/cards/profile/index.js tests/profile-bio-wrap.test.js
git commit -m "fix(profile): wrap bio text in split layout to prevent card overflow"
```

---

#### Task 4: Fix Static-First Fallback & Counter 00 Bug in Developer Card
**Files:**
- Modify: `src/cards/developer/utils/timeline.js:168-192`
- Modify: `src/cards/developer/components/actDesk.js:171-174`
- Test: `tests/developer-static-fallback.test.js`

**Interfaces:**
- Consumes: `rollCounter(x, y, val, color)` and `renderActDesk`
- Produces: SVG markup where initial resting state / fallback displays the full target value and visible workstation desk scene.

- [ ] **Step 1: Write the failing test**
Create `tests/developer-static-fallback.test.js`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { rollCounter } from '../src/cards/developer/utils/timeline.js';
import { developerCard } from '../src/cards/developer/index.js';
import { themes } from '../src/svg/theme.js';

test('rollCounter outputs static fallback displaying target number', () => {
  const rendered = rollCounter(50, 100, 64, '#fff');
  // First digit 6 must be present as static text or resting transform
  assert.ok(rendered.includes('6'));
  assert.ok(rendered.includes('4'));
});

test('developerCard Act 1 desk is visible in static first frame', () => {
  const svg = developerCard.renderSvg({
    name: 'Le Tan Thang',
    stats: [{ label: 'REPOSITORIES', value: 28 }, { label: 'TOTAL STARS', value: 64 }, { label: 'FOLLOWERS', value: 42 }],
  }, themes.dark);

  // Must not have opacity="0" on Act 1 base container
  assert.ok(!svg.includes('ACT 1: DESK & HOLOGRAM (0s - 12s) ============================= -->\n  <g opacity="0">'));
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/developer-static-fallback.test.js`
Expected: FAIL

- [ ] **Step 3: Implement minimal fix**
In `src/cards/developer/utils/timeline.js`:
Revise `rollCounter` so that the base `<text>` or initial visual state renders the target digits by default (e.g. `<text class="t" x="${x + 13 * k + 6}" y="${y + 18}" ...>${digit}</text>`), layered with the SMIL animation `<g>` or setting initial strip offset so non-SMIL renderers see `64` instead of `00`.
In `src/cards/developer/components/actDesk.js`:
Remove initial fade-in from 0 to 1 on Act 1 desk container: set initial opacity to 1 (`anim('opacity', [[0, 1], [11.7, 1], [12.4, 0]])`).

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/developer-static-fallback.test.js`
Expected: PASS

- [ ] **Step 5: Commit changes**
```bash
git add src/cards/developer/utils/timeline.js src/cards/developer/components/actDesk.js tests/developer-static-fallback.test.js
git commit -m "fix(developer): make base state static-first with visible counters and desk"
```

---

#### Task 5: Fix Pinned Repo Hologram Overflow in Developer Card
**Files:**
- Modify: `src/cards/developer/components/actDesk.js:100-137, 582-600`
- Test: `tests/developer-hologram-overflow.test.js`

**Interfaces:**
- Consumes: Repo name (e.g. `financial-management`, 20 chars)
- Produces: Repo name text scaled or truncated with font size / bounding box that strictly stays within `[-76, 76]` frame.

- [ ] **Step 1: Write the failing test**
Create `tests/developer-hologram-overflow.test.js`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderActDesk } from '../src/cards/developer/components/actDesk.js';

test('renderActDesk fits long repository names without overflowing hologram frame', () => {
  const actDeskSvg = renderActDesk({
    repos: [
      { name: 'financial-management', language: 'TypeScript', color: '#3178c6', stars: 18, sparkline: [1, 2, 3, 4] },
      { name: 'short-repo', language: 'JavaScript', color: '#f1e05a', stars: 32, sparkline: [1, 2, 3, 4] },
      { name: 'another-very-long-project-name', language: 'Python', color: '#3572A5', stars: 14, sparkline: [1, 2, 3, 4] },
    ],
  });

  // Long repo name should either use smaller font size or truncated text
  assert.ok(actDeskSvg.includes('font-size="11"') || actDeskSvg.includes('financial-mana...'));
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/developer-hologram-overflow.test.js`
Expected: FAIL

- [ ] **Step 3: Implement minimal fix in `src/cards/developer/components/actDesk.js`**
Adjust repo name rendering:
```javascript
const displayName = r.name.length > 17 ? (r.name.slice(0, 15) + '...') : r.name;
const fontSize = r.name.length > 14 ? '11.5' : '13.5';
```
Ensure text stays within bounds.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/developer-hologram-overflow.test.js`
Expected: PASS

- [ ] **Step 5: Commit changes**
```bash
git add src/cards/developer/components/actDesk.js tests/developer-hologram-overflow.test.js
git commit -m "fix(developer): prevent pinned repo hologram title overflow"
```

---

### Phase 2: Replace Fake & Hardcoded Data with Live GitHub Data

#### Task 6: Extend GitHub GraphQL Developer Query
**Files:**
- Modify: `src/core/github/queries.js:167-263`
- Test: `tests/developer-query.test.js`

**Interfaces:**
- Consumes: GraphQL variables `$login: String!`
- Produces: `DEVELOPER_QUERY` string with `abbreviatedOid` under `Commit`, repository `languages(first: 5)`, and total annual commits.

- [ ] **Step 1: Write the failing test**
Create `tests/developer-query.test.js`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { DEVELOPER_QUERY } from '../src/core/github/queries.js';

test('DEVELOPER_QUERY fetches abbreviatedOid for real commit SHA', () => {
  assert.ok(DEVELOPER_QUERY.includes('abbreviatedOid'), 'Query must fetch abbreviated commit SHA');
});

test('DEVELOPER_QUERY fetches top languages for repositories', () => {
  assert.ok(DEVELOPER_QUERY.includes('languages('), 'Query must fetch repository languages');
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/developer-query.test.js`
Expected: FAIL

- [ ] **Step 3: Implement minimal query update in `src/core/github/queries.js`**
In `DEVELOPER_QUERY`:
1. Add `abbreviatedOid` under `... on Commit { history(...) { nodes { message committedDate abbreviatedOid } } }`.
2. Add `languages(first: 5, orderBy: { field: SIZE, direction: DESC }) { edges { node { name color } size } }` to `repositories` or `topRepos`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/developer-query.test.js`
Expected: PASS

- [ ] **Step 5: Commit changes**
```bash
git add src/core/github/queries.js tests/developer-query.test.js
git commit -m "feat(github): add abbreviatedOid and languages to DEVELOPER_QUERY"
```

---

#### Task 7: Update Developer Normalization for Live Tech Arsenal and Real Commit SHA
**Files:**
- Modify: `src/core/github/normalize.js:136-242`
- Test: `tests/developer-normalize.test.js`

**Interfaces:**
- Consumes: GraphQL `DEVELOPER_QUERY` payload
- Produces: Normalized object with real `commitSha`, live `tech` array extracted from repositories, and authentic streak/counts.

- [ ] **Step 1: Write the failing test**
Create `tests/developer-normalize.test.js`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDeveloperData } from '../src/core/github/normalize.js';

test('normalizeDeveloperData extracts real commitSha from abbreviatedOid', () => {
  const raw = {
    user: {
      login: 'testuser',
      repositories: {
        totalCount: 5,
        nodes: [{
          stargazerCount: 10,
          languages: { edges: [{ size: 5000, node: { name: 'Rust', color: '#dea584' } }] },
          defaultBranchRef: {
            target: {
              history: {
                nodes: [{ message: 'feat: add real sha', abbreviatedOid: '9b8c7d6' }],
              },
            },
          },
        }],
      },
    },
  };

  const norm = normalizeDeveloperData(raw);
  assert.equal(norm.commitSha, '9b8c7d6', 'Should extract real abbreviated commit SHA');
  assert.ok(norm.tech.includes('Rust'), 'Should extract real languages instead of hardcoded list');
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/developer-normalize.test.js`
Expected: FAIL

- [ ] **Step 3: Implement minimal normalization update in `src/core/github/normalize.js`**
Extract `commitSha` from `history[0].abbreviatedOid`.
Aggregate top languages from `repositories.nodes` by size into `tech` array.
Remove hardcoded `['React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'Next.js']` as only fallback when user has 0 languages.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/developer-normalize.test.js`
Expected: PASS

- [ ] **Step 5: Commit changes**
```bash
git add src/core/github/normalize.js tests/developer-normalize.test.js
git commit -m "feat(normalize): extract live commitSha and tech languages in normalizeDeveloperData"
```

---

#### Task 8: Differentiate Profile Card Facts from Stats Card
**Files:**
- Modify: `src/cards/profile/index.js:69-106, 190-213, 290-305, 392-398`
- Test: `tests/profile-differentiated-facts.test.js`

**Interfaces:**
- Consumes: Profile data including `createdAt`, `repositories`, `followers`, `totalStars`, primary language
- Produces: SVG cards highlighting account tenure, primary language, and profile facts instead of cloning stats card tiles.

- [ ] **Step 1: Write the failing test**
Create `tests/profile-differentiated-facts.test.js`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { profileCard } from '../src/cards/profile/index.js';
import { themes } from '../src/svg/theme.js';

test('profileCard highlights account tenure and distinct facts', () => {
  const svg = profileCard.renderSvg({
    name: 'Le Tan Thang',
    login: 'cubewin07',
    createdAt: '2021-03-15T00:00:00Z',
    repositories: 28,
    totalStars: 64,
    followers: 42,
  }, themes.dark, { layout: 'classic' });

  assert.ok(svg.includes('Joined 2021') || svg.includes('ACCOUNT AGE') || svg.includes('YEARS ON GITHUB'));
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/profile-differentiated-facts.test.js`
Expected: FAIL

- [ ] **Step 3: Implement differentiated facts in `src/cards/profile/index.js`**
Add calculated fields: `accountAgeYears = Math.max(1, new Date().getFullYear() - new Date(p.createdAt).getFullYear())`.
In tile rows, replace repetitive `STARS` / `FOLLOWERS` / `FOLLOWING` with unique profile dimensions: `JOINED`, `PUBLIC REPOS`, `FOLLOWERS`, `ACCOUNT AGE`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/profile-differentiated-facts.test.js`
Expected: PASS

- [ ] **Step 5: Commit changes**
```bash
git add src/cards/profile/index.js tests/profile-differentiated-facts.test.js
git commit -m "feat(profile): introduce differentiated profile facts and account tenure"
```

---

#### Task 9: Clean Up Languages Card Clutter and Differentiate Layouts
**Files:**
- Modify: `src/cards/languages/index.js:220-238, 275-294`
- Test: `tests/languages-clean.test.js`

**Interfaces:**
- Consumes: Language list `{ name, color, size, percentage }`
- Produces: Clean, uncluttered percentages in Donut layout; distinct compact bar layout for List view without redundant KB clutter.

- [ ] **Step 1: Write the failing test**
Create `tests/languages-clean.test.js`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { languagesCard } from '../src/cards/languages/index.js';
import { themes } from '../src/svg/theme.js';

test('languagesCard donut layout shows clean percentage without inline KB clutter in legend', () => {
  const svg = languagesCard.renderSvg({
    languages: [
      { name: 'JavaScript', color: '#f1e05a', size: 1048576, percentage: 65.2 },
      { name: 'TypeScript', color: '#3178c6', size: 524288, percentage: 34.8 },
    ],
    totalSize: 1572864,
    totalLanguages: 2,
  }, themes.dark, { layout: 'donut' });

  // Right legend should have clean percentage
  assert.ok(svg.includes('65.2%'));
  // Should not clutter every row with redundant "(1.0 MB)" right next to percentage
  assert.ok(!svg.includes('65.2% <tspan fill='));
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/languages-clean.test.js`
Expected: FAIL

- [ ] **Step 3: Implement clean legend and differentiated list layout in `src/cards/languages/index.js`**
In `renderDonutLayout`: Streamline legend text to display `lang.percentage}%` cleanly above the progress bar. Total code size remains in header badge.
In `renderListLayout`: Display full-width horizontal bar visualization with ranked badges `#1`, `#2` to make it visually distinct from the donut chart.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/languages-clean.test.js`
Expected: PASS

- [ ] **Step 5: Commit changes**
```bash
git add src/cards/languages/index.js tests/languages-clean.test.js
git commit -m "feat(languages): remove inline byte clutter and differentiate donut vs list layouts"
```

---

### Phase 3: Redesign Developer Card & Set-Wide Unification

#### Task 10: Redesign Developer Card with Unified Chapter Tracker & One Fact Per Act
**Files:**
- Modify: `src/cards/developer/components/actDesk.js:630-640`
- Modify: `src/cards/developer/components/actRunner.js:298-313`
- Modify: `src/cards/developer/components/actCity.js:246-257`
- Modify: `src/cards/developer/components/sharedDefs.js`
- Test: `tests/developer-chapter-tracker.test.js`

**Interfaces:**
- Consumes: Act timing and facts (SHIP: latest commit & pinned repo; RUN: streak & best day; BUILD: 7-week contribution volume)
- Produces: Unified 3-pip chapter tracker with consistent progress bar and large-type fact headings.

- [ ] **Step 1: Write the failing test**
Create `tests/developer-chapter-tracker.test.js`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { developerCard } from '../src/cards/developer/index.js';
import { themes } from '../src/svg/theme.js';

test('developerCard renders unified 3-act chapter tracker instead of disconnected prompts', () => {
  const svg = developerCard.renderSvg({
    name: 'Le Tan Thang',
    commit: 'feat: add visual snapshot engine',
    streak: 14,
    counts: new Array(60).fill(5),
  }, themes.dark);

  // Must include unified chapter tracker titles
  assert.ok(svg.includes('ACT 1') || svg.includes('ACT 01 // SHIP'));
  assert.ok(svg.includes('ACT 2') || svg.includes('ACT 02 // RUN'));
  assert.ok(svg.includes('ACT 3') || svg.includes('ACT 03 // BUILD'));
  // Old disconnected CLI strings replaced
  assert.ok(!svg.includes('> ship_it.sh'));
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/developer-chapter-tracker.test.js`
Expected: FAIL

- [ ] **Step 3: Implement Chapter Tracker HUD**
Create a unified chapter tracker component in `src/cards/developer/components/chapterTracker.js` (or integrate into `sharedDefs.js` / acts):
- Three pips at top of scene (x: 24, y: 24):
  - Act 1 (0s-12s): Pip 1 active, Caption: `ACT 01 // SHIP • LATEST COMMIT & PINNED REPO`
  - Act 2 (12s-18s): Pip 2 active, Caption: `ACT 02 // RUN • 14-DAY STREAK & RUNNER`
  - Act 3 (18s-24s): Pip 3 active, Caption: `ACT 03 // BUILD • 7-WEEK VOXEL CITY`
- Remove discordant legacy prompts `> ship_it.sh` and `RUNNER 1/6`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/developer-chapter-tracker.test.js`
Expected: PASS

- [ ] **Step 5: Commit changes**
```bash
git add src/cards/developer/ tests/developer-chapter-tracker.test.js
git commit -m "feat(developer): add unified 3-act chapter tracker with one clear fact per act"
```

---

#### Task 11: Slim Left Panel and Scale Optimization
**Files:**
- Modify: `src/cards/developer/components/infoPanel.js:47-63, 192-218`
- Test: `tests/developer-info-panel.test.js`

**Interfaces:**
- Consumes: Profile info, stats, tech arsenal
- Produces: Left panel with font sizes >= 11px (at 1150px canvas width), removing duplicate 14D activity strip so Act 2 has exclusive ownership of heatmap streak.

- [ ] **Step 1: Write the failing test**
Create `tests/developer-info-panel.test.js`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderInfoPanel } from '../src/cards/developer/components/infoPanel.js';
import { themes } from '../src/svg/theme.js';

test('renderInfoPanel removes redundant 14D strip and uses legible font sizes', () => {
  const panel = renderInfoPanel({
    name: 'Le Tan Thang',
    handle: '@cubewin07',
    role: 'Full-Stack Engineer',
    tech: ['React', 'Node.js', 'TypeScript'],
    stats: [{ label: 'REPOSITORIES', value: 28 }, { label: 'TOTAL STARS', value: 64 }, { label: 'FOLLOWERS', value: 42 }],
  }, themes.dark);

  // Redundant 14D mini heatmap strip removed
  assert.ok(!panel.includes('14D ACTIVITY'));
  // SHA badge font size increased from 8.5px to at least 10px
  assert.ok(!panel.includes('font-size="8.5"'));
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/developer-info-panel.test.js`
Expected: FAIL

- [ ] **Step 3: Implement minimal fix in `src/cards/developer/components/infoPanel.js`**
1. Remove `heatmapSvg` and `14D ACTIVITY` label. Give the Tech Arsenal card cleaner padding and larger tag badges.
2. Bump `commitSha` badge font size from 8.5px to 10.5px.
3. Replace arbitrary "Level 52 / LEGENDARY ARCHITECT" formula with an honest metric (e.g. `ANNUAL CONTRIBUTIONS` or certified tier).

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/developer-info-panel.test.js`
Expected: PASS

- [ ] **Step 5: Commit changes**
```bash
git add src/cards/developer/components/infoPanel.js tests/developer-info-panel.test.js
git commit -m "feat(developer): slim left panel, remove duplicate 14D strip, and enhance text scaling"
```

---

#### Task 12: Unified Header Component and Tokens Across Secondary Cards
**Files:**
- Create: `src/svg/header.js`
- Modify: `src/cards/stats/index.js`, `src/cards/repos/index.js`, `src/cards/profile/index.js`, `src/cards/languages/index.js`
- Test: `tests/unified-header.test.js`

**Interfaces:**
- Consumes: `{ title, badgeText, badgeIcon, width, theme }`
- Produces: Consistent SVG `<g>` header block with standardized font size (17px), vertical alignment, and pill badge.

- [ ] **Step 1: Write the failing test**
Create `tests/unified-header.test.js`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCardHeader } from '../src/svg/header.js';
import { themes } from '../src/svg/theme.js';

test('renderCardHeader outputs consistent header title and pill badge', () => {
  const headerSvg = renderCardHeader({
    title: 'Top Repositories (cubewin07)',
    badgeText: '🌟 Featured',
    width: 495,
    theme: themes.dark,
  });

  assert.ok(headerSvg.includes('class="card-header-title"'));
  assert.ok(headerSvg.includes('🌟 Featured'));
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/unified-header.test.js`
Expected: FAIL

- [ ] **Step 3: Implement `src/svg/header.js` and adopt across cards**
Create `src/svg/header.js`:
```javascript
import { escapeXml } from './escape.js';

export function renderCardHeader({ title, badgeText, width = 495, theme }) {
  const titleText = escapeXml(title);
  const badge = badgeText ? escapeXml(badgeText) : null;
  const badgeW = badge ? Math.max(90, Math.ceil(badge.length * 6.5) + 24) : 0;
  const badgeX = width - 48 - badgeW;

  return `
    <g transform="translate(24, 22)">
      <text x="0" y="0" class="card-header-title" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="17" fill="${theme.title}">${titleText}</text>
      ${badge ? `
        <rect x="${badgeX}" y="-14" width="${badgeW}" height="20" rx="10" fill="${theme.badgeBg}"/>
        <text x="${badgeX + badgeW / 2}" y="0" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="10" fill="${theme.title}">${badge}</text>
      ` : ''}
    </g>`;
}
```
Adopt in `stats`, `repos`, `profile`, and `languages`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/unified-header.test.js`
Expected: PASS

- [ ] **Step 5: Commit changes**
```bash
git add src/svg/header.js src/cards/ tests/unified-header.test.js
git commit -m "refactor(cards): unify header layout and design tokens across all secondary cards"
```

---

#### Task 13: Card Snapshot Audit Script for Extreme Datasets & Themes
**Files:**
- Create: `tooling/scripts/snapshot_cards.js`
- Modify: `package.json:6-11`
- Test: `tests/snapshot-runner.test.js`

**Interfaces:**
- Consumes: All 5 cards (`profile`, `languages`, `repos`, `stats`, `developer`), themes (`dark`, `light`), all layouts, and mock datasets (`normal`, `long_names_overflow`, `empty_data`).
- Produces: Renders all cards and verifies no unescaped strings, no broken tags, and validates SVG well-formedness.

- [ ] **Step 1: Write the failing test**
Create `tests/snapshot-runner.test.js`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { runSnapshotAudit } from '../tooling/scripts/snapshot_cards.js';

test('runSnapshotAudit renders all cards without crashing across extreme data and themes', async () => {
  const result = await runSnapshotAudit({ writeToDisk: false });
  assert.equal(result.failed, 0);
  assert.ok(result.totalRendered >= 20, 'Should audit at least 20 card/layout combinations');
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/snapshot-runner.test.js`
Expected: FAIL

- [ ] **Step 3: Implement `tooling/scripts/snapshot_cards.js` and add package.json scripts**
Implement snapshot audit script that tests:
- Cards: `profile`, `languages`, `repos`, `stats`, `developer`
- Layouts: `classic`, `hero`, `compact`, `split`, `dashboard`, `donut`, `list`, `polyglot`, `grid`, `featured`, `spotlight`, `timeline`, `leaderboard`, `ring`, `bars`
- Datasets:
  - `long`: 40-character repo names, 200-char bios, 8-digit stats
  - `empty`: 0 repos, 0 commits, 0 stars, empty languages
  - `standard`: default realistic profile
- Themes: `dark`, `light`
Add `"test": "node --test tests/**/*.test.js"` and `"snapshot": "node tooling/scripts/snapshot_cards.js"` to `package.json`.

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/snapshot-runner.test.js`
Expected: PASS

- [ ] **Step 5: Run full test suite, lint, and build**
Run: `npm test && npm run lint && npm run build`
Expected: All tests pass, lint passes with 0 errors, build succeeds.

- [ ] **Step 6: Commit changes**
```bash
git add tooling/scripts/snapshot_cards.js package.json tests/snapshot-runner.test.js
git commit -m "feat(testing): add automated snapshot audit script and npm test script"
```

---

## Execution Handoff

Plan complete and saved to `work/plans/2026-09-29-cards-audit-redesign.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration.
**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
