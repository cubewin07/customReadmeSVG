/**
 * Banner Card Plugin
 * Produces an animated looping SVG banner for GitHub profile READMEs.
 *
 * BANNER-ADVENTURE: see work/plans/banner-adventure-phases.md
 * Phase 1: Quest Compiler + static hub + zoom interiors. Ability = stage index (not language).
 * No README parse. No hardcoded cubewin07 rooms as architecture.
 * After banner work: update Current State + append Agent Log in that file.
 */

import axios from 'axios';
import { graphql, getGithubToken } from '../../core/github/client.js';
import { BANNER_REPOS_QUERY } from '../../core/github/queries.js';
import { compileQuests } from './compileQuests.js';
import { buildTimeline } from './timeline.js';
import { renderInterior } from './interiors/index.js';
import { renderFoxSprite } from './foxSprite.js';
import {
  renderStars,
  renderShootingStars,
  renderNeonMoon,
  renderParallaxSkyline,
  renderHubStreet,
} from './adventureWorld.js';
import { escapeXml } from '../../svg/escape.js';

// Common GitHub language colors
const LANGUAGE_COLORS = {
  Swift: '#F05138',
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Java: '#b07219',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89e051',
  Vue: '#41b883',
  Lua: '#000080',
  Dockerfile: '#384d54',
};

// Fallback showcase repos when offline
const SHOWCASE_REPOS = [
  { name: 'iStats', description: 'Real-time macOS CPU, RAM & GPU Monitor', stargazerCount: 12, forkCount: 2, diskUsage: 450, topics: ['macos', 'swiftui', 'hardware'], pushedAt: '2026-09-01T12:00:00Z', createdAt: '2025-01-01T00:00:00Z', pinned: true, pinIndex: 0, primaryLanguage: { name: 'Swift', color: '#F05138' } },
  { name: 'financial-management', description: 'Smart Budgeting, Expense Analytics & Limits', stargazerCount: 14, forkCount: 3, diskUsage: 380, topics: ['finance', 'react', 'dashboard'], pushedAt: '2026-08-25T12:00:00Z', createdAt: '2025-02-01T00:00:00Z', pinned: true, pinIndex: 1, primaryLanguage: { name: 'JavaScript', color: '#f1e05a' } },
  { name: 'customReadmeSVG', description: 'Dynamic Looping SVG Engine & Serverless API', stargazerCount: 25, forkCount: 5, diskUsage: 512, topics: ['svg', 'animation', 'smil'], pushedAt: '2026-09-05T12:00:00Z', createdAt: '2025-03-01T00:00:00Z', pinned: true, pinIndex: 2, primaryLanguage: { name: 'JavaScript', color: '#f1e05a' } },
  { name: 'csharp-practice', description: 'Async Architecture, Algorithms & Concurrency', stargazerCount: 4, forkCount: 0, diskUsage: 210, topics: ['dotnet', 'async', 'backend'], pushedAt: '2026-07-20T12:00:00Z', createdAt: '2025-04-01T00:00:00Z', pinned: true, pinIndex: 3, primaryLanguage: { name: 'C#', color: '#178600' } },
  { name: 'animeLog', description: 'Personalized Media Tracking & Watch Analytics', stargazerCount: 8, forkCount: 1, diskUsage: 290, topics: ['media', 'react'], pushedAt: '2026-06-15T12:00:00Z', createdAt: '2025-05-01T00:00:00Z', pinned: false, pinIndex: null, primaryLanguage: { name: 'TypeScript', color: '#3178c6' } },
  { name: 'movie-explorer', description: 'TMDB Movie & Show Discovery Platform', stargazerCount: 6, forkCount: 1, diskUsage: 180, topics: ['movie', 'api'], pushedAt: '2026-05-10T12:00:00Z', createdAt: '2025-06-01T00:00:00Z', pinned: false, pinIndex: null, primaryLanguage: { name: 'JavaScript', color: '#f1e05a' } },
];

