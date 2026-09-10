import { compileQuests } from '../src/cards/banner/compileQuests.js';
import assert from 'node:assert';

console.log('Running test-phase1.js...');

// Test 1: 4 mock TS repos -> 4 unique archetypes
const mock4TSRepos = [
  { name: 'repo-one', description: '', primaryLanguage: { name: 'TypeScript', color: '#3178c6' } },
  { name: 'repo-two', description: '', primaryLanguage: { name: 'TypeScript', color: '#3178c6' } },
  { name: 'repo-three', description: '', primaryLanguage: { name: 'TypeScript', color: '#3178c6' } },
  { name: 'repo-four', description: '', primaryLanguage: { name: 'TypeScript', color: '#3178c6' } },
];

const plan1 = compileQuests({ username: 'tester', repos: mock4TSRepos });
assert.strictEqual(plan1.stages.length, 4, 'Should have 4 stages');
const archetypes = plan1.stages.map(s => s.archetype);
console.log('Archetypes for 4 TS repos:', archetypes);
assert.strictEqual(new Set(archetypes).size, 4, 'All 4 archetypes must be unique');
assert.deepStrictEqual(archetypes, ['vault', 'forge', 'lab', 'tower'], 'Expected worked example A order');

// Test 2: Pin order preserved
const mockPinnedRepos = [
  { name: 'repo-fill-recent', pushedAt: '2026-09-01T00:00:00Z', primaryLanguage: { name: 'JavaScript' } },
  { name: 'repo-pin-2', pinned: true, pinIndex: 1, primaryLanguage: { name: 'C#' } },
  { name: 'repo-pin-1', pinned: true, pinIndex: 0, primaryLanguage: { name: 'Swift' } },
];

const plan2 = compileQuests({ username: 'tester', repos: mockPinnedRepos });
assert.strictEqual(plan2.stages[0].repo.name, 'repo-pin-1', '1st stage should be pinIndex 0');
assert.strictEqual(plan2.stages[1].repo.name, 'repo-pin-2', '2nd stage should be pinIndex 1');
assert.strictEqual(plan2.stages[2].repo.name, 'repo-fill-recent', '3rd stage should be recent fill');

// Test 3: 2 repos -> stages.length === 2, abilities scan, dash
const mock2Repos = [
  { name: 'repo-a', pinned: true, pinIndex: 0, primaryLanguage: { name: 'Swift' } },
  { name: 'repo-b', pinned: true, pinIndex: 1, primaryLanguage: { name: 'Go' } },
];
const plan3 = compileQuests({ username: 'tester', repos: mock2Repos });
assert.strictEqual(plan3.stages.length, 2);
assert.strictEqual(plan3.stages[0].ability, 'scan');
assert.strictEqual(plan3.stages[1].ability, 'dash');

console.log('✅ compileQuests.js tests passed successfully!');

// Test 4: fetchData showcase fallback sets pinned and pinIndex
import bannerCard from '../src/cards/banner/index.js';
// Offline / unknown user fallback
const fallbackData = await bannerCard.fetchData('nonexistent-user-xyz-404-fallback');
assert.ok(fallbackData.repos.length > 0, 'Should return repos');
const istats = fallbackData.repos.find(r => r.name === 'iStats');
assert.ok(istats, 'iStats should exist in fallback');
assert.strictEqual(istats.pinned, true, 'iStats should be pinned in showcase fallback');
assert.strictEqual(istats.pinIndex, 0, 'iStats should have pinIndex 0');
assert.ok(Array.isArray(istats.topics), 'iStats should have topics array');

// Test 5: Live / REST returns valid repo shape
const liveData = await bannerCard.fetchData('cubewin07');
assert.ok(liveData.repos.length > 0, 'Live data should return repos');
assert.ok('pinned' in liveData.repos[0], 'Repo should have pinned property');
assert.ok('topics' in liveData.repos[0], 'Repo should have topics property');
assert.ok('diskUsage' in liveData.repos[0], 'Repo should have diskUsage property');

console.log('✅ fetchData tests passed successfully!');

// Test 6: timeline.js verification
import { buildTimeline, opacityKeyTimes } from '../src/cards/banner/timeline.js';
const tl4 = buildTimeline(4);
assert.strictEqual(tl4.totalDur, 28, '4-stage totalDur should be 28');
assert.strictEqual(tl4.totalDurStr, '28.0s');
assert.ok(tl4.scenes.length > 0);
for (const scene of tl4.scenes) {
  assert.ok('t0' in scene && 't1' in scene && 'type' in scene && 'stageIndex' in scene);
  assert.ok(scene.t1 >= scene.t0);
}

const tl2 = buildTimeline(2);
assert.ok(tl2.totalDur < 28, '2-stage timeline should be shorter than 28s');
assert.strictEqual(tl2.totalDur, 19, '2-stage timeline should be 19s');

const streetOpacity = opacityKeyTimes(tl4, s => s.type === 'street' || s.type === 'campfire');
assert.ok(streetOpacity.keyTimes && streetOpacity.values);

console.log('✅ timeline.js tests passed successfully!');

// Test 7: bannerCard.renderSvg generates pure SMIL SVG with no <script>
const svg4 = bannerCard.renderSvg(fallbackData, null, { username: 'cubewin07' });
assert.ok(svg4.startsWith('<svg'), 'Should start with <svg');
assert.ok(svg4.endsWith('</svg>'), 'Should end with </svg>');
assert.strictEqual(svg4.includes('<script'), false, 'Should have 0 <script> tags');
assert.ok(svg4.includes('id="street-hub"'), 'Should contain static street-hub');
assert.ok(svg4.includes('id="interior-0"'), 'Should contain interior-0');
assert.ok(svg4.includes('id="interior-3"'), 'Should contain interior-3');
assert.ok(svg4.includes('id="fox-street"'), 'Should contain fox-street');
assert.ok(svg4.includes('fox-room-') || svg4.includes('fox-interior'), 'Should contain interior room fox');
assert.ok(svg4.includes('id="checkpoint-campfire"'), 'Should contain campfire');

// Test 8: 2-stage SVG generation
const mock2Data = { username: 'test', repos: mock2Repos, stats: { totalCommits: 50, totalStars: 5, totalRepos: 2 } };
const svg2 = bannerCard.renderSvg(mock2Data);
assert.strictEqual(svg2.includes('<script'), false, '2-stage banner should have 0 <script>');
assert.ok(svg2.includes('id="interior-0"'), 'Should contain interior-0');
assert.ok(svg2.includes('id="interior-1"'), 'Should contain interior-1');
assert.strictEqual(svg2.includes('id="interior-2"'), false, 'Should omit interior-2 when 2 stages');
assert.ok(svg2.includes('19.0s'), 'Should use 19.0s duration');

console.log('✅ banner SVG rendering tests passed successfully!');
console.log('🎉 ALL PHASE 1 TESTS PASSED!');
