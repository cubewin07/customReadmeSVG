import test from 'node:test';
import assert from 'node:assert/strict';
import { runSnapshotAudit } from '../tooling/scripts/snapshot_cards.js';

test('all 156 card snapshots pass strict XML well-formedness parsing', async () => {
  const result = await runSnapshotAudit({ writeToDisk: false });

  if (result.failed > 0) {
    console.error('XML Snapshot Failures:', result.issues);
  }

  assert.equal(result.failed, 0, `Expected 0 XML validation failures, but got ${result.failed}`);
  assert.equal(result.totalRendered, 156, 'Expected exactly 156 snapshot variations (26 layouts x 3 datasets x 2 themes)');
  assert.equal(result.passed, 156, 'Expected all 156 snapshots to pass strict XML validation');
});
