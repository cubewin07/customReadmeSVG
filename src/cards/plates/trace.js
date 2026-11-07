import { graphql } from '../../core/github/client.js';
import { TRACE_HISTORY_QUERY, TRACE_QUERY } from '../../core/github/queries.js';
import { normalizeTrace } from '../../core/github/normalize.js';
import {
  PLATE_PAD,
  PLATE_WIDTH,
  displayWidth,
  fitDisplay,
  plate,
  plateMetric,
  plateText,
  plateTheme,
} from '../../svg/plate.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 365;
const WEEKS = 52;
const MAX_ROWS = 9;
const ROW_H = 40;
const MAX_HISTORY_PAGES = 12;
const HISTORY_BUDGET_MS = 6000;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * The first query returns 100 commits per repository. Lanes must show the whole year, so the
 * repositories that get a row fetch the rest of their timestamps. A page cap and a time budget
 * keep cold starts inside the serverless timeout; if either trips, the lane shows its most recent
 * commits while the commit count stays exact.
 */
async function fillCommitDates(username, repo, since, options, deadline) {
  let cursor = repo.nextCursor;
  for (let page = 0; cursor && page < MAX_HISTORY_PAGES && Date.now() < deadline; page++) {
    const data = await graphql(TRACE_HISTORY_QUERY, { owner: username, name: repo.name, since, after: cursor }, {
      ...options,
      cacheKey: `gh:trace:${username}:${repo.name}:${cursor}`,
      ttlMs: options.ttlMs,
    });
    const history = data?.repository?.defaultBranchRef?.target?.history;
    repo.commitDates.push(...(history?.nodes || []).map((node) => node.committedDate).filter(Boolean));
    cursor = history?.pageInfo?.hasNextPage ? history.pageInfo.endCursor : null;
  }
  delete repo.nextCursor;
}

