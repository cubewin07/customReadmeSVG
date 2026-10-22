import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { Buffer } from 'node:buffer';
import { developerCard } from '../src/cards/developer/index.js';
import { renderActOrbit } from '../src/cards/developer/components/actOrbit.js';
import { renderActIntro, renderActOutro } from '../src/cards/developer/components/actOutro.js';
import { rollCounter } from '../src/cards/developer/utils/timeline.js';
import { themes } from '../src/svg/theme.js';

function assertValidXml(svg) {
  try {
    execFileSync('xmllint', ['--noout', '-'], {
      input: svg,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (err) {
    assert.fail(`Developer SVG is not valid XML: ${err.stderr?.toString() || err.message}`);
  }
}

const RICH_PROFILE = {
  source: 'live',
  name: 'Tan Thang Le',
  login: 'cubewin07',
  handle: '@cubewin07',
  role: 'Full-Stack Engineer & Creative Coder',
  createdAt: '2024-11-21T13:12:05Z',
  joinedYear: 2024,
  accountDays: 702,
  commit: 'feat: 36s master loop redesign',
  commitSha: '87a74e1',
  annualCommits: 1275,
  streak: 2,
  longestStreak: 18,
  activeDays: 188,
  totalDays: 365,
  busiestWeekday: 3,
  peakDay: { count: 21, date: '2026-10-15' },
  tech: ['JavaScript', 'Swift', 'Java', 'Python'],
  langShares: [
    { name: 'JavaScript', color: '#f1e05a', pct: 82 },
    { name: 'Swift', color: '#F05138', pct: 12 },
    { name: 'Java', color: '#b07219', pct: 4 },
    { name: 'Python', color: '#3572A5', pct: 2 },
  ],
  stats: [
    { label: 'REPOSITORIES', value: 26 },
    { label: 'TOTAL STARS', value: 5 },
    { label: 'FOLLOWERS', value: 12 },
  ],
  counts: new Array(60).fill(4),
};

test('developerCard 36s 5-phase master loop coordinates Intro, Ship, Run, Build, Orbit, and Outro', () => {
  const svg = developerCard.renderSvg(RICH_PROFILE, themes.dark, {
    call: 'Thang',
    tagline: 'I build things that move.',
  });

  assertValidXml(svg);
  const byteSize = Buffer.byteLength(svg, 'utf8');
  assert.ok(byteSize < 102400, `Rich developer SVG must stay under 100 KB, got ${byteSize} bytes`);

  // 1. 36s master timeline
  assert.ok(svg.includes('dur="36s"'), 'Must animate on the 36s master loop');

  // 2. Shortened Act 3 HUD caption avoids streak flame collision
  assert.ok(svg.includes('7-WK VOXEL CITY (196C)'), 'Act 3 HUD caption should use compact 7-WK VOXEL CITY (${totalCommits}C) format');

  // 3. Intro Arc (Arcade Boot / Hi-Score)
  assert.ok(svg.includes('HI-SCORE'), 'Intro arc should display HI-SCORE row');
  assert.ok(svg.includes('BEST 18D'), 'Intro arc should display longest streak combo note');

  // 4. Act 4 (Polyglot Language Universe)
  assert.ok(svg.includes('ACT 04 // ORBIT'), 'Chapter tracker should include Act 4 Orbit caption');
  assert.ok(svg.includes('JavaScript 82%'), 'Act 4 should render top language moon with byte share percentage');
  assert.ok(svg.includes('Swift 12%'), 'Act 4 should render secondary language moon with byte share percentage');
  assert.ok(svg.includes('PEAK DAY'), 'Act 4 should render peak day insight chip');
  assert.ok(svg.includes('21 on 15 OCT'), 'Act 4 should format peak day count and date');

  // 5. Outro (Player Card / Sign-Off & Continue Countdown)
  assert.ok(svg.includes('I build things that move.'), 'Outro should render persona speech bubble tagline');
  assert.ok(svg.includes('COMBO MASTER'), 'Outro should render earned COMBO MASTER achievement');
  assert.ok(svg.includes('CENTURION'), 'Outro should render earned CENTURION achievement');
  assert.ok(svg.includes('CONTINUE?'), 'Outro should render retro arcade CONTINUE? prompt');
});

test('rollCounter avoids nested <svg> and calcMode="spline" to prevent WebKit/Blink 00 freeze', () => {
  const out = rollCounter(26, 319, 26, '#e6edf3');
  assert.ok(!out.includes('<svg '), 'rollCounter should use <g> + <clipPath> instead of nested <svg> time containers');
  assert.ok(!out.includes('calcMode="spline"'), 'rollCounter should avoid spline calcMode on text transforms');
  assert.ok(out.includes('transform="translate(0, -288)"'), 'Resting static state for digit 2 must be preserved');
  assert.ok(out.includes('transform="translate(0, -384)"'), 'Resting static state for digit 6 must be preserved');
});

test('renderActOrbit and renderActOutro standalone outputs are valid and respect custom persona options', () => {
  const orbitSvg = `<svg xmlns="http://www.w3.org/2000/svg">${renderActOrbit(RICH_PROFILE, themes.dark)}</svg>`;
  const introSvg = `<svg xmlns="http://www.w3.org/2000/svg">${renderActIntro(RICH_PROFILE, themes.dark)}</svg>`;
  const outroSvg = `<svg xmlns="http://www.w3.org/2000/svg">${renderActOutro(RICH_PROFILE, themes.dark, {
    call: 'Cube',
    tagline: 'Shipping pixels at 60fps.',
  })}</svg>`;

  assertValidXml(orbitSvg);
  assertValidXml(introSvg);
  assertValidXml(outroSvg);
  assert.ok(outroSvg.includes("HI, I'M CUBE"), 'Should respect custom call name option');
  assert.ok(outroSvg.includes('Shipping pixels at 60fps.'), 'Should respect custom tagline option');
});

test('developerCard redesign audit assertions: 5-pip chapter HUD, bio/role text fitting, and adaptive tagline', () => {
  // 1. renderChapterTracker renders all 5 act pips
  const svg = developerCard.renderSvg(RICH_PROFILE, themes.dark);
  assertValidXml(svg);
  assert.ok(svg.includes('cx="0"'), 'Pip 1 at cx=0');
  assert.ok(svg.includes('cx="16"'), 'Pip 2 at cx=16');
  assert.ok(svg.includes('cx="32"'), 'Pip 3 at cx=32');
  assert.ok(svg.includes('cx="48"'), 'Pip 4 at cx=48');
  assert.ok(svg.includes('cx="64"'), 'Pip 5 at cx=64');

  // 2. developerCard fits long bio (150 chars) and long role (80 chars) without overflowing left panel
  const longProfile = {
    ...RICH_PROFILE,
    role: 'Principal Distributed Systems Architecture Lead & High Performance Computing Engineer',
    bio: 'Pioneering distributed fault-tolerant microservices, low-latency stream engines, and reactive canvas user interfaces for cloud-native simulation platforms.',
    focus: [
      'Pioneering distributed fault-tolerant microservices, low-latency stream engines, and reactive canvas user interfaces for cloud-native simulation platforms.',
    ],
  };

  const longSvg = developerCard.renderSvg(longProfile, themes.dark);
  assertValidXml(longSvg);
  const byteSize = Buffer.byteLength(longSvg, 'utf8');
  assert.ok(byteSize < 102400, `SVG must stay under 100 KB, got ${byteSize}`);

  // 3. renderActOutro fits 40-character tagline inside bubble
  const longTagline = 'Architecting resilient hyper-scale systems daily.';
  const outroLongSvg = `<svg xmlns="http://www.w3.org/2000/svg">${renderActOutro(RICH_PROFILE, themes.dark, {
    tagline: longTagline,
  })}</svg>`;
  assertValidXml(outroLongSvg);
  assert.ok(outroLongSvg.includes('font-size="15"') || outroLongSvg.includes('font-size="16"'), 'Adaptive font size for long tagline');
});
