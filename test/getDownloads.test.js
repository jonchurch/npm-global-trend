'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// We'll mock fetch to avoid hitting the real API in tests.
// Tests verify chunking logic and response stitching.

function makeDays(from, to) {
  const days = [];
  const d = new Date(from + 'T00:00:00Z');
  const end = new Date(to + 'T00:00:00Z');
  while (d <= end) {
    days.push({ day: d.toISOString().slice(0, 10), downloads: 1000 });
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return days;
}

describe('getDownloads chunking', () => {
  let callLog;
  let getDownloads;

  beforeEach(() => {
    callLog = [];

    // Mock fetch at module level before requiring
    global.fetch = async (url) => {
      callLog.push(url);
      // Parse the date range from the URL
      const match = url.match(/\/range\/(\d{4}-\d{2}-\d{2}):(\d{4}-\d{2}-\d{2})/);
      if (!match) return { ok: false, text: async () => 'bad url' };
      const [, from, to] = match;
      return {
        ok: true,
        json: async () => ({
          start: from,
          end: to,
          downloads: makeDays(from, to),
        }),
      };
    };

    // Clear module cache so lib picks up our mock fetch
    delete require.cache[require.resolve('../lib')];
    ({ getDownloads } = require('../lib'));
  });

  it('fetches a short range in a single request', async () => {
    const result = await getDownloads({ from: '2026-01-01', to: '2026-06-01' });
    assert.equal(callLog.length, 1);
    assert.ok(result.length > 0);
    assert.equal(result[0].day, '2026-01-01');
  });

  it('chunks ranges longer than 18 months into multiple requests', async () => {
    const result = await getDownloads({ from: '2023-01-01', to: '2025-12-31' });
    // 3 years = should need at least 2 chunks
    assert.ok(callLog.length >= 2, `Expected >=2 requests, got ${callLog.length}`);
    // Result should be a continuous array of days
    assert.equal(result[0].day, '2023-01-01');
    assert.equal(result[result.length - 1].day, '2025-12-31');
    // No duplicate days
    const days = result.map(d => d.day);
    assert.equal(days.length, new Set(days).size, 'Should have no duplicate days');
  });

  it('defaults to to today when only from is given', async () => {
    const result = await getDownloads({ from: '2026-01-01' });
    assert.equal(callLog.length, 1);
    assert.equal(result[0].day, '2026-01-01');
  });

  it('throws on API error', async () => {
    global.fetch = async () => ({ ok: false, status: 404, text: async () => 'not found' });
    delete require.cache[require.resolve('../lib')];
    const mod = require('../lib');
    await assert.rejects(() => mod.getDownloads({ from: '2026-01-01', to: '2026-01-31' }), /npm API error/);
  });
});
