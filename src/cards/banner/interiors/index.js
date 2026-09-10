/**
 * Interior Dispatcher for Banner Adventure
 *
 * Selects and renders the full 890x240 interior template corresponding to
 * stage.archetype ('lab' | 'vault' | 'forge' | 'tower'), and layers
 * the choreographed room actor fox inside the zoom scene.
 *
 * Spec: work/plans/banner-adventure-phases.md - Phase 1.7
 */

import { renderLabInterior } from './lab.js';
import { renderVaultInterior } from './vault.js';
import { renderForgeInterior } from './forge.js';
import { renderTowerInterior } from './tower.js';
import { renderRoomFox } from '../foxSprite.js';

export function renderInterior(stage, bounds = { width: 890, height: 240, groundY: 192 }) {
  const archetype = stage?.archetype || 'lab';

  let roomSvg;
  switch (archetype) {
    case 'vault':
      roomSvg = renderVaultInterior(stage, bounds);
      break;
    case 'forge':
      roomSvg = renderForgeInterior(stage, bounds);
      break;
    case 'tower':
      roomSvg = renderTowerInterior(stage, bounds);
      break;
    case 'lab':
    default:
      roomSvg = renderLabInterior(stage, bounds);
      break;
  }

  const foxSvg = renderRoomFox({
    archetype,
    stageIndex: bounds.stageIndex ?? 0,
    timeline: bounds.timeline,
    bounds,
  });

  return `<!-- Interior Scene: ${archetype} -->
  <g class="interior-room-scene">
    ${roomSvg}
    ${foxSvg}
  </g>`;
}

export default renderInterior;
