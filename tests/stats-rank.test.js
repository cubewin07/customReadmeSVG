import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRank } from '../src/core/stats/rank.js';
import { statsCard } from '../src/cards/stats/index.js';
import { themes } from '../src/svg/theme.js';

test('calculateRank returns score and grade without inverted percentile contradiction', () => {
  const result = calculateRank({ totalCommits: 500, totalStars: 30, totalForks: 10, totalRepos: 15, followers: 20 });
  assert.ok(result.score > 0 && result.score <= 100);
  assert.ok(['S+', 'S', 'A+', 'A', 'B+', 'B', 'C'].includes(result.level));
  assert.ok(typeof result.score === 'number');
  assert.ok(!isNaN(result.score));
  assert.equal(result.scoreText, `${result.score}/100`);
});

test('statsCard renders grade and score clearly in SVG across layouts', () => {
  const data = { totalCommits: 500, totalStars: 30, totalForks: 10, totalRepos: 15, followers: 20 };
  
  // Ring layout
  const ringSvg = statsCard.renderSvg(data, themes.dark, { layout: 'ring' });
  assert.ok(ringSvg.includes('Overall Rank'));
  assert.ok(!ringSvg.includes('Top 49.2%')); // Contradictory inverted label removed
  assert.ok(ringSvg.includes('Score'));
  // Top bar badge replaced duplicate rank with interesting activity metric
  assert.ok(ringSvg.includes('⚡ 500 Commits'), 'Top bar badge should show dynamic commits metric');
  assert.ok(!ringSvg.includes('🏆 Rank'), 'Duplicate Rank in top bar badge should be removed');
  assert.ok(ringSvg.includes('height="195"'), 'Layout height should be tightened from 215 to 195');

  // Bars layout
  const barsSvg = statsCard.renderSvg(data, themes.dark, { layout: 'bars' });
  assert.ok(!barsSvg.includes('Top 49.2%'));
  assert.ok(barsSvg.includes('Score'));

  // Hero layout
  const heroSvg = statsCard.renderSvg(data, themes.dark, { layout: 'hero' });
  assert.ok(!heroSvg.includes('Top 49.2%'));

  // Dashboard layout
  const dashSvg = statsCard.renderSvg(data, themes.dark, { layout: 'dashboard' });
  assert.ok(!dashSvg.includes('Top 49.2%'));

  // Compact layout
  const compSvg = statsCard.renderSvg(data, themes.dark, { layout: 'compact' });
  assert.ok(!compSvg.includes('Top 49.2%'));
});
