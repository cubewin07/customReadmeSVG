import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { statsCard } from '../src/cards/stats/index.js';
import { themes } from '../src/svg/theme.js';

test('statsCard bars layout generates strictly valid XML without tag mismatch', () => {
  const data = {
    name: 'Le Tan Thang',
    login: 'cubewin07',
    totalStars: 420,
    totalCommits: 2840,
    totalForks: 65,
    totalRepos: 38,
    followers: 142,
    pullRequests: 28,
    currentStreak: 14,
  };

  const svg = statsCard.renderSvg(data, themes.dark, { layout: 'bars', username: 'cubewin07' });

  // xmllint must parse without errors
  let xmlLintPassed = true;
  let xmlLintError = '';
  try {
    execFileSync('xmllint', ['--noout', '-'], { input: svg, encoding: 'utf-8' });
  } catch (err) {
    xmlLintPassed = false;
    xmlLintError = err.stderr || err.message;
  }

  assert.ok(xmlLintPassed, `XML validation failed: ${xmlLintError}`);
});
