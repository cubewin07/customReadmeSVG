# Cards Audit Redesign & Hotfix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address the comprehensive SVG cards audit report across five phases, beginning with the immediate Phase 0 hotfix covering critical rendering bugs (XML tag mismatch, double-escaped entities, badge clipping, cache headers, security sanitization, and XML-parsing test suite).

**Architecture:** Maintain the lightweight, pure JavaScript/Node SVG generation engine without heavy frontend runtime dependencies. SVG cards are generated via pure string templates adhering strictly to XML/SVG 1.1 specs. Tests leverage Node's built-in test runner (`node:test`) and system XML validator (`xmllint`) across standard, long, and empty datasets.

**Tech Stack:** Node.js 20+, `node:test`, `node:assert`, `xmllint`, pure SVG/XML.

## Global Constraints

- Never fabricate data or fall back to plausible-looking fake statistics.
- All SVG output must be strictly valid XML (100% parseable by `xmllint`).
- Keep raw data strings unescaped in memory and escape once at the point of output via `escapeXml`.
- Cache headers must be cache-friendly for GitHub README embeds: `public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400`.
- Do not accept GitHub auth tokens via HTTP query string.
- Each fix must be developed, tested, and committed individually with clean git commit messages.

---

## Roadmap Across Phases

| Phase | Description | Key Deliverables | Done When |
|---|---|---|---|
| **Phase 0** | Hotfix & Validation | Fix stats `bars` extra `</g>`, fix profile split `&` double-escape, fix developer streak badge clipping, update cache headers to 30m/1h stale-while-revalidate, strip `token` query param, add XML validity test to snapshot suite | All 120 snapshots pass `xmllint` with 0 XML errors |
| **Phase 1** | Data Integrity & Fallbacks | Remove fabricated streak fallbacks (3/14) in `normalize.js`, real commit sparklines via `history(since:...)` 8 weekly bins, remove fake commitSha & defaults in developer card, add `source: 'live' \| 'fallback'` and render explicit "data unavailable" state on failure | No hardcoded stats reachable on failed fetch |
| **Phase 2** | Shared Component Kit | Shared `fitText` & `wrapText` with per-character width tables, labelled tile component, canonical widths (830px full, 405px half, legacy 495px via `?width=`), shared static-first primitives (ring, stacked bar, sparkline, heatmap, delta chip) | No text overflow across all test datasets |
| **Phase 3** | Card Variant Redesigns | Redesign variants to answer distinct questions: Repos (topics, language bar, release tag, pushedAt sort), Stats (real shares, radar crest, trajectory, consistency streak), Profile (identity, links, activity heatmap), Languages (clean %, treemap, Evolution) | Each variant displays distinct fields from siblings |
| **Phase 4** | Developer Card Overhaul | Readability pass (>=14px on 1150 grid), responsive media queries (`@media (max-width: 700px)`), stacked layout option (`?layout=stack`), synchronized left panel per act, data-driven scene colors, sub-100KB footprint | Readable at 830px and 350px; <100 KB bundle |

---

## Phase 0 Tasks

### Task 1: Fix Stats `bars` Layout XML Tag Mismatch

**Files:**
- Modify: `src/cards/stats/index.js`
- Test: `tests/stats-bars-xml.test.js`

**Interfaces:**
- Consumes: `renderV1BarsSvg(data, theme, options)`
- Produces: Valid XML SVG string with balanced `<g>` tags

- [x] **Step 1: Write failing test verifying XML validity of stats bars layout**
- [x] **Step 2: Run test to verify it fails with XML parser error**
- [x] **Step 3: Remove duplicate `</g>` tag in `renderV1BarsSvg` in `src/cards/stats/index.js`**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit `fix(stats): remove duplicate closing g tag in bars layout`**

---

### Task 2: Fix Profile `split` Layout Double-Escaping of Bio

**Files:**
- Modify: `src/cards/profile/index.js`
- Test: `tests/profile-bio-escape.test.js`

**Interfaces:**
- Consumes: `profileCard.renderSvg(data, theme, { layout: 'split' })`
- Produces: Output containing `&amp;` instead of `&amp;amp;` for bios with ampersands

- [x] **Step 1: Write failing test asserting bio containing `&` renders as `&amp;` and not `&amp;amp;` in split and all layouts**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Modify `extractProfileFields` and layout renderers to escape at output point only**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit `fix(profile): escape bio once at output to prevent double-escaping`**

---

### Task 3: Fix Developer Card "N-day streak" Badge Clipping

**Files:**
- Modify: `src/cards/developer/components/chapterTracker.js`
- Modify: `src/cards/developer/components/skyAtmosphere.js`
- Test: `tests/developer-streak-badge.test.js`

