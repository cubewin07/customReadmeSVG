import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDeveloperData } from '../src/core/github/normalize.js';

test('normalizeDeveloperData calculates sparklines from real weekly commit dates, not message charCode', () => {
  const now = new Date('2026-10-01T12:00:00Z').getTime();

  const makePayload = (message, committedDate) => ({
    user: {
      login: 'testdev',
      name: 'Test Dev',
      pinnedItems: {
        nodes: [
          {
            name: 'repo-with-recent-commit',
            stargazerCount: 10,
            primaryLanguage: { name: 'JavaScript', color: '#f1e05a' },
            defaultBranchRef: {
              target: {
                history: {
                  nodes: [
                    {
                      message,
                      committedDate,
                      abbreviatedOid: 'abc1234',
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    },
  });

  // Commit from 2 days ago (most recent week, bin 7)
  const commitRecentDate = '2026-09-29T12:00:00Z';
  const data1 = normalizeDeveloperData(makePayload('A short message', commitRecentDate), { now });
  const data2 = normalizeDeveloperData(makePayload('Z totally different char code', commitRecentDate), { now });

  assert.ok(data1?.repos?.[0]?.sparkline, 'Should produce repos sparkline');
  const spark1 = data1.repos[0].sparkline;
  const spark2 = data2.repos[0].sparkline;

  // The sparkline must be identical regardless of commit message string
  assert.deepEqual(
    spark1,
    spark2,
    'Sparkline must depend on commit dates, not commit message char codes'
  );

  // Recent commit must register in the latest bin (index 7), and older bins should be baseline (1)
  assert.equal(spark1[7], 9, 'Most recent week should be peak (9)');
  assert.equal(spark1[0], 1, 'Older week with 0 commits should be baseline (1)');

  // Repos with no commits should produce a flat baseline [1, 1, 1, 1, 1, 1, 1, 1], never fabricated [2, 4, 3, 5, 4, 7, 6, 8]
  const emptyPayload = {
    user: {
      login: 'testdev',
      name: 'Test Dev',
      pinnedItems: {
        nodes: [
          {
            name: 'empty-repo',
            stargazerCount: 0,
            defaultBranchRef: null,
          },
        ],
      },
    },
  };
  const emptyData = normalizeDeveloperData(emptyPayload);
  assert.deepEqual(
    emptyData.repos[0].sparkline,
    [1, 1, 1, 1, 1, 1, 1, 1],
    'Empty repo must have honest flat baseline sparkline, not fabricated pattern'
  );
});
