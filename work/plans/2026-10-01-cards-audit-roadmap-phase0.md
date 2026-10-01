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