**Interfaces:**
- Consumes: `renderChapterTracker(profile, theme)`, `renderSkyAtmosphere(streak)`
- Produces: Streak badge rendered within HUD / safe bounds without clipping against `clip-path="url(#scene)"`

- [x] **Step 1: Write test verifying developer card SVG has no elements extending past scene width (584px) at the streak badge**
- [x] **Step 2: Run test to verify failure / boundary overflow**
- [x] **Step 3: Move streak flame badge inside the HUD capsule or anchor right-aligned with safe margin, eliminating the clipping**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit `fix(developer): move streak badge inside HUD to prevent edge clipping`**

---

### Task 4: Fix Cache-Control Headers and Remove Query `token`

**Files:**
- Modify: `src/runtime/handleRequest.js`
- Test: `tests/runtime-headers-security.test.js`

**Interfaces:**
- Consumes: `handleRequest(pathname, options)`
- Produces: Response headers containing `public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400`, ignoring query.token

- [x] **Step 1: Write tests checking `Cache-Control` header format and verifying `query.token` is rejected/ignored**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Update `handleRequest.js` headers and remove `query.token` propagation**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit `fix(runtime): send stale-while-revalidate cache headers and drop query token`**

---

### Task 5: Add Automated XML-Parse Validation to Snapshot Audit & Test Suite

**Files:**
- Modify: `tooling/scripts/snapshot_cards.js`
- Create: `tests/xml-validity.test.js`
- Modify: `work/snapshots/*.svg` (regenerate clean baselines)

**Interfaces:**
- Consumes: `runSnapshotAudit()`
- Produces: Complete audit that parses every generated SVG with strict XML validation (`xmllint`)

- [x] **Step 1: Write `tests/xml-validity.test.js` that audits all cards and validates each against `xmllint`**
- [x] **Step 2: Update `tooling/scripts/snapshot_cards.js` to include XML well-formedness validation in audit loop**
- [x] **Step 3: Regenerate all 120 snapshots via `npm run snapshot`**
- [x] **Step 4: Run `xmllint --noout work/snapshots/*.svg` and `npm test` to verify 100% pass rate**
- [x] **Step 5: Commit `feat(audit): enforce strict XML validation across all 120 card snapshots`**

---

## Phase 1 Tasks: Data Integrity & Fallbacks

### Task 1.1: Remove Fabricated Streak Fallbacks in `normalize.js`

**Files:**
- Modify: `src/core/github/normalize.js`
- Modify: `src/cards/stats/index.js`
- Test: `tests/stats-streak-zero-fallback.test.js`

**Interfaces:**
- Consumes: `normalizeStats(rawData)`
- Produces: `currentStreak: 0` and `maxStreak: 0` when contribution counts are 0, rendered as `–` or `0 Days`

- [x] **Step 1: Write failing test verifying 0-streak accounts return 0 (not 3/14) and stats card shows clean 0/–**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: In `normalizeStats`, remove fallback to 3 and 14; update stats card to handle 0 cleanly**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit `fix(normalize): remove fabricated 3 and 14 day streak fallbacks in stats`**

---

### Task 1.2: Bucket Real Commit Dates into 8 Weekly Bins for Repo Sparklines

**Files:**
- Modify: `src/core/github/normalize.js`
- Test: `tests/developer-real-sparklines.test.js`

**Interfaces:**
- Consumes: `history.nodes[i].committedDate` in `normalizeDeveloperData`
- Produces: 8-element sparkline array based on weekly commit density instead of `message.charCodeAt(0) % 7`

- [x] **Step 1: Write failing test verifying sparkline bins are determined by commit dates**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement weekly date binning from `committedDate`**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit `feat(developer): compute repo sparklines from real weekly commit bins`**

---

### Task 1.3: Remove Fake Defaults in the Developer Card

**Files:**
- Modify: `src/core/github/normalize.js`
- Modify: `src/cards/developer/components/infoPanel.js`
- Modify: `src/cards/developer/components/chapterTracker.js`
- Test: `tests/developer-fake-defaults.test.js`

**Interfaces:**
- Consumes: `profile` in developer card components
- Produces: Developer card rendering actual commit count (including 0), empty or actual commitSha, without hardcoded `'ea77b7c'`, `142`, or `14`

- [x] **Step 1: Write failing test asserting zero-commit accounts don't receive fake 142 commits, streak 14, or sha ea77b7c**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Remove hardcoded fallbacks across components**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit `fix(developer): remove hardcoded fake defaults and fallbacks`**

---

### Task 1.4: Add `data.source = 'live' | 'fallback'` and Render Explicit Data Unavailable State

**Files:**
- Modify: `src/cards/developer/index.js`
- Modify: `src/cards/developer/components/infoPanel.js`
- Test: `tests/developer-source-fallback.test.js`

