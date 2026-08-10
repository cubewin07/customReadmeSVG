# Custom README SVG — Core Architecture & Extensibility Guide

## System Overview

`customReadmeSVG` is built with a plugin-based architecture for generating dynamic SVG cards for GitHub profiles.

```
Request (e.g., /octocat/languages?theme=dark)
   │
   ▼
Vite Dev Middleware / Edge Handler (src/runtime/vitePluginSvg.js & handleRequest.js)
   │
   ▼
Card Registry (src/core/cards/registry.js) → resolves plugin 'languages'
   │
   ▼
Card Plugin (src/cards/languages/index.js)
   ├─ fetchData(username, opts) → Axios GraphQL Client (src/core/github/client.js) + Cache (src/core/cache/index.js)
   └─ renderSvg(data, theme) → SVG string builder using escapeXml (src/svg/escape.js) & theme (src/svg/theme.js)
   │
   ▼
HTTP Response: Content-Type: image/svg+xml; charset=utf-8
```

## Example Paths

- **Profile Card (default)**: `http://localhost:5173/octocat` or `http://localhost:5173/octocat/profile`
- **Languages Card**: `http://localhost:5173/octocat/languages`
- **Repositories Card**: `http://localhost:5173/octocat/repos`
- **Stats Card**: `http://localhost:5173/octocat/stats`
- **With Query Parameters**: `http://localhost:5173/octocat/languages?theme=dark&cache=0`

---

## How to Add a New Card Plugin (< 10 Steps)

1. **Create Card Directory**: Create a folder `src/cards/<new-card-name>/`.
2. **Create Plugin File**: Create `src/cards/<new-card-name>/index.js`.
3. **Define Plugin Object**: Export a `CardPlugin` object with `id`, `title`, and optional `aliases`:
   ```javascript
   export const newCard = {
     id: 'my-card',
     title: 'My Custom Card',
     aliases: ['my-card-alias'],
     cacheTtlMs: 3600000,
     async fetchData(username, options = {}) { ... },
     renderSvg(data, theme, options = {}) { ... }
   };
   ```
4. **Add GraphQL Query**: Add or import query document in `src/core/github/queries.js`.
5. **Implement `fetchData`**: Call `graphql(QUERY, { username }, { ...options, cacheKey: \`gh:my-card:\${username}\` })`.
6. **Implement `renderSvg`**: Construct SVG markup string using `data`, `theme` palette from `src/svg/theme.js`, and `escapeXml` from `src/svg/escape.js`.
7. **Register Plugin**: In `src/cards/index.js`, import `newCard` and register it using `registerCard(newCard)`.
8. **Test Route**: Access `http://localhost:5173/<username>/my-card` in the browser or via curl.
