'use strict';

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const { getDownloads, bucketBy } = require('../lib/index.js');

const WIDTH = 1200;
const HEIGHT = 630;
const MONTHS_BACK = 12;
// Pinned so local and CI render match. Mac: `brew install --cask font-dejavu`.
const FONT_FAMILY = "'DejaVu Sans', sans-serif";

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function lastFullMonthEnd() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0))
    .toISOString().slice(0, 10);
}

function monthsAgo(n) {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - n, 1);
  return d.toISOString().slice(0, 10);
}

function formatB(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  return String(n);
}

function formatMonthShort(label) {
  const [y, m] = label.split('-');
  return MONTHS[parseInt(m, 10) - 1] + " '" + y.slice(2);
}

// Pick a nice step size based on data range, then snap min/max to multiples.
// Non-zero baseline — keeps month-over-month variation readable on a trend chart.
function niceAxis(minValue, maxValue, targetTicks = 5) {
  const rawStep = (maxValue - minValue) / targetTicks;
  const pow = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const frac = rawStep / pow;
  let niceFrac;
  if (frac <= 1) niceFrac = 1;
  else if (frac <= 1.5) niceFrac = 1.5;
  else if (frac <= 2) niceFrac = 2;
  else if (frac <= 2.5) niceFrac = 2.5;
  else if (frac <= 5) niceFrac = 5;
  else niceFrac = 10;
  const step = niceFrac * pow;
  const yMin = Math.floor(minValue / step) * step;
  const yMax = Math.ceil(maxValue / step) * step;
  return { yMin, yMax, step };
}

function buildSvg(buckets) {
  const values = buckets.map(b => b.downloads);
  const first = values[0];
  const last = values[values.length - 1];
  const total = values.reduce((s, v) => s + v, 0);
  const growthPct = ((last - first) / first) * 100;

  const chartX = 50;
  const chartY = 300;
  const chartW = 1100;
  const chartH = 280;

  const { yMin, yMax, step: yStep } = niceAxis(Math.min(...values), Math.max(...values));
  const yRange = yMax - yMin;
  const xStep = values.length > 1 ? chartW / (values.length - 1) : 0;

  const points = values.map((v, i) => {
    const x = chartX + i * xStep;
    const y = chartY + chartH - ((v - yMin) / yRange) * chartH;
    return [x, y];
  });

  const polyline = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  // Filled area: follow line, drop to baseline, close.
  const areaPath = [
    `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`,
    ...points.slice(1).map(([x, y]) => `L ${x.toFixed(1)} ${y.toFixed(1)}`),
    `L ${(chartX + chartW).toFixed(1)} ${(chartY + chartH).toFixed(1)}`,
    `L ${chartX.toFixed(1)} ${(chartY + chartH).toFixed(1)}`,
    'Z',
  ].join(' ');

  const yTicks = [];
  for (let v = yMin; v <= yMax + 1e-6; v += yStep) {
    const y = chartY + chartH - ((v - yMin) / yRange) * chartH;
    yTicks.push({ value: v, y });
  }

  const gridLines = yTicks.map(t =>
    `<line x1="${chartX}" y1="${t.y.toFixed(1)}" x2="${chartX + chartW}" y2="${t.y.toFixed(1)}" stroke="#1a1a1a" stroke-width="1"/>`
  ).join('');

  const yLabels = yTicks.map(t =>
    `<text x="${chartX - 10}" y="${(t.y + 4).toFixed(1)}" fill="#555" font-size="12" text-anchor="end">${formatB(t.value)}</text>`
  ).join('');

  const xTickCount = 6;
  const xLabels = [];
  for (let i = 0; i < xTickCount; i++) {
    const idx = Math.round((i / (xTickCount - 1)) * (values.length - 1));
    const x = chartX + idx * xStep;
    const label = formatMonthShort(buckets[idx].label);
    xLabels.push(
      `<text x="${x.toFixed(1)}" y="${chartY + chartH + 22}" fill="#666" font-size="13" text-anchor="middle">${label}</text>`
    );
  }

  const statsY = 220;
  const stats = [
    { value: formatB(last), label: 'LATEST MONTH' },
    { value: (growthPct >= 0 ? '+' : '') + growthPct.toFixed(0) + '%', label: 'YOY GROWTH' },
    { value: formatB(total), label: '12-MONTH TOTAL' },
  ];
  const statBlocks = stats.map((s, i) => {
    const x = 50 + i * 360;
    return `
      <text x="${x}" y="${statsY}" fill="#ffffff" font-size="42" font-weight="700">${s.value}</text>
      <text x="${x}" y="${statsY + 22}" fill="#888" font-size="13" font-weight="600" letter-spacing="1">${s.label}</text>
    `;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" font-family="${FONT_FAMILY}">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#0a0a0a"/>

    <text x="50" y="90" fill="#ffffff" font-size="52" font-weight="700" letter-spacing="-1">Registry Download Trends</text>
    <text x="50" y="125" fill="#888" font-size="20">Monthly downloads across all npm packages</text>
    <text x="${WIDTH - 50}" y="90" fill="#cb3837" font-size="44" font-weight="800" text-anchor="end" letter-spacing="-1">npm</text>

    ${statBlocks}

    ${gridLines}
    <path d="${areaPath}" fill="rgba(203, 56, 55, 0.18)"/>
    <polyline points="${polyline}" fill="none" stroke="#cb3837" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    ${yLabels}
    ${xLabels.join('')}
  </svg>`;
}

async function main() {
  const from = monthsAgo(MONTHS_BACK);
  const to = lastFullMonthEnd();

  console.log(`Fetching downloads ${from} → ${to}...`);
  const days = await getDownloads({ from, to });
  const buckets = bucketBy(days, 'month');
  console.log(`Got ${buckets.length} monthly buckets.`);

  const svg = buildSvg(buckets);

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
    font: { loadSystemFonts: true },
  });
  const png = resvg.render().asPng();

  const outPath = path.resolve(__dirname, '../docs/og.png');
  fs.writeFileSync(outPath, png);
  console.log(`Wrote ${outPath} (${(png.length / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
