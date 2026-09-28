import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDeveloperData } from '../src/core/github/normalize.js';

test('normalizeDeveloperData extracts real commitSha from abbreviatedOid', () => {
  const raw = {
    user: {
      login: 'testuser',
      repositories: {
        totalCount: 5,
        nodes: [{
          stargazerCount: 10,
          languages: { edges: [{ size: 5000, node: { name: 'Rust', color: '#dea584' } }] },
          defaultBranchRef: {
            target: {
              history: {
                nodes: [{ message: 'feat: add real sha', abbreviatedOid: '9b8c7d6' }],
              },
            },
          },
        }],
      },
      pinnedItems: {
        nodes: [{
          name: 'cool-project',
          stargazerCount: 10,
          primaryLanguage: { name: 'Rust', color: '#dea584' },
          languages: { edges: [{ size: 5000, node: { name: 'Rust', color: '#dea584' } }] },
          defaultBranchRef: {
            target: {
              history: {
                nodes: [{ message: 'feat: add real sha', abbreviatedOid: '9b8c7d6' }],
              },
            },
          },
        }],
      },
    },
  };

  const norm = normalizeDeveloperData(raw);
  assert.equal(norm.commitSha, '9b8c7d6', 'Should extract real abbreviated commit SHA');
  assert.ok(norm.tech.includes('Rust'), 'Should extract real languages instead of hardcoded list');
});

test('normalizeDeveloperData extracts annual commits count when present', () => {
  const raw = {
    user: {
      login: 'testuser',
      contributionsCollection: {
        totalCommitContributions: 480,
        contributionCalendar: {
          totalContributions: 620,
          weeks: [],
        },
      },
    },
  };

  const norm = normalizeDeveloperData(raw);
  assert.equal(norm.annualCommits, 480, 'Should extract totalCommitContributions as annualCommits');
});
