import { graphql } from '../../core/github/client.js';
import { STATS_QUERY } from '../../core/github/queries.js';
import { normalizeStats } from '../../core/github/normalize.js';
import {
  DISPLAY_CAP,
  PLATE_PAD,
  PLATE_WIDTH,
  displayWidth,
  fitDisplay,
  fitMonoText,
  monoTextWidth,
  plate,
  plateMetric,
  plateText,
  plateTheme,
} from '../../svg/plate.js';

const WINDOW_DAYS = 28;
const ROW_GAP = 16;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function shortDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return match ? `${Number(match[3])} ${MONTHS[Number(match[2]) - 1]}` : '';
}

function monthOf(iso) {
  const match = /^\d{4}-(\d{2})/.exec(iso || '');
  return match ? MONTHS[Number(match[1]) - 1] : '';
}

/** Splits the calendar into equal windows counted back from today; the oldest row sits at the back. */
function toWindows(days) {
  const windows = [];
  for (let i = days.length % WINDOW_DAYS; i < days.length; i += WINDOW_DAYS) {
    windows.push(days.slice(i, i + WINDOW_DAYS));
  }
  return windows;
}

/**
 * One ridge: a narrow bump per day, so a single busy day reads as a single peak. The line runs
 * flat to both edges of the plate, and flat runs collapse to keep the output small.
 */
function ridgePoints(windowDays, { x0, x1, base, amplitude, max, width }) {
  const perDay = 5.5;
  const span = windowDays.length - 1;
  const xOf = (t) => x0 + (t / span) * (x1 - x0);
  const heightAt = (t) => {
    let height = 0;
    windowDays.forEach((day, j) => {
      const count = day.contributionCount || 0;
      if (!count || Math.abs(t - j) > 1.4) return;
      height += ((count / max) ** 0.55) * Math.exp(-((t - j) ** 2) / (2 * 0.3 * 0.3));
    });
    return Math.min(1, height);
  };

  const points = [[0, base]];
  const steps = Math.round((span + 2.4) * perDay);
  let previousFlat = true;
  for (let i = 0; i <= steps; i++) {
    const t = -1.2 + (i / steps) * (span + 2.4);
    const lift = heightAt(t);
    const flat = lift < 0.002;
    const nextFlat = heightAt(-1.2 + ((i + 1) / steps) * (span + 2.4)) < 0.002;
    if (!(flat && previousFlat && nextFlat)) {
      points.push([xOf(t), base - lift * amplitude]);
    }
    previousFlat = flat;
  }
  points.push([width, base]);
  return points;
}

function pathFrom(points) {
  return `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}`;
}

