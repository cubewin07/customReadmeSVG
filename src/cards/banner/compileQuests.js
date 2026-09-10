/**
 * Quest Compiler for Banner Adventure
 * Transforms live GitHub repository and user data into an ability-gated adventure quest plan.
 *
 * BANNER-ADVENTURE: Phase 1 Quest Compiler
 * Spec: work/plans/banner-adventure-phases.md
 */

/**
 * @typedef {object} QuestPaint
 * @property {string} name          repo.name, truncated to 16 chars for marquee
 * @property {string} lang          primaryLanguage.name or 'Code'
 * @property {string} langColor     primaryLanguage.color or '#00f0ff'
 * @property {'gauges'|'candles'|'laser'|'leds'|'terminal'} widget
 * @property {string} [tagline]     optional overlay from KNOWN_PROJECTS or description slice <=40 chars
 *
 * @typedef {object} QuestStage
 * @property {object} repo          original repo object (do not mutate)
 * @property {'lab'|'vault'|'forge'|'tower'} archetype
 * @property {'scan'|'dash'|'trace'|'climb'} ability
 * @property {1|2|3} difficulty     stored in Phase 1; interiors play as d2
 * @property {QuestPaint} paint
 *
 * @typedef {object} QuestPlan
 * @property {string} username
 * @property {QuestStage[]} stages  length 1..4
 * @property {{ orbs: QuestPaint[] }} campfire
 * @property {object} stats
 */

export const KNOWN_PROJECT_TAGLINES = {
  istats: { tagline: 'Real-time macOS CPU, RAM & GPU Monitor', widget: 'gauges' },
  'financial-management': { tagline: 'Smart Budgeting, Expense Analytics & Limits', widget: 'candles' },
  customreadmesvg: { tagline: 'Dynamic Looping SVG Engine & Serverless API', widget: 'laser' },
  animelog: { tagline: 'Personalized Media Tracking & Watch Analytics', widget: 'terminal' },
  'movie-explorer': { tagline: 'TMDB Movie & Show Discovery Platform', widget: 'terminal' },
  'csharp-practice': { tagline: 'Async Architecture, Algorithms & Concurrency', widget: 'leds' },
  'skills-hub': { tagline: 'Autonomous AI Skills & Prompt Workflows', widget: 'leds' },
};

const ORDER = ['lab', 'vault', 'forge', 'tower'];
const ABILITIES = ['scan', 'dash', 'trace', 'climb'];

/**
 * Derives archetype preferences for a repository based on language, topics, and description.
 * @param {object} repo
 * @returns {Array<'lab'|'vault'|'forge'|'tower'>}
 */
export function getArchetypePreferences(repo) {
  const topics = (repo.topics || []).map(t => String(t).toLowerCase());
  const name = (repo.name || '').toLowerCase();
  const desc = (repo.description || '').toLowerCase();
  const lang = repo.primaryLanguage?.name || '';
  const blob = `${name} ${desc} ${topics.join(' ')}`;

  if (['Swift', 'Kotlin', 'Dart', 'Objective-C'].includes(lang) || /macos|ios|swiftui/.test(blob)) {
    return ['lab', 'tower', 'forge'];
  }
  if (['C#', 'Java', 'Go', 'Rust', 'C++'].includes(lang) || /backend|api|dotnet|\.net/.test(blob)) {
    return ['tower', 'lab', 'vault'];
  }
  if (/svg|readme|graphics|cli|smil/.test(blob)) {
    return ['forge', 'vault', 'lab'];
  }
  if ((lang === 'JavaScript' || lang === 'TypeScript') && /react|finance|dashboard|budget/.test(blob)) {
    return ['vault', 'forge', 'lab'];
  }
  if (lang === 'JavaScript' || lang === 'TypeScript') {
    return ['vault', 'forge', 'lab'];
  }
  if (['Python', 'R'].includes(lang) || /data|ml|jupyter/.test(blob)) {
    return ['lab', 'vault', 'tower'];
  }
  return ['lab', 'vault', 'forge', 'tower'];
}

/**
 * Determines the widget for an interior side panel.
 * @param {object} repo
 * @returns {'gauges'|'candles'|'laser'|'leds'|'terminal'}
 */
