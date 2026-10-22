import { escapeXml } from '../../../svg/escape.js';
import { measureText, fitText } from '../../../svg/text.js';
import { anim, tr, sl, sla, pulse } from '../utils/timeline.js';
import { scoreRows, earnedAchievements } from '../utils/insights.js';
import { PERSONA } from '../data/persona.js';

/**
 * Renders the Intro Arc (0.0s - 3.4s): Arcade Boot & Player 1 Scoreboard.
 * Note: Root <g> uses opacity="0" attribute so static non-SMIL viewers see Act 1 Desk beneath,
 * while SMIL viewers immediately animate opacity to 1 during 0.0s - 3.4s.
 */
export function renderActIntro(profile = {}, theme = {}) {
  const accent = theme.accent || '#58a6ff';
  const rawHandle = profile.handle || '@cubewin07';
  const handle = escapeXml(rawHandle);
  const cursorX = Math.round(measureText(rawHandle, 22) * 1.08) + 64;
  const rows = scoreRows(profile);

  let rowsSvg = '';
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const ry = 152 + i * 48;
    const tIn = parseFloat((0.25 + i * 0.22).toFixed(2));
    rowsSvg += `<g opacity="0">${anim('opacity', [[0, 0], [tIn, 0], [tIn + 0.18, 1], [3.05, 1], [3.35, 0]])}<rect x="56" y="${ry}" width="472" height="38" rx="8" fill="#0d1524" stroke="#1e2d44"/><text class="m" x="74" y="${ry + 24}" font-size="12" font-weight="800" letter-spacing="1.2" fill="#f59e0b">${escapeXml(r.label)}</text><text class="m" x="280" y="${ry + 24}" text-anchor="middle" font-size="16" font-weight="800" fill="#e6edf3">${escapeXml(r.value)}</text><text class="m" x="510" y="${ry + 23}" text-anchor="end" font-size="10" font-weight="700" fill="#38bdf8">${escapeXml(r.note)}</text></g>`;
  }

  return `<!-- ============================= INTRO ARC: ARCADE BOOT (0.0s - 3.4s) ============================= -->
  <g opacity="0">
    ${anim('opacity', [[0, 1], [3.05, 1], [3.4, 0]])}
    <rect x="20" y="54" width="544" height="296" rx="12" fill="#070c15" fill-opacity="0.95" stroke="#1f2e46" stroke-width="1.4"/>
    <path d="M28 68v-8h8M556 68v-8h-8M28 336v8h8M556 336v8h-8" stroke="${accent}" stroke-width="1.8" fill="none"/>
    <text class="m" x="56" y="88" font-size="10.5" font-weight="700" letter-spacing="1.4" fill="#3fb950">ARCADE OS // BOOT SEQUENCE</text>
    <text class="m" x="528" y="88" text-anchor="end" font-size="10.5" font-weight="800" fill="#f59e0b">1UP • PLAYER 01</text>
    <text class="m" x="56" y="122" font-size="22" font-weight="800" fill="#e6edf3">${handle}</text>
    <rect x="${cursorX}" y="103" width="9" height="21" fill="${accent}">${sla('opacity', ['1', '0', '1'], 0.6)}</rect>
    ${rowsSvg}
    <text class="m" x="292" y="326" text-anchor="middle" font-size="10.5" font-weight="700" letter-spacing="1.5" fill="#9db7e8">STAGE 01 START • READY</text>
  </g>`;
}

/**
 * Renders the Outro Arc (32.8s - 36.0s master / 0.0s - 3.2s local):
 * - Character waving with customizable speech bubble tagline ("I build things that move.").
 * - Earned achievement badges derived from real GitHub activity.
 * - Retro arcade "CONTINUE? 9... 8... 7..." countdown before looping back to 0.
 */
