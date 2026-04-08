# npm Downloads API Notes

## Endpoints

Two endpoints, same inputs, different outputs:

| Endpoint | Input | Output |
|----------|-------|--------|
| `/downloads/point/{period}` | `last-month`, `last-year`, or `YYYY-MM-DD:YYYY-MM-DD` | One number — total downloads for that period |
| `/downloads/range/{period}` | Same | Array of `{ day, downloads }` — one entry per day |

Omit the package name to get registry-wide totals.

Base URL: `https://api.npmjs.org`

## Limits

- Max 18 months per request
- Data goes back to Jan 10, 2015

## Approach: Monthly Download Trend Over N Years

We want one data point per calendar month (e.g. 60 points for 5 years).

### Option A: 60 x `/point/` requests

One request per calendar month:
```
/downloads/point/2021-04-01:2021-04-30
/downloads/point/2021-05-01:2021-05-31
...
/downloads/point/2026-03-01:2026-03-31
```

Each returns a single number. No aggregation needed. Many requests but they're tiny and parallelizable.

### Option B: 4 x `/range/` requests

Fetch in 18-month chunks:
```
/downloads/range/2021-04-01:2022-09-30
/downloads/range/2022-10-01:2024-03-31
/downloads/range/2024-04-01:2025-09-30
/downloads/range/2025-10-01:2026-03-31
```

Fewer requests, but each returns ~550 daily rows that we sum into monthly buckets on our side.

### Trade-off

- **Option A** — clean, no aggregation, but many requests
- **Option B** — fewer requests, but requires client-side aggregation
