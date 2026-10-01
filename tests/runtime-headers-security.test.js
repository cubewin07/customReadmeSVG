import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest, sharedCache } from '../src/runtime/handleRequest.js';

test('handleRequest returns README-optimized cache-control headers and drops query token', async () => {
  const res = await handleRequest('/cubewin07/developer', {
    query: {
      cache: '1',
      token: 'ghp_secret_token_that_must_not_be_propagated',
    },
  });

  assert.equal(res.status, 200);
  assert.equal(
    res.headers['Cache-Control'],
    'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400',
    'Cache-Control must specify 30m client cache, 1h CDN cache, and 24h stale-while-revalidate'
  );
  assert.equal(res.headers['Content-Type'], 'image/svg+xml; charset=utf-8');
});

test('handleRequest returns no-store headers for 404 card not found', async () => {
  const res = await handleRequest('/cubewin07/nonexistent_card_xyz');
  assert.equal(res.status, 404);
  assert.equal(res.headers['Cache-Control'], 'no-cache, no-store, must-revalidate');
});

test('handleRequest serves last good cached copy on API errors (stale-while-revalidate)', async () => {
  const testUser = 'nonexistent_test_user_xyz_999';
  const cacheKey = `gh:profile:${testUser}:v1`;

  // Pre-seed cache with last good raw GraphQL response
  sharedCache.set(cacheKey, {
    user: {
      login: testUser,
      name: 'Offline Cached Hero',
      bio: 'Cached from previous successful fetch',
      avatarUrl: '',
      followers: { totalCount: 10 },
      following: { totalCount: 5 },
      repositories: { totalCount: 8, nodes: [] },
      createdAt: '2021-01-01T00:00:00Z',
    },
  }, -1000); // Expired TTL in past

  // Request should recover from API error by serving the stale cached copy
  const res = await handleRequest(`/${testUser}`, { query: { version: 'v1' } });
  assert.equal(res.status, 200);
  assert.equal(
    res.headers['Cache-Control'],
    'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400'
  );
  assert.ok(res.body.includes('Cached from previous successful fetch'));
});