export const KNOWN_PROJECTS = {
  istats: {
    chapter: 'CHAPTER I • THE KERNEL SANCTUARY',
    domainBadge: ' NATIVE APPLE ARTIFACT',
    tagline: 'Real-time macOS CPU, RAM & GPU Monitor',
    lore: 'Piercing the Apple silicon veil to monitor the vital hardware pulse.',
    questReward: '+99 SYSTEM MASTERY',
    tags: ['SwiftUI', 'IOKit', 'Kernel'],
  },
  'financial-management': {
    chapter: 'CHAPTER II • THE CITADEL OF LEDGERS',
    domainBadge: '📊 FINTECH CITADEL',
    tagline: 'Smart Budgeting, Expense Analytics & Limits',
    lore: 'Transmuting raw transactions into golden budgetary clarity.',
    questReward: '+100 DATA CLARITY',
    tags: ['React', 'DataViz', 'Jest'],
  },
  customreadmesvg: {
    chapter: 'CHAPTER III • THE VECTOR FORGE',
    domainBadge: '⚡ GRAPHICS FORGE',
    tagline: 'Dynamic Looping SVG Engine & Serverless API',
    lore: 'Breathing kinetic SMIL magic into static developer READMEs.',
    questReward: '+150 OPEN SOURCE',
    tags: ['SMIL', 'Serverless', 'Zero-Dep'],
  },
  animelog: {
    chapter: 'CHAPTER IV • THE MEDIA OBSERVATORY',
    domainBadge: '🎬 MEDIA OBSERVATORY',
    tagline: 'Personalized Media Tracking & Watch Analytics',
    lore: 'Charting visual epics and streaming analytics across the web.',
    questReward: '+85 FULL-STACK',
    tags: ['TypeScript', 'React', 'REST APIs'],
  },
  'movie-explorer': {
    chapter: 'CHAPTER IV • THE MEDIA OBSERVATORY',
    domainBadge: '🍿 CINEMA ARCHIVE',
    tagline: 'TMDB Movie & Show Discovery Platform',
    lore: 'Observing cinematic archives and ratings across modern web APIs.',
    questReward: '+75 API AGILITY',
    tags: ['React', 'API', 'Search UI'],
  },
  'csharp-practice': {
    chapter: 'CHAPTER V • CONCURRENCY LABYRINTH',
    domainBadge: '⚙️ SYSTEMS LABYRINTH',
    tagline: 'Async Architecture, Algorithms & Concurrency',
    lore: 'Mastering parallel async threads deep within the .NET engine.',
    questReward: '+120 HIGH-PERF',
    tags: ['C# .NET', 'Async', 'Patterns'],
  },
  'skills-hub': {
    chapter: 'CHAPTER VI • AUTOMATON CITADEL',
    domainBadge: '🧠 AGENT CITADEL',
    tagline: 'Autonomous AI Skills & Prompt Workflows',
    lore: 'Orchestrating autonomous intelligence to conquer engineering tasks.',
    questReward: '+130 AI MASTERY',
    tags: ['AI Agents', 'Automation', 'Workflows'],
  },
};

