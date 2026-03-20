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
});
