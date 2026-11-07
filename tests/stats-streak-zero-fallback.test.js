import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeStats } from '../src/core/github/normalize.js';
import { statsCard } from '../src/cards/stats/index.js';
import { themes } from '../src/svg/theme.js';

test('normalizeStats returns real 0 streak without fabricating 3 and 14 days', () => {
  const rawData = {
    user: {
      login: 'zerouser',
      name: 'Zero Streak User',
      followers: { totalCount: 5 },
      repositories: {
        totalCount: 2,
        nodes: [{ stargazerCount: 1, forkCount: 0 }],
      },
      contributionsCollection: {
        totalCommitContributions: 0,
        totalPullRequestContributions: 0,
        totalIssueContributions: 0,
        totalPullRequestReviewContributions: 0,
        restrictedContributionsCount: 0,
        contributionCalendar: {
          totalContributions: 0,
          weeks: [
            {
              contributionDays: [
                { contributionCount: 0, date: '2026-09-20' },
                { contributionCount: 0, date: '2026-09-21' },
              ],
            },
          ],
        },
      },
      createdAt: '2026-01-01T00:00:00Z',
    },
  };

  const normalized = normalizeStats(rawData);
  assert.equal(normalized.currentStreak, 0, 'currentStreak must be 0, not fabricated 3');
  assert.equal(normalized.maxStreak, 0, 'maxStreak must be 0, not fabricated 14');

  // Test SVG rendering with 0 streak
  const svg = statsCard.renderSvg(normalized, themes.dark, { layout: 'hero', username: 'zerouser' });
  assert.ok(!svg.includes('3 Days'), 'Must not render fabricated 3 Days');
  assert.ok(!svg.includes('14 Days'), 'Must not render fabricated 14 Days');
});
