import test from 'node:test';
import assert from 'node:assert/strict';
import { DEVELOPER_QUERY } from '../src/core/github/queries.js';

test('DEVELOPER_QUERY fetches abbreviatedOid for real commit SHA', () => {
  assert.ok(DEVELOPER_QUERY.includes('abbreviatedOid'), 'Query must fetch abbreviated commit SHA');
});

test('DEVELOPER_QUERY fetches top languages for repositories', () => {
  assert.ok(DEVELOPER_QUERY.includes('languages('), 'Query must fetch repository languages');
});

test('DEVELOPER_QUERY fetches totalCommitContributions from contributionsCollection', () => {
  assert.ok(DEVELOPER_QUERY.includes('totalCommitContributions'), 'Query must fetch totalCommitContributions');
});
