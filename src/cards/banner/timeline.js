/**
 * Banner Adventure Timeline Engine
 * Orchestrates multi-stage timing, zoom transitions, and SMIL keyframe normalization.
 *
 * BANNER-ADVENTURE: Phase 1 Timeline
 * Spec: work/plans/banner-adventure-phases.md
 */

/**
 * @typedef {'street'|'zoom-in'|'interior'|'zoom-out'|'campfire'} SceneType
 * @typedef {{ id: string, type: SceneType, stageIndex: number | null, t0: number, t1: number, dur: number }} Scene
 * @typedef {{ totalDur: number, totalDurStr: string, scenes: Scene[], keyTimes(times: number[]): string }} Timeline
 */

/**
 * Standard 4-stage scene definitions
 */
const BASE_4_STAGE_SCENES = [
  { type: 'street', stageIndex: 0, dur: 2.2 },
  { type: 'zoom-in', stageIndex: 0, dur: 0.4 },
  { type: 'interior', stageIndex: 0, dur: 4.8 },
  { type: 'zoom-out', stageIndex: 0, dur: 0.4 },

  { type: 'street', stageIndex: 1, dur: 1.4 },
  { type: 'zoom-in', stageIndex: 1, dur: 0.4 },
  { type: 'interior', stageIndex: 1, dur: 4.4 },
  { type: 'zoom-out', stageIndex: 1, dur: 0.4 },

  { type: 'street', stageIndex: 2, dur: 1.4 },
  { type: 'zoom-in', stageIndex: 2, dur: 0.4 },
  { type: 'interior', stageIndex: 2, dur: 4.2 },
  { type: 'zoom-out', stageIndex: 2, dur: 0.4 },

  { type: 'street', stageIndex: 3, dur: 1.2 },
  { type: 'zoom-in', stageIndex: 3, dur: 0.4 },
  { type: 'interior', stageIndex: 3, dur: 3.4 },
  { type: 'zoom-out', stageIndex: 3, dur: 0.4 },

  { type: 'campfire', stageIndex: null, dur: 1.8 },
];

/**
 * Builds a timeline for the given number of stages (1 to 4).
 * @param {number} stageCount - 1, 2, 3, or 4
 * @returns {Timeline}
 */
export function buildTimeline(stageCount = 4) {
  const count = Math.max(1, Math.min(4, Math.round(stageCount)));

  let rawScenes = [];
  if (count === 4) {
    rawScenes = BASE_4_STAGE_SCENES.map(s => ({ ...s }));
  } else {
    // For fewer stages: include stages 0 .. count-1, plus final street walk to campfire and campfire
    for (let i = 0; i < count; i++) {
      const stageScenes = BASE_4_STAGE_SCENES.filter(s => s.stageIndex === i);
      rawScenes.push(...stageScenes.map(s => ({ ...s })));
    }
    // Walk from last door to campfire
    const walkToCampfireDur = count === 1 ? 4.7 : count === 2 ? 2.6 : 1.2;
    rawScenes.push({ type: 'street', stageIndex: null, dur: walkToCampfireDur });
    rawScenes.push({ type: 'campfire', stageIndex: null, dur: 2.0 });
  }

  // Calculate cumulative t0 and t1
  let currentTime = 0;
  const scenes = rawScenes.map((scene, idx) => {
    const t0 = Math.round(currentTime * 100) / 100;
    currentTime += scene.dur;
    const t1 = Math.round(currentTime * 100) / 100;
    return {
      id: `scene-${idx}-${scene.type}${scene.stageIndex !== null ? `-${scene.stageIndex}` : ''}`,
      type: scene.type,
      stageIndex: scene.stageIndex,
      dur: scene.dur,
      t0,
      t1,
    };
  });

  const totalDur = Math.round(currentTime * 100) / 100;
  const totalDurStr = `${totalDur.toFixed(1)}s`;

  /**
   * Converts an array of seconds into a normalized 0..1 keyTimes string
   * @param {number[]} times
   * @returns {string}
   */
  const keyTimes = (times) => {
    if (!Array.isArray(times) || times.length === 0) return '0; 1';
    return times
      .map(t => {
        const norm = Math.max(0, Math.min(1, t / totalDur));
        return Number(norm.toFixed(4)).toString();
      })
      .join('; ');
  };

  return {
    totalDur,
    totalDurStr,
    scenes,
    keyTimes,
  };
}

