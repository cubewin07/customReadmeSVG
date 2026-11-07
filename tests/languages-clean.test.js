import test from 'node:test';
import assert from 'node:assert/strict';
import { languagesCard } from '../src/cards/languages/index.js';
import { themes } from '../src/svg/theme.js';

test('languagesCard donut layout shows clean percentage without inline KB clutter in legend', () => {
  const svg = languagesCard.renderSvg({
    languages: [
      { name: 'JavaScript', color: '#f1e05a', size: 1048576, percentage: 65.2 },
      { name: 'TypeScript', color: '#3178c6', size: 524288, percentage: 34.8 },
    ],
    totalSize: 1572864,
    totalLanguages: 2,
  }, themes.dark, { layout: 'donut' });

  // Right legend should have clean percentage
  assert.ok(svg.includes('65.2%'));
  // Should not clutter every row with redundant byte text right next to percentage
  assert.ok(!svg.includes('65.2% <tspan fill='));
});
