#!/usr/bin/env node
'use strict';

const { getDownloads, bucketBy } = require('./lib');

function formatNumber(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

function printTable(buckets, label) {
  const maxDl = Math.max(...buckets.map(b => b.downloads));
  const barWidth = 40;

  console.log(`\nnpm registry downloads by ${label}\n`);

  let prev = null;
  for (const { label: l, downloads } of buckets) {
    const bar = '\u2588'.repeat(Math.round((downloads / maxDl) * barWidth));
    const num = formatNumber(downloads).padStart(7);
    let change = '';
    if (prev != null) {
      const pct = ((downloads - prev) / prev * 100).toFixed(1);
      change = (pct >= 0 ? '+' : '') + pct + '%';
    }
    console.log(`  ${l}  ${bar}  ${num}  ${change.padStart(7)}`);
    prev = downloads;
  }

  const total = buckets.reduce((s, b) => s + b.downloads, 0);
  console.log(`\n  Total: ${formatNumber(total)}`);
}

function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
}

function parseArgs(args) {
  const opts = { bucket: 'month' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--help' || args[i] === '-h') return { help: true };
    if (args[i] === '--from' && args[i + 1]) opts.from = args[++i];
    else if (args[i] === '--to' && args[i + 1]) opts.to = args[++i];
    else if (args[i] === '--months' && args[i + 1]) opts.months = parseInt(args[++i], 10);
    else if (args[i] === '--weekly') opts.bucket = 'week';
    else if (args[i] === '--monthly') opts.bucket = 'month';
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help) {
    console.log(`Usage: npm-trend [options]

Options:
  --from YYYY-MM-DD   Start date
  --to YYYY-MM-DD     End date (default: today)
  --months N          Shorthand: last N months (default: 12)
  --weekly            Group by week instead of month
  --monthly           Group by month (default)`);
    process.exit(0);
  }

  const from = opts.from || monthsAgo(opts.months || 12);
  const to = opts.to;

  try {
    const days = await getDownloads({ from, to });
    const buckets = bucketBy(days, opts.bucket);
    printTable(buckets, opts.bucket);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
