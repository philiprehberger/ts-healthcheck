import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const mod = await import('../../dist/index.js');

describe('healthcheck', () => {
  it('should export createHealthcheck', () => {
    assert.ok(mod.createHealthcheck);
  });

  it('should export check', () => {
    assert.ok(mod.check);
  });

  it('should export group', () => {
    assert.ok(mod.group);
  });

  it('should return healthy when all checks pass', async () => {
    const health = mod.createHealthcheck([
      mod.check('a', async () => {}),
      mod.check('b', async () => {}),
    ]);
    const result = await health();
    assert.equal(result.status, 'healthy');
    assert.equal(result.checks.a.status, 'healthy');
    assert.equal(result.checks.b.status, 'healthy');
    assert.ok(result.timestamp);
  });

  it('should return unhealthy when a check fails', async () => {
    const health = mod.createHealthcheck([
      mod.check('a', async () => {}),
      mod.check('b', async () => { throw new Error('fail'); }),
    ]);
    const result = await health();
    assert.equal(result.checks.b.status, 'unhealthy');
    assert.equal(result.checks.b.error, 'fail');
  });

  it('should support degraded threshold', async () => {
    const health = mod.createHealthcheck(
      [
        mod.check('a', async () => {}),
        mod.check('b', async () => { throw new Error('fail'); }),
        mod.check('c', async () => {}),
        mod.check('d', async () => {}),
      ],
      { degradedThreshold: 50 },
    );
    const result = await health();
    // 3 of 4 pass = 75%, above 50% threshold => degraded
    assert.equal(result.status, 'degraded');
  });

  it('should return unhealthy when below threshold', async () => {
    const health = mod.createHealthcheck(
      [
        mod.check('a', async () => {}),
        mod.check('b', async () => { throw new Error('fail'); }),
        mod.check('c', async () => { throw new Error('fail'); }),
        mod.check('d', async () => { throw new Error('fail'); }),
      ],
      { degradedThreshold: 50 },
    );
    const result = await health();
    // 1 of 4 pass = 25%, below 50% => unhealthy
    assert.equal(result.status, 'unhealthy');
  });

  it('should skip dependent check when dependency fails', async () => {
    const health = mod.createHealthcheck([
      mod.check('db', async () => { throw new Error('down'); }),
      mod.check('migrations', async () => {}, { dependsOn: ['db'] }),
    ]);
    const result = await health();
    assert.equal(result.checks.db.status, 'unhealthy');
    assert.equal(result.checks.migrations.status, 'unhealthy');
    assert.ok(result.checks.migrations.error?.includes('Dependency'));
  });

  it('should run dependent check when dependency passes', async () => {
    const health = mod.createHealthcheck([
      mod.check('db', async () => {}),
      mod.check('migrations', async () => {}, { dependsOn: ['db'] }),
    ]);
    const result = await health();
    assert.equal(result.checks.db.status, 'healthy');
    assert.equal(result.checks.migrations.status, 'healthy');
  });

  it('should group checks and provide group results', async () => {
    const health = mod.createHealthcheck([
      ...mod.group('database', [
        mod.check('pg', async () => {}),
      ]),
      ...mod.group('cache', [
        mod.check('redis', async () => {}),
      ]),
    ]);
    const result = await health();
    assert.ok(result.groups);
    assert.equal(result.groups.database.status, 'healthy');
    assert.equal(result.groups.cache.status, 'healthy');
    assert.ok(result.groups.database.checks.pg);
  });

  it('should timeout a slow check', async () => {
    const health = mod.createHealthcheck([
      mod.check('slow', async () => {
        await new Promise((r) => setTimeout(r, 500));
      }, { timeout: 50 }),
    ]);
    const result = await health();
    assert.equal(result.checks.slow.status, 'unhealthy');
    assert.ok(result.checks.slow.error?.includes('timed out'));
  });
});
