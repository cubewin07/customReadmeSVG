import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { signatureCard } from '../src/cards/plates/signature.js';
import { stackCard } from '../src/cards/plates/stack.js';
import { traceCard } from '../src/cards/plates/trace.js';
import { normalizeLanguages, normalizeTrace } from '../src/core/github/normalize.js';
import { TRACE_QUERY } from '../src/core/github/queries.js';
import { resolveCard } from '../src/core/cards/registry.js';
import '../src/cards/index.js';
import { themes } from '../src/svg/theme.js';

function assertValidXml(svg) {
  execFileSync('xmllint', ['--noout', '-'], { input: svg, stdio: ['pipe', 'pipe', 'pipe'] });
}

const day = (date, contributionCount) => ({ date, contributionCount, weekday: 0 });

function calendar(busy = {}) {
  const start = Date.UTC(2025, 10, 2);
  const days = Array.from({ length: 371 }, (_, i) => {
    const date = new Date(start + i * 86400000).toISOString().slice(0, 10);
    return day(date, busy[date] ?? 0);
  });
  return Array.from({ length: 53 }, (_, w) => ({ contributionDays: days.slice(w * 7, w * 7 + 7) }));
}

const statsData = {
  login: 'cubewin07',
  name: 'Tan Thang Le',
  totalContributions: 1649,
  totalCommits: 1352,
  pullRequests: 52,
  maxStreak: 18,
  totalStars: 6,
  followers: 0,
  weeks: calendar({ '2026-06-26': 68, '2026-06-27': 12, '2026-10-01': 30 }),
};

test('new plates resolve through the card registry and their aliases', () => {
  assert.equal(resolveCard('signature').id, 'signature');
  assert.equal(resolveCard('stack').id, 'stack');
  assert.equal(resolveCard('flame').id, 'stack');
  assert.equal(resolveCard('trace').id, 'trace');
});

test('signature leads with the name and real activity, not stars or followers', () => {
  const svg = signatureCard.renderSvg(statsData, themes.light, { username: 'cubewin07', name: 'Brian Le', role: 'Backend' });
  assertValidXml(svg);
  assert.ok(svg.includes('BRIAN LE'), 'name override must be used and set in capitals');
  assert.ok(svg.includes('1,649') && svg.includes('contributions'));
  assert.ok(svg.includes('68 ON 26 JUN'), 'must flag the real busiest day');
  assert.ok(!/stars|followers/i.test(svg.replace(/base64,[^)]+/g, '')), 'vanity metrics stay off the hero');
});

test('signature counts active days from the calendar', () => {
  const svg = signatureCard.renderSvg(statsData, themes.dark, { username: 'cubewin07' });
  assert.ok(/>3<\/text><text[^>]*>active days/.test(svg), 'three days in the fixture have contributions');
});

test('signature renders without inventing a peak when the calendar is empty', () => {
  const svg = signatureCard.renderSvg({ login: 'ghost', name: '', weeks: [] }, themes.dark, { username: 'ghost' });
  assertValidXml(svg);
  assert.ok(svg.includes('GHOST'));
  assert.ok(!/\d+ ON \d+/.test(svg), 'no busiest-day flag without data');
});

