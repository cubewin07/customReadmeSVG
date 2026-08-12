import { useState } from 'react';
import './App.css';

const THEMES = [
  { id: 'dark', name: 'Dark' },
  { id: 'light', name: 'Light' },
  { id: 'radical', name: 'Radical' },
  { id: 'nord', name: 'Nord' },
  { id: 'gruvbox', name: 'Gruvbox' },
  { id: 'dracula', name: 'Dracula' },
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
          <span className="badge">Plugin Architecture</span>
          <span className="badge">GraphQL Powered</span>
          <span className="badge">Zero Heavy Bundles</span>
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
