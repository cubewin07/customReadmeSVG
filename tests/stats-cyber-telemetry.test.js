import test from 'node:test';
import assert from 'node:assert/strict';
import { statsCard } from '../src/cards/stats/index.js';
import { themes } from '../src/svg/theme.js';

test('statsCard renders flagship Cyberpunk Telemetry HUD by default', () => {
  const data = {
    name: 'Tan Thang Le',
    login: 'cubewin07',
    totalCommits: 1580,
    totalContributions: 1809,
    pullRequests: 38,
    reviews: 4,
    issues: 5,
    currentStreak: 14,
    maxStreak: 21,
    totalRepos: 25,
    totalStars: 5,
    totalForks: 0,
    followers: 0,
  };

  const svg = statsCard.renderSvg(data, themes.dark);

  // HUD branding & header
  assert.ok(svg.includes('SYS.DEV // TELEMETRY HUD'), 'Must include HUD breadcrumb');
  assert.ok(svg.includes('Tan Thang Le'), 'Must include user name');
  assert.ok(svg.includes('(@cubewin07)'), 'Must include handle');
  assert.ok(svg.includes('⚡ 1,809 IMPACT'), 'Must include impact beacon');

  // Zone A: 2x2 Tactical Inset Modules
  assert.ok(svg.includes('CONTRIBUTIONS'), 'Must include contributions module');
  assert.ok(svg.includes('1,809'), 'Must render total contributions value');
  assert.ok(svg.includes('COMMITS PUSHED'), 'Must include commits module');
  assert.ok(svg.includes('1,580'), 'Must render commits value');
  assert.ok(svg.includes('PULL REQUESTS'), 'Must include PRs module');
  assert.ok(svg.includes('38'), 'Must render PR count');
  assert.ok(svg.includes('+4 Reviews'), 'Must render review count');
  assert.ok(svg.includes('ACTIVE STREAK'), 'Must include streak module');
  assert.ok(svg.includes('14'), 'Must render streak days');
  assert.ok(svg.includes('Peak: 21d'), 'Must render peak streak');

  // Zone B: Radial Velocity Gauge
  assert.ok(svg.includes('OVERALL RANK'), 'Must include rank tier title');
  assert.ok(svg.includes('SCORE'), 'Must include velocity score');
  assert.ok(svg.includes('TOP'), 'Must include velocity percentile callout');

  // Elimination of dead zero metrics
  assert.ok(!svg.includes('Total Forks:'), 'Dead 0 forks should not be a primary metric');
  assert.ok(!svg.includes('Followers:'), 'Dead 0 followers should not be a primary metric');
});

test('statsCard Cyberpunk HUD renders cleanly in light and alternative themes', () => {
  const data = {
    name: 'Developer',
    login: 'octocat',
    totalCommits: 500,
    totalContributions: 620,
    pullRequests: 15,
    reviews: 2,
    issues: 1,
    currentStreak: 5,
    maxStreak: 10,
    totalRepos: 12,
  };

  const lightSvg = statsCard.renderSvg(data, themes.light);
  assert.ok(lightSvg.includes('SYS.DEV // TELEMETRY HUD'));
  assert.ok(lightSvg.includes('SCORE'));

  const tokyoSvg = statsCard.renderSvg(data, themes.tokyonight);
  assert.ok(tokyoSvg.includes('SYS.DEV // TELEMETRY HUD'));
  assert.ok(tokyoSvg.includes('SCORE'));
});