test('signature keeps long names legible by holding the ridges back from the letters', () => {
  const name = 'Alexander Bartholomew Montgomery-Fitzgerald';
  const svg = signatureCard.renderSvg(statsData, themes.dark, { username: 'x', name });
  const baseline = Number(/<text x="[\d.-]+" y="(\d+)" class="d ink" font-size="96/.exec(svg)?.[1]);
  const peak = Math.min(...[...svg.matchAll(/class="ridge"[^>]*d="M([^"]+)"/g)].flatMap((m) => m[1].split('L').map((pair) => Number(pair.split(' ')[1]))));
  assert.ok(baseline > 0, 'long names shrink to the minimum size');
  assert.ok(peak >= baseline - 96 * 0.8 * 0.36, `ridges (${peak}) must stay in the lower third of the letters (${baseline})`);
});

test('plates default to cobalt but honour an explicit theme', () => {
  const fallback = signatureCard.renderSvg(statsData, themes.light, { username: 'x' });
  assert.ok(fallback.includes(themes.cobalt.bg));
  const asked = signatureCard.renderSvg(statsData, themes.tokyonight, { username: 'x', theme: 'tokyonight' });
  assert.ok(asked.includes(themes.tokyonight.bg) && !asked.includes(themes.cobalt.bg));
});

test('plates embed their fonts, so they render the same in an <img>', () => {
  const svg = stackCard.renderSvg({ languages: [], totalRepos: 0 }, themes.dark, {});
  assert.ok(svg.includes('@font-face') && svg.includes('data:font/woff2;base64,'));
  assert.ok(!/https?:\/\/(?!www\.w3\.org)/.test(svg.replace(/base64,[^)]+/g, '')), 'no external requests');
});

test('stack merges private repositories into nameless frames', () => {
  const normalized = normalizeLanguages({
    user: {
      repositories: {
        nodes: [
          { name: 'secret-client-project', isPrivate: true, pushedAt: '2026-10-01T00:00:00Z', languages: { edges: [{ size: 5000000, node: { name: 'Java', color: '#b07219' } }] } },
          { name: 'another-secret', isPrivate: true, pushedAt: '2026-10-01T00:00:00Z', languages: { edges: [{ size: 3000000, node: { name: 'Java', color: '#b07219' } }] } },
          { name: 'movie-explorer', isPrivate: false, pushedAt: '2026-10-01T00:00:00Z', languages: { edges: [{ size: 4000000, node: { name: 'Java', color: '#b07219' } }] } },
        ],
      },
    },
  });
  const svg = stackCard.renderSvg(normalized, themes.dark, {});
  assertValidXml(svg);
  assert.ok(!svg.includes('secret-client-project') && !svg.includes('another-secret'), 'private names must never render');
  assert.ok(svg.includes('private'), 'private code still counts, under a nameless frame');
  assert.ok(svg.includes('movie-explorer'));
});


test('stack escapes hostile names and honours hide', () => {
  const data = {
    totalRepos: 2,
    languages: [
      { name: 'Java', size: 900, repos: [{ name: 'a&b<c>', size: 900, isPrivate: false }] },
      { name: 'CSS', size: 100, repos: [] },
    ],
  };
  const svg = stackCard.renderSvg(data, themes.dark, { hide: 'css' });
  assertValidXml(svg);
  assert.ok(svg.includes('a&amp;b&lt;c&gt;'));
  assert.ok(!svg.includes('>CSS'), 'hidden languages are removed');
  assert.ok(/>1<\/text>/.test(svg), 'count reflects the filter');
});

test('trace only ever queries public repositories, because it prints their names', () => {
  assert.ok(TRACE_QUERY.includes('privacy: PUBLIC'));
  assert.ok(TRACE_QUERY.includes('isFork: false'));
});

test('trace normalizer ranks by commits and drops inactive repositories', () => {
  const history = (totalCount, nodes = [], hasNextPage = false) => ({ defaultBranchRef: { target: { history: { totalCount, nodes, pageInfo: { hasNextPage, endCursor: hasNextPage ? 'next' : null } } } } });
  const result = normalizeTrace({
    user: {
      login: 'u',
      name: 'U',
      repositories: {
        nodes: [
          { name: 'small', pushedAt: 'x', ...history(2, [{ committedDate: '2026-01-01T00:00:00Z' }]) },
          { name: 'idle', pushedAt: 'x', ...history(0) },
          { name: 'big', pushedAt: 'x', ...history(651, [{ committedDate: '2026-02-01T00:00:00Z' }], true) },
        ],
      },
    },
  });
  assert.deepEqual(result.repos.map((r) => r.name), ['big', 'small']);
  assert.equal(result.repos[0].commitCount, 651);
  assert.equal(result.repos[0].nextCursor, 'next', 'repos over one page must be flagged for paging');
});

test('trace draws one lane per repo up to the row limit but totals every repo', () => {
  const now = new Date('2026-11-07T00:00:00Z');
  const repos = Array.from({ length: 12 }, (_, i) => ({
    name: `repo-${i}`,
    commitCount: 100 - i,
    commitDates: ['2026-06-01T00:00:00Z', '2026-09-01T00:00:00Z'],
    language: { name: 'Java', color: '#b07219' },
  }));
  const svg = traceCard.renderSvg({ repos }, themes.dark, { now });
  assertValidXml(svg);
  assert.ok(svg.includes('repo-8') && !svg.includes('repo-9'));
  const total = repos.reduce((acc, r) => acc + r.commitCount, 0);
  assert.ok(svg.includes(total.toLocaleString('en-US')), 'headline counts all active repos');
});

test('trace ignores commits outside the 12 month window and shows an empty state', () => {
  const now = new Date('2026-11-07T00:00:00Z');
  const stale = traceCard.renderSvg({ repos: [{ name: 'old', commitCount: 1, commitDates: ['2020-01-01T00:00:00Z'] }] }, themes.dark, { now });
  assertValidXml(stale);
  assert.ok(!/fill="#3fb950" *\/><\/g>/.test(stale));
  const empty = traceCard.renderSvg({ repos: [] }, themes.dark, { now });
  assert.ok(empty.includes('NO PUBLIC COMMITS'));
});
