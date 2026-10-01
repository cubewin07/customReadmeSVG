import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolveCardWidth, getSizeClass, CANONICAL_WIDTHS, getCardBounds } from '../src/svg/layout.js';
import { resolveTheme, themes } from '../src/svg/theme.js';
import { renderMetricTile } from '../src/svg/tile.js';
import {
  renderProgressRing,
  renderStackedBar,
  renderCommitSparkline,
  renderHeatmapMatrix,
  renderDeltaChip,
  renderTopicChips,
  renderReleaseTag,
} from '../src/svg/primitives.js';

function assertValidXml(svg) {
  try {
    execFileSync('xmllint', ['--noout', '-'], {
      input: `<svg xmlns="http://www.w3.org/2000/svg">${svg}</svg>`,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (err) {
    assert.fail(`Generated snippet is not valid XML: ${err.stderr?.toString() || err.message}\nSnippet: ${svg.slice(0, 300)}`);
  }
}

test('layout: resolveCardWidth resolves canonical widths and numbers correctly', () => {
  assert.equal(resolveCardWidth('full'), 830);
  assert.equal(resolveCardWidth('half'), 405);
  assert.equal(resolveCardWidth('legacy'), 495);
  assert.equal(resolveCardWidth(undefined), 495);
  assert.equal(resolveCardWidth('600'), 600);
  assert.equal(resolveCardWidth(750), 750);
  // Clamping
  assert.equal(resolveCardWidth('100'), 300);
  assert.equal(resolveCardWidth(1500), 1200);

  // CANONICAL_WIDTHS map
  assert.equal(CANONICAL_WIDTHS.full, 830);
  assert.equal(CANONICAL_WIDTHS.half, 405);
  assert.equal(CANONICAL_WIDTHS.legacy, 495);
});

test('layout: getSizeClass returns full, half, or legacy', () => {
  assert.equal(getSizeClass(830), 'full');
  assert.equal(getSizeClass(720), 'full');
  assert.equal(getSizeClass(405), 'half');
  assert.equal(getSizeClass(495), 'legacy');
});

test('layout: getCardBounds returns consistent inner bounds', () => {
  const fullBounds = getCardBounds(830);
  assert.equal(fullBounds.contentWidth, 830 - 48);
  const halfBounds = getCardBounds(405);
  assert.equal(halfBounds.contentWidth, 405 - 32);
});

test('theme: resolveTheme supports semantic tokens and query overrides', () => {
  const defaultDark = resolveTheme('dark');
  assert.ok(defaultDark.positive);
  assert.ok(defaultDark.negative);
  assert.ok(defaultDark.neutral);
  assert.ok(defaultDark.heatmapLevels.length === 5);

  const customAccent = resolveTheme('dark', { accent: 'ff5500' });
  assert.equal(customAccent.title, '#ff5500');
  assert.equal(customAccent.iconColor, '#ff5500');

  const transparentTheme = resolveTheme('dark', { bg: 'transparent' });
  assert.equal(transparentTheme.bg, 'transparent');
  assert.ok(transparentTheme.cardBg.includes('rgba'));
});

test('tile: renderMetricTile outputs visible label, hero number, and delta without overflow', () => {
  const tileSvg = renderMetricTile({
    x: 10,
    y: 10,
    width: 140,
    height: 58,
    label: 'Total Commits',
    value: '1,420',
    delta: '+12%',
    deltaType: 'positive',
    theme: themes.dark,
  });

  assertValidXml(tileSvg);
  assert.ok(tileSvg.includes('TOTAL COMMITS'), 'Must render visible uppercase label');
  assert.ok(tileSvg.includes('1,420'), 'Must render hero number');
  assert.ok(tileSvg.includes('+12%'), 'Must render delta chip');
});

test('tile: renderMetricTile fits extreme long text without overflowing tile width', () => {
  const longValue = '999,999,999,999,999';
  const longLabel = 'Extraordinarily Long Metric Label That Might Overflow Card Container';
  const tileSvg = renderMetricTile({
    x: 0,
    y: 0,
    width: 100,
    height: 58,
    label: longLabel,
    value: longValue,
    theme: themes.dark,
  });

  assertValidXml(tileSvg);
  // Text should be fitted and not overflow
  assert.ok(tileSvg.includes('...'));
});

test('primitives: renderProgressRing renders static-first circular score and grade', () => {
  const ringSvg = renderProgressRing({
    score: 88,
    level: 'A+',
    x: 60,
    y: 60,
    radius: 40,
    theme: themes.dark,
  });

  assertValidXml(ringSvg);
  assert.ok(ringSvg.includes('A+'));
  assert.ok(ringSvg.includes('RANK'));
  assert.ok(ringSvg.includes('stroke-dashoffset'));
});

test('primitives: renderStackedBar renders proportional segments with clip mask', () => {
  const barSvg = renderStackedBar({
    segments: [
      { label: 'Commits', color: '#3fb950', percentage: 60 },
      { label: 'PRs', color: '#58a6ff', percentage: 40 },
    ],
    width: 250,
    height: 10,
    theme: themes.dark,
  });

  assertValidXml(barSvg);
  assert.ok(barSvg.includes('stacked-bar-clip'));
  assert.ok(barSvg.includes('#3fb950'));
  assert.ok(barSvg.includes('#58a6ff'));
});

test('primitives: renderCommitSparkline renders 8-point activity polyline', () => {
  const sparklineSvg = renderCommitSparkline([1, 3, 5, 8, 12, 10, 15, 20], 100, 25, '#58a6ff');
  assertValidXml(sparklineSvg);
  assert.ok(sparklineSvg.includes('class="sparkline"'));
  assert.ok(sparklineSvg.includes('<path d="M '));
});

test('primitives: renderHeatmapMatrix renders 26-week activity grid', () => {
  const mockWeeks = Array.from({ length: 26 }, () => ({
    contributionDays: Array.from({ length: 7 }, (_, d) => ({
      weekday: d,
      contributionCount: d % 3 === 0 ? 5 : 0,
    })),
  }));

  const heatmapSvg = renderHeatmapMatrix({
    weeks: mockWeeks,
    cellWidth: 8,
    cellGap: 2,
    cols: 26,
    theme: themes.dark,
  });

  assertValidXml(heatmapSvg);
  assert.ok(heatmapSvg.includes('class="heatmap-matrix"'));
  assert.ok(heatmapSvg.includes('<rect x="'));
});

test('primitives: renderDeltaChip renders positive and negative indicators', () => {
  const positiveChip = renderDeltaChip({ delta: 18, label: 'vs last year', theme: themes.dark });
  assertValidXml(positiveChip);
  assert.ok(positiveChip.includes('▲ +18%'));

  const negativeChip = renderDeltaChip({ delta: -6, theme: themes.dark });
  assertValidXml(negativeChip);
  assert.ok(negativeChip.includes('▼ -6%'));
});

test('primitives: renderTopicChips renders pill chips with valid XML', () => {
  const chipsSvg = renderTopicChips(['react', 'svg', 'github'], 200, themes.dark);
  assertValidXml(chipsSvg);
  assert.ok(chipsSvg.includes('react'));
  assert.ok(chipsSvg.includes('svg'));
});

test('primitives: renderReleaseTag renders release badge with valid XML', () => {
  const tagSvg = renderReleaseTag('v2.1.0', themes.dark);
  assertValidXml(tagSvg);
  assert.ok(tagSvg.includes('v2.1.0'));
});
