import test from 'node:test';
import assert from 'node:assert/strict';
import { runSnapshotAudit } from '../tooling/scripts/snapshot_cards.js';

test('all 138 card snapshots pass strict XML well-formedness parsing', async () => {
  const result = await runSnapshotAudit({ writeToDisk: false });

  if (result.failed > 0) {
    console.error('XML Snapshot Failures:', result.issues);
  }

  assert.equal(result.failed, 0, `Expected 0 XML validation failures, but got ${result.failed}`);
  assert.equal(result.totalRendered, 138, 'Expected exactly 138 snapshot variations (23 layouts x 3 datasets x 2 themes)');
  assert.equal(result.passed, 138, 'Expected all 138 snapshots to pass strict XML validation');
});
