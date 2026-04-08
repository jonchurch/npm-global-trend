'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { bucketBy } = require('../lib');

const sampleDays = [
  // Week 1 of Jan 2026 (Thu-Sun)
  { day: '2026-01-01', downloads: 100 },
  { day: '2026-01-02', downloads: 200 },
  { day: '2026-01-03', downloads: 150 },
  { day: '2026-01-04', downloads: 120 },
  // Week 2 of Jan (Mon-Sun)
  { day: '2026-01-05', downloads: 300 },
  { day: '2026-01-06', downloads: 310 },
  { day: '2026-01-07', downloads: 280 },
  { day: '2026-01-08', downloads: 290 },
  { day: '2026-01-09', downloads: 270 },
  { day: '2026-01-10', downloads: 130 },
  { day: '2026-01-11', downloads: 110 },
  // Partial week 3
  { day: '2026-01-12', downloads: 320 },
  // Feb
  { day: '2026-02-01', downloads: 400 },
  { day: '2026-02-02', downloads: 410 },
];

describe('bucketBy month', () => {
  it('groups daily data into monthly totals', () => {
    const result = bucketBy(sampleDays, 'month');
    assert.equal(result.length, 2);
    assert.equal(result[0].label, '2026-01');
    assert.equal(result[0].downloads, 2580); // sum of all Jan days
    assert.equal(result[1].label, '2026-02');
    assert.equal(result[1].downloads, 810);
  });

  it('returns empty array for empty input', () => {
    assert.deepEqual(bucketBy([], 'month'), []);
  });

  it('handles single day', () => {
    const result = bucketBy([{ day: '2026-03-15', downloads: 500 }], 'month');
    assert.equal(result.length, 1);
    assert.equal(result[0].label, '2026-03');
    assert.equal(result[0].downloads, 500);
  });
});

describe('bucketBy week', () => {
  it('groups daily data into ISO week totals', () => {
    const result = bucketBy(sampleDays, 'week');
    // Each bucket should have a label and a downloads total
    assert.ok(result.length > 0);
    // Total across all weeks should equal total across all days
    const weekTotal = result.reduce((s, w) => s + w.downloads, 0);
    const dayTotal = sampleDays.reduce((s, d) => s + d.downloads, 0);
    assert.equal(weekTotal, dayTotal);
  });

  it('returns empty array for empty input', () => {
    assert.deepEqual(bucketBy([], 'week'), []);
  });
});

describe('bucketBy validation', () => {
  it('throws on invalid bucket type', () => {
    assert.throws(() => bucketBy(sampleDays, 'year'), /Invalid bucket type/);
  });
});
