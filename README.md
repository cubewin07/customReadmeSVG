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
* **Theme System**: Supports built-in color themes (`dark`, `light`, `radical`, `nord`, `gruvbox`, `dracula`, `tokyonight`, `catppuccin`, `synthwave`).

---

## 🖼 Plates

Three wide flagship cards, each built from a form engineers already read, drawn from live GitHub data with embedded fonts. They default to the `cobalt` theme and accept any other `theme`.

### Signature: `/:user/signature`
> Your name set huge, with a year of contributions rising in front of it as ridgelines. Each ridge is four weeks, oldest at the back. Set `name` and `role` to control the wording.

<p align="center">
  <img src="assets/cards/plate-signature.svg" alt="Signature plate" width="100%" />
</p>

### Stack: `/:user/stack`
> A flame graph of your code: all code, then family, language, and repository, with width as bytes. Private repositories count toward the totals but are never named. Use `hide=Less,SCSS` to leave out languages.

<p align="center">
  <img src="assets/cards/plate-stack.svg" alt="Stack flame graph" width="100%" />
</p>

### Trace: `/:user/trace`
> A distributed-trace waterfall of the last 12 months: one lane per public repository, with weekly commits as bars.

<p align="center">
  <img src="assets/cards/plate-trace.svg" alt="Shipping trace" width="100%" />
</p>

```markdown
![Signature](https://your-deployment.netlify.app/USERNAME/signature?name=Your%20Name&role=Backend%20/%20Systems)
![Stack](https://your-deployment.netlify.app/USERNAME/stack)
![Trace](https://your-deployment.netlify.app/USERNAME/trace)
```

---

## 🎨 Live Card Showcase

SVG outputs generated directly by `customReadmeSVG`, rendered here with sample data:

### 1. Developer Showcase (Flagship Animated Cyber World)
> 36s synchronized multi-act animation featuring hologram workstation telemetry, platformer contribution runner, and isometric voxel city.

<p align="center">
  <img src="assets/cards/developer-showcase.svg" alt="Developer Showcase" width="100%" />
</p>

### 2. GitHub Stats (Telemetry HUD & Ring Gauge)
> Powered by the enhanced rank scoring engine with impact gating (peer-reviewed PRs, star density, code reviews, and community traction).

<p align="center">
  <img src="assets/cards/stats-telemetry-hud.svg" alt="GitHub Stats Cyberpunk HUD" width="100%" />
</p>

<p align="center">
  <img src="assets/cards/stats-ring.svg" alt="GitHub Stats Ring Gauge" width="100%" />
</p>

### 3. Top Languages (Polyglot Waffle) & Top Repositories
> A hundred-cell waffle with one cell per percent of code, alongside a ruled repository table with stars, forks, and last push.

<p align="center">
  <img src="assets/cards/languages-polyglot.svg" alt="Top Languages Polyglot" width="100%" />
</p>

<p align="center">
  <img src="assets/cards/repos-grid.svg" alt="Top Repositories Grid" width="100%" />
</p>

### 4. Profile Overview
> Identity under a banner built from the account's real contribution calendar, with language share and core counts.

<p align="center">
  <img src="assets/cards/profile-overview.svg" alt="Profile Overview" width="100%" />
</p>

---

## 📌 Available SVG Routes & Embed Examples

### Routes

| Route | Card Plugin | Default TTL | Description |
|---|---|---|---|
| `/:user/signature` | Signature Plate | 1 Hour | Your name set huge, with a year of contributions rising in front of it as ridgelines |
| `/:user/stack` | Stack Flame Graph | 6 Hours | Flame graph of code by family, language, and repository, with private repositories unnamed |
| `/:user/trace` | Shipping Trace | 2 Hours | Waterfall of the last 12 months with one lane per public repository and weekly commits as bars |
| `/:user` or `/:user/profile` | Profile Overview | 1 Hour | Name, bio, repository count, follower/following counts, location, & company |
| `/:user/developer` | Developer Showcase | 1 Hour | 24s 3-act animated cyber world: Workstation Desk & Pinned Repos Hologram, Contribution Graph Platformer Runner, and 3D Isometric Voxel City |
| `/:user/languages` | Top Languages | 6 Hours | Top 5–8 programming languages aggregated by byte size with color dots & percentages |
| `/:user/repos` | Top Repositories | 2 Hours | Top 6 public non-fork repositories ordered by stargazers |
| `/:user/stats` | GitHub Stats | 1 Hour | Total stars earned, total forks, commit contributions, repo count, & followers |

### Query Parameters

* `theme`: `dark` | `light` | `radical` | `nord` | `gruvbox` | `dracula` | `tokyonight` | `catppuccin` | `synthwave` (Default: `dark`)
* `role`: Custom role / title override for the Developer Showcase card (e.g. `?role=Senior+Software+Engineer`)
* `status`: Custom status message for the Developer Showcase card (e.g. `?status=Shipping+v2.0+🚀`)
* `bio`: Custom focus description override for the Developer Showcase card
* `cache`: Set `?cache=0` to bypass server-side cache.

### Markdown Embed Examples

```markdown
<!-- Developer Showcase (24s 3-Act Story Card) -->
![Developer Showcase](https://custom-readme-svg.example.com/octocat/developer?theme=tokyonight)

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
