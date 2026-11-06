import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { languagesCard } from '../src/cards/languages/index.js';
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

const mockLanguagesData = {
  totalSize: 4500000,
  totalLanguages: 8,
  totalRepos: 24,
  languages: [
    { name: 'TypeScript', color: '#3178c6', size: 2250000, percentage: 50.0, repoCount: 14, lastUsedMonthsAgo: 1, recentShare: 65.0 },
    { name: 'JavaScript', color: '#f1e05a', size: 1350000, percentage: 30.0, repoCount: 18, lastUsedMonthsAgo: 2, recentShare: 20.0 },
    { name: 'Python', color: '#3572A5', size: 450000, percentage: 10.0, repoCount: 6, lastUsedMonthsAgo: 4, recentShare: 10.0 },
    { name: 'Rust', color: '#dea584', size: 225000, percentage: 5.0, repoCount: 3, lastUsedMonthsAgo: 1, recentShare: 5.0 },
    { name: 'HTML', color: '#e34c26', size: 135000, percentage: 3.0, repoCount: 10, lastUsedMonthsAgo: 6, recentShare: 0.0 },
    { name: 'CSS', color: '#563d7c', size: 90000, percentage: 2.0, repoCount: 8, lastUsedMonthsAgo: 6, recentShare: 0.0 },
  ],
};

test('Languages compact variant renders clean ~110px stacked bar and legend without KB clutter', () => {
  const svg = languagesCard.renderSvg(mockLanguagesData, themes.dark, { layout: 'compact' });
  assertValidXml(svg);
  assert.ok(svg.includes('height="110"') || svg.includes('height="115"') || svg.includes('height="120"'), 'Height should be compact ~110px');
  assert.ok(svg.includes('TypeScript') && svg.includes('50%'), 'Must show top language and percentage');
  assert.ok(!svg.includes('KB') && !svg.includes('MB'), 'Must not have inline KB/MB clutter');
});

test('Languages donut variant renders center top-language hole callout, top-5 legend, and Other percentage', () => {
  const svg = languagesCard.renderSvg(mockLanguagesData, themes.dark, { layout: 'donut' });
  assertValidXml(svg);
  assert.ok(svg.includes('TypeScript') && svg.includes('50%'), 'Must render top language in donut');
  assert.ok(svg.includes('Other') || svg.includes('languages across'), 'Must render category summary or other percentage');
  assert.ok(svg.includes('stroke-dasharray'), 'Must render SVG donut circle arcs');
});

test('Languages list variant renders ranked bars (#1-#5), repo counts, and recency indicators', () => {
  const svg = languagesCard.renderSvg(mockLanguagesData, themes.dark, { layout: 'list' });
  assertValidXml(svg);
  assert.ok(svg.includes('#1') && svg.includes('#2'), 'Must render rank standings');
  assert.ok(svg.includes('repos') || svg.includes('repo'), 'Must render repo counts per language');
  assert.ok(svg.includes('ago') || svg.includes('Recent'), 'Must render last used recency');
});

test('Languages polyglot variant renders proportional geometric mosaic treemap with embedded labels', () => {
  const svg = languagesCard.renderSvg(mockLanguagesData, themes.dark, { layout: 'polyglot' });
  assertValidXml(svg);
  assert.ok(svg.includes('waffle') && svg.includes('polyglot'), 'Must render waffle structure');
  assert.ok(svg.includes('TypeScript') && svg.includes('JavaScript'), 'Must embed language labels in cells');
});

test('Languages evolution variant renders comparative historical vs current language stack shares', () => {
  const svg = languagesCard.renderSvg(mockLanguagesData, themes.dark, { layout: 'evolution' });
  assertValidXml(svg);
  assert.ok(svg.includes('All time') && svg.includes('Last 12 months'), 'Must render evolution comparison');
  assert.ok(svg.includes('TypeScript'), 'Must render language trajectories');
});

test('Languages card respects options.hide by filtering specified languages and renormalizing percentages', () => {
  const svg = languagesCard.renderSvg(mockLanguagesData, themes.dark, { layout: 'donut', hide: 'html,css' });
  assertValidXml(svg);
  assert.ok(!svg.includes('HTML') && !svg.includes('CSS'), 'Must exclude hidden languages');
  // Remaining total = 4275000. TypeScript 2250000 / 4275000 = ~52.6%
  assert.ok(svg.includes('52.6%') || svg.includes('53%'), 'Must renormalize percentages among remaining languages');
});

test('Languages card supports canonical widths (830 full, 405 half, 495 legacy) and outputs 100% valid XML', () => {
  const fullSvg = languagesCard.renderSvg(mockLanguagesData, themes.dark, { layout: 'donut', width: 'full' });
  assert.ok(fullSvg.includes('width="830"'));
  assertValidXml(fullSvg);

  const halfSvg = languagesCard.renderSvg(mockLanguagesData, themes.dark, { layout: 'donut', width: 'half' });
  assert.ok(halfSvg.includes('width="405"'));
  assertValidXml(halfSvg);

  const defaultSvg = languagesCard.renderSvg(mockLanguagesData, themes.dark, { layout: 'donut' });
  assert.ok(defaultSvg.includes('width="495"'));
  assertValidXml(defaultSvg);
});

test('Languages redesign audit assertions: polyglot renders 6+ languages and enforces minimum cell bounds', () => {
  const skewedData = {
    totalSize: 10000000,
    totalLanguages: 6,
    totalRepos: 10,
    languages: [
      { name: 'TypeScript', color: '#3178c6', size: 9200000, percentage: 92.0, repoCount: 8 },
      { name: 'JavaScript', color: '#f1e05a', size: 400000, percentage: 4.0, repoCount: 3 },
      { name: 'Python', color: '#3572A5', size: 200000, percentage: 2.0, repoCount: 2 },
      { name: 'Rust', color: '#dea584', size: 100000, percentage: 1.0, repoCount: 1 },
      { name: 'HTML', color: '#e34c26', size: 50000, percentage: 0.5, repoCount: 2 },
      { name: 'CSS', color: '#563d7c', size: 50000, percentage: 0.5, repoCount: 2 },
    ],
  };

  const svg = languagesCard.renderSvg(skewedData, themes.dark, { layout: 'polyglot', langs_count: '6' });
  assertValidXml(svg);
  // Must render all 6 languages, including CSS
  assert.ok(svg.includes('CSS'), 'Polyglot must render all requested languages including 6th item');

  // One waffle cell per percent, and small languages keep a visible cell
  const cells = svg.match(/class="waffle-cell/g) || [];
  assert.equal(cells.length, 100, 'Waffle must render exactly 100 cells');
  for (const color of ['#e34c26', '#563d7c']) {
    assert.ok(svg.includes(`waffle-cell ci" x`) && svg.includes(`fill="${color}"`), `${color} must keep at least one cell`);
  }
});
