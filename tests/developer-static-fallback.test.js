import test from 'node:test';
import assert from 'node:assert/strict';
import { rollCounter } from '../src/cards/developer/utils/timeline.js';
import { developerCard } from '../src/cards/developer/index.js';
import { themes } from '../src/svg/theme.js';

test('rollCounter outputs resting static state displaying target number', () => {
  const rendered = rollCounter(50, 100, 64, '#fff');
  // Both digits 6 and 4 must have resting transform="translate(0, -...)" so static renderers see the target digit
  assert.ok(rendered.includes('transform="translate(0, -384)"'), 'First digit 6 should have resting transform at -384');
  assert.ok(rendered.includes('transform="translate(0, -336)"'), 'Second digit 4 should have resting transform at -336');
});

test('developerCard Act 1 desk is visible in static first frame with opacity 1 at t=0', () => {
  const svg = developerCard.renderSvg({
    name: 'Le Tan Thang',
    stats: [{ label: 'REPOSITORIES', value: 28 }, { label: 'TOTAL STARS', value: 64 }, { label: 'FOLLOWERS', value: 42 }],
  }, themes.dark);

  // Act 1 desk root container must start at opacity 1 at t=0
  assert.ok(svg.includes('values="1;1;0;0"'), 'Act 1 desk container must start at opacity 1');
});