export function getRepoWidget(repo) {
  const cleanName = (repo.name || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const known = KNOWN_PROJECT_TAGLINES[cleanName];
  if (known?.widget) return known.widget;

  const topics = (repo.topics || []).map(t => String(t).toLowerCase());
  const blob = `${repo.name || ''} ${repo.description || ''} ${topics.join(' ')}`.toLowerCase();

  if (/cpu|ram|monitor|macos/.test(blob)) return 'gauges';
  if (/finance|budget|money/.test(blob)) return 'candles';
  if (/svg|animation|graphic/.test(blob)) return 'laser';
  if (/async|server|api|\.net|dotnet/.test(blob)) return 'leds';
  return 'terminal';
}

/**
 * Calculates difficulty score (1, 2, or 3) from repo metadata.
 * @param {object} repo
 * @returns {1|2|3}
 */
export function calculateDifficulty(repo) {
  const stars = repo.stargazerCount || 0;
  const disk = repo.diskUsage || 0;
  const langs = (repo.languages || []).length;
  const score = Math.log(stars + 1) + Math.log(disk + 1) + Math.min(langs, 4);
  return score < 4 ? 1 : score < 8 ? 2 : 3;
}

/**
 * Compiles repositories and user data into a structured QuestPlan.
 * @param {object} data
 * @returns {QuestPlan}
 */
export function compileQuests(data = {}) {
  const username = data.username || 'cubewin07';
  const rawRepos = Array.isArray(data.repos) ? data.repos : [];

  // 1. Pinned repos sorted by pinIndex
  const pinned = rawRepos
    .filter(r => Boolean(r.pinned))
    .sort((a, b) => {
      const idxA = typeof a.pinIndex === 'number' ? a.pinIndex : 999;
      const idxB = typeof b.pinIndex === 'number' ? b.pinIndex : 999;
      return idxA - idxB;
    });

  // 2. Fill repos: unpinned, non-profile repo, having primaryLanguage, sorted by pushedAt desc
  const fill = rawRepos
    .filter(r => !r.pinned && (r.name || '').toLowerCase() !== username.toLowerCase() && Boolean(r.primaryLanguage?.name))
    .sort((a, b) => {
      const dateA = a.pushedAt ? new Date(a.pushedAt).getTime() : 0;
      const dateB = b.pushedAt ? new Date(b.pushedAt).getTime() : 0;
      return dateB - dateA;
    });

  // 3. Deduplicate by lowercase name and cap at 4
  const seenNames = new Set();
  const chosen = [];
  for (const repo of [...pinned, ...fill]) {
    const key = (repo.name || '').toLowerCase();
    if (key && !seenNames.has(key)) {
      seenNames.add(key);
      chosen.push(repo);
      if (chosen.length === 4) break;
    }
  }

  // 4. Fallback if fewer than 1 chosen
  if (chosen.length === 0) {
    for (const repo of rawRepos) {
      const key = (repo.name || '').toLowerCase();
      if (key && !seenNames.has(key)) {
        seenNames.add(key);
        chosen.push(repo);
        if (chosen.length === 4) break;
      }
    }
  }

  // Assign greedy unique archetypes
  const usedArchetypes = new Set();
  const stages = chosen.map((repo, i) => {
    const prefs = getArchetypePreferences(repo);
    const pick =
      prefs.find(p => !usedArchetypes.has(p)) ||
      ORDER.find(o => !usedArchetypes.has(o)) ||
      prefs[0] ||
      'lab';
    usedArchetypes.add(pick);

    const cleanName = (repo.name || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
    const known = KNOWN_PROJECT_TAGLINES[cleanName];

    const rawTagline = known?.tagline || (repo.description && repo.description.trim()) || 'Interactive Project';
    const tagline = rawTagline.length > 40 ? `${rawTagline.slice(0, 37)}...` : rawTagline;

    const paint = {
      name: (repo.name || 'project').slice(0, 16),
      lang: repo.primaryLanguage?.name || 'Code',
      langColor: repo.primaryLanguage?.color || '#00f0ff',
      widget: getRepoWidget(repo),
      tagline,
    };

    return {
      repo,
      archetype: pick,
      ability: ABILITIES[i] || 'scan',
      difficulty: calculateDifficulty(repo),
      paint,
    };
  });

  return {
    username,
    stages,
    campfire: {
      orbs: stages.map(s => s.paint),
    },
    stats: data.stats || { totalStars: 0, totalCommits: 0, totalRepos: 0 },
  };
}

export default compileQuests;
