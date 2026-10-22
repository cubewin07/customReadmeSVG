/**
 * Pure helpers that turn a normalized developer profile into short, honest,
 * display-ready facts. Every returned value is derived from real data; when the
 * data is missing the helper returns null so the card shows nothing instead of
 * inventing a number.
 */

const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function fmtInt(n) {
  return Number.isFinite(Number(n)) ? Math.round(Number(n)).toLocaleString('en-US') : '–';
}

/** "2026-03-14" -> "14 MAR" */
export function shortDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return '';
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] || ''}`.trim();
}

/**
 * Rotating headline messages for the rank pill (max ~22 chars each so they fit the pill).
 * @returns {string[]} at least one entry
 */
export function rankMessages(profile) {
  const out = [];
  const annual = Number(profile.annualCommits) || 0;
  if (profile.source === 'fallback') return ['OFFLINE / FALLBACK'];
  out.push(annual > 0 ? `${fmtInt(annual)} COMMITS / YR` : `${fmtInt(profile.stats?.[1]?.value ?? 0)} TOTAL STARS`);
  if (profile.peakDay?.count > 0) out.push(`BEST DAY: ${fmtInt(profile.peakDay.count)} CONTRIBS`);
  if (Number.isInteger(profile.busiestWeekday) && profile.busiestWeekday >= 0) {
    out.push(`PEAKS ON ${WEEKDAYS[profile.busiestWeekday]}`);
  }
  if (profile.activeDays > 0 && profile.totalDays > 0) {
    out.push(`${profile.activeDays}/${profile.totalDays} DAYS ACTIVE`);
  }
  return out;
}

/**
 * Rotating messages for the status pill (max ~21 chars each).
 * @param {string|null} customStatus - already-sanitized custom status, if any
 */
export function statusMessages(profile, customStatus, joinedYear) {
  if (profile.source === 'fallback') return [{ plain: customStatus || 'DATA UNAVAILABLE' }];
  const out = [];
  out.push(customStatus ? { plain: customStatus } : { label: 'MEMBER SINCE ', value: String(joinedYear) });
  if (profile.accountDays > 30) out.push({ value: fmtInt(profile.accountDays), label: ' DAYS ON GITHUB' });
  if (profile.commitSha) out.push({ label: 'LATEST SHIP ', value: profile.commitSha });
  return out;
}

/**
 * Arcade-style scoreboard rows for the intro screen.
 * @returns {{label:string, value:string, note:string}[]}
 */
export function scoreRows(profile) {
  if (profile.source === 'fallback') {
    return [{ label: 'HI-SCORE', value: '–', note: 'DATA UNAVAILABLE' }];
  }
  const rows = [];
  const annual = Number(profile.annualCommits) || 0;
  rows.push({ label: 'HI-SCORE', value: fmtInt(annual), note: 'COMMITS / YEAR' });
  rows.push({
    label: 'COMBO',
    value: `${fmtInt(profile.streak || 0)}D`,
    note: profile.longestStreak > 0 ? `BEST ${fmtInt(profile.longestStreak)}D` : 'CURRENT STREAK',
  });
  if (profile.activeDays > 0 && profile.totalDays > 0) {
    rows.push({ label: 'WORLD', value: `${profile.activeDays}/${profile.totalDays}`, note: 'DAYS ACTIVE' });
  } else {
    rows.push({ label: 'WORLD', value: fmtInt(profile.stats?.[0]?.value ?? 0), note: 'PUBLIC REPOS' });
  }
  return rows;
}

/**
 * Up to two achievements the developer has genuinely earned, in priority order.
 * @returns {{title:string, detail:string}[]}
 */
export function earnedAchievements(profile) {
  if (profile.source === 'fallback') return [];
  const first = [];
  if (profile.longestStreak >= 7) {
    first.push({ title: 'COMBO MASTER', detail: `${profile.longestStreak}-day best streak` });
  }
  if (profile.activeDays >= 100) {
    first.push({ title: 'REGULAR', detail: `${profile.activeDays} active days` });
  }
  const second = [];
  if ((profile.annualCommits || 0) >= 100) {
    second.push({ title: 'CENTURION', detail: `${fmtInt(profile.annualCommits)} commits / yr` });
  }
  const repos = Number(profile.stats?.[0]?.value) || 0;
  if (repos >= 10) second.push({ title: 'BUILDER', detail: `${repos} public repos` });
  const langs = Array.isArray(profile.langShares) ? profile.langShares.length : 0;
  if (langs >= 3) second.push({ title: 'POLYGLOT', detail: `${langs} languages shipped` });
  return [first[0], second[0]].filter(Boolean);
}

/** Bottom insight chips for the orbit act. */
export function orbitChips(profile) {
  if (profile.source === 'fallback') return [];
  const chips = [];
  const top = profile.langShares?.[0];
  if (top) chips.push({ label: 'TOP LANGUAGE', value: `${top.name} ${top.pct}%`, color: top.color });
  if (profile.longestStreak > 0) chips.push({ label: 'BEST STREAK', value: `${profile.longestStreak} days`, color: '#ffb86b' });
  if (profile.peakDay?.count > 0) {
    chips.push({ label: 'PEAK DAY', value: `${profile.peakDay.count} on ${shortDate(profile.peakDay.date)}`, color: '#34d399' });
  }
  return chips.slice(0, 3);
}
