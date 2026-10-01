import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDeveloperData } from '../src/core/github/normalize.js';
import { renderChapterTracker } from '../src/cards/developer/components/chapterTracker.js';
import { renderInfoPanel } from '../src/cards/developer/components/infoPanel.js';
import { developerCard } from '../src/cards/developer/index.js';

test('normalizeDeveloperData does not inject fake streak 12, fake commitSha ea77b7c, or fake seed counts', () => {
  const rawUserWithZeroCommits = {
    user: {
      login: 'zerodev',
      name: 'Zero Dev',
      pinnedItems: { nodes: [] },
      topRepos: { nodes: [] },
      contributionsCollection: {
        totalCommitContributions: 0,
        contributionCalendar: {
          totalContributions: 0,
          weeks: [],
        },
      },
    },
  };

  const data = normalizeDeveloperData(rawUserWithZeroCommits);
  assert.equal(data.streak, 0, 'Zero commit user must have streak 0, not 12 or 14');
  assert.notEqual(data.commitSha, 'ea77b7c', 'Zero commit user must not have fake commitSha ea77b7c');
  assert.equal(data.commitSha, '', 'Zero commit user should have empty commitSha');
  assert.ok(Array.isArray(data.counts), 'Counts must be an array');
  assert.equal(data.counts.length, 60, 'Counts must have 60 items');
  assert.ok(data.counts.every(c => c === 0), 'Empty history counts must be honest 0s, not fake seed numbers');
});

test('renderChapterTracker renders honest 0 commits and 0 streak instead of fake 142 commits or 14-day streak', () => {
  const profile = {
    streak: 0,
    counts: new Array(60).fill(0),
  };

  const svg = renderChapterTracker(profile, {});
  assert.ok(!svg.includes('142'), 'Chapter tracker must not contain hardcoded 142 commits');
  assert.ok(svg.includes('(0 COMMITS)'), 'Chapter tracker must display (0 COMMITS) when count is 0');
  assert.ok(!svg.includes('14-day'), 'Chapter tracker must not fall back to 14-day streak');
  assert.ok(svg.includes('0-day streak'), 'Chapter tracker should display honest 0-day streak');
});

test('renderInfoPanel does not render fake ea77b7c or fake 64 stars for zero-stat user', () => {
  const data = {
    name: 'Zero Dev',
    login: 'zerodev',
    handle: '@zerodev',
    commitSha: '',
    annualCommits: 0,
    stats: [
      { label: 'REPOSITORIES', value: 0 },
      { label: 'TOTAL STARS', value: 0 },
      { label: 'FOLLOWERS', value: 0 },
    ],
  };

  const svg = renderInfoPanel(data, {});
  assert.ok(!svg.includes('ea77b7c'), 'Info panel must not render hardcoded ea77b7c SHA');
  assert.ok(!svg.includes('64 TOTAL STARS'), 'Info panel must not render fake 64 stars badge');
  assert.ok(svg.includes('0 TOTAL STARS'), 'Info panel must render honest 0 TOTAL STARS badge');
});

test('developerCard full SVG renders zero-commit user honestly without fake metrics', () => {
  const data = {
    name: 'Zero Dev',
    login: 'zerodev',
    handle: '@zerodev',
    commit: 'No recent public commits',
    commitSha: '',
    annualCommits: 0,
    streak: 0,
    counts: new Array(60).fill(0),
    tech: ['JavaScript'],
    stats: [
      { label: 'REPOSITORIES', value: 0 },
      { label: 'TOTAL STARS', value: 0 },
      { label: 'FOLLOWERS', value: 0 },
    ],
  };

  const svg = developerCard.renderSvg(data, 'standard-dark');
  assert.ok(!svg.includes('ea77b7c'), 'Full developer card must not contain ea77b7c');
  assert.ok(!svg.includes('142 COMMITS'), 'Full developer card must not contain 142 COMMITS');
  assert.ok(!svg.includes('14-day streak'), 'Full developer card must not contain 14-day streak');
});
