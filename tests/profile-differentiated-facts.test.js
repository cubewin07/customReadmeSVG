import test from 'node:test';
import assert from 'node:assert/strict';
import { profileCard } from '../src/cards/profile/index.js';
import { themes } from '../src/svg/theme.js';

test('profileCard highlights account tenure and distinct facts', () => {
  const svg = profileCard.renderSvg({
    name: 'Le Tan Thang',
    login: 'cubewin07',
    createdAt: '2021-03-15T00:00:00Z',
    repositories: 28,
    totalStars: 64,
    followers: 42,
  }, themes.dark, { layout: 'classic' });

  // Should display account age or tenure
  assert.ok(svg.includes('JOINED') || svg.includes('ACCOUNT AGE') || svg.includes('TENURE'));
  assert.ok(svg.includes('2021'));
});