/** Monthly axis ticks across the window, oldest on the left. */
function monthTicks(start, end) {
  const ticks = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  while (cursor < end) {
    ticks.push({ time: cursor.getTime(), label: MONTHS[cursor.getUTCMonth()] });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return ticks;
}

export const traceCard = {
  id: 'trace',
  title: 'Shipping Trace',
  aliases: ['waterfall', 'shipped'],
  cacheTtlMs: 7200000,

  async fetchData(username, options = {}) {
    const deadline = Date.now() + HISTORY_BUDGET_MS;
    const since = new Date(Date.now() - WINDOW_DAYS * DAY_MS).toISOString();
    const data = await graphql(TRACE_QUERY, { login: username, since }, {
      ...options,
      cacheKey: options.cacheKey || `gh:trace:${username}`,
      ttlMs: options.ttlMs || this.cacheTtlMs,
    });
    if (!data?.user) throw new Error(`User "${username}" not found.`);
    const normalized = normalizeTrace(data);
    await Promise.all(normalized.repos.slice(0, MAX_ROWS).map((repo) => fillCommitDates(username, repo, since, options, deadline)));
    return normalized;
  },

  renderSvg(data, rawTheme, options = {}) {
    const theme = plateTheme(rawTheme, options);
    const width = PLATE_WIDTH;
    const pad = PLATE_PAD;
    const now = options.now ? new Date(options.now) : new Date();
    const start = new Date(now.getTime() - WINDOW_DAYS * DAY_MS);

    const all = Array.isArray(data?.repos) ? data.repos : [];
    const repos = all.slice(0, MAX_ROWS);
    const totalCommits = all.reduce((acc, repo) => acc + (repo.commitCount || 0), 0);

    const nameW = 300;
    const countW = 72;
    const laneX = pad + nameW;
    const laneW = width - pad - countW - laneX;
    const xOf = (time) => laneX + ((time - start.getTime()) / (now.getTime() - start.getTime())) * laneW;
    const weekW = laneW / WEEKS;

    const headerH = 146;
    const axisY = headerH + 24;
    const rowsY = axisY + 14;
    const height = rowsY + Math.max(repos.length, 1) * ROW_H + 26;

    const ticks = monthTicks(start, now);
    const axis = ticks.map(({ time, label }) => {
      const x = xOf(time).toFixed(1);
      return `<line x1="${x}" y1="${axisY + 6}" x2="${x}" y2="${height - 22}" stroke="${theme.subtleBorder || theme.border}"/>
        ${plateText(x, axisY, label, 'm mut', 'font-size="13"')}`;
    }).join('');

    const rows = repos.map((repo, r) => {
      const y = rowsY + r * ROW_H;
      const mid = y + ROW_H / 2;
      const times = (repo.commitDates || []).map((d) => new Date(d).getTime()).filter((t) => t >= start.getTime());
      const bins = new Array(WEEKS).fill(0);
      times.forEach((t) => {
        bins[Math.min(WEEKS - 1, Math.floor(((t - start.getTime()) / (now.getTime() - start.getTime())) * WEEKS))] += 1;
      });
      const peak = Math.max(1, ...bins);
      const first = times.length ? Math.min(...times) : null;
      const last = times.length ? Math.max(...times) : null;
      const span = first !== null
        ? `<line x1="${xOf(first).toFixed(1)}" y1="${mid + 12}" x2="${xOf(last).toFixed(1)}" y2="${mid + 12}" stroke="${theme.secondaryText}" stroke-width="2" stroke-linecap="round"/>`
        : '';
      const bars = bins.map((count, w) => {
        if (!count) return '';
        const h = 4 + ((count / peak) ** 0.6) * 22;
        return `<rect x="${(laneX + w * weekW + 1).toFixed(1)}" y="${(mid + 10 - h).toFixed(1)}" width="${Math.max(2, weekW - 2).toFixed(1)}" height="${h.toFixed(1)}" fill="${theme.accent}"/>`;
      }).join('');
      const shownName = fitDisplay(repo.name, 27, nameW - 34);
      const swatch = repo.language?.color || theme.secondaryText;
      return `<g>
        <rect x="${pad}" y="${mid - 7}" width="14" height="14" fill="${swatch}"/>
        ${plateText(pad + 24, mid + 10, shownName, 'd ink', 'font-size="27"')}
        <g clip-path="url(#lane-clip)">${span}${bars}</g>
        ${plateText(width - pad, mid + 10, repo.commitCount >= 1000 ? `${(repo.commitCount / 1000).toFixed(1)}k` : repo.commitCount, 'd ink', 'font-size="27" text-anchor="end"')}
      </g>`;
    }).join('');

    const headline = 'SHIPPED';
    const headlineSize = 112;
    const headlineW = displayWidth(headline, headlineSize);

    return plate({
      height,
      title: `${totalCommits} commits across ${all.length} public repositories in the last 12 months`,
      theme,
      defs: `<clipPath id="lane-clip"><rect x="${laneX - 2}" y="${axisY}" width="${laneW + 4}" height="${height - axisY}"><animate attributeName="width" from="0" to="${laneW + 4}" dur="1.7s" calcMode="spline" keyTimes="0;1" keySplines=".3 .7 .2 1"/></rect></clipPath>`,
      body: `
        ${plateText(pad - 2, 132, headline, 'd ink', `font-size="${headlineSize}"`)}
        ${plateText(pad + headlineW + 18, 104, 'LAST 12 MONTHS', 'm hot', 'font-size="16"')}
        ${plateText(pad + headlineW + 18, 130, 'ONE LANE PER PUBLIC REPO', 'm mut', 'font-size="15"')}
        ${plateMetric({ x: width - pad - 320, y: 106, value: totalCommits.toLocaleString('en-US'), label: 'commits' })}
        ${plateMetric({ x: width - pad - 150, y: 106, value: String(all.length), label: 'active repos' })}
        ${axis}
        ${repos.length ? rows : plateText(pad, rowsY + 30, 'NO PUBLIC COMMITS IN THE LAST 12 MONTHS', 'd mut', 'font-size="28"')}
      `,
    });
  },
};

export default traceCard;