**Interfaces:**
- Consumes: `developerCard.fetchData(username)` and `developerCard.renderSvg(data, theme, options)`
- Produces: `data.source = 'live' | 'fallback'`, rendering "DATA UNAVAILABLE" state rather than another user's stats on fetch error

- [x] **Step 1: Write failing test verifying failed fetch tags `source: 'fallback'` and does not show 28 repos / 64 stars / 42 followers**
- [x] **Step 2: Run test to verify it fails**
- [x] **Step 3: Implement source tagging and data unavailable UI state in developerCard**
- [x] **Step 4: Run test to verify it passes**
- [x] **Step 5: Commit `feat(developer): tag data source and display data unavailable on failed fetch`**

---

## Phase 2 Tasks: Shared Component Kit

### Task 2.1: Per-Character Text Fitting & Multi-Line Wrapping
**Files:**
- Create: `src/svg/text.js`
- Test: `tests/svg-text.test.js`

**Interfaces:**
- `measureText(text, fontPx)` => number
- `fitText(text, fontPx, maxWidth, ellipsis)` => string
- `wrapText(text, fontPx, maxWidth, maxLines)` => string[]

- [x] **Step 1: Implement calibrated per-character font metrics and binary-search fitting in `src/svg/text.js`**
- [x] **Step 2: Write tests in `tests/svg-text.test.js` validating truncation and wrapping**
- [x] **Step 3: Verify all tests pass**

---

### Task 2.2: Canonical Widths and Layout Breakpoints
**Files:**
- Create: `src/svg/layout.js`
- Test: `tests/phase2-component-kit.test.js`

**Interfaces:**
- `CANONICAL_WIDTHS`: `{ full: 830, half: 405, legacy: 495 }`
- `resolveCardWidth(widthParam, defaultWidth)` => number (clamped 300-1200)
- `getSizeClass(width)` => 'full' | 'half' | 'legacy'
- `getCardBounds(width)` => `{ paddingX, paddingY, contentWidth }`

- [x] **Step 1: Implement canonical width resolver and size classification in `src/svg/layout.js`**
- [x] **Step 2: Test resolution across keyword aliases ('full', 'half', 'legacy') and numeric values**
- [x] **Step 3: Verify all tests pass**

---

### Task 2.3: Semantic Theme Tokens & Option Resolver
**Files:**
- Modify: `src/svg/theme.js`
- Test: `tests/phase2-component-kit.test.js`

**Interfaces:**
- Semantic tokens: `positive`, `negative`, `neutral`, `ringBg`, `heatmapLevels` across all 9 built-in themes
- `resolveTheme(themeInput, options)` with `accent` and `bg=transparent` support

- [x] **Step 1: Add semantic sentiment tokens and 5-level heatmap scales to all theme palettes**
- [x] **Step 2: Implement `resolveTheme` handling custom accent hex overrides and transparent background styling**
- [x] **Step 3: Verify all tests pass**

---

### Task 2.4: Standardized Labelled Metric Tile Component
**Files:**
- Create: `src/svg/tile.js`
- Test: `tests/phase2-component-kit.test.js`

**Interfaces:**
- `renderMetricTile({ x, y, width, height, label, value, icon, delta, deltaType, subtext, accentColor, theme })`

- [x] **Step 1: Implement `renderMetricTile` ensuring visible uppercase label, prominent hero number, and delta badge**
- [x] **Step 2: Guarantee text fitting on long values/labels without card overflow**
- [x] **Step 3: Validate strict XML well-formedness via `xmllint`**

---

### Task 2.5: Shared Static-First Visual Primitives
**Files:**
- Modify: `src/svg/primitives.js`
- Test: `tests/phase2-component-kit.test.js`

**Interfaces:**
- `renderProgressRing({ score, level, x, y, radius, strokeWidth, maxScore, label, theme })`
- `renderStackedBar({ segments, width, height, x, y, rx, theme })`
- `renderCommitSparkline(bins, width, height, strokeColor, fillColor)`
- `renderHeatmapMatrix({ weeks, x, y, cellWidth, cellGap, cols, theme })`
- `renderDeltaChip({ delta, label, x, y, theme })`
- `renderTopicChips(topics, maxCount, maxWidth, theme)`
- `renderReleaseTag(tagName, theme)`
- `renderLanguageBar(languages, width, height, theme)`

- [x] **Step 1: Implement static-first SVG progress ring with track background, circular dashoffset, and centered grade**
- [x] **Step 2: Implement stacked proportion bar with rounded clip-path mask**
- [x] **Step 3: Implement 26-week / 53-week mini heatmap grid with theme-aware intensity levels**
- [x] **Step 4: Implement delta chip with positive (+), negative (-), and neutral symbols**
- [x] **Step 5: Validate 100% test pass rate across all primitives with strict XML parsing**

