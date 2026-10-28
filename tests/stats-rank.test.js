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

test('calculateRank prevents solo commit volume with low stars/followers from getting an easy A', () => {
  // User profile with solid commits/PRs but minimal stars/followers/reviews should get B (not A)
  const soloBuilder = calculateRank({
    totalCommits: 1580,
    totalContributions: 1809,
    pullRequests: 38,
    reviews: 4,
    issues: 5,
    totalRepos: 25,
    totalStars: 5,
    totalForks: 0,
    followers: 0,
  });
  assert.ok(
    ['C', 'B'].includes(soloBuilder.level),
    `Expected C or B for solo personal-project profile, got ${soloBuilder.level} (${soloBuilder.score})`
  );
  assert.ok(soloBuilder.score < 35, `Expected score < 35, got ${soloBuilder.score}`);

  // Well-rounded senior / active OSS developer with strong commits, PRs, reviews, stars, and followers earns A/A+
  const wellRounded = calculateRank({
    totalCommits: 1800,
    totalContributions: 2200,
    pullRequests: 110,
    reviews: 55,
    issues: 35,
    totalRepos: 30,
    totalStars: 350,
    totalForks: 60,
    followers: 120,
  });
  assert.ok(
    ['A', 'A+'].includes(wellRounded.level),
    `Expected A or A+ for well-rounded OSS profile, got ${wellRounded.level} (${wellRounded.score})`
  );

  // Top-tier OSS maintainer earns S or S+
  const eliteMaintainer = calculateRank({
    totalCommits: 5000,
    totalContributions: 6200,
    pullRequests: 400,
    reviews: 200,
    issues: 150,
    totalRepos: 60,
    totalStars: 4000,
    totalForks: 600,
    followers: 1500,
  });
  assert.ok(
    ['S', 'S+'].includes(eliteMaintainer.level),
    `Expected S or S+ for elite maintainer, got ${eliteMaintainer.level} (${eliteMaintainer.score})`
  );
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
