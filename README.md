# npm-global-trend

See how npm registry downloads have changed over time. Monthly totals, weekly totals, or raw daily data — for the entire registry.

None of the existing npm stats sites (npm-stat.com, npmtrends.com, npmcharts.com) show registry-wide download totals. They only do per-package or package-vs-package comparisons. This fills that gap.

## Install

```sh
npm install -g npm-global-trend
```

## CLI

```sh
# Last 12 months, grouped by month (default)
npm-trend

# Last 18 months
npm-trend --months 18

# Custom date range
npm-trend --from 2024-01-01 --to 2025-12-31

# Weekly view
npm-trend --weekly --months 6
```

Example output:

```
npm registry downloads by month

  2025-05  ████████████████████               319.5B
  2025-06  ███████████████████████             363.9B   +13.9%
  2025-07  ████████████████████████            386.9B    +6.3%
  2025-08  ███████████████████████             360.2B    -6.9%
  2025-09  ████████████████████████            383.9B    +6.6%
  2025-10  ████████████████████████            376.5B    -1.9%
  2025-11  █████████████████████████           397.1B    +5.5%
  2025-12  █████████████████████████           389.8B    -1.8%
  2026-01  ████████████████████████████        441.0B   +13.1%
  2026-02  █████████████████████████████       467.6B    +6.0%
  2026-03  ████████████████████████████████████635.1B   +35.8%

  Total: 4851.7B
```

## Library

```js
const { getDownloads, bucketBy } = require('npm-global-trend');

// Fetch daily data for a date range (auto-chunks ranges > 18 months)
const days = await getDownloads({ from: '2024-01-01', to: '2025-12-31' });
// [{ day: '2024-01-01', downloads: 12345678 }, ...]

// Aggregate into monthly or weekly buckets
const months = bucketBy(days, 'month');
// [{ label: '2024-01', downloads: 380000000000 }, ...]

const weeks = bucketBy(days, 'week');
// [{ label: '2024-01-01', downloads: 95000000000 }, ...]
```

### `getDownloads({ from, to? })`

Fetches daily download counts for the entire npm registry. Ranges longer than 18 months are automatically split into multiple API requests (npm's per-request limit).

- `from` — start date, `YYYY-MM-DD` (required)
- `to` — end date, `YYYY-MM-DD` (defaults to today)

Returns `Array<{ day: string, downloads: number }>`.

### `bucketBy(days, 'month' | 'week')`

Aggregates daily data into monthly or weekly buckets.

- Monthly labels: `YYYY-MM`
- Weekly labels: `YYYY-MM-DD` (Monday of that week)

Returns `Array<{ label: string, downloads: number }>`.

## Data source

Uses the [npm registry downloads API](https://github.com/npm/registry/blob/main/docs/download-counts.md). Data is available back to January 10, 2015.

## License

ISC
