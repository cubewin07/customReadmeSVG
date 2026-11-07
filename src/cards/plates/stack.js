import { graphql } from '../../core/github/client.js';
import { LANGUAGES_QUERY } from '../../core/github/queries.js';
import { normalizeLanguages } from '../../core/github/normalize.js';
import { escapeXml } from '../../svg/escape.js';
import {
  PLATE_PAD,
  PLATE_WIDTH,
  displayWidth,
  fitDisplay,
  flameRamp,
  inkOn,
  mixColor,
  plate,
  plateMetric,
  plateText,
  plateTheme,
} from '../../svg/plate.js';

const FAMILIES = {
  Web: ['JavaScript', 'TypeScript', 'HTML', 'CSS', 'SCSS', 'Less', 'Sass', 'Vue', 'Svelte', 'Astro', 'MDX', 'EJS'],
  Backend: ['Java', 'C#', 'Python', 'Go', 'Rust', 'Kotlin', 'Ruby', 'PHP', 'Scala', 'Elixir', 'C++', 'C', 'Assembly'],
  Apple: ['Swift', 'Objective-C', 'Objective-C++', 'Metal'],
  Mobile: ['Dart'],
  'Infra & data': ['Shell', 'Dockerfile', 'PLpgSQL', 'TSQL', 'HCL', 'Makefile', 'PowerShell', 'Nix', 'SQL', 'Jupyter Notebook'],
};

const FRAME_H = 50;
const FRAME_GAP = 3;
const MIN_FRAME_W = 3;
const SMALL_LABEL = 18;

function familyOf(language) {
  for (const [family, members] of Object.entries(FAMILIES)) {
    if (members.includes(language)) return family;
  }
  return 'Other';
}

