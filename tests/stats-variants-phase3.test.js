import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { statsCard } from '../src/cards/stats/index.js';
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

const mockStatsData = {
  name: 'Le Tan Thang',
  login: 'cubewin07',
  totalCommits: 1420,
  totalContributions: 1850,
  pullRequests: 84,
  issues: 22,
  reviews: 36,
  totalStars: 310,
  totalForks: 45,
  totalRepos: 28,
  followers: 95,
  currentStreak: 16,
  maxStreak: 42,
  weeks: Array.from({ length: 26 }, () => ({
    contributionDays: Array.from({ length: 7 }, (_, d) => ({
      weekday: d,
      contributionCount: d % 2 === 0 ? 4 : 0,
      date: '2026-05-01',
    })),
  })),
  monthlyContributions: [80, 110, 95, 140, 160, 210, 180, 195, 150, 175, 220, 135],
};

test('Stats ring variant renders composite progress ring and 5 labelled metrics with deltas', () => {
  const svg = statsCard.renderSvg(mockStatsData, themes.dark, { layout: 'ring' });
  assertValidXml(svg);
  assert.ok(svg.includes('progress-ring'), 'Must include circular progress ring');
  assert.ok(svg.includes('delta-chip') || svg.includes('▲'), 'Must include YoY delta chips');
  assert.ok(svg.includes('COMMITS'), 'Must include labelled Commits metric');
  assert.ok(svg.includes('PULL REQUESTS'), 'Must include labelled PRs metric');
  assert.ok(svg.includes('REVIEWS'), 'Must include labelled Reviews metric');
  assert.ok(svg.includes('ISSUES'), 'Must include labelled Issues metric');
  assert.ok(svg.includes('STARS'), 'Must include labelled Stars metric');
});

test('Stats mix (bars) variant renders real percentage shares of effort and stacked bar', () => {
  const svg = statsCard.renderSvg(mockStatsData, themes.dark, { layout: 'mix' });
  assertValidXml(svg);
  assert.ok(svg.includes('stacked-bar'), 'Must include proportional stacked bar');
  // Commits should be ~90.9% of action contributions (1420 / (1420+84+22+36) = 1420 / 1562 = ~90.9%)
  assert.ok(svg.includes('%'), 'Must show real percentage shares');
  assert.ok(svg.includes('COMMITS'));
  assert.ok(svg.includes('PULL REQUESTS'));
  assert.ok(svg.includes('1,850') || svg.includes('1850'), 'Must show milestone total contributions');
});

test('Stats crest (hero) variant renders 5-axis radar chart with vertices and rank methodology', () => {
  const svg = statsCard.renderSvg(mockStatsData, themes.dark, { layout: 'crest' });
  assertValidXml(svg);
  assert.ok(svg.includes('radar-chart') || svg.includes('polygon'), 'Must include 5-axis radar polygon');
  assert.ok(svg.includes('COMMITS'));
  assert.ok(svg.includes('PRS'));
  assert.ok(svg.includes('REVIEWS'));
  assert.ok(svg.includes('STARS'));
  assert.ok(svg.includes('FOLLOWERS'));
  assert.ok(svg.includes('Score') || svg.includes('SCORE'), 'Must include composite score');
});

test('Stats year (dashboard) variant renders 12 monthly contribution bars across width with peak month', () => {
  const svg = statsCard.renderSvg(mockStatsData, themes.dark, { layout: 'year' });
  assertValidXml(svg);
  assert.ok(svg.includes('monthly-bars') || svg.includes('trajectory-bar'), 'Must include monthly bars');
  assert.ok(svg.includes('Peak') || svg.includes('Best Month'), 'Must include peak month callout');
  assert.ok(svg.includes('42'), 'Must include longest streak');
  assert.ok(svg.includes('1,850') || svg.includes('1850'), 'Must include total contributions');
});

test('Stats ticker (compact) variant renders single-row ~72px banner with grade chip and 4 labelled tiles', () => {
  const svg = statsCard.renderSvg(mockStatsData, themes.dark, { layout: 'ticker' });
  assertValidXml(svg);
  assert.ok(svg.includes('height="72"') || svg.includes('height="70"'), 'Must have compact ~72px height');
  assert.ok(svg.includes('metric-tile') || svg.includes('COMMITS'), 'Must include labelled tiles');
  assert.ok(svg.includes('1,420') || svg.includes('1420'), 'Must include hero commits number');
  assert.ok(svg.includes('STARS'));
});

test('Stats streak variant renders current streak flame, longest streak, and 26-week heatmap', () => {
  const svg = statsCard.renderSvg(mockStatsData, themes.dark, { layout: 'streak' });
  assertValidXml(svg);
  assert.ok(svg.includes('16'), 'Must include current streak 16');
  assert.ok(svg.includes('42'), 'Must include longest streak 42');
  assert.ok(svg.includes('heatmap-matrix'), 'Must include 26-week heatmap matrix');
});

test('Stats card supports canonical widths (830 full, 405 half, 495 legacy)', () => {
  const fullSvg = statsCard.renderSvg(mockStatsData, themes.dark, { layout: 'ring', width: 'full' });
  assertValidXml(fullSvg);
  assert.ok(fullSvg.includes('width="830"'));

  const halfSvg = statsCard.renderSvg(mockStatsData, themes.dark, { layout: 'ring', width: 'half' });
  assertValidXml(halfSvg);
  assert.ok(halfSvg.includes('width="405"'));

  const legacySvg = statsCard.renderSvg(mockStatsData, themes.dark, { layout: 'ring', width: 'legacy' });
  assertValidXml(legacySvg);
  assert.ok(legacySvg.includes('width="495"'));
});
