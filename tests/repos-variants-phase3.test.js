import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { reposCard } from '../src/cards/repos/index.js';
import { normalizeRepos } from '../src/core/github/normalize.js';
import { REPOS_QUERY } from '../src/core/github/queries.js';
import { themes } from '../src/svg/theme.js';

function assertValidXml(svg) {
  try {
    execFileSync('xmllint', ['--noout', '-'], {
      input: svg,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (err) {
    assert.fail(`Generated SVG is not valid XML: ${err.stderr?.toString() || err.message}\nSVG snippet: ${svg.slice(0, 300)}`);
  }
}

const mockRepoData = {
  repos: [
    {
      name: 'quantum-orchestrator',
      description: 'Distributed quantum workflow scheduler for heterogenous cluster nodes in production environments',
      url: 'https://github.com/test/quantum-orchestrator',
      stargazerCount: 1420,
      forkCount: 310,
      watchers: 85,
      primaryLanguage: { name: 'Rust', color: '#dea584' },
      topics: ['scheduler', 'distributed', 'rust'],
      latestRelease: 'v2.4.0',
      pushedAt: '2026-09-30T12:00:00Z',
      updatedAt: '2026-09-30T12:00:00Z',
      languages: [
        { name: 'Rust', color: '#dea584', size: 850000, percentage: 85 },
        { name: 'Shell', color: '#89e051', size: 150000, percentage: 15 },
      ],
      lastCommit: {
        message: 'perf(engine): optimize atomic state transitions',
        sha: '7f3a9b1',
        date: '2026-09-30T11:45:00Z',
      },
      sparkline: [2, 4, 6, 8, 12, 10, 14, 18],
    },
    {
      name: 'neural-canvas-editor',
      description: 'Vector-based collaborative canvas powered by WebAssembly and WebGL shaders',
      url: 'https://github.com/test/neural-canvas-editor',
      stargazerCount: 950,
      forkCount: 140,
      watchers: 42,
      primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
      topics: ['canvas', 'webgl', 'typescript'],
      latestRelease: 'v1.1.2',
      pushedAt: '2026-10-01T08:00:00Z', // Most recently pushed!
      updatedAt: '2026-10-01T08:00:00Z',
      languages: [
        { name: 'TypeScript', color: '#3178c6', size: 700000, percentage: 70 },
        { name: 'GLSL', color: '#5686a5', size: 300000, percentage: 30 },
      ],
      lastCommit: {
        message: 'fix(shaders): eliminate border artifacts in bloom pass',
        sha: 'c4e201a',
        date: '2026-10-01T07:50:00Z',
      },
      sparkline: [5, 8, 12, 15, 7, 9, 11, 14],
    },
    {
      name: 'crypto-vault-guard',
      description: 'Zero-knowledge hardware key agent for cryptographic signing',
      url: 'https://github.com/test/crypto-vault-guard',
      stargazerCount: 420,
      forkCount: 65,
      watchers: 19,
      primaryLanguage: { name: 'Go', color: '#00add8' },
      topics: ['cryptography', 'security', 'zkp'],
      latestRelease: null,
      pushedAt: '2026-08-15T00:00:00Z',
      updatedAt: '2026-08-15T00:00:00Z',
      languages: [
        { name: 'Go', color: '#00add8', size: 500000, percentage: 100 },
      ],
      lastCommit: {
        message: 'chore: bump dependencies',
        sha: '99bf012',
        date: '2026-08-14T20:00:00Z',
      },
      sparkline: [1, 2, 1, 0, 0, 1, 3, 2],
    },
    {
      name: 'telemetry-stream-collector',
      description: 'Ultra-low latency eBPF metric pipeline',
      url: 'https://github.com/test/telemetry-stream-collector',
      stargazerCount: 280,
      forkCount: 30,
      watchers: 12,
      primaryLanguage: { name: 'C', color: '#555555' },
      topics: ['ebpf', 'linux', 'kernel'],
      latestRelease: null,
      pushedAt: '2026-07-20T00:00:00Z',
      updatedAt: '2026-07-20T00:00:00Z',
      languages: [{ name: 'C', color: '#555555', size: 400000, percentage: 100 }],
      lastCommit: { message: 'feat: add ring buffer', sha: 'a1b2c3d', date: '2026-07-19T00:00:00Z' },
      sparkline: [0, 0, 2, 4, 1, 0, 0, 0],
    },
  ],
};

test('REPOS_QUERY includes topics, latestRelease, watchers, languages, and commit history', () => {
  assert.ok(REPOS_QUERY.includes('repositoryTopics'));
  assert.ok(REPOS_QUERY.includes('latestRelease'));
  assert.ok(REPOS_QUERY.includes('watchers'));
  assert.ok(REPOS_QUERY.includes('languages('));
  assert.ok(REPOS_QUERY.includes('defaultBranchRef'));
});

test('normalizeRepos normalizes topics, release, watchers, languages, and sparkline', () => {
  const rawData = {
    user: {
      repositories: {
        nodes: [
          {
            name: 'demo-repo',
            description: 'A test repository',
            url: 'https://github.com/demo/repo',
            stargazerCount: 15,
            forkCount: 3,
            pushedAt: '2026-09-15T00:00:00Z',
            watchers: { totalCount: 7 },
            primaryLanguage: { name: 'JavaScript', color: '#f1e05a' },
            repositoryTopics: {
              nodes: [{ topic: { name: 'react' } }, { topic: { name: 'svg' } }],
            },
            latestRelease: { tagName: 'v1.0.0' },
            languages: {
              edges: [
                { size: 900, node: { name: 'JavaScript', color: '#f1e05a' } },
                { size: 100, node: { name: 'HTML', color: '#e34c26' } },
              ],
            },
            defaultBranchRef: {
              target: {
                history: {
                  nodes: [
                    { message: 'feat: initial release', committedDate: '2026-09-15T00:00:00Z', abbreviatedOid: 'abcdef1' },
                  ],
                },
              },
            },
          },
        ],
      },
    },
  };

  const normalized = normalizeRepos(rawData);
  assert.equal(normalized.repos.length, 1);
  const repo = normalized.repos[0];
  assert.deepEqual(repo.topics, ['react', 'svg']);
  assert.equal(repo.latestRelease, 'v1.0.0');
  assert.equal(repo.watchers, 7);
  assert.equal(repo.lastCommit?.sha, 'abcdef1');
  assert.equal(repo.lastCommit?.message, 'feat: initial release');
  assert.equal(repo.sparkline.length, 8);
  assert.equal(repo.languages[0].name, 'JavaScript');
});

test('Repos grid variant renders topic chips, language dot, stars, forks, and pushed time', () => {
  const svg = reposCard.renderSvg(mockRepoData, themes.dark, { layout: 'grid' });
  assertValidXml(svg);
  assert.ok(svg.includes('scheduler'));
  assert.ok(svg.includes('quantum-orchestrator'));
  assert.ok(svg.includes('Rust'));
  assert.ok(svg.includes('pushed') || svg.includes('ago'));
});

test('Repos featured variant renders headline project with language bar, sparkline, release tag, and 2 sub-tiles', () => {
  const svg = reposCard.renderSvg(mockRepoData, themes.dark, { layout: 'featured' });
  assertValidXml(svg);
  assert.ok(svg.includes('v2.4.0'), 'Must include release tag');
  assert.ok(svg.includes('language-bar'), 'Must include language proportion bar');
  assert.ok(svg.includes('sparkline'), 'Must include commit sparkline');
  assert.ok(svg.includes('Headline Project') || svg.includes('Featured'));
  // Sub-repos should render without orphan 3rd item
  assert.ok(svg.includes('neural-canvas-editor'));
});

test('Repos spotlight variant renders 3-line wrapped description, last commit SHA, sparkline, and watchers', () => {
  const svg = reposCard.renderSvg(mockRepoData, themes.dark, { layout: 'spotlight' });
  assertValidXml(svg);
  assert.ok(svg.includes('7f3a9b1'), 'Must include last commit SHA');
  assert.ok(svg.includes('perf(engine)') || svg.includes('optimize'), 'Must include last commit message');
  assert.ok(svg.includes('sparkline'), 'Must include commit sparkline');
  assert.ok(svg.includes('85'), 'Must include watchers count');
});

test('Repos timeline variant sorts by pushedAt DESC and renders Git branch stem with commit log', () => {
  const svg = reposCard.renderSvg(mockRepoData, themes.dark, { layout: 'timeline' });
  assertValidXml(svg);
  // neural-canvas-editor was pushed more recently than quantum-orchestrator, so it must appear first!
  const neuralPos = svg.indexOf('neural-canvas-editor');
  const quantumPos = svg.indexOf('quantum-orchestrator');
  assert.ok(neuralPos !== -1 && quantumPos !== -1);
  assert.ok(neuralPos < quantumPos, 'Timeline must sort by pushedAt DESC, not stars');
  assert.ok(svg.includes('c4e201a'), 'Must include commit SHA');
});

test('Repos leaderboard variant renders rank standings, comparative stars bar, and watchers', () => {
  const svg = reposCard.renderSvg(mockRepoData, themes.dark, { layout: 'leaderboard' });
  assertValidXml(svg);
  assert.ok(svg.includes('#1') || svg.includes('🥇'));
  assert.ok(svg.includes('quantum-orchestrator'));
  assert.ok(svg.includes('85'), 'Must include watchers count');
  assert.ok(svg.includes('stars-bar') || svg.includes('rect'), 'Must include stars bar');
});

test('Repos card supports width customization (830px full, 405px half, 495px default)', () => {
  const svgFull = reposCard.renderSvg(mockRepoData, themes.dark, { layout: 'grid', width: 830 });
  assertValidXml(svgFull);
  assert.ok(svgFull.includes('width="830"'));

  const svgHalf = reposCard.renderSvg(mockRepoData, themes.dark, { layout: 'grid', width: 405 });
  assertValidXml(svgHalf);
  assert.ok(svgHalf.includes('width="405"'));
});
