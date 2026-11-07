import test from 'node:test';
import assert from 'node:assert/strict';
import { runSnapshotAudit } from '../tooling/scripts/snapshot_cards.js';

test('runSnapshotAudit renders all cards without crashing across extreme data and themes', async () => {
  const result = await runSnapshotAudit({ writeToDisk: false });
  assert.equal(result.failed, 0);
  assert.ok(result.totalRendered >= 20, 'Should audit at least 20 card/layout combinations');
});
