import test from 'node:test';
import assert from 'node:assert/strict';
import { renderInfoPanel } from '../src/cards/developer/components/infoPanel.js';
import { themes } from '../src/svg/theme.js';

test('renderInfoPanel removes redundant 14D strip and uses legible font sizes', () => {
  const panel = renderInfoPanel({
    name: 'Le Tan Thang',
    handle: '@cubewin07',
    role: 'Full-Stack Engineer',
    tech: ['React', 'Node.js', 'TypeScript'],
    stats: [{ label: 'REPOSITORIES', value: 28 }, { label: 'TOTAL STARS', value: 64 }, { label: 'FOLLOWERS', value: 42 }],
  }, themes.dark);

  // Redundant 14D mini heatmap strip removed (handled by Act 2)
  assert.ok(!panel.includes('14D ACTIVITY'), 'Should remove duplicate 14D activity strip');
  // Small 8.5px SHA badge enlarged
  assert.ok(!panel.includes('font-size="8.5"'), 'Small 8.5px text should be scaled up');
  // Arbitrary LEGENDARY ARCHITECT formula replaced with honest activity metric
  assert.ok(!panel.includes('LEGENDARY ARCHITECT'));
  // Personalized member since tenure badge rendered
  assert.ok(panel.includes('MEMBER SINCE'), 'Should render personalized MEMBER SINCE badge');
  assert.ok(panel.includes('2024'), 'Should render member joined year');
  assert.ok(!panel.includes(':checkered_flag:'), 'Should never display unrendered raw slack emoji shortcode');
});
