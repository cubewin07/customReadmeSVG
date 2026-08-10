export const themes = {
  light: {
    bg: '#ffffff',
    border: '#e1e4e8',
    title: '#0366d6',
    text: '#24292e',
    secondaryText: '#586069',
    accent: '#28a745',
    barBg: '#e1e4e8',
    cardBg: '#f6f8fa',
  },
  dark: {
    bg: '#0d1117',
    border: '#30363d',
    title: '#58a6ff',
    text: '#c9d1d9',
    secondaryText: '#8b949e',
    accent: '#3fb950',
    barBg: '#21262d',
    cardBg: '#161b22',
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
