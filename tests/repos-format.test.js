import test from 'node:test';
import assert from 'node:assert/strict';
import { reposCard } from '../src/cards/repos/index.js';
import { themes } from '../src/svg/theme.js';

test('reposCard formatRelativeTime formats months as "mo ago" and not "m ago"', () => {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const svg = reposCard.renderSvg({
    repos: [{
      name: 'financial-management',
      description: 'Full stack reactive platform',
      stargazerCount: 18,
      forkCount: 4,
      primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
      updatedAt: sixtyDaysAgo,
    }],
  }, themes.dark);

  assert.ok(svg.includes('2mo ago'), 'Should use "2mo ago" instead of "2m ago"');
  assert.ok(!svg.includes('>2m ago<'), 'Should not contain ambiguous "2m ago"');
});

test('reposCard featured and spotlight layouts handle 1-2 repos without empty bands', () => {
  const data = {
    repos: [{
      name: 'customReadmeSVG',
      description: 'Dynamic game-inspired SVG cards for GitHub READMEs',
      stargazerCount: 42,
      forkCount: 8,
      primaryLanguage: { name: 'JavaScript', color: '#f1e05a' },
      updatedAt: new Date().toISOString(),
    }],
  };

  const featSvg = reposCard.renderSvg(data, themes.dark, { layout: 'featured' });
  assert.ok(featSvg.includes('customReadmeSVG'));

  const spotSvg = reposCard.renderSvg(data, themes.dark, { layout: 'spotlight' });
  assert.ok(spotSvg.includes('customReadmeSVG'));
});
