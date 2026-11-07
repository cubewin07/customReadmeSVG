import test from 'node:test';
import assert from 'node:assert/strict';
import { developerCard } from '../src/cards/developer/index.js';
import { themes } from '../src/svg/theme.js';

test('developerCard renders unified 3-act chapter tracker instead of disconnected prompts', () => {
  const svg = developerCard.renderSvg({
    name: 'Le Tan Thang',
    commit: 'feat: add visual snapshot engine',
    streak: 14,
    counts: new Array(60).fill(5),
  }, themes.dark);

  // Must include unified chapter tracker titles
  assert.ok(svg.includes('ACT 01 // SHIP'), 'Must include Act 1 Ship tracker title');
  assert.ok(svg.includes('ACT 02 // RUN'), 'Must include Act 2 Run tracker title');
  assert.ok(svg.includes('ACT 03 // BUILD'), 'Must include Act 3 Build tracker title');
  // Disconnected CLI prompt replaced
  assert.ok(!svg.includes('> ship_it.sh'), 'Old disconnected > ship_it.sh prompt should be removed');

  // Capsule width must be at least 480 to contain longest titles without overflowing
  assert.ok(svg.includes('width="484"'), 'HUD glass capsule width must be at least 484 to contain titles fully');
  // Redundant scrubber translation overlapping pip 1 removed
  assert.ok(!svg.includes('[12, 24, 0]'), 'Scrubber translation keyframe overlapping Pip 1 must be removed');
});
