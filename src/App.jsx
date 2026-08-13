import { useState } from 'react';
import './App.css';

const THEMES = [
  { id: 'dark', name: 'Dark' },
  { id: 'light', name: 'Light' },
  { id: 'radical', name: 'Radical' },
  { id: 'nord', name: 'Nord' },
  { id: 'gruvbox', name: 'Gruvbox' },
  { id: 'dracula', name: 'Dracula' },
  { id: 'tokyonight', name: 'Tokyo Night' },
  { id: 'catppuccin', name: 'Catppuccin' },
  { id: 'synthwave', name: 'Synthwave' },
];

const CARDS = [
  { id: 'profile', name: 'Profile Overview', route: '/:user' },
  { id: 'languages', name: 'Top Languages', route: '/:user/languages' },
  { id: 'repos', name: 'Top Repositories', route: '/:user/repos' },
  { id: 'stats', name: 'GitHub Stats', route: '/:user/stats' },
];

function App() {
  const [username, setUsername] = useState('octocat');
  const [card, setCard] = useState('profile');
  const [version, setVersion] = useState('v1');
  const [langLayout, setLangLayout] = useState('polyglot');
  const [repoLayout, setRepoLayout] = useState('grid');
  const [langsCount, setLangsCount] = useState('12');
  const [theme, setTheme] = useState('dark');
  const [cacheBypass, setCacheBypass] = useState(false);
  const [activeTab, setActiveTab] = useState('markdown');
  const [copied, setCopied] = useState(false);

  const cleanUser = username.trim() || 'octocat';

  // Construct URL
  const getBaseUrl = () => {
    if (typeof window === 'undefined') return '';
    const base = import.meta.env.BASE_URL || '/';
    if (base === '/' || base === './') {
      return window.location.origin;
    }
    return `${window.location.origin}${base.replace(/\/$/, '')}`;
  };

  const baseUrl = getBaseUrl();
  const path = card === 'profile' ? `/${cleanUser}` : `/${cleanUser}/${card}`;
  
  const params = new URLSearchParams();
  if (version) {
    params.set('version', version);
  }
  if (card === 'languages') {
    if (langLayout) params.set('layout', langLayout);
    if (langsCount) params.set('langs_count', langsCount);
  }
  if (card === 'repos') {
    if (repoLayout) params.set('layout', repoLayout);
  }
  if (theme && theme !== 'light') {
    params.set('theme', theme);
  }
  if (cacheBypass) {
    params.set('cache', '0');
  }

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const cardUrl = `${baseUrl}${path}${queryStr}`;
  const relativeUrl = `${path}${queryStr}`;

  const markdownSnippet = `![${cleanUser}'s GitHub Card](${cardUrl})`;
  const htmlSnippet = `<img src="${cardUrl}" alt="${cleanUser}'s GitHub Card" />`;

  const currentSnippet = activeTab === 'markdown' ? markdownSnippet : htmlSnippet;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">Custom README SVG</h1>
        <p className="app-subtitle">
          Dynamic, extensible SVG cards for your GitHub profile README.
        </p>
        <div className="badge-row">
          <span className="badge">v1 Cards Live</span>
          <span className="badge">Plugin Architecture</span>
          <span className="badge">GraphQL Powered</span>
        </div>
      </header>

      {/* Routes Explanation Section */}
      <section className="routes-section">
        <h2 className="section-title">
          <span>📌</span> Available SVG Routes
        </h2>
        <div className="routes-grid">
          {CARDS.map((c) => (
            <div
              key={c.id}
              className={`route-card ${card === c.id ? 'active' : ''}`}
              onClick={() => setCard(c.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="route-path">GET {c.route}</div>
              <div className="route-desc">{c.name} card SVG document</div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Playground */}
      <section className="playground-section">
        <h2 className="section-title">
          <span>🛠️</span> Interactive Card Generator
        </h2>

        <div className="playground-grid">
          {/* Controls Panel */}
          <div className="controls-panel">
            {/* Username Input */}
            <div className="control-group">
              <label className="control-label" htmlFor="username-input">
                GitHub Username
              </label>
              <input
                id="username-input"
                type="text"
                className="text-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. octocat"
              />
              <div className="presets">
                <button className="preset-btn" onClick={() => setUsername('octocat')}>octocat</button>
                <button className="preset-btn" onClick={() => setUsername('torvalds')}>torvalds</button>
                <button className="preset-btn" onClick={() => setUsername('gaearon')}>gaearon</button>
              </div>
            </div>

            {/* Card Version Switcher */}
            <div className="control-group">
              <label className="control-label">Card Design Version</label>
              <div className="card-type-grid">
                <button
                  className={`card-type-btn ${version === 'v1' ? 'active' : ''}`}
                  onClick={() => setVersion('v1')}
                >
                  v1 (Informative & Modern)
                </button>
                <button
                  className={`card-type-btn ${version === 'v0' ? 'active' : ''}`}
                  onClick={() => setVersion('v0')}
                >
                  v0 (Classic Basic)
                </button>
              </div>
            </div>

            {/* Card Selection */}
            <div className="control-group">
              <label className="control-label">Card Type</label>
              <div className="card-type-grid">
                {CARDS.map((c) => (
                  <button
                    key={c.id}
                    className={`card-type-btn ${card === c.id ? 'active' : ''}`}
                    onClick={() => setCard(c.id)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Languages Layout Selector (only when card === 'languages') */}
            {card === 'languages' && (
              <>
                <div className="control-group">
                  <label className="control-label">Languages Layout Style</label>
                  <div className="card-type-grid">
                    <button
                      className={`card-type-btn ${langLayout === 'polyglot' ? 'active' : ''}`}
                      onClick={() => setLangLayout('polyglot')}
                    >
                      ⚡ Polyglot Grid (12+ Languages)
                    </button>
                    <button
                      className={`card-type-btn ${langLayout === 'donut' ? 'active' : ''}`}
                      onClick={() => setLangLayout('donut')}
                    >
                      Donut Chart
                    </button>
                    <button
                      className={`card-type-btn ${langLayout === 'compact' ? 'active' : ''}`}
                      onClick={() => setLangLayout('compact')}
                    >
                      Compact Grid
                    </button>
                    <button
                      className={`card-type-btn ${langLayout === 'list' ? 'active' : ''}`}
                      onClick={() => setLangLayout('list')}
                    >
                      Full Stacked Bars
                    </button>
                  </div>
                </div>

                <div className="control-group">
                  <label className="control-label" htmlFor="langs-count-select">Languages Display Count</label>
                  <select
                    id="langs-count-select"
                    className="select-input"
                    value={langsCount}
                    onChange={(e) => setLangsCount(e.target.value)}
                  >
                    <option value="6">Top 6 Languages</option>
                    <option value="10">Top 10 Languages</option>
                    <option value="12">Top 12 Languages (Polyglot)</option>
                    <option value="16">Top 16 Languages (Max Multi-Lang)</option>
                  </select>
                </div>
              </>
            )}

            {/* Repositories Layout Selector (only when card === 'repos') */}
            {card === 'repos' && (
              <div className="control-group">
                <label className="control-label">Repositories Layout Style</label>
                <div className="card-type-grid">
                  <button
                    className={`card-type-btn ${repoLayout === 'grid' ? 'active' : ''}`}
                    onClick={() => setRepoLayout('grid')}
                  >
                    ⚡ 2-Column Grid
                  </button>
                  <button
                    className={`card-type-btn ${repoLayout === 'featured' ? 'active' : ''}`}
                    onClick={() => setRepoLayout('featured')}
                  >
                    🌟 Featured Project
                  </button>
                  <button
                    className={`card-type-btn ${repoLayout === 'spotlight' ? 'active' : ''}`}
                    onClick={() => setRepoLayout('spotlight')}
                  >
                    ✨ Asymmetrical Spotlight
                  </button>
                  <button
                    className={`card-type-btn ${repoLayout === 'timeline' ? 'active' : ''}`}
                    onClick={() => setRepoLayout('timeline')}
                  >
                    🌿 Git Timeline
                  </button>
                  <button
                    className={`card-type-btn ${repoLayout === 'leaderboard' ? 'active' : ''}`}
                    onClick={() => setRepoLayout('leaderboard')}
                  >
                    🏆 Rank Standings
                  </button>
                </div>
              </div>
            )}


            {/* Theme Selector */}
            <div className="control-group">
              <label className="control-label" htmlFor="theme-select">Theme Palette</label>
              <select
                id="theme-select"
                className="select-input"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                {THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cache Bypass Checkbox */}
            <div className="control-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={cacheBypass}
                  onChange={(e) => setCacheBypass(e.target.checked)}
                />
                Bypass Cache (?cache=0)
              </label>
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="preview-panel">
            <div className="preview-header">
              <span className="preview-title">Live SVG Card Preview</span>
              <span className="url-badge">{relativeUrl}</span>
            </div>

            <div className="card-display-box">
              <img
                src={cardUrl}
                alt={`${cleanUser}'s ${card} card`}
                className="preview-img"
                key={cardUrl}
              />
            </div>

            {/* Embed Snippets */}
            <div className="embed-section">
              <div className="tab-row">
                <button
                  className={`tab-btn ${activeTab === 'markdown' ? 'active' : ''}`}
                  onClick={() => setActiveTab('markdown')}
                >
                  Markdown Embed
                </button>
                <button
                  className={`tab-btn ${activeTab === 'html' ? 'active' : ''}`}
                  onClick={() => setActiveTab('html')}
                >
                  HTML Tag
                </button>
              </div>

              <div className="code-box-wrapper">
                <pre className="code-block">{currentSnippet}</pre>
                <button
                  className={`copy-btn ${copied ? 'copied' : ''}`}
                  onClick={handleCopy}
                >
                  {copied ? '✓ Copied!' : 'Copy Snippet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="app-footer">
        <p>customReadmeSVG &bull; Built with Vite, React & GraphQL &bull; Extensible Plugin Architecture</p>
      </footer>
    </div>
  );
}

export default App;
