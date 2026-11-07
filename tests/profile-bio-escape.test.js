import test from 'node:test';
import assert from 'node:assert/strict';
import { profileCard } from '../src/cards/profile/index.js';
import { themes } from '../src/svg/theme.js';

test('profileCard split layout does not double-escape ampersands in bio', () => {
  const data = {
    login: 'cubewin07',
    name: 'Le Tan Thang',
    bio: 'Full-Stack Developer & Creative Technologist building next-gen web experiences.',
    followers: 142,
    following: 89,
    repositories: 38,
    totalStars: 420,
    company: 'Antigravity Studio',
    location: 'Auckland, NZ',
    websiteUrl: 'https://cubewin.dev',
    createdAt: '2020-03-15T08:00:00Z',
  };

  const allLayouts = ['split', 'classic', 'hero', 'compact', 'dashboard'];
  for (const layout of allLayouts) {
    const svg = profileCard.renderSvg(data, themes.dark, { layout, username: 'cubewin07' });
    assert.ok(
      !svg.includes('&amp;amp;'),
      `Layout "${layout}" contains double-escaped &amp;amp; in output`
    );
  }

  const bioLayouts = ['split', 'classic', 'hero', 'dashboard'];
  for (const layout of bioLayouts) {
    const svg = profileCard.renderSvg(data, themes.dark, { layout, username: 'cubewin07' });
    assert.ok(
      svg.includes('&amp;'),
      `Layout "${layout}" should properly escape & as &amp; in bio output`
    );
  }

  // Specifically check split layout bio tspan content
  const splitSvg = profileCard.renderSvg(data, themes.dark, { layout: 'split', username: 'cubewin07' });
  assert.ok(
    splitSvg.includes('Full-Stack Developer &amp; Creative'),
    'Split layout should render "Full-Stack Developer &amp; Creative" without double-escaping'
  );
});
