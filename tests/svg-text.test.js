import test from 'node:test';
import assert from 'node:assert/strict';
import { fitText, wrapText, measureText } from '../src/svg/text.js';

test('measureText returns reasonable widths for various strings', () => {
  const widthW = measureText('WWW', 10);
  const widthI = measureText('III', 10);
  assert.ok(widthW > widthI, 'Wide characters should measure wider than narrow characters');
  assert.equal(measureText('', 10), 0);
});

test('fitText truncates strings exceeding maxWidth', () => {
  const longName = 'really-extraordinarily-long-repository-name-that-overflows-card';
  const fitted = fitText(longName, 12, 100);
  assert.ok(fitted.endsWith('...'));
  assert.ok(measureText(fitted, 12) <= 100);
  assert.ok(fitted.length < longName.length);
});

test('fitText preserves strings that already fit', () => {
  const shortName = 'repo';
  assert.equal(fitText(shortName, 12, 100), 'repo');
});

test('wrapText wraps text into multiple lines within maxWidth', () => {
  const bio = 'High-performance reactive platform engineering with distributed systems and creative SVG art for developer workflows.';
  const lines = wrapText(bio, 11, 200, 2);
  assert.equal(lines.length, 2);
  assert.ok(measureText(lines[0], 11) <= 200);
  assert.ok(measureText(lines[1], 11) <= 200);
  assert.ok(lines[1].endsWith('...'));
});
