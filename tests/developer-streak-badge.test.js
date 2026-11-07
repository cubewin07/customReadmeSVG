import test from 'node:test';
import assert from 'node:assert/strict';
import { developerCard } from '../src/cards/developer/index.js';
import { themes } from '../src/svg/theme.js';

test('developerCard streak badge is contained within HUD without scene edge clipping', () => {
  const svg = developerCard.renderSvg({
    name: 'Le Tan Thang',
    streak: 142,
    counts: new Array(60).fill(5),
  }, themes.dark);

  // Must not have the old clipped translation coordinate at 486,26 that overflows SW (584)
  assert.ok(
    !svg.includes('translate(486,26)'),
    'Old clipped coordinate translate(486,26) that overflows scene boundary (584) must be removed'
  );

  // Streak badge should be inside the HUD capsule
  assert.ok(
    svg.includes('142-day streak'),
    'Developer card should render streak text'
  );
});
