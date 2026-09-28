import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCardHeader } from '../src/svg/header.js';
import { themes } from '../src/svg/theme.js';

test('renderCardHeader outputs consistent header title and pill badge', () => {
  const headerSvg = renderCardHeader({
    title: 'Top Repositories (cubewin07)',
    badgeText: '🌟 Featured',
    width: 495,
    theme: themes.dark,
  });

  assert.ok(headerSvg.includes('class="card-header-title"'), 'Must include standardized card-header-title class');
  assert.ok(headerSvg.includes('🌟 Featured'), 'Must include badge text');
  assert.ok(headerSvg.includes('Top Repositories (cubewin07)'));
});

test('renderCardHeader renders without badge when badgeText is omitted', () => {
  const headerSvg = renderCardHeader({
    title: 'Only Title',
    width: 495,
    theme: themes.dark,
  });

  assert.ok(headerSvg.includes('class="card-header-title"'));
  assert.ok(headerSvg.includes('Only Title'));
  assert.ok(!headerSvg.includes('<rect'), 'Should not render badge rect');
});

