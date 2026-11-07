# Phase 3: Card Variants Redesign & Field Matrix

> **Rule:** Every card variant must answer a distinct question and display a distinct slice of data.
> No variant's fields may be a subset of a sibling variant's fields.

---

## 1. Variant Field Matrix (All Cards)

| Card | Variant | Core Question | Data Fields Displayed | Unique Layout / Visualization |
|---|---|---|---|---|
| **Repos** | `grid` | What are my primary pinned projects? | Fitted name, 1-line description, up to 3 topic chips, language dot, ★ stars, ⑂ forks, `pushedAt` relative time | Equal tiles in 2×2 or 3×2 grid with topic chips |
| **Repos** | `featured` | What is my headline project? | Hero repo: name, 2-line wrapped description, topic chips, top-5 language stacked proportion bar, 8-week commit sparkline, release tag (`latestRelease.tagName`), ★, ⑂; Sub-repos: 2 compact tiles | Headline project card + 2 secondary tiles (eliminates empty orphan space) |
| **Repos** | `spotlight` | Deep-dive case study of top repo? | Spotlight repo: name, 3-line wrapped description, last commit message, commit SHA (`abbreviatedOid`), 8-week commit sparkline, ★, ⑂, watchers; Side list: 3 compact repo items | 2-column magazine layout: deep-dive left column + 3 stacked right cards |
| **Repos** | `timeline` | What have I shipped recently? | **Sorted by `pushedAt` DESC** (not stars!), last commit message, commit SHA, relative push date, language dot, ★, ⑂ | Vertical Git branch stem with commit commit-log styling per node |
| **Repos** | `leaderboard` | Which projects have the highest community adoption? | Rank standings (#1🥇, #2🥈, #3🥉, #4, #5), proportional star volume bar (vs max), ★ stars, ⑂ forks, 👁 watchers, language dot, fitted name | Comparative horizontal star-volume bar chart with rank badges |
|---|---|---|---|---|
| **Stats** | `ring` | What is my overall developer grade? | Circular composite score ring (letter grade + score/100), 5 labelled metrics (commits, PRs, issues, reviews, stars) with ▲ YoY delta indicators | Left composite circle ring + right labelled metric tiles with deltas |
| **Stats** | `mix` *(bars)* | Where does my engineering effort go? | Real contribution percentage shares (% commits, % PRs, % issues, % reviews), milestone labels, total contributions count | Proportional stacked horizontal bar (replaces arbitrary exp formula) |
| **Stats** | `crest` *(hero)* | How does my skill profile compare across dimensions? | Rank crest, composite score, 5-axis radar polygon (commits, PRs, reviews, stars, followers), score methodology caption | 5-axis radar spider chart |
| **Stats** | `year` *(dashboard)*| What is my annual contribution trajectory? | 12 monthly contribution bars, peak month indicator, longest streak, total yearly contributions | 12-month bar chart with milestone callouts |
| **Stats** | `ticker` *(compact)*| What are my key metrics at a glance? | 4 labelled metric tiles (Commits, PRs, Stars, Followers) with icons + rank grade pill | Single-row 70px compact banner |
| **Stats** | `streak` *(new)* | How consistent is my daily coding activity? | Current streak (flame), longest streak, total contributions, 26-week mini contribution heatmap | Mini heatmap matrix + streak counter capsules |
|---|---|---|---|---|
| **Profile** | `classic` | Who is this developer? | Avatar, name, @handle, 2-line wrapped bio, company, location, websiteUrl, status emoji & message, account tenure ("Joined 2020 · 6 yrs"), isHireable badge; Footer: top language, most-starred repo, followers | Identity card with link metadata and footer summary strip |
| **Profile** | `hero` | What is the strong first impression? | Large avatar, name, bio, up to 4 organization badges, top-3 language color dots, dynamic language dual-gradient banner | Language-themed dual-color banner with organization badges |
| **Profile** | `compact` | Inline identity for README header? | Avatar, name, handle, 1-line fitted bio, 3 labelled chips (repos, followers, years on GitHub) | Ultra-compact 70px single-row banner |
| **Profile** | `split` | Developer résumé / summary? | Left: identity, handle, links, location. Right: ABOUT text, CURRENTLY status, top-3 language bar, 12-month contribution sparkline | 2-column résumé layout |
| **Profile** | `activity` *(dashboard)*| How does this developer work? | Avatar, 53-week contribution heatmap, current streak, longest streak, busiest weekday, last 30-day contribution volume | 53-week full contribution heatmap + cadence metrics |
|---|---|---|---|---|
| **Languages**| `compact` | What languages do I write? | Top languages stacked proportion bar, legend chips with %, no KB clutter | Clean 110px compact bar + legend |
| **Languages**| `donut` | What is my primary language focus? | Donut chart with top language & % in center hole; Top 5 legend with "Other n%"; caption "N languages across M repos" | Donut chart with centered hero stat |
| **Languages**| `list` | How are my languages ranked across repos? | Ranked horizontal bars (#1, #2, #3), %, repo count per language, "last used Xmo ago" | Ranked individual progress bars with repo count |
| **Languages**| `polyglot` | What is my multi-language footprint? | Proportional squarified treemap with area sized by byte %, color-coded with embedded names and % labels | Treemap geometric mosaic (non-list layout) |
| **Languages**| `evolution` *(new)*| How has my language stack changed over time? | Stacked time-series area/bar comparing historical language shares vs current shares ("then vs now") | Multi-year comparative area visualization |

---

## 2. Subset Validation (Rule Check)

Each variant in the matrix has been audited to guarantee that its displayed field set is NOT a subset of any sibling variant:

1. **Repos:**
   - `grid` is the ONLY variant with topic chips across all items in a 2x2/3x2 layout.
   - `featured` is the ONLY variant with language stacked bar + release tag.
   - `spotlight` is the ONLY variant with 3-line wrapped description + last commit message & SHA + 2-column showcase.
   - `timeline` is the ONLY variant sorted by `pushedAt` DESC and rendering a Git branch stem with commit log.
   - `leaderboard` is the ONLY variant with proportional star volume bars, watchers, and #1-#5 rank badges.

2. **Stats:**
   - `ring` has YoY delta chips; `mix` has effort share percentages; `crest` has a 5-axis radar; `year` has 12 monthly bars; `ticker` has 70px 1-row form; `streak` has a 26-week heatmap.

3. **Profile:**
   - `classic` has website, company, status, and footer summary; `hero` has org avatars and language gradient banner; `compact` has 70px 3-chip row; `split` has 2-column résumé with sparkline; `activity` has 53-week heatmap and busiest weekday.

4. **Languages:**
   - `compact` has 110px stacked bar; `donut` has donut geometry with center callout; `list` has repo counts & recency; `polyglot` has treemap geometry; `evolution` has time-series evolution.

---

## 3. Implementation Plan by Card

1. **Foundation (Shared Kit):**
   - Per-character text fitting (`fitText`) and line wrapping (`wrapText`) in `src/svg/text.js`.
   - Shared primitives: topic chip, language stacked bar, 8-week commit sparkline, release tag badge.
2. **Repos Card (PR 1):**
   - Update `REPOS_QUERY` and `normalizeRepos` to fetch topics, releases, languages, watchers, and commit history.
   - Implement all 5 distinct layouts (`grid`, `featured`, `spotlight`, `timeline`, `leaderboard`).
   - Add test suite `tests/repos-variants-phase3.test.js`.
3. **Stats Card (PR 2):**
   - Redesign `mix` (real shares), `crest` (radar), `year` (12 monthly bars), `ticker` (compact), `streak` (26w heatmap), `ring` (deltas).
4. **Profile Card (PR 3):**
   - Redesign `classic`, `hero`, `compact`, `split`, `activity` (heatmap & weekday).
5. **Languages Card (PR 4):**
   - Redesign `compact`, `donut`, `list`, `polyglot` (treemap), `evolution` (then vs now), `hide` param.
