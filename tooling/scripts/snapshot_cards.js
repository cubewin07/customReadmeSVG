import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { profileCard } from '../../src/cards/profile/index.js';
import { languagesCard } from '../../src/cards/languages/index.js';
import { reposCard } from '../../src/cards/repos/index.js';
import { statsCard } from '../../src/cards/stats/index.js';
import { developerCard } from '../../src/cards/developer/index.js';
import { themes } from '../../src/svg/theme.js';

let _hasXmllint = null;
function hasXmllint() {
  if (_hasXmllint !== null) return _hasXmllint;
  try {
    execFileSync('xmllint', ['--version'], { stdio: 'ignore' });
    _hasXmllint = true;
  } catch {
    _hasXmllint = false;
  }
  return _hasXmllint;
}

/**
 * Validates that an SVG string is strictly well-formed XML using xmllint
 * or a structural XML tag stack verification fallback.
 * @param {string} svg
 */
export function validateXml(svg) {
  if (hasXmllint()) {
    try {
      execFileSync('xmllint', ['--noout', '-'], {
        input: svg,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return;
    } catch (err) {
      const msg = err.stderr ? err.stderr.toString().trim() : err.message;
      throw new Error(`XML Validation Error: ${msg}`);
    }
  }

  // Fallback well-formedness checker when xmllint binary is unavailable
  const tagRegex = /<(\/)?([a-zA-Z0-9:-]+)([^>]*?)(\/)?>/g;
  const stack = [];
  let match;
  while ((match = tagRegex.exec(svg)) !== null) {
    const isClosing = Boolean(match[1]);
    const tagName = match[2];
    const isSelfClosing = Boolean(match[4]) || match[3].trim().endsWith('/');

    if (tagName.startsWith('?') || tagName.startsWith('!')) continue;
    if (isSelfClosing) continue;

    if (isClosing) {
      if (stack.length === 0) {
        throw new Error(`Unexpected closing tag </${tagName}> with empty stack`);
      }
      const top = stack.pop();
      if (top !== tagName) {
        throw new Error(`Tag mismatch: expected </${top}>, found </${tagName}>`);
      }
    } else {
      stack.push(tagName);
    }
  }
  if (stack.length > 0) {
    throw new Error(`Unclosed XML tags: ${stack.join(', ')}`);
  }
}

const MOCK_DATA = {
  standard: {
    profile: {
      login: 'cubewin07',
      name: 'Le Tan Thang',
      bio: 'Full-Stack Developer & Creative Technologist building next-gen web experiences.',
      followers: 142,
      following: 89,
      repositories: 38,
      totalStars: 420,
      company: 'Antigravity Studio',
      location: 'Auckland, NZ',
      websiteUrl: 'https://cubewin.dev',
      createdAt: '2020-03-15T08:00:00Z',
    },
    languages: {
      languages: [
        { name: 'TypeScript', size: 450000, percentage: 45.0, color: '#3178c6' },
        { name: 'JavaScript', size: 250000, percentage: 25.0, color: '#f1e05a' },
        { name: 'Python', size: 150000, percentage: 15.0, color: '#3572A5' },
        { name: 'HTML', size: 100000, percentage: 10.0, color: '#e34c26' },
        { name: 'CSS', size: 50000, percentage: 5.0, color: '#563d7c' },
      ],
      totalSize: 1000000,
    },
    repos: {
      repos: [
        {
          name: 'customReadmeSVG',
          description: 'Dynamic game-inspired SVG cards for GitHub READMEs',
          stargazerCount: 128,
          forkCount: 24,
          primaryLanguage: { name: 'JavaScript', color: '#f1e05a' },
          updatedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
        },
        {
          name: 'reactive-portfolio',
          description: 'High performance GSAP-animated portfolio site',
          stargazerCount: 94,
          forkCount: 12,
          primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
          updatedAt: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
        },
        {
          name: 'neural-canvas',
          description: 'Real-time procedural voxel generation in WebGL',
          stargazerCount: 65,
          forkCount: 8,
          primaryLanguage: { name: 'Rust', color: '#dea584' },
          updatedAt: new Date(Date.now() - 3600000 * 24 * 45).toISOString(),
        },
        {
          name: 'cloud-task-orchestrator',
          description: 'Distributed workflow automation runner',
          stargazerCount: 42,
          forkCount: 5,
          primaryLanguage: { name: 'Go', color: '#00ADD8' },
          updatedAt: new Date(Date.now() - 3600000 * 24 * 70).toISOString(),
        },
      ],
    },
    stats: {
      name: 'Le Tan Thang',
      login: 'cubewin07',
      totalStars: 420,
      totalCommits: 2840,
      totalForks: 65,
      totalRepos: 38,
      followers: 142,
    },
    developer: {
      name: 'Le Tan Thang',
      login: 'cubewin07',
      handle: '@cubewin07',
      role: 'Full-Stack Engineer & Creative Coder',
      status: 'SHIPPED TO PRODUCTION',
      focus: ['Systems Architecture', 'Interactive WebGL', 'AI Agent Workflows'],
      commitSha: 'c546d68',
      annualCommits: 2840,
      primaryTech: ['TypeScript', 'React 19', 'WebGL', 'Node.js', 'Go'],
      pinnedRepos: [
        { name: 'customReadmeSVG', desc: 'Game-inspired SVG cards', stars: 128, forks: 24, lang: 'JS', color: '#f1e05a' },
        { name: 'neural-canvas', desc: 'Procedural voxel terrain', stars: 65, forks: 8, lang: 'Rust', color: '#dea584' },
      ],
    },
  },
  long: {
    profile: {
      login: 'hyper-productive-polyglot-architect-specialist',
      name: 'Alexander Bartholomew Montgomery-Fitzgerald III',
      bio: 'Principal distributed systems architect, high-throughput streaming systems enthusiast, compiler hacker, open-source contributor, and technical writer focusing on ultra low-latency compute platforms.',
      followers: 8493021,
      following: 198273,
      repositories: 5420,
      totalStars: 1948203,
      company: 'International Cybernetics & Hyper-Scale Distributed Systems Laboratory Corporation',
      location: 'San Francisco, CA / Zurich, Switzerland / Tokyo, Japan',
      websiteUrl: 'https://alexander-bartholomew-montgomery-fitzgerald.engineering-systems.io',
      createdAt: '2012-01-01T00:00:00Z',
    },
    languages: {
      languages: [
        { name: 'SupercalifragilisticexpialidociousLang', size: 98765432, percentage: 38.5, color: '#e34c26' },
        { name: 'VeryLongExtendedProgrammingLanguageName', size: 65432100, percentage: 25.5, color: '#3178c6' },
        { name: 'EnterpriseJavaEnterpriseEditionFramework', size: 34567890, percentage: 13.5, color: '#b07219' },
        { name: 'HighPerformanceAssemblyVectorLang', size: 28475620, percentage: 11.1, color: '#6e4c13' },
        { name: 'ModernDeclarativeShaderSpecification', size: 15928370, percentage: 6.2, color: '#438eff' },
        { name: 'MicrocontrollerEmbeddedRustCrate', size: 13374200, percentage: 5.2, color: '#dea584' },
      ],
      totalSize: 256483612,
    },
    repos: {
      repos: [
        {
          name: 'ultra-mega-enterprise-distributed-microservices-mesh',
          description: 'A comprehensive, fault-tolerant, horizontally scalable event stream aggregation broker engine for mission-critical real-time edge processing.',
          stargazerCount: 948201,
          forkCount: 48201,
          primaryLanguage: { name: 'SupercalifragilisticexpialidociousLang', color: '#e34c26' },
          updatedAt: new Date(Date.now() - 3600000 * 24 * 365).toISOString(),
        },
        {
          name: 'high-frequency-algorithmic-trading-backtesting-sim',
          description: 'Nanosecond precision order-book reconstruction and deterministic hardware replay framework.',
          stargazerCount: 248910,
          forkCount: 12904,
          primaryLanguage: { name: 'C++', color: '#f34b7d' },
          updatedAt: new Date(Date.now() - 3600000 * 24 * 180).toISOString(),
        },
      ],
    },
    stats: {
      name: 'Alexander Bartholomew Montgomery-Fitzgerald III',
      login: 'hyper-productive-polyglot-architect-specialist',
      totalStars: 1948203,
      totalCommits: 8493021,
      totalForks: 482019,
      totalRepos: 5420,
      followers: 8493021,
    },
    developer: {
      name: 'Alexander Bartholomew Montgomery-Fitzgerald III',
      login: 'hyper-polyglot',
      handle: '@hyper-productive-polyglot-architect-specialist',
      role: 'Principal High-Throughput Distributed Cloud Systems Software Architect',
      status: 'MISSION CRITICAL DEPLOYMENT VERIFIED',
      focus: ['Ultra Low-Latency Architecture', 'Deterministic Concurrency Primitives', 'Voxel Engine Parallel Pipeline'],
      commitSha: '94820a1',
      annualCommits: 8493021,
      primaryTech: ['Distributed Systems', 'C++20 Modules', 'CUDA Kernels', 'WebAssembly Core', 'Linux Kernel eBPF'],
      pinnedRepos: [
        { name: 'ultra-mega-enterprise-distributed-microservices-mesh', desc: 'Fault-tolerant stream broker engine for mission-critical edge compute', stars: 948201, forks: 48201, lang: 'C++', color: '#f34b7d' },
      ],
    },
  },
  empty: {
    profile: {
      login: 'ghost',
      name: '',
      bio: '',
      followers: 0,
      following: 0,
      repositories: 0,
      totalStars: 0,
      company: '',
      location: '',
      websiteUrl: '',
      createdAt: null,
    },
    languages: {
      languages: [],
      totalSize: 0,
    },
    repos: {
      repos: [],
    },
    stats: {
      name: '',
      login: 'ghost',
      totalStars: 0,
      totalCommits: 0,
      totalForks: 0,
      totalRepos: 0,
      followers: 0,
    },
    developer: {
      name: 'Ghost User',
      login: 'ghost',
      handle: '@ghost',
      role: 'Developer',
      status: 'IDLE',
      focus: [],
      commitSha: '0000000',
      annualCommits: 0,
      primaryTech: [],
      pinnedRepos: [],
    },
  },
};

const CARDS_CONFIG = [
  {
    id: 'profile',
    card: profileCard,
    layouts: ['classic', 'hero', 'compact', 'split', 'dashboard'],
  },
  {
    id: 'languages',
    card: languagesCard,
    layouts: ['polyglot', 'donut', 'list', 'compact'],
  },
  {
    id: 'repos',
    card: reposCard,
    layouts: ['grid', 'featured', 'spotlight', 'timeline', 'leaderboard'],
  },
  {
    id: 'stats',
    card: statsCard,
    layouts: ['ring', 'bars', 'hero', 'dashboard', 'compact'],
  },
  {
    id: 'developer',
    card: developerCard,
    layouts: ['default'],
  },
];

/**
 * Runs a complete snapshot audit across all cards, layouts, themes, and datasets.
 * @param {object} [options]
 * @param {boolean} [options.writeToDisk=false]
 * @param {string} [options.outDir='work/snapshots']
 * @returns {Promise<{ totalRendered: number, passed: number, failed: number, issues: string[] }>}
 */
export async function runSnapshotAudit(options = {}) {
  const writeToDisk = options.writeToDisk === true;
  const outDir = options.outDir || path.resolve(process.cwd(), 'work/snapshots');

  if (writeToDisk && !fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  let totalRendered = 0;
  let passed = 0;
  let failed = 0;
  const issues = [];

  const themeKeys = ['dark', 'light'];
  const datasetKeys = ['standard', 'long', 'empty'];

  for (const { id, card, layouts } of CARDS_CONFIG) {
    for (const layout of layouts) {
      for (const datasetKey of datasetKeys) {
        for (const themeKey of themeKeys) {
          totalRendered++;
          const theme = themes[themeKey] || themes.dark;
          const data = MOCK_DATA[datasetKey][id];
          const renderOpts = {
            layout,
            username: data?.login || 'testuser',
            theme: themeKey,
          };

          try {
            const svg = card.renderSvg(data, theme, renderOpts);

            // Validation checks
            if (typeof svg !== 'string' || !svg.trim().startsWith('<svg')) {
              throw new Error(`Output does not start with <svg`);
            }
            if (!svg.trim().endsWith('</svg>')) {
              throw new Error(`Output does not end with </svg>`);
            }
            if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
              throw new Error(`Missing SVG namespace`);
            }
            if (svg.includes('NaN')) {
              throw new Error(`Contains NaN value in output`);
            }
            if (svg.includes('undefined')) {
              throw new Error(`Contains literal "undefined" in output`);
            }
            if (svg.includes('[object Object]')) {
              throw new Error(`Contains unrendered [object Object] in output`);
            }

            // Strict XML well-formedness validation
            validateXml(svg);

            passed++;

            if (writeToDisk) {
              const filename = `${id}_${layout}_${datasetKey}_${themeKey}.svg`;
              fs.writeFileSync(path.join(outDir, filename), svg, 'utf-8');
            }
          } catch (err) {
            failed++;
            issues.push(`[${id}:${layout}:${datasetKey}:${themeKey}] ${err.message}`);
          }
        }
      }
    }
  }

  return {
    totalRendered,
    passed,
    failed,
    issues,
  };
}

// CLI runner execution
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  console.log('🔍 Starting Card Snapshot Audit across themes and extreme datasets...');
  const result = await runSnapshotAudit({ writeToDisk: true });
  console.log(`\n========================================`);
  console.log(`📊 Snapshot Audit Summary:`);
  console.log(`  Total Rendered: ${result.totalRendered}`);
  console.log(`  Passed:         ${result.passed}`);
  console.log(`  Failed:         ${result.failed}`);
  console.log(`========================================\n`);

  if (result.failed > 0) {
    console.error('❌ Failures encountered:');
    result.issues.forEach((iss) => console.error(`  - ${iss}`));
    process.exit(1);
  } else {
    console.log('✅ All snapshots rendered cleanly and verified!');
  }
}
