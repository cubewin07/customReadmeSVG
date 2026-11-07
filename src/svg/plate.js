import { escapeXml } from './escape.js';
import { DISPLAY_FONT, MONO_FONT } from './fonts/data.js';
import { resolveTheme, themes } from './theme.js';

/**
 * Plates are the flagship README cards: a fixed wide canvas that scales down with the page,
 * huge embedded display type, and one data form taken from real engineering tools.
 * Sizes here are canvas units; GitHub shows a 1200-unit plate at roughly 830px.
 */

export const PLATE_WIDTH = 1200;
export const PLATE_PAD = 44;

function widthOf(font, value, px) {
  let total = 0;
  for (const char of String(value ?? '')) {
    total += font.advances[char] ?? 0.55;
  }
  return total * px;
}

export const displayWidth = (value, px) => widthOf(DISPLAY_FONT, value, px);
export const monoTextWidth = (value, px) => widthOf(MONO_FONT, value, px);

function fitWith(measure, value, px, maxWidth) {
  const str = String(value ?? '');
  if (measure(str, px) <= maxWidth) return str;
  const ellipsisWidth = measure('...', px);
  let out = str;
  while (out.length > 0 && measure(out, px) + ellipsisWidth > maxWidth) {
    out = out.slice(0, -1);
  }
  return out ? `${out.trimEnd()}...` : '';
}

export const fitDisplay = (value, px, maxWidth) => fitWith(displayWidth, value, px, maxWidth);
export const fitMonoText = (value, px, maxWidth) => fitWith(monoTextWidth, value, px, maxWidth);

export const DISPLAY_CAP = DISPLAY_FONT.cap;

/** Plates default to the cobalt theme unless a theme was asked for. */
export function plateTheme(theme, options = {}) {
  return resolveTheme(options.theme ? theme : themes.cobalt, options);
}

function hexToRgb(hex) {
  const value = String(hex).replace('#', '');
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
}

/** Mixes two #rrggbb colours; `amount` is the share of `b`. */
export function mixColor(a, b, amount) {
  const [ra, ga, ba] = hexToRgb(a);
  const [rb, gb, bb] = hexToRgb(b);
  const channel = (x, y) => Math.round(x + (y - x) * amount).toString(16).padStart(2, '0');
  return `#${channel(ra, rb)}${channel(ga, gb)}${channel(ba, bb)}`;
}

/** Warm frames for flame-like marks: the theme's own ramp, or steps of its accent. */
export function flameRamp(theme) {
  if (Array.isArray(theme.flame) && theme.flame.length) return theme.flame;
  const base = /^#[0-9a-f]{6}$/i.test(theme.accent) ? theme.accent : '#ff7a2f';
  return [0.32, 0.18, 0.06, 0, -0.1, 0.42].map((step) =>
    step >= 0 ? mixColor(base, '#ffffff', step) : mixColor(base, '#000000', -step));
}

/** Near-black or near-white, whichever reads on the fill. */
export function inkOn(fill) {
  const [r, g, b] = hexToRgb(fill);
  return 0.299 * r + 0.587 * g + 0.114 * b > 140 ? '#1A0D05' : '#FFF8EE';
}

export function plateText(x, y, content, cls, extra = '') {
  return `<text x="${x}" y="${y}" class="${cls}"${extra ? ` ${extra}` : ''}>${escapeXml(String(content ?? ''))}</text>`;
}

function fontFace(font) {
  return `@font-face{font-family:'${font.family}';font-weight:${font.weight};src:url(data:font/woff2;base64,${font.base64}) format('woff2');}`;
}

const FALLBACK_DISPLAY = "Impact, 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif";
const FALLBACK_MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/** Outer document: embedded fonts, surface, and the shared entrance animations. */
export function plate({ height, title, theme, css = '', defs = '', body = '', width = PLATE_WIDTH }) {
  const solid = theme.bg !== 'transparent';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" role="img" aria-label="${escapeXml(title)}">
<title>${escapeXml(title)}</title>
<style>
${fontFace(DISPLAY_FONT)}
${fontFace(MONO_FONT)}
.d{font-family:'${DISPLAY_FONT.family}',${FALLBACK_DISPLAY};font-weight:${DISPLAY_FONT.weight};}
.m{font-family:'${MONO_FONT.family}',${FALLBACK_MONO};}
.ink{fill:${theme.text};}
.mut{fill:${theme.secondaryText};}
.hot{fill:${theme.accent};}
.fade{animation:plateFade .6s ease-out both;}
@keyframes plateFade{from{opacity:0}to{opacity:1}}
@keyframes plateDraw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes platePulse{0%{opacity:.7;transform:scale(.4)}100%{opacity:0;transform:scale(2.4)}}
${css}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
<defs><clipPath id="plate-clip"><rect width="${width}" height="${height}" rx="16"/></clipPath>${defs}</defs>
<g clip-path="url(#plate-clip)">
${solid ? `<rect width="${width}" height="${height}" fill="${theme.bg}"/>` : ''}
${body}
</g>
</svg>`;
}

/** Stat set in the display face over a small mono label. */
export function plateMetric({ x, y, value, label, size = 48, labelSize = 15, valueCls = 'ink' }) {
  return `${plateText(x, y, value, `d ${valueCls}`, `font-size="${size}"`)}${plateText(x, y + labelSize + 8, label, 'm mut', `font-size="${labelSize}"`)}`;
}