export function enrichRepo(repo, index = 0) {
  const cleanName = (repo.name || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const known = KNOWN_PROJECTS[cleanName] ||
    Object.entries(KNOWN_PROJECTS).find(([k]) => cleanName.includes(k))?.[1];

  const lang = repo.primaryLanguage?.name || '';
  let chapter = `CHAPTER 0${index + 1} • THE QUEST`;
  let domainBadge = '⚡ PRODUCTION READY';
  let tagline = (repo.description && repo.description.trim().length > 0)
    ? repo.description.trim()
    : 'Interactive Engineering Project';
  let lore = 'Discovered during the developer odyssey across GitHub.';
  let questReward = `+${Math.max(50, (index + 1) * 25)} DEV XP`;
  let tags = [lang || 'Code', 'Production'];

  if (known) {
    chapter = known.chapter;
    domainBadge = known.domainBadge;
    lore = known.lore;
    questReward = known.questReward;
    if (!repo.description || repo.description.trim().length === 0) {
      tagline = known.tagline;
    }
    tags = known.tags;
  } else {
    if (lang === 'Swift' || lang === 'Objective-C') {
      domainBadge = ' APPLE NATIVE';
      tags = ['Swift', 'macOS/iOS', 'Native'];
    } else if (lang === 'TypeScript') {
      domainBadge = '🌐 FULL-STACK • TS';
      tags = ['TypeScript', 'Modern Web', 'Typed'];
    } else if (lang === 'JavaScript') {
      domainBadge = '🌐 WEB APP • JS';
      tags = ['JavaScript', 'Frontend', 'Web'];
    } else if (lang === 'C#') {
      domainBadge = '⚙️ SYSTEMS • .NET';
      tags = ['C#', '.NET Core', 'Backend'];
    } else if (lang === 'Python') {
      domainBadge = '🤖 DATA & AI • PYTHON';
      tags = ['Python', 'Data', 'Backend'];
    } else if (lang === 'Rust' || lang === 'Go' || lang === 'C++') {
      domainBadge = '⚙️ HIGH-PERF SYSTEMS';
      tags = [lang, 'Systems', 'Compiled'];
    }
  }

  return {
    ...repo,
    chapter,
    domainBadge,
    tagline,
    lore,
    questReward,
    tags,
  };
}

export const bannerCard = {
  id: 'banner',
  title: 'Animated Fox Banner',
  aliases: ['fox-banner', 'neon-banner', 'readme-banner'],
  cacheTtlMs: 7200000, // 2 hours

  /**
   * Fetches user repositories, top languages, and contribution statistics.
   */
  async fetchData(username, options = {}) {
    const { cache, cacheKey, ttlMs } = options;

    if (cache && cacheKey && cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (cached) return cached;
    }

    const token = getGithubToken(options.token);
    let repos = [];
    let languages = [];
    let stats = { totalStars: 0, totalCommits: 0, totalRepos: 0, followers: 0 };

    // Strategy 1: GraphQL API (if token available)
    if (token) {
      try {
        const data = await graphql(BANNER_REPOS_QUERY, { login: username }, {
          ...options,
          token,
        });

        const pinned = data?.user?.pinnedItems?.nodes || [];
        const topRepos = data?.user?.repositories?.nodes || [];

        const seen = new Set();
        const langByteMap = new Map();
        let totalLangBytes = 0;

        const processRepoNode = (repo, isPinned, pinIndex) => {
          if (!repo || !repo.name) return;
          const key = repo.name.toLowerCase();
          if (seen.has(key)) return;
          seen.add(key);

          const topics = repo.repositoryTopics?.nodes?.map(n => n?.topic?.name).filter(Boolean) || [];
          const repoLangs = (repo.languages?.edges || []).map(({ size, node }) => ({
            name: node?.name,
            color: node?.color || LANGUAGE_COLORS[node?.name] || '#00f0ff',
            size: size || 0,
          }));

          repos.push({
            name: repo.name,
            description: repo.description || '',
            url: repo.url || '',
            stargazerCount: repo.stargazerCount || 0,
            forkCount: repo.forkCount || 0,
            diskUsage: repo.diskUsage || 0,
            pushedAt: repo.pushedAt || null,
            createdAt: repo.createdAt || null,
            topics,
            languages: repoLangs,
            pinned: isPinned,
            pinIndex: isPinned ? pinIndex : null,
            primaryLanguage: repo.primaryLanguage || null,
          });

          // Aggregate language bytes
          for (const lang of repoLangs) {
            if (lang.name) {
              totalLangBytes += lang.size;
              const existing = langByteMap.get(lang.name) || {
                name: lang.name,
                color: lang.color,
                size: 0,
              };
              existing.size += lang.size;
              langByteMap.set(lang.name, existing);
            }
          }
        };

        pinned.forEach((r, idx) => processRepoNode(r, true, idx));
        topRepos.forEach(r => processRepoNode(r, false, null));

        if (langByteMap.size > 0) {
          languages = Array.from(langByteMap.values())
            .sort((a, b) => b.size - a.size)
            .slice(0, 4)
            .map(l => ({
              name: l.name,
              color: l.color,
              percent: totalLangBytes > 0 ? Math.round((l.size / totalLangBytes) * 100) : 75,
            }));
        }

        const totalStars = repos.reduce((sum, r) => sum + (r.stargazerCount || 0), 0);
        stats = {
          totalStars,
          totalCommits: data?.user?.contributionsCollection?.totalCommitContributions || Math.max(150, totalStars * 12 + repos.length * 35),
          totalRepos: data?.user?.repositories?.totalCount || repos.length,
          followers: data?.user?.followers?.totalCount || 0,
        };
      } catch (err) {
        console.warn(`[BannerCard] GraphQL query failed for "${username}": ${err.message}. Trying REST API...`);
      }
    }

    // Strategy 2: GitHub Public REST API (works unauthenticated for any public user)
    if (repos.length === 0) {
      try {
        const headers = {
          'User-Agent': 'customReadmeSVG-App',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        const res = await axios.get(
          `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=pushed&per_page=10`,
          { headers, timeout: 8000 }
        );

        if (Array.isArray(res.data) && res.data.length > 0) {
          repos = res.data
            .filter(r => !r.fork)
            .map(r => ({
              name: r.name,
              description: r.description || '',
              url: r.html_url || r.url || '',
              stargazerCount: r.stargazers_count || 0,
              forkCount: r.forks_count || 0,
              diskUsage: 0,
              pushedAt: r.pushed_at || null,
              createdAt: r.created_at || null,
              topics: Array.isArray(r.topics) ? r.topics : [],
              languages: [],
              pinned: false,
              pinIndex: null,
              primaryLanguage: r.language
                ? {
                    name: r.language,
                    color: LANGUAGE_COLORS[r.language] || '#00f0ff',
                  }
                : null,
            }));

          // Calculate language frequencies
          const langFreqMap = new Map();
          let totalWithLang = 0;
          for (const r of repos) {
            if (r.primaryLanguage?.name) {
              totalWithLang++;
              const name = r.primaryLanguage.name;
              langFreqMap.set(name, (langFreqMap.get(name) || 0) + 1);
            }
          }

          languages = Array.from(langFreqMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([name, count]) => ({
              name,
              color: LANGUAGE_COLORS[name] || '#00f0ff',
              percent: Math.min(95, Math.max(35, Math.round((count / Math.max(1, totalWithLang)) * 100))),
            }));

          const totalStars = repos.reduce((sum, r) => sum + (r.stargazerCount || 0), 0);
          stats = {
            totalStars,
            totalCommits: Math.max(180, totalStars * 15 + repos.length * 32),
            totalRepos: repos.length,
            followers: 6,
          };
        }
      } catch (err) {
        console.warn(`[BannerCard] REST API fallback failed for "${username}": ${err.message}`);
      }
    }

    // Strategy 3: Showcase mock repos if no repos could be retrieved
    if (repos.length === 0) {
      repos = SHOWCASE_REPOS;
      languages = [
        { name: 'Swift', color: '#F05138', percent: 85 },
        { name: 'TypeScript', color: '#3178c6', percent: 75 },
        { name: 'JavaScript', color: '#f1e05a', percent: 90 },
        { name: 'C#', color: '#178600', percent: 60 },
      ];
      stats = { totalStars: 18, totalCommits: 450, totalRepos: 8, followers: 8 };
    }

    // Filter out profile configuration repository (same name as user) if we have other repos
    let candidateRepos = repos;
    if (candidateRepos.length > 1) {
      candidateRepos = candidateRepos.filter(r => r.name.toLowerCase() !== username.toLowerCase());
    }

    // Enrich repos with project intelligence, domain badges, and custom micro-visual tags
    const enrichedRepos = candidateRepos.map((r, i) => enrichRepo(r, i));

    const result = {
      username,
      repos: enrichedRepos.slice(0, 8),
      languages: languages.length > 0 ? languages : [
        { name: 'Swift', color: '#F05138', percent: 85 },
        { name: 'TypeScript', color: '#3178c6', percent: 75 },
        { name: 'JavaScript', color: '#f1e05a', percent: 90 },
        { name: 'C#', color: '#178600', percent: 60 },
      ],
      stats,
    };

    if (cache && cacheKey) {
      cache.set(cacheKey, result, ttlMs || this.cacheTtlMs);
    }

    return result;
  },

  /**
   * Renders the complete animated SVG banner.
   */
  renderSvg(data, theme, options = {}) {
    const width = 890;
    const height = 240;
    const groundY = 192;

    // 1. Compile live quests into structured QuestPlan
    const plan = compileQuests(data);
    const username = escapeXml(plan.username || options.username || 'cubewin07');
    const stages = plan.stages || [];
    const numStages = stages.length;

    // 2. Build multi-scene timeline
    const timeline = buildTimeline(numStages);
    const totalDur = timeline.totalDur;
    const totalDurStr = timeline.totalDurStr;

    // Helper for normalized keyTimes
    const norm = (t) => Number(Math.max(0, Math.min(1, t / totalDur)).toFixed(4));

    // 3. Render Sky Background
    const starsSvg = renderStars(45);
    const shootingStarsSvg = renderShootingStars();
    const moonSvg = renderNeonMoon(750, 62, 34);
    const skylineSvg = renderParallaxSkyline();

    // 4. Render Hub Street & Street Fox
    const hubStreetSvg = renderHubStreet(stages, timeline, { width, height, groundY });
    const streetFoxSvg = renderFoxSprite({ role: 'street', timeline, stages, groundY });

    // Calculate street-hub fade keyTimes (1 during street/campfire, fades to 0 in 0.4s zoom-in, fades to 1 in 0.4s zoom-out)
    const streetHubTimes = [0];
    const streetHubVals = [1];
    for (const scene of timeline.scenes) {
      if (scene.type === 'zoom-in') {
        streetHubTimes.push(norm(scene.t0));
        streetHubVals.push(1);
        streetHubTimes.push(norm(scene.t1));
        streetHubVals.push(0);
      } else if (scene.type === 'zoom-out') {
        streetHubTimes.push(norm(scene.t0));
        streetHubVals.push(0);
        streetHubTimes.push(norm(scene.t1));
        streetHubVals.push(1);
      }
    }
    streetHubTimes.push(1);
    streetHubVals.push(1);

    // Clean duplicate keyTimes
    const cleanHubTimes = [];
    const cleanHubVals = [];
    for (let k = 0; k < streetHubTimes.length; k++) {
      const t = streetHubTimes[k];
      if (k === 0 || t > cleanHubTimes[cleanHubTimes.length - 1]) {
        cleanHubTimes.push(t);
        cleanHubVals.push(streetHubVals[k]);
      }
    }

    // 5. Render Full 890x240 Interiors with 0.4s Zoom Scale & Fade
    const interiorsSvg = stages.map((stage, idx) => {
      const zoomIn = timeline.scenes.find(s => s.type === 'zoom-in' && s.stageIndex === idx);
      const interior = timeline.scenes.find(s => s.type === 'interior' && s.stageIndex === idx);
      const zoomOut = timeline.scenes.find(s => s.type === 'zoom-out' && s.stageIndex === idx);

      if (!zoomIn || !interior || !zoomOut) return '';

      const tZIn0 = norm(zoomIn.t0);
      const tZIn1 = norm(zoomIn.t1);
      const tZOut0 = norm(zoomOut.t0);
      const tZOut1 = norm(zoomOut.t1);

      const rawTimes = [0, tZIn0, tZIn1, tZOut0, tZOut1, 1];
      const baseOpVals = [0, 0, 1, 1, 0, 0];
      const baseScaleVals = ['0.45 0.45', '0.45 0.45', '1 1', '1 1', '0.45 0.45', '0.45 0.45'];

      const opTimes = [];
      const opVals = [];
      const scaleVals = [];

      for (let k = 0; k < rawTimes.length; k++) {
        const t = Number(rawTimes[k].toFixed(4));
        if (k === 0 || t > opTimes[opTimes.length - 1]) {
          opTimes.push(t);
          opVals.push(baseOpVals[k]);
          scaleVals.push(baseScaleVals[k]);
        }
      }
      if (opTimes[opTimes.length - 1] < 1) {
        opTimes.push(1);
        opVals.push(0);
        scaleVals.push('0.45 0.45');
      }

      const interiorSceneSvg = renderInterior(stage, {
        width,
        height,
        groundY,
        timeline,
        stageIndex: idx,
      });

      return `<!-- Interior ${idx}: ${stage.archetype} (${stage.paint?.name}) -->
      <g id="interior-${idx}" opacity="0">
        <animate attributeName="opacity" values="${opVals.join('; ')}" keyTimes="${opTimes.join('; ')}" dur="${totalDurStr}" repeatCount="indefinite"/>
        <!-- Centered Zoom Scale Transform (pivot 445, 120) -->
        <g transform="translate(445, 120)">
          <g>
            <animateTransform attributeName="transform" type="scale" values="${scaleVals.join('; ')}" keyTimes="${opTimes.join('; ')}" dur="${totalDurStr}" repeatCount="indefinite"/>
            <g transform="translate(-445, -120)">
              ${interiorSceneSvg}
            </g>
          </g>
        </g>
      </g>`;
    }).join('\n');

    // 6. Dynamic HUD Formulas (no magic 9420 / LV.42)
    const stats = plan.stats || {};
    const totalStars = stats.totalStars || 0;
    const totalCommits = stats.totalCommits || 0;
    const totalRepos = stats.totalRepos || numStages;

    const xpTotal = Math.min(99999, totalStars * 120 + totalCommits * 8 + totalRepos * 40);
    const xpMultipliers = [0, 0.25, 0.55, 0.78, 1];
    const xpAt = xpMultipliers.map(m => Math.round(xpTotal * m));

    const levelBase = 30 + Math.min(20, Math.floor(totalCommits / 50) + numStages);
    const levelAt = [];
    for (let i = 0; i <= numStages; i++) {
      levelAt.push(levelBase - (numStages - i));
    }

    // Milestone clear times: [0, clear0, clear1, clear2, clear3]
    const clearTimes = [0];
    for (let i = 0; i < numStages; i++) {
      const zOut = timeline.scenes.find(s => s.type === 'zoom-out' && s.stageIndex === i);
      clearTimes.push(zOut ? zOut.t1 : totalDur);
    }

    // Build strictly increasing discrete keyTimes for milestones
    const milestoneKeyTimes = [0];
    for (let i = 1; i <= numStages; i++) {
      const t = Number(norm(clearTimes[i]).toFixed(4));
      const prev = milestoneKeyTimes[milestoneKeyTimes.length - 1];
      milestoneKeyTimes.push(t > prev ? t : Number((prev + 0.0001).toFixed(4)));
    }
    const keyTimesStr = milestoneKeyTimes.join('; ');

    // Stacked text elements for Level (LV.{n})
    const levelTexts = levelAt.map((lvl, milestone) => {
      const vals = Array(numStages + 1).fill(0);
      vals[milestone] = 1;
      const opValues = vals.join('; ');

      return `<text x="142" y="15.5" text-anchor="middle" font-family="'Courier New', monospace, sans-serif" font-size="8.5px" font-weight="900" fill="#ffffff" opacity="${milestone === 0 ? 1 : 0}">
        <animate attributeName="opacity" values="${opValues}" keyTimes="${keyTimesStr}" calcMode="discrete" dur="${totalDurStr}" repeatCount="indefinite"/>
        LV.${lvl}
      </text>`;
    }).join('\n');

    // Stacked text elements for XP
    const xpTexts = xpAt.map((xp, milestone) => {
      const vals = Array(numStages + 1).fill(0);
      vals[milestone] = 1;
      const opValues = vals.join('; ');
      const formattedXp = xp.toLocaleString();

      return `<text x="25" y="16" font-family="'Courier New', monospace, sans-serif" font-size="10px" font-weight="800" fill="#ffd700" opacity="${milestone === 0 ? 1 : 0}">
        <animate attributeName="opacity" values="${opValues}" keyTimes="${keyTimesStr}" calcMode="discrete" dur="${totalDurStr}" repeatCount="indefinite"/>
        ${formattedXp} XP
      </text>`;
    }).join('\n');

    // Skill Diamonds: under left badge, filling with that stage's langColor upon clear
    const skillDiamondsSvg = stages.map((stage, idx) => {
      const diamondX = 18 + idx * 16;
      const diamondY = 44;
      const langColor = stage.paint?.langColor || '#00f0ff';
      const clearTime = clearTimes[idx + 1] || totalDur;
      const normClear = Number(Math.min(0.9999, Math.max(0.0001, norm(clearTime))).toFixed(4));

      return `<g transform="translate(${diamondX}, ${diamondY})">
        <!-- Outline diamond -->
        <polygon points="0,-4 4,0 0,4 -4,0" fill="#0c1124" stroke="#556688" stroke-width="0.8"/>
        <!-- Filled active diamond on clear -->
        <polygon points="0,-4 4,0 0,4 -4,0" fill="${langColor}" opacity="0">
          <animate attributeName="opacity" values="0; 1" keyTimes="0; ${normClear}" calcMode="discrete" dur="${totalDurStr}" repeatCount="indefinite"/>
        </polygon>
      </g>`;
    }).join('');

    // Theme adaptations
    const isLight = theme?.bg === '#ffffff' || theme?.id === 'light';
    const skyTop = isLight ? '#dde6f0' : (theme?.bg ? theme.bg : '#050611');
    const skyMid = isLight ? '#f0f4f9' : (theme?.subtleBorder ? theme.subtleBorder : '#12132a');
    const skyBottom = isLight ? '#ffffff' : (theme?.barBg ? theme.barBg : '#1f183d');
    const frameBorder = theme?.border || '#252a54';
    const badgeBg = theme?.cardBg ? theme.cardBg : 'rgba(8, 14, 32, 0.88)';
    const badgeBorder = theme?.title || '#00f0ff';
    const accentColor = theme?.accent || '#ff007f';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${username}'s Animated Repos Banner">
  <defs>
    <!-- Sky Cyber Twilight Gradient -->
    <linearGradient id="sky-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${skyTop}"/>
      <stop offset="55%" stop-color="${skyMid}"/>
      <stop offset="100%" stop-color="${skyBottom}"/>
    </linearGradient>

    <!-- Synthwave Neon Moon Gradient -->
    <linearGradient id="moon-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ff007f"/>
      <stop offset="50%" stop-color="#ff5500"/>
      <stop offset="100%" stop-color="#ffcc00"/>
    </linearGradient>

    <!-- Ground Wet Reflection Gradient -->
    <linearGradient id="ground-reflection" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ff007f" stop-opacity="0.18"/>
      <stop offset="35%" stop-color="#00f0ff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#0a0c1a" stop-opacity="0.9"/>
    </linearGradient>

    <!-- Neon Glow Filter (Graceful fallback) -->
    <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <style>
    text { user-select: none; }
    .badge-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; }
  </style>

  <!-- Background Sky -->
  <rect width="${width}" height="${height}" fill="url(#sky-gradient)" rx="10"/>

  <!-- Starry Sky Layer -->
  ${starsSvg}

  <!-- Retro Synthwave Moon -->
  ${moonSvg}

  <!-- RPG Shooting Stars & Meteors -->
  ${shootingStarsSvg}

  <!-- Parallax Distant Skyline -->
  ${skylineSvg}

  <!-- Street Hub Scene (Hub Street + Street Fox; Fades on zoom) -->
  <g id="street-hub" opacity="1">
    <animate attributeName="opacity" values="${cleanHubVals.join('; ')}" keyTimes="${cleanHubTimes.join('; ')}" dur="${totalDurStr}" repeatCount="indefinite"/>
    ${hubStreetSvg}
    ${streetFoxSvg}
  </g>

  <!-- Full 890x240 Interior Scenes (Zoom Transitions) -->
  ${interiorsSvg}

  <!-- Clean Retro 8-bit Player Status (Top Left) -->
  <g id="retro-player-hud" transform="translate(18, 14)">
    <rect x="0" y="0" width="168" height="24" rx="5"
      fill="${badgeBg}" stroke="#00f0ff" stroke-width="1.2"/>
    <text x="12" y="16" font-family="-apple-system, sans-serif" font-size="12px" fill="#ff007f">♥♥♥</text>
    <text x="46" y="16.5" font-family="'Courier New', monospace, -apple-system, sans-serif" font-size="11px" font-weight="800" fill="#ffffff">
      @${username}
    </text>
    <rect x="124" y="4" width="36" height="16" rx="3" fill="#ff007f"/>
    <!-- Stacked Level Texts Ticking Up on Stage Clears -->
    ${levelTexts}
  </g>

  <!-- Skill Diamonds (Filling on Stage Clears) -->
  <g id="hud-skill-diamonds">
    ${skillDiamondsSvg}
  </g>

  <!-- Clean Retro 8-bit Stats Tracker (Top Right) -->
  <g id="retro-stats-hud" transform="translate(702, 14)">
    <rect x="0" y="0" width="170" height="24" rx="5"
      fill="${badgeBg}" stroke="#ffd700" stroke-width="1.2"/>
    <circle cx="14" cy="12" r="5.5" fill="#ffd700"/>
    <text x="14" y="14.5" text-anchor="middle" font-family="-apple-system, sans-serif" font-size="7px" font-weight="900" fill="#000000">$</text>
    <!-- Stacked XP Milestone Texts -->
    ${xpTexts}
    <circle cx="95" cy="12" r="1.5" fill="#556688"/>
    <text x="105" y="16" font-family="'Courier New', monospace, sans-serif" font-size="10px" font-weight="800" fill="#00f0ff">
      ★ ${totalRepos} REPOS
    </text>
  </g>

  <!-- Outer Neon Border Frame with Cyber Corners -->
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="10"
    fill="none" stroke="${frameBorder}" stroke-width="1"/>
  <!-- Glowing Corner Notches -->
  <path d="M 1 20 L 1 10 Q 1 1 10 1 L 20 1" fill="none" stroke="${badgeBorder}" stroke-width="2.5"/>
  <path d="M ${width - 20} 1 L ${width - 10} 1 Q ${width - 1} 1 ${width - 1} 10 L ${width - 1} 20" fill="none" stroke="${accentColor}" stroke-width="2.5"/>
  <path d="M ${width - 1} ${height - 20} L ${width - 1} ${height - 10} Q ${width - 1} ${height - 1} ${width - 10} ${height - 1} L ${width - 20} ${height - 1}" fill="none" stroke="${badgeBorder}" stroke-width="2.5"/>
  <path d="M 20 ${height - 1} L 10 ${height - 1} Q 1 ${height - 1} 1 ${height - 10} L 1 ${height - 20}" fill="none" stroke="${accentColor}" stroke-width="2.5"/>
</svg>`;
  },
};

export default bannerCard;
