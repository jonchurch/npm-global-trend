'use strict';

const BASE_URL = 'https://api.npmjs.org/downloads';
const MAX_DAYS = 545; // ~18 months, npm API limit per request

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));
}

/**
 * Build date range chunks that stay within the API's 18-month limit.
 */
function buildChunks(from, to) {
  const chunks = [];
  let cursor = from;
  while (cursor <= to) {
    const chunkEnd = addDays(cursor, MAX_DAYS - 1);
    const end = chunkEnd < to ? chunkEnd : to;
    chunks.push({ from: cursor, to: end });
    cursor = addDays(end, 1);
  }
  return chunks;
}

/**
 * Fetch daily download counts for the entire npm registry.
 * Automatically chunks requests for ranges longer than 18 months.
 *
 * @param {{ from: string, to?: string }} opts - YYYY-MM-DD dates. `to` defaults to today.
 * @returns {Promise<Array<{ day: string, downloads: number }>>}
 */
async function getDownloads({ from, to } = {}) {
  if (!from) throw new Error('from is required');
  to = to || todayStr();

  const chunks = buildChunks(from, to);
  const results = await Promise.all(chunks.map(async (chunk) => {
    const period = `${chunk.from}:${chunk.to}`;
    const url = `${BASE_URL}/range/${period}`;
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`npm API error (${res.status}): ${body}`);
    }
    const data = await res.json();
    return data.downloads;
  }));

  return results.flat();
}

/**
 * Aggregate daily download data into monthly or weekly buckets.
 *
 * @param {Array<{ day: string, downloads: number }>} days
 * @param {'month' | 'week'} type
 * @returns {Array<{ label: string, downloads: number }>}
 */
function bucketBy(days, type) {
  if (type !== 'month' && type !== 'week') {
    throw new Error(`Invalid bucket type: ${type}. Use 'month' or 'week'.`);
  }
  if (days.length === 0) return [];

  const keyFn = type === 'month' ? monthKey : weekKey;
  const map = new Map();

  for (const { day, downloads } of days) {
    const key = keyFn(day);
    map.set(key, (map.get(key) || 0) + downloads);
  }

  return Array.from(map, ([label, downloads]) => ({ label, downloads }));
}

function monthKey(day) {
  return day.slice(0, 7); // YYYY-MM
}

function weekKey(day) {
  // ISO week: week starts on Monday
  const d = new Date(day);
  const dayOfWeek = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
  return monday.toISOString().slice(0, 10); // YYYY-MM-DD of the Monday
}

module.exports = { getDownloads, bucketBy };
