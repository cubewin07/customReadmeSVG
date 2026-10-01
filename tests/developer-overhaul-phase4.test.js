import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { Buffer } from 'node:buffer';
import { developerCard } from '../src/cards/developer/index.js';
import { themes } from '../src/svg/theme.js';

function assertValidXml(svg) {
  try {
    execFileSync('xmllint', ['--noout', '-'], {
      input: svg,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (err) {
    assert.fail(`Developer SVG is not valid XML: ${err.stderr?.toString() || err.message}\nSnippet: ${svg.slice(0, 400)}`);
  }
}

test('developerCard produces sub-100KB SVG bundle footprint', () => {
  const svg = developerCard.renderSvg({
    name: 'Le Tan Thang',
    handle: '@cubewin07',
    role: 'Full-Stack Engineer',
    streak: 14,
    counts: new Array(60).fill(4),
  }, themes.dark);

  const byteSize = Buffer.byteLength(svg, 'utf8');
  assert.ok(
    byteSize < 102400,
    `Developer card SVG size must be under 100 KB (102,400 bytes), got ${byteSize} bytes (${(byteSize / 1024).toFixed(2)} KB)`
  );
  assertValidXml(svg);
});

test('developerCard supports ?layout=stack with vertical stacking (584x740)', () => {
  const svg = developerCard.renderSvg({
    name: 'Le Tan Thang',
  }, themes.dark, { layout: 'stack' });

  assert.ok(svg.includes('viewBox="0 0 584 740"'), 'Stacked layout should have 584x740 viewBox');
  assert.ok(svg.includes('height="740"'), 'Stacked layout should have height="740"');
  assertValidXml(svg);
});

test('developerCard includes responsive media query for narrow viewports', () => {
  const svg = developerCard.renderSvg({}, themes.dark);
  assert.ok(
    svg.includes('@media (max-width: 700px)') || svg.includes('@media (max-width:700px)'),
    'Developer SVG should include @media (max-width: 700px) query'
  );
});

test('developerCard synchronizes left panel telemetry across the 3 acts', () => {
  const svg = developerCard.renderSvg({
    name: 'Le Tan Thang',
    streak: 21,
    commit: 'feat: overhaul developer card',
    commitSha: 'a1b2c3d',
    counts: new Array(60).fill(6),
  }, themes.dark);

  // Left panel must include synchronized act telemetry states for Act 1, 2, and 3
  assert.ok(svg.includes('left-act-telemetry'), 'Left panel should contain synchronized act telemetry container');
  assert.ok(svg.includes('STATUS // SHIPPING') || svg.includes('ACT 01 // SHIP'), 'Left panel should include Act 1 ship status');
  assert.ok(svg.includes('STATUS // RUNNING') || svg.includes('ACT 02 // RUN'), 'Left panel should include Act 2 runner status');
  assert.ok(svg.includes('STATUS // BUILDING') || svg.includes('ACT 03 // BUILD'), 'Left panel should include Act 3 build status');
});

test('developerCard uses data-driven language colors for scene accents', () => {
  // Test with Python as primary language (#3572A5)
  const pythonSvg = developerCard.renderSvg({
    name: 'Python Dev',
    repos: [
      { name: 'ml-pipeline', primaryLanguage: { name: 'Python', color: '#3572A5' } },
    ],
  }, themes.dark);

  // Test with Rust as primary language (#dea584)
  const rustSvg = developerCard.renderSvg({
    name: 'Rust Dev',
    repos: [
      { name: 'rusty-core', primaryLanguage: { name: 'Rust', color: '#dea584' } },
    ],
  }, themes.dark);

  assert.ok(pythonSvg.includes('#3572A5'), 'Python card should contain Python primary color #3572A5');
  assert.ok(rustSvg.includes('#dea584'), 'Rust card should contain Rust primary color #dea584');
});

test('developerCard readability pass ensures primary body font sizes >= 14px', () => {
  const svg = developerCard.renderSvg({
    name: 'Le Tan Thang',
    focus: ['Building reactive web applications.', 'Specializing in high performance SVG.'],
  }, themes.dark);

  // Core focus body text should be at least 14px (e.g. 14.5px)
  assert.ok(
    svg.includes('font-size="14.5"') || svg.includes('font-size="14"') || svg.includes('font-size="15"'),
    'Core focus body text should be at least 14px for readability on 1150 grid'
  );
});
