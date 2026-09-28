import test from 'node:test';
import assert from 'node:assert/strict';
import { profileCard } from '../src/cards/profile/index.js';
import { themes } from '../src/svg/theme.js';

test('profileCard split layout wraps bio text into tspans without overflowing', () => {
  const longBio = 'Senior engineer crafting distributed systems, high-performance web applications, and creative developer tools.';
  const svg = profileCard.renderSvg({
    name: 'Le Tan Thang',
    login: 'cubewin07',
    bio: longBio,
    repositories: 28,
    totalStars: 64,
    followers: 42,
    following: 15,
  }, themes.dark, { layout: 'split' });

  // Must wrap into multiple tspans
  assert.ok(svg.includes('<tspan'), 'Long bio must wrap into tspans in split layout');
  assert.ok(svg.includes('class="bio-text"'));
});
