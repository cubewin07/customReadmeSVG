import test from 'node:test';
import assert from 'node:assert/strict';
import { renderActDesk } from '../src/cards/developer/components/actDesk.js';

test('renderActDesk fits long repository names without overflowing hologram frame', () => {
  const actDeskSvg = renderActDesk({
    repos: [
      { name: 'financial-management', language: 'TypeScript', color: '#3178c6', stars: 18, sparkline: [1, 2, 3, 4] },
      { name: 'short-repo', language: 'JavaScript', color: '#f1e05a', stars: 32, sparkline: [1, 2, 3, 4] },
      { name: 'super-ultra-long-repository-name-that-definitely-overflows', language: 'Python', color: '#3572A5', stars: 14, sparkline: [1, 2, 3, 4] },
    ],
  });

  // Long repo name financial-management must use adaptive font size or truncation so it fits in 136px
  assert.ok(actDeskSvg.includes('font-size="11"') || actDeskSvg.includes('font-size="11.5"'), 'Should scale font size down for long repo names');
  // Extreme repo name must be truncated cleanly with ellipsis
  assert.ok(actDeskSvg.includes('super-ultra-long-r...'), 'Extreme repo names must be safely truncated');
});