export function renderActOutro(profile = {}, theme = {}, options = {}) {
  const accent = theme.accent || '#58a6ff';
  const callName = escapeXml(options.call || options.callName || profile.callName || PERSONA.callName);
  const rawTagline = options.tagline || profile.tagline || PERSONA.tagline;
  const tagFontSize = rawTagline.length > 28 ? 15 : rawTagline.length > 22 ? 17 : 19;
  const tagline = escapeXml(fitText(rawTagline, tagFontSize, 302));
  const handle = escapeXml(profile.handle || '@cubewin07');

  const badges = earnedAchievements(profile);
  let badgesSvg = '';
  for (let i = 0; i < badges.length; i++) {
    const b = badges[i];
    const bx = 196 + i * 176;
    badgesSvg += `<g transform="translate(${bx},168)"><rect width="166" height="48" rx="8" fill="#0d1626" stroke="#263852"/><polygon points="20,13 28,17 28,27 20,31 12,27 12,17" fill="#ffd76a" opacity="0.22" stroke="#ffd76a" stroke-width="1"/><text class="m" x="20" y="25" text-anchor="middle" font-size="8" font-weight="900" fill="#ffd76a">★</text><text class="m" x="36" y="21" font-size="9.5" font-weight="800" letter-spacing="0.6" fill="#ffd76a">${escapeXml(b.title)}</text><text class="t" x="36" y="36" font-size="10.5" font-weight="600" fill="#c9d1d9">${escapeXml(b.detail)}</text></g>`;
  }

  return `<!-- ============================= OUTRO ARC: SIGN-OFF & CONTINUE (32.8s - 36.0s) ============================= -->
  <g opacity="0">
    ${anim('opacity', [[0, 0], [0.22, 1], [2.95, 1], [3.2, 0]])}
    <rect x="20" y="54" width="544" height="296" rx="12" fill="#070c15" fill-opacity="0.94" stroke="#1f2e46" stroke-width="1.4"/>

    <!-- Waving Character on Illuminated Player Pad -->
    <g transform="translate(112,248)">
      <ellipse cx="0" cy="4" rx="42" ry="10" fill="#0f1e33" stroke="#38bdf8" stroke-width="1.2"/>
      <ellipse cx="0" cy="4" rx="28" ry="6" fill="#38bdf8" opacity="0.25"/>
      <g transform="scale(2.0)">
        <rect x="-7" y="-12" width="6" height="12" rx="2" fill="#15171c"/>
        <rect x="1" y="-12" width="6" height="12" rx="2" fill="#15171c"/>
        <use href="#mbody"/>
        <rect x="-14" y="-26" width="6" height="14" rx="2.5" fill="#f2cfae"/>
        <g>${sl('rotate', ['-135 11 -26', '-95 11 -26', '-135 11 -26'], 0.55)}<rect x="8" y="-26" width="6" height="14" rx="2.5" fill="#f2cfae"/></g>
      </g>
    </g>

    <!-- Speech Bubble with Personal Voice Tagline -->
    <g transform="translate(196,68)">
      <rect width="342" height="84" rx="12" fill="#0e192b" stroke="${accent}" stroke-width="1.4"/>
      <polygon points="0,52 -18,62 0,68" fill="#0e192b" stroke="${accent}" stroke-width="1.4"/>
      <line x1="0" y1="53" x2="0" y2="67" stroke="#0e192b" stroke-width="2.2"/>
      <text class="m" x="20" y="28" font-size="10.5" font-weight="700" letter-spacing="0.8" fill="#38bdf8">HI, I'M ${callName.toUpperCase()} • ${handle}</text>
      <text class="t" x="20" y="58" font-size="${tagFontSize}" font-weight="800" fill="#e6edf3">“${tagline}”</text>
    </g>

    <!-- Earned Achievements -->
    ${badgesSvg}

    <!-- Retro Arcade CONTINUE? 9... 8... 7... Countdown Bar -->
    <g transform="translate(48,266)">
      <rect width="488" height="64" rx="10" fill="#0b1220" stroke="#25354d"/>
      <text class="m" x="22" y="27" font-size="13" font-weight="800" letter-spacing="1.4" fill="#ff7b72">CONTINUE?</text>
      <text class="m" x="22" y="46" font-size="10" font-weight="700" letter-spacing="0.8" fill="#8b949e">AUTO-LOOPING TO STAGE 01${sla('opacity', ['1', '0.35', '1'], 0.8)}</text>
      <rect x="196" y="28" width="210" height="8" rx="4" fill="#162032"/>
      <rect x="196" y="28" width="210" height="8" rx="4" fill="#38bdf8">
        ${anim('width', [[0, 210], [3.1, 24]])}
      </rect>
      <g transform="translate(446,43)">
        <text class="m" x="0" y="0" text-anchor="middle" font-size="30" font-weight="900" fill="#ffd76a" opacity="0">${anim('opacity', pulse(0.0, 1.0, 0.08))}9</text>
        <text class="m" x="0" y="0" text-anchor="middle" font-size="30" font-weight="900" fill="#ffd76a" opacity="0">${anim('opacity', pulse(1.05, 2.05, 0.08))}8</text>
        <text class="m" x="0" y="0" text-anchor="middle" font-size="30" font-weight="900" fill="#ff7b72" opacity="0">${anim('opacity', [[0, 0], [2.1, 0], [2.18, 1], [3.2, 1]])}7</text>
      </g>
    </g>
  </g>`;
}