/**
 * Generates discrete SMIL keyTimes and values based on a predicate over scenes.
 * @param {Timeline} timeline
 * @param {(scene: Scene) => boolean} predicate
 * @returns {{ keyTimes: string, values: string }}
 */
export function opacityKeyTimes(timeline, predicate) {
  const { totalDur, scenes } = timeline;
  const keyTimesArr = [0];
  const valuesArr = [predicate(scenes[0]) ? 1 : 0];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const isActive = predicate(scene) ? 1 : 0;
    const lastVal = valuesArr[valuesArr.length - 1];

    if (isActive !== lastVal) {
      const normTime = Math.max(0, Math.min(1, scene.t0 / totalDur));
      // In discrete SMIL mode, step happens at keyTimes
      keyTimesArr.push(Number(normTime.toFixed(4)));
      valuesArr.push(isActive);
    }
  }

  // Ensure end anchor at 1
  if (keyTimesArr[keyTimesArr.length - 1] < 1) {
    keyTimesArr.push(1);
    valuesArr.push(valuesArr[valuesArr.length - 1]);
  }

  return {
    keyTimes: keyTimesArr.map(n => n.toString()).join('; '),
    values: valuesArr.map(n => n.toString()).join('; '),
  };
}

/**
 * Generates smooth/interpolated opacity keyTimes for zooming in and out.
 * 0 during inactive, 1 during active, interpolates across zoom transitions.
 * @param {Timeline} timeline
 * @param {number} stageIndex
 * @returns {{ keyTimes: string, values: string }}
 */
export function interiorZoomKeyTimes(timeline, stageIndex) {
  const { totalDur, scenes } = timeline;
  const zoomIn = scenes.find(s => s.type === 'zoom-in' && s.stageIndex === stageIndex);
  const interior = scenes.find(s => s.type === 'interior' && s.stageIndex === stageIndex);
  const zoomOut = scenes.find(s => s.type === 'zoom-out' && s.stageIndex === stageIndex);

  if (!zoomIn || !interior || !zoomOut) {
    return { keyTimes: '0; 1', values: '0; 0' };
  }

  const t0Norm = Math.max(0, (zoomIn.t0 - 0.01) / totalDur);
  const tZoomInStart = zoomIn.t0 / totalDur;
  const tInteriorStart = interior.t0 / totalDur;
  const tInteriorEnd = interior.t1 / totalDur;
  const tZoomOutEnd = zoomOut.t1 / totalDur;
  const tEndNorm = Math.min(1, (zoomOut.t1 + 0.01) / totalDur);

  const times = [0];
  const vals = [0];

  if (t0Norm > 0.01) {
    times.push(t0Norm);
    vals.push(0);
  }
  times.push(tZoomInStart);
  vals.push(0);

  times.push(tInteriorStart);
  vals.push(1);

  times.push(tInteriorEnd);
  vals.push(1);

  times.push(tZoomOutEnd);
  vals.push(0);

  if (tEndNorm < 0.99) {
    times.push(tEndNorm);
    vals.push(0);
  }
  times.push(1);
  vals.push(0);

  // Clean deduplication
  const cleanTimes = [];
  const cleanVals = [];
  for (let i = 0; i < times.length; i++) {
    const t = Number(Math.max(0, Math.min(1, times[i])).toFixed(4));
    if (i === 0 || t > cleanTimes[cleanTimes.length - 1]) {
      cleanTimes.push(t);
      cleanVals.push(vals[i]);
    }
  }
  if (cleanTimes[cleanTimes.length - 1] < 1) {
    cleanTimes.push(1);
    cleanVals.push(0);
  }

  return {
    keyTimes: cleanTimes.join('; '),
    values: cleanVals.join('; '),
  };
}

export default {
  buildTimeline,
  opacityKeyTimes,
  interiorZoomKeyTimes,
};