export const signatureCard = {
  id: 'signature',
  title: 'Signature Plate',
  aliases: ['hero', 'banner'],
  cacheTtlMs: 3600000,

  async fetchData(username, options = {}) {
    const data = await graphql(STATS_QUERY, { login: username }, {
      ...options,
      cacheKey: options.cacheKey || `gh:signature:${username}`,
      ttlMs: options.ttlMs || this.cacheTtlMs,
    });
    const normalized = normalizeStats(data);
    if (!normalized) throw new Error(`User "${username}" not found.`);
    return normalized;
  },

  renderSvg(data, rawTheme, options = {}) {
    const theme = plateTheme(rawTheme, options);
    const width = PLATE_WIDTH;
    const pad = PLATE_PAD;
    const inner = width - pad * 2;
    const solid = theme.bg !== 'transparent';

    const login = data?.login || options.username || '';
    const displayName = String(options.name || data?.name || login || 'Developer').toUpperCase();
    const role = String(options.role || 'Last 12 months on GitHub').toUpperCase();

    // The name fills the plate; only very long names lose characters.
    const naturalSize = Math.min(350, (inner / displayWidth(displayName, 100)) * 100);
    const nameSize = Math.max(96, naturalSize);
    const nameShown = fitDisplay(displayName, nameSize, inner);
    const capHeight = nameSize * DISPLAY_CAP;
    const nameTop = 66;
    const nameBaseline = Math.round(nameTop + capHeight);

    const weeks = Array.isArray(data?.weeks) ? data.weeks : [];
    const days = weeks.flatMap((week) => week.contributionDays || []);
    const windows = toWindows(days);
    const max = Math.max(1, ...days.map((day) => day.contributionCount || 0));

    const labelW = 56;
    const x0 = pad;
    const x1 = width - pad - labelW;
    const amplitude = ROW_GAP * 6.2;
    // Ridges may only bite into the lower third of the letters, however small a long name gets.
    const firstBase = Math.round(nameBaseline - 4 + Math.max(0, amplitude - capHeight * 0.34));
    const rowCount = Math.max(windows.length, 1);
    const lastBase = firstBase + (rowCount - 1) * ROW_GAP;
    const metricsY = lastBase + 70;
    const height = metricsY + 46;

    let peak = null;
    let gradients = '';
    const rows = windows.map((windowDays, r) => {
      const base = firstBase + r * ROW_GAP;
      const points = ridgePoints(windowDays, { x0, x1, base, amplitude, max, width });
      const line = pathFrom(points);
      const delay = 200 + r * 95;
      windowDays.forEach((day, j) => {
        if ((day.contributionCount || 0) === max && max > 1 && !peak) {
          peak = { x: x0 + (j / (windowDays.length - 1)) * (x1 - x0), y: base - amplitude, day, row: r };
        }
      });
      const depth = rowCount > 1 ? r / (rowCount - 1) : 1;
      gradients += `<linearGradient id="ridge-${r}" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="${(base - amplitude).toFixed(1)}" y2="${base}"><stop offset=".6" stop-color="${theme.accent}"/><stop offset=".93" stop-color="${theme.text}"/></linearGradient>`;
      const showLabel = r > 0 && r % 2 === (rowCount - 1) % 2;
      return `<g>
        ${solid ? `<path class="fade" style="animation-delay:${delay}ms" d="${line}L${width} ${base + 60}L0 ${base + 60}Z" fill="${theme.bg}"/>` : ''}
        <path class="ridge" style="animation-delay:${delay}ms" pathLength="1" d="${line}" stroke="url(#ridge-${r})" stroke-width="${(1.8 + depth * 1.4).toFixed(2)}" stroke-linejoin="round"/>
        ${showLabel ? `<g class="fade" style="animation-delay:${delay + 300}ms">${plateText(width - pad, base - 4, monthOf(windowDays[0]?.date), 'm mut', 'font-size="13" text-anchor="end"')}</g>` : ''}
      </g>`;
    }).join('');

    // Flag the single busiest day, because it is the one fact a ridge cannot state on its own.
    let flag = '';
    if (peak) {
      const label = `${peak.day.contributionCount} ON ${shortDate(peak.day.date)}`;
      const flagW = monoTextWidth(label, 14) + 18;
      const flagX = peak.x + flagW + 8 > x1 ? peak.x - flagW : peak.x;
      const flagY = Math.max(58, peak.y - 44);
      flag = `<g class="fade" style="animation-delay:${200 + rowCount * 95 + 250}ms">
        <line x1="${peak.x.toFixed(1)}" y1="${flagY}" x2="${peak.x.toFixed(1)}" y2="${peak.y.toFixed(1)}" stroke="${theme.accent}" stroke-width="2"/>
        <rect x="${flagX.toFixed(1)}" y="${flagY}" width="${flagW.toFixed(1)}" height="26" fill="${theme.accent}"/>
        <text x="${(flagX + 9).toFixed(1)}" y="${flagY + 18}" class="m" font-size="14" fill="${theme.bg === 'transparent' ? '#000000' : theme.bg}">${label}</text>
      </g>`;
    }

    // "Now" sits at the end of the front ridge and is the only thing that keeps moving.
    const nowX = windows.length ? x1 : 0;
    const nowY = windows.length
      ? ridgePoints(windows[windows.length - 1], { x0, x1, base: lastBase, amplitude, max, width })
        .reduce((closest, point) => (Math.abs(point[0] - x1) < Math.abs(closest[0] - x1) ? point : closest))[1]
      : lastBase;
    const now = windows.length
      ? `<g class="fade" style="animation-delay:${200 + rowCount * 95 + 500}ms">
           <circle cx="${nowX}" cy="${nowY.toFixed(1)}" r="5" fill="${theme.accent}"/>
           <circle class="pulse" cx="${nowX}" cy="${nowY.toFixed(1)}" r="5" stroke="${theme.accent}" stroke-width="2"/>
         </g>`
      : '';

    const activeDays = days.filter((day) => (day.contributionCount || 0) > 0).length;
    const metrics = [
      { value: (data?.totalContributions ?? 0).toLocaleString('en-US'), label: 'contributions' },
      { value: (data?.totalCommits ?? 0).toLocaleString('en-US'), label: 'commits' },
      { value: activeDays.toLocaleString('en-US'), label: 'active days' },
      { value: String(data?.maxStreak ?? 0), label: 'day best streak' },
      { value: (data?.pullRequests ?? 0).toLocaleString('en-US'), label: 'pull requests' },
    ];
    const columnW = inner / metrics.length;

    return plate({
      height,
      title: `${options.name || data?.name || login}, ${data?.totalContributions ?? 0} contributions in the last year`,
      theme,
      defs: gradients,
      css: `
        .ridge{stroke-dasharray:1;animation:plateDraw 1.1s cubic-bezier(.3,.7,.2,1) both;}
        .pulse{transform-box:fill-box;transform-origin:center;animation:platePulse 2.4s ease-out infinite;}
      `,
      body: `
        ${plateText(pad, 44, fitMonoText(role, 16, inner * 0.72), 'm ink', 'font-size="16"')}
        ${plateText(width - pad, 44, login ? `@${login}` : '', 'm mut', 'font-size="16" text-anchor="end"')}
        ${plateText(pad - 3, nameBaseline, nameShown, 'd ink', `font-size="${nameSize.toFixed(1)}"`)}
        ${rows}
        ${flag}
        ${now}
        <g class="fade" style="animation-delay:${200 + rowCount * 95}ms">
          ${metrics.map((m, i) => plateMetric({ x: Math.round(pad + i * columnW), y: metricsY, value: m.value, label: m.label })).join('')}
        </g>
      `,
    });
  },
};

export default signatureCard;
