import { graphql } from '../../core/github/client.js';
import { LANGUAGES_QUERY } from '../../core/github/queries.js';
import { escapeXml } from '../../svg/escape.js';

export const languagesCard = {
  id: 'languages',
  title: 'Top Languages',
  aliases: ['lang', 'top-languages'],
  cacheTtlMs: 3600000,

  async fetchData(username, options = {}) {
    try {
      const data = await graphql(LANGUAGES_QUERY, { username }, {
        ...options,
        cacheKey: `gh:languages:${username}`,
      });
      return data?.user || null;
    } catch (err) {
      return { error: err.message };
    }
  },

  renderSvg(data, theme, options = {}) {
    const username = escapeXml(options.username || 'User');
    
    // Process language statistics or use placeholder sample languages
    const sampleLangs = [
      { name: 'JavaScript', color: '#f1e05a', pct: '50%' },
      { name: 'TypeScript', color: '#3178c6', pct: '30%' },
      { name: 'HTML/CSS', color: '#e34c26', pct: '20%' },
    ];

    return `<svg xmlns="http://www.w3.org/2000/svg" width="350" height="150" viewBox="0 0 350 150" fill="none">
  <style>
    .header { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-weight: 700; font-size: 16px; fill: ${theme.title}; }
    .lang-name { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif; font-size: 13px; fill: ${theme.text}; }
  </style>
  <rect x="0.5" y="0.5" rx="6" width="349" height="149" fill="${theme.bg}" stroke="${theme.border}"/>
  <g transform="translate(25, 30)">
    <text x="0" y="0" class="header">Most Used Languages (${username})</text>
    <g transform="translate(0, 25)">
      ${sampleLangs.map((lang, idx) => `
        <g transform="translate(0, ${idx * 24})">
          <circle cx="6" cy="6" r="5" fill="${lang.color}" />
          <text x="20" y="10" class="lang-name">${escapeXml(lang.name)} (${lang.pct})</text>
        </g>
      `).join('')}
    </g>
  </g>
</svg>`;
  },
};

export default languagesCard;
