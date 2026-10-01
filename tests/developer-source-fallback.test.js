import test from 'node:test';
import assert from 'node:assert/strict';
import { developerCard } from '../src/cards/developer/index.js';

test('developerCard.fetchData tags source: "fallback" on API failure and avoids hardcoded stats', async () => {
  // Pass invalid credentials/endpoint or non-existent user with mocked network failure
  const fallbackData = await developerCard.fetchData('nonexistent-test-user-xyz', {
    cache: null, // bypass cache
    fetch: async () => {
      throw new Error('GitHub API simulated failure: Bad credentials');
    },
  });

  assert.equal(fallbackData.source, 'fallback', 'Data source should be tagged as "fallback"');
  assert.equal(fallbackData.login, 'nonexistent-test-user-xyz');
  assert.equal(fallbackData.handle, '@nonexistent-test-user-xyz');

  // Verify that DEFAULT_DEVELOPER_PROFILE stats (28 repos, 64 stars, 42 followers) are NOT returned
  const reposStat = fallbackData.stats?.find(s => s.label === 'REPOSITORIES')?.value;
  const starsStat = fallbackData.stats?.find(s => s.label === 'TOTAL STARS')?.value;
  const followersStat = fallbackData.stats?.find(s => s.label === 'FOLLOWERS')?.value;

  assert.notEqual(reposStat, 28, 'Must not report fabricated 28 repos on fallback');
  assert.notEqual(starsStat, 64, 'Must not report fabricated 64 stars on fallback');
  assert.notEqual(followersStat, 42, 'Must not report fabricated 42 followers on fallback');

  // Verify rendered SVG displays explicit data unavailable state
  const svg = developerCard.renderSvg(fallbackData, 'standard-dark');
  assert.ok(svg.includes('DATA UNAVAILABLE'), 'SVG markup must indicate DATA UNAVAILABLE');
  assert.ok(!svg.includes('64 TOTAL STARS'), 'Rendered SVG must not show 64 TOTAL STARS badge');
  assert.ok(!svg.includes('customReadmeSVG'), 'Rendered SVG must not show hardcoded pinned repo');
});
