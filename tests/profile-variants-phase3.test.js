import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { profileCard } from '../src/cards/profile/index.js';
import { themes } from '../src/svg/theme.js';

function assertValidXml(svg) {
  try {
    execFileSync('xmllint', ['--noout', '-'], {
      input: svg,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (err) {
    assert.fail(`Generated SVG is not valid XML: ${err.stderr?.toString() || err.message}\nSVG snippet: ${svg.slice(0, 300)}`);
  }
}

const mockProfileData = {
  login: 'cubewin07',
  name: 'Le Tan Thang',
  bio: 'Full-Stack Developer & Creative Technologist building next-gen web experiences.',
  avatarUrl: 'https://avatars.githubusercontent.com/u/123456?v=4',
  url: 'https://github.com/cubewin07',
  followers: 142,
  following: 89,
  repositories: 38,
  totalStars: 420,
  company: 'Antigravity Studio',
  location: 'Auckland, NZ',
  websiteUrl: 'https://cubewin.dev',
  isHireable: true,
  createdAt: '2020-03-15T08:00:00Z',
  status: {
    emoji: '🚀',
    message: 'Shipping SVG engines',
  },
  organizations: [
    { name: 'Antigravity', login: 'antigravity-ai', avatarUrl: 'https://github.com/antigravity.png' },
    { name: 'Google DeepMind', login: 'deepmind', avatarUrl: 'https://github.com/deepmind.png' },
  ],
  topRepo: {
    name: 'customReadmeSVG',
    stars: 310,
    language: 'JavaScript',
    languageColor: '#f1e05a',
  },
  topLanguages: [
    { name: 'JavaScript', color: '#f1e05a', count: 18, percentage: 55 },
    { name: 'TypeScript', color: '#3178c6', count: 12, percentage: 32 },
    { name: 'HTML', color: '#e34c26', count: 4, percentage: 13 },
  ],
  monthlyContributions: [45, 60, 85, 110, 130, 95, 140, 160, 120, 150, 180, 105],
  calendar: {
    totalContributions: 1420,
    currentStreak: 16,
    longestStreak: 42,
    busiestWeekday: 'Wednesday',
    last30DaysCount: 145,
    weeks: Array.from({ length: 53 }, () => ({
      contributionDays: Array.from({ length: 7 }, (_, d) => ({
        weekday: d,
        contributionCount: d % 2 === 0 ? 3 : 0,
        date: '2026-05-01',
      })),
    })),
  },
};

test('Profile classic variant renders identity, bio, metadata links, isHireable badge, and footer summary', () => {
  const svg = profileCard.renderSvg(mockProfileData, themes.dark, { layout: 'classic' });
  assertValidXml(svg);
  assert.ok(svg.includes('Le Tan Thang'), 'Must render full name');
  assert.ok(svg.includes('@cubewin07'), 'Must render handle');
  assert.ok(svg.includes('Antigravity Studio'), 'Must render company');
  assert.ok(svg.includes('Auckland, NZ'), 'Must render location');
  assert.ok(svg.includes('cubewin.dev'), 'Must render website');
  assert.ok(svg.includes('Available for hire') || svg.includes('Open to Work') || svg.includes('Hireable'), 'Must render hireable badge');
  assert.ok(svg.includes('customReadmeSVG'), 'Must render top repo in footer summary');
  assert.ok(svg.includes('JavaScript'), 'Must render top language');
  assert.ok(svg.includes('JOINED') || svg.includes('ACCOUNT AGE') || svg.includes('Joined 2020'), 'Must render tenure');
});

test('Profile hero variant renders dual-language gradient banner, large avatar, and organization badges', () => {
  const svg = profileCard.renderSvg(mockProfileData, themes.dark, { layout: 'hero' });
  assertValidXml(svg);
  assert.ok(svg.includes('hero-banner-grad') || svg.includes('gradient'), 'Must render hero banner gradient');
  assert.ok(svg.includes('Antigravity'), 'Must render organization badges');
  assert.ok(svg.includes('JavaScript') || svg.includes('#f1e05a'), 'Must reflect top language color in banner/dots');
});

test('Profile compact variant renders ultra-compact ~72px single-row banner with 3 labelled chips', () => {
  const svg = profileCard.renderSvg(mockProfileData, themes.dark, { layout: 'compact' });
  assertValidXml(svg);
  assert.ok(svg.includes('height="72"') || svg.includes('height="70"') || svg.includes('height="75"'), 'Must be compact banner height ~72px');
  assert.ok(svg.includes('38') && svg.includes('142'), 'Must render repos and followers counts in chips');
  assert.ok(svg.includes('active') || svg.includes('years') || svg.includes('2020') || svg.includes('6y'), 'Must render tenure chip');
});

test('Profile split variant renders 2-column résumé with wrapped bio tspans, status, language bar, and 12m sparkline', () => {
  const svg = profileCard.renderSvg(mockProfileData, themes.dark, { layout: 'split' });
  assertValidXml(svg);
  assert.ok(svg.includes('class="bio-text"'), 'Must have bio-text class for test backwards-compatibility');
  assert.ok(svg.includes('<tspan'), 'Must wrap bio into tspans');
  assert.ok(svg.includes('Full-Stack Developer &amp; Creative'), 'Must cleanly escape & without double-escaping');
  assert.ok(svg.includes('Shipping SVG engines') || svg.includes('ABOUT'), 'Must render current focus or about section');
  assert.ok(svg.includes('polyline') || svg.includes('sparkline') || svg.includes('12-Month') || svg.includes('Activity'), 'Must render 12m activity sparkline');
});

test('Profile activity (dashboard) variant renders 53-week heatmap, streak capsules, busiest weekday, and 30-day volume', () => {
  const svg = profileCard.renderSvg(mockProfileData, themes.dark, { layout: 'activity' });
  assertValidXml(svg);
  assert.ok(svg.includes('heatmap-matrix') || svg.includes('activity-heatmap') || svg.includes('rect class="heatmap-cell'), 'Must render 53-week heatmap');
  assert.ok(svg.includes('16') && (svg.includes('Streak') || svg.includes('streak')), 'Must render streak');
  assert.ok(svg.includes('Wednesday') || svg.includes('Busiest') || svg.includes('BUSIEST'), 'Must render busiest weekday');
  assert.ok(svg.includes('145') || svg.includes('30-day') || svg.includes('30 Days') || svg.includes('Last 30'), 'Must render 30-day volume');
});

test('Profile card supports canonical widths (830 full, 405 half, 495 legacy)', () => {
  const fullSvg = profileCard.renderSvg(mockProfileData, themes.dark, { layout: 'classic', width: 'full' });
  assert.ok(fullSvg.includes('width="830"'));
  assertValidXml(fullSvg);

  const halfSvg = profileCard.renderSvg(mockProfileData, themes.dark, { layout: 'classic', width: 'half' });
  assert.ok(halfSvg.includes('width="405"'));
  assertValidXml(halfSvg);

  const defaultSvg = profileCard.renderSvg(mockProfileData, themes.dark, { layout: 'classic' });
  assert.ok(defaultSvg.includes('width="495"'));
  assertValidXml(defaultSvg);
});
