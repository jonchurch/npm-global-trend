# npm Registry Download Trend Comparison

## The Problem

When lodash downloads jump 20% month-over-month, we can't tell if that's:
1. **Real growth** — lodash is gaining adoption faster than npm overall
2. **Rising tide** — npm as a whole grew ~20% and lodash is just along for the ride
3. **Decline masked by growth** — npm grew 30% but lodash only grew 20%, meaning lodash is actually losing share

## What We Want

Compare a package's download growth against the overall npm registry trend to separate real signal from ecosystem-wide noise.

Example output:

```
                    npm total    lodash total    lodash share
Last 30 days:       621.5B       4.6B            0.74%
Prior 30 days:      580.2B       3.8B            0.66%
Change:             +7.1%        +21.1%          +0.08pp
```

This tells you lodash grew 3x faster than the registry — that's real growth, not just a rising tide.

## Data Source

The npm downloads API already supports this. Omit the package name to get registry-wide totals:

- `GET /downloads/point/last-month` — total npm downloads, all packages
- `GET /downloads/range/last-month` — daily breakdown, all packages

Same endpoints we already use in lodash-stats, just without a package name.

## Where This Could Live

- **New subcommand**: `lodash-stats trend` — quick and easy, but couples it to lodash
- **Standalone tool** — this question isn't lodash-specific. Anyone maintaining a popular package would want to know if their growth is real or just a rising tide. Could be a general-purpose CLI like `npm-trend lodash` or `npm-trend express react vue`

## Existing Tools

None of the existing sites (npm-stat.com, npmtrends.com, npmcharts.com) show registry-wide totals or package-vs-registry share. They all do per-package or package-vs-package comparisons. This would be a new thing.

