# Custom README SVG — Master Plan

## Vision

A service that returns **SVG badges/cards** for GitHub profiles, embeddable in README.md:

```
https://<domain>/<username>                 → profile overview card
https://<domain>/<username>/languages       → top languages
https://<domain>/<username>/repos           → top repos
https://<domain>/<username>/stats           → contribution-ish stats
```

Hosted primarily via **GitHub Pages** (static SPA + docs/playground). Dynamic SVG for live README embeds needs a thin runtime (dev middleware now; edge-ready handler for later). Architecture stays **plugin-based** so new card types are one folder + registry entry.

## Constraints & decisions

| Constraint | Decision |
|---|---|
| GitHub Pages is static only | SPA for landing + playground; SVG routes via Vite middleware in dev; pure `handleSvgRequest` export for future Workers/Functions |
| Rate limits | GraphQL only (Axios), pluggable cache (memory + localStorage browser / file optional node) |
| Extensibility | `CardPlugin` interface + registry; new cards = implement interface + register |
| Auth | `GITHUB_TOKEN` / `VITE_GITHUB_TOKEN` optional; unauthenticated works with low limits |
| Stack | Vite + React (existing), Axios, no heavy frameworks |

## Architecture

```
src/
  core/
    github/
      client.js          # Axios GraphQL client
      queries.js         # Named GraphQL documents
      types.js           # JSDoc / shared shapes
    cache/
      memory.js
      localStorage.js
      index.js           # Cache interface + factory
    cards/
      registry.js        # register / get / list
      types.js           # CardPlugin contract
  cards/
    profile/             # default card at /:user
      index.js
      query.js
      render.js
    languages/
    repos/
    stats/
  svg/
    theme.js             # colors, fonts, dark/light
    escape.js
    layout.js
  runtime/
    handleRequest.js     # (path, opts) => { status, headers, body }
    vitePluginSvg.js     # dev middleware wiring handleRequest
  app/                   # React landing + live preview playground
    ...
```

### CardPlugin contract

```js
/**
 * @typedef {object} CardPlugin
 * @property {string} id                 // route segment: 'languages' | 'repos' | ...
 * @property {string} title
 * @property {string[]} [aliases]        // optional extra route names
 * @property {(username: string, ctx) => Promise<object>} fetchData
 * @property {(data: object, theme: object) => string} renderSvg
 * @property {number} [cacheTtlMs]       // default e.g. 1h
 */
```

Default card (`id: 'profile'`) is served at `/:user` with no extra segment.

### Routing

- `GET /:username` → profile card SVG (if Accept prefers image OR `?format=svg` OR path used as image)
- `GET /:username/:card` → registered card
- SPA routes for docs: `/`, `/docs`, `/playground` — never collide with known static assets
- Query params: `?theme=dark|light`, `?cache=0` (bypass)

### GitHub GraphQL (initial cards)

1. **profile** — user login, name, bio, avatar, followers, following, publicRepos, createdAt
2. **languages** — aggregate languages across owned repos (top N by size)
3. **repos** — top repos by stars (name, desc, stars, forks, language)
4. **stats** — total stars, forks, watchers sum, repo count, maybe contributionsCollection if token allows

### Cache keys

`gh:{cardId}:{username}:{theme}` with TTL per card (default 3600s).

### Hosting story

1. **Dev**: Vite plugin serves SVG at `/:user` and `/:user/:card`
2. **GitHub Pages**: static SPA (docs + playground that generates SVG client-side for preview/copy)
3. **Future edge**: same `handleRequest` dropped into Worker — zero rewrite of cards

## Phased work

### Phase 0 — Research (ghapi agent)
- Map GraphHub GraphQL fields for the 4 cards
- Note rate-limit headers, auth, and cost of queries
- Write `work/plans/github-graphql-api.md`

### Phase 1 — Core scaffold (builder agent)
- Install axios
- Implement client, cache, registry, theme, handleRequest stub
- Vite plugin middleware
- Empty card plugins registered

### Phase 2 — Card implementations (both agents)
- ghapi: queries + fetchData for each card
- builder: SVG renderers + playground UI

### Phase 3 — Polish
- README with embed examples
- Error SVGs (user not found, rate limited)
- Theme support
- Deploy workflow stays for SPA

## Verification

- `npm run dev` → visit `/octocat` returns SVG
- `/octocat/languages`, `/octocat/repos`, `/octocat/stats` work
- Second request hits cache (no extra GraphQL)
- `npm run build` succeeds for Pages deploy
- Adding a card only touches `src/cards/<id>/` + one register call

## Skills loaded (orchestrator)

- `herdr` (sibling pane orchestration)
- `tooling/skills/REGISTRY.md`
- `tooling/skills/shared/karpathy-coding-principles.md`
- `tooling/skills/workflow/superpowers-writing-plans.md`
