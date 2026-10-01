export const themes = {
  light: {
    bg: '#ffffff',
    border: '#e1e4e8',
    subtleBorder: '#eaecef',
    title: '#0366d6',
    text: '#24292e',
    secondaryText: '#586069',
    accent: '#28a745',
    iconColor: '#0366d6',
    barBg: '#e1e4e8',
    cardBg: '#f6f8fa',
    badgeBg: '#eaf5ff',
    positive: '#28a745',
    negative: '#d73a49',
    neutral: '#586069',
    ringBg: '#e1e4e8',
    heatmapLevels: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  },
  dark: {
    bg: '#0d1117',
    border: '#30363d',
    subtleBorder: '#21262d',
    title: '#58a6ff',
    text: '#c9d1d9',
    secondaryText: '#8b949e',
    accent: '#3fb950',
    iconColor: '#58a6ff',
    barBg: '#21262d',
    cardBg: '#161b22',
    badgeBg: '#1f6feb26',
    positive: '#3fb950',
    negative: '#f85149',
    neutral: '#8b949e',
    ringBg: '#21262d',
    heatmapLevels: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
  },
  radical: {
    bg: '#141321',
    border: '#36344e',
    subtleBorder: '#242238',
    title: '#fe428e',
    text: '#a9fef7',
    secondaryText: '#7b729e',
    accent: '#f8d847',
    iconColor: '#fe428e',
    barBg: '#2a273f',
    cardBg: '#1d1b2e',
    badgeBg: '#fe428e26',
    positive: '#f8d847',
    negative: '#fe428e',
    neutral: '#7b729e',
    ringBg: '#2a273f',
    heatmapLevels: ['#1d1b2e', '#49284e', '#88316e', '#ca388d', '#fe428e'],
  },
  nord: {
    bg: '#2e3440',
    border: '#4c566a',
    subtleBorder: '#3b4252',
    title: '#88c0d0',
    text: '#e5e9f0',
    secondaryText: '#d8dee9',
    accent: '#a3be8c',
    iconColor: '#88c0d0',
    barBg: '#3b4252',
    cardBg: '#3b4252',
    badgeBg: '#88c0d026',
    positive: '#a3be8c',
    negative: '#bf616a',
    neutral: '#d8dee9',
    ringBg: '#3b4252',
    heatmapLevels: ['#3b4252', '#434c5e', '#4c566a', '#81a1c1', '#88c0d0'],
  },
  gruvbox: {
    bg: '#282828',
    border: '#504945',
    subtleBorder: '#3c3836',
    title: '#fabd2f',
    text: '#ebdbb2',
    secondaryText: '#a89984',
    accent: '#b8bb26',
    iconColor: '#fabd2f',
    barBg: '#3c3836',
    cardBg: '#32302f',
    badgeBg: '#fabd2f26',
    positive: '#b8bb26',
    negative: '#fb4934',
    neutral: '#a89984',
    ringBg: '#3c3836',
    heatmapLevels: ['#32302f', '#504945', '#7c6f64', '#d79921', '#fabd2f'],
  },
  dracula: {
    bg: '#282a36',
    border: '#6272a4',
    subtleBorder: '#44475a',
    title: '#ff79c6',
    text: '#f8f8f2',
    secondaryText: '#6272a4',
    accent: '#50fa7b',
    iconColor: '#bd93f9',
    barBg: '#44475a',
    cardBg: '#343746',
    badgeBg: '#ff79c626',
    positive: '#50fa7b',
    negative: '#ff5555',
    neutral: '#6272a4',
    ringBg: '#44475a',
    heatmapLevels: ['#343746', '#44475a', '#6272a4', '#bd93f9', '#ff79c6'],
  },
  tokyonight: {
    bg: '#1a1b26',
    border: '#3b4261',
    subtleBorder: '#24283b',
    title: '#7aa2f7',
    text: '#a9b1d6',
    secondaryText: '#565f89',
    accent: '#73daca',
    iconColor: '#7aa2f7',
    barBg: '#24283b',
    cardBg: '#1f2335',
    badgeBg: '#7aa2f726',
    positive: '#73daca',
    negative: '#f7768e',
    neutral: '#565f89',
    ringBg: '#24283b',
    heatmapLevels: ['#1f2335', '#292e42', '#3b4261', '#565f89', '#7aa2f7'],
  },
  catppuccin: {
    bg: '#1e1e2e',
    border: '#45475a',
    subtleBorder: '#313244',
    title: '#cba6f7',
    text: '#cdd6f4',
    secondaryText: '#a6adc8',
    accent: '#a6e3a1',
    iconColor: '#cba6f7',
    barBg: '#313244',
    cardBg: '#181825',
    badgeBg: '#cba6f726',
    positive: '#a6e3a1',
    negative: '#f38ba8',
    neutral: '#a6adc8',
    ringBg: '#313244',
    heatmapLevels: ['#181825', '#313244', '#45475a', '#a6adc8', '#cba6f7'],
  },
  synthwave: {
    bg: '#2b213a',
    border: '#493761',
    subtleBorder: '#372a4b',
    title: '#e2e9ec',
    text: '#e5e9f0',
    secondaryText: '#b094b8',
    accent: '#ef65b0',
    iconColor: '#f78c6c',
    barBg: '#372a4b',
    cardBg: '#241b30',
    badgeBg: '#ef65b026',
    positive: '#ef65b0',
    negative: '#ff5555',
    neutral: '#b094b8',
    ringBg: '#372a4b',
    heatmapLevels: ['#241b30', '#372a4b', '#5a3d75', '#a44d93', '#ef65b0'],
  },
};

/**
 * Get theme palette object by name.
 * @param {string} [name='light']
 * @returns {object}
 */
export function getTheme(name = 'light') {
  const normalized = (name || '').toLowerCase();
  return themes[normalized] || themes.light;
}

/**
 * Resolves theme with optional query overrides (accent color, transparent background).
 * @param {string|object} [themeInput='light'] - Theme name or palette object
 * @param {object} [options={}] - Query options
 * @param {string} [options.accent] - Accent hex color override
 * @param {string} [options.bg] - Background color override (e.g., 'transparent')
 * @returns {object} Resolved theme object
 */
export function resolveTheme(themeInput = 'light', options = {}) {
  let base;
  if (typeof themeInput === 'string') {
    base = getTheme(themeInput);
  } else if (themeInput && typeof themeInput === 'object') {
    base = themeInput;
  } else {
    base = themes.light;
  }

  const resolved = { ...base };

  if (options.accent) {
    let accentStr = String(options.accent).trim();
    if (!accentStr.startsWith('#') && !accentStr.startsWith('rgb')) {
      accentStr = `#${accentStr}`;
    }
    resolved.title = accentStr;
    resolved.accent = accentStr;
    resolved.iconColor = accentStr;
  }

  if (options.bg === 'transparent') {
    resolved.bg = 'transparent';
    resolved.cardBg = 'rgba(255, 255, 255, 0.04)';
  } else if (options.bg) {
    let bgStr = String(options.bg).trim();
    if (!bgStr.startsWith('#') && !bgStr.startsWith('rgb')) {
      bgStr = `#${bgStr}`;
    }
    resolved.bg = bgStr;
  }

  return resolved;
}
