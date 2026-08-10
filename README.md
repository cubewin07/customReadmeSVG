# customReadmeSVG

Dynamic, extensible SVG card generator for GitHub profile READMEs, powered by the GitHub GraphQL API, Axios, and a pluggable cache engine.

![Custom Readme SVG Banner](https://img.shields.io/badge/Architecture-Extensible%20Card%20Plugins-blue)
![GraphQL](https://img.shields.io/badge/API-GitHub%20GraphQL-pink)
![Vite](https://img.shields.io/badge/Runtime-Vite%20Middleware-purple)

---

## 🚀 Overview & Features

`customReadmeSVG` generates dynamic, customizable SVG cards designed for embedding directly in your GitHub profile `README.md`.

* **Extensible Plugin Registry**: Easily register custom card plugins conforming to a simple `CardPlugin` contract.
* **GraphQL Data Layer**: Efficiently fetches profile, repository, language byte count, and metric data via GitHub GraphQL API.
* **Pluggable Caching**: Built-in memory cache engine with customizable TTLs to stay well within GitHub API rate limits.
* **Dev Server Middleware**: Seamless local development experience serving raw SVG requests directly via Vite dev server.
* **Theme System**: Supports built-in color themes (`dark`, `light`, `radical`, `nord`, `gruvbox`, `dracula`).

---

## 📌 Available SVG Routes & Embed Examples

### Routes

| Route | Card Plugin | Default TTL | Description |
|---|---|---|---|
| `/:user` or `/:user/profile` | Profile Overview | 1 Hour | Name, bio, repository count, follower/following counts, location, & company |
| `/:user/languages` | Top Languages | 6 Hours | Top 5–8 programming languages aggregated by byte size with color dots & percentages |
| `/:user/repos` | Top Repositories | 2 Hours | Top 6 public non-fork repositories ordered by stargazers |
| `/:user/stats` | GitHub Stats | 1 Hour | Total stars earned, total forks, commit contributions, repo count, & followers |

### Query Parameters

* `theme`: `dark` | `light` | `radical` | `nord` | `gruvbox` | `dracula` (Default: `dark`)
* `cache`: Set `?cache=0` to bypass server-side cache.

### Markdown Embed Examples

```markdown
<!-- Profile Overview -->
![Profile Overview](https://custom-readme-svg.example.com/octocat?theme=radical)

<!-- Top Languages -->
![Top Languages](https://custom-readme-svg.example.com/octocat/languages?theme=nord)

<!-- Top Repositories -->
![Top Repositories](https://custom-readme-svg.example.com/octocat/repos?theme=dracula)

<!-- GitHub Stats -->
![GitHub Stats](https://custom-readme-svg.example.com/octocat/stats?theme=gruvbox)
```

---

## 🔑 Token & Environment Setup

The GitHub GraphQL API requires authentication. Set your Personal Access Token in `.env`:

```bash
# Copy env template
cp .env.example .env
```

Add your token:
```env
GITHUB_TOKEN=ghp_your_github_personal_access_token
# or for Vite environment loading
VITE_GITHUB_TOKEN=ghp_your_github_personal_access_token
```

When running locally with GitHub CLI (`gh`), you can pass your authenticated token directly:

```bash
export GITHUB_TOKEN=$(gh auth token)
npm run dev
```

---

## 🧩 Adding a Custom Card Plugin

To create a new card plugin, implement the `CardPlugin` interface and register it in `src/cards/index.js`:

```javascript
// src/cards/my-custom-card/index.js
import { registerCard } from '../../core/cards/registry.js';
import { graphql } from '../../core/github/client.js';

export const myCustomCard = {
  id: 'my-card',
  title: 'My Custom Card',
  aliases: ['custom'],
  cacheTtlMs: 3600000, // 1 hour in ms

  async fetchData(username, options = {}) {
    const data = await graphql(MY_QUERY, { login: username }, options);
    return normalizeMyData(data);
  },

  renderSvg(data, theme, options = {}) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="150">
      <rect width="400" height="150" fill="${theme.bg}" />
      <text x="20" y="40" fill="${theme.title}">${data.title}</text>
    </svg>`;
  },
};

// Register in registry
registerCard(myCustomCard);
```

---

## ⚡ Hosting Architecture & Deployment Notice

### GitHub Pages vs Dynamic SVG Generation

* **GitHub Pages**: Static site host. Used in this repo to publish the interactive **Card Playground SPA**. Static Pages cannot execute per-request GraphQL queries or dynamic SVG parameters (`?theme=...`).
* **Dynamic SVG Serving**: Dynamic SVG routes (`/:user`, `/:user/languages`, etc.) are processed on-demand via the pure request handler `handleRequest` in `src/runtime/handleRequest.js`.
* **Deployment Options**:
  1. **Vite Middleware**: Serves dynamic SVGs during local development (`npm run dev`).
  2. **Edge / Serverless Host**: Import `handleRequest` directly into Cloudflare Workers, Vercel Edge Functions, or Node.js serverless handlers for live production README embeds.

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start Vite dev server with SVG route middleware
export GITHUB_TOKEN=$(gh auth token)
npm run dev

# Test SVG endpoint in terminal
curl -s http://localhost:5173/octocat/stats | head -n 20

# Build production SPA bundle for GitHub Pages
npm run build
```