function formatBytes(bytes) {
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1).replace(/\.0$/, '')} MB`;
  if (bytes >= 1e3) return `${Math.round(bytes / 1e3)} KB`;
  return `${bytes} B`;
}

function formatShare(size, total) {
  const share = (size / total) * 100;
  return share >= 10 ? `${Math.round(share)}%` : `${share.toFixed(1).replace(/\.0$/, '')}%`;
}

function hashOf(value) {
  let hash = 0;
  for (const char of String(value)) hash = (hash * 31 + char.charCodeAt(0)) % 9973;
  return hash;
}

/**
 * Builds the tree root -> family -> language -> repo. Private repositories stay in the totals but
 * are merged into one nameless frame, because this card is public.
 */
function buildTree(languages) {
  const families = new Map();
  for (const language of languages) {
    const family = familyOf(language.name);
    if (!families.has(family)) families.set(family, { name: family, size: 0, children: [] });
    const repoFrames = new Map();
    for (const repo of language.repos || []) {
      const key = repo.isPrivate ? 'private' : repo.name;
      repoFrames.set(key, (repoFrames.get(key) || 0) + repo.size);
    }
    const children = [...repoFrames]
      .map(([name, size]) => ({ name, size, children: [] }))
      .sort((a, b) => b.size - a.size);
    const node = families.get(family);
    node.size += language.size;
    node.children.push({ name: language.name, size: language.size, children });
  }
  const list = [...families.values()].sort((a, b) => b.size - a.size);
  list.forEach((family) => family.children.sort((a, b) => b.size - a.size));
  return list;
}

export const stackCard = {
  id: 'stack',
  title: 'Stack Flame Graph',
  aliases: ['flame', 'flamegraph'],
  cacheTtlMs: 21600000,

  async fetchData(username, options = {}) {
    const data = await graphql(LANGUAGES_QUERY, { login: username }, {
      ...options,
      cacheKey: options.cacheKey || `gh:stack:${username}`,
      ttlMs: options.ttlMs || this.cacheTtlMs,
    });
    const normalized = normalizeLanguages(data);
    if (!normalized || (!normalized.languages.length && !data?.user)) {
      throw new Error(`User "${username}" not found or has no repositories.`);
    }
    return normalized;
  },

  renderSvg(data, rawTheme, options = {}) {
    const theme = plateTheme(rawTheme, options);
    const width = PLATE_WIDTH;
    const pad = PLATE_PAD;
    const inner = width - pad * 2;
    const ramp = flameRamp(theme);

    const hidden = new Set(String(options.hide || '').split(',').map((h) => h.trim().toLowerCase()).filter(Boolean));
    const languages = (data?.languages || []).filter((l) => !hidden.has(l.name.toLowerCase()));
    const totalSize = languages.reduce((acc, l) => acc + (l.size || 0), 0);
    const tree = buildTree(languages);

    const headerH = 152;
    const levels = totalSize > 0 ? 4 : 1;
    const flameTop = headerH + 20;
    const rootY = flameTop + (levels - 1) * (FRAME_H + FRAME_GAP);
    const height = rootY + FRAME_H + 40;
    const yOf = (level) => rootY - level * (FRAME_H + FRAME_GAP);

    // Labels step down so nothing reads as a stub: full label, then name alone, then a long
    // enough truncation, then no label. Flame graphs routinely leave narrow frames unlabelled.
    const frameLabel = (label, name, size, room) => {
      if (displayWidth(label, size) <= room) return { shown: label, size };
      if (displayWidth(name, size) <= room) return { shown: name, size };
      if (displayWidth(name, SMALL_LABEL) <= room) return { shown: name, size: SMALL_LABEL };
      const fitted = fitDisplay(name, SMALL_LABEL, room);
      return { shown: fitted.replace(/\.\.\.$/, '').length >= 5 ? fitted : '', size: SMALL_LABEL };
    };

    const frame = ({ x, w, level, label, name = label, fill }) => {
      if (w < MIN_FRAME_W) return '';
      const y = yOf(level);
      const { shown, size } = frameLabel(label, name, level === 3 ? 22 : 25, w - 14);
      const delay = 150 + level * 170 + (x / width) * 260;
      return `<g class="frame" style="animation-delay:${Math.round(delay)}ms">
        <rect x="${x.toFixed(1)}" y="${y}" width="${Math.max(0, w - FRAME_GAP).toFixed(1)}" height="${FRAME_H}" rx="2" fill="${fill}"/>
        ${shown ? `<text x="${(x + 8).toFixed(1)}" y="${y + 33}" class="d" font-size="${size}" fill="${inkOn(fill)}">${escapeXml(shown)}</text>` : ''}
      </g>`;
    };

    let frames = '';
    if (totalSize > 0) {
      frames += frame({ x: pad, w: inner + FRAME_GAP, level: 0, label: `ALL CODE  ${formatBytes(totalSize)}`, fill: theme.text });
      let familyX = pad;
      for (const family of tree) {
        const familyW = (family.size / totalSize) * (inner + FRAME_GAP);
        frames += frame({ x: familyX, w: familyW, level: 1, label: `${family.name.toUpperCase()} ${formatShare(family.size, totalSize)}`, name: family.name.toUpperCase(), fill: ramp[3] });
        let languageX = familyX;
        for (const language of family.children) {
          const languageW = (language.size / totalSize) * (inner + FRAME_GAP);
          const languageFill = ramp[hashOf(language.name) % 3];
          frames += frame({ x: languageX, w: languageW, level: 2, label: `${language.name} ${formatShare(language.size, totalSize)}`, name: language.name, fill: languageFill });
          let repoX = languageX;
          for (const repo of language.children) {
            const repoW = (repo.size / totalSize) * (inner + FRAME_GAP);
            const repoFill = repo.name === 'private'
              ? mixColor(languageFill, theme.bg === 'transparent' ? '#000000' : theme.bg, 0.72)
              : mixColor(languageFill, '#ffffff', 0.28 + (hashOf(repo.name) % 4) * 0.08);
            frames += frame({ x: repoX, w: repoW, level: 3, label: repo.name, fill: repoFill });
            repoX += repoW;
          }
          languageX += languageW;
        }
        familyX += familyW;
      }
    } else {
      frames = plateText(pad, rootY + 34, 'NO LANGUAGE DATA FOR THIS ACCOUNT YET', 'd mut', 'font-size="28"');
    }

    const count = languages.length;
    const countSize = 124;
    const countText = String(count);
    const countW = displayWidth(countText, countSize);
    const metricsX = width - pad - 330;

    return plate({
      height,
      title: `${count} languages across ${data?.totalRepos ?? 0} repositories, shown as a flame graph`,
      theme,
      css: `
        .frame{animation:plateFade .45s ease-out both;}
      `,
      body: `
        ${plateText(pad - 2, 142, countText, 'd hot', `font-size="${countSize}"`)}
        ${plateText(pad + countW + 18, 104, 'LANGUAGES', 'd ink', 'font-size="64"')}
        ${plateText(pad + countW + 20, 140, 'WIDTH IS BYTES OF CODE', 'm mut', 'font-size="15"')}
        ${plateMetric({ x: metricsX, y: 106, value: formatBytes(totalSize), label: 'of code' })}
        ${plateMetric({ x: metricsX + 190, y: 106, value: String(data?.totalRepos ?? 0), label: 'repositories' })}
        ${frames}
      `,
    });
  },
};

export default stackCard;
