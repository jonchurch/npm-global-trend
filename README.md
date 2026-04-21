# npm-global-trend

Chart of total downloads across all packages on the npm registry, over time.

**[jonchurch.com/npm-global-trend](https://jonchurch.com/npm-global-trend/)**

None of the existing npm stats sites showed registry wide download totals, they're all per-package or package-vs-package. I threw this together to help answer the question of "if a rising tide lifts all boats, how's the tide?"

What I've seen is that since the advent of AI coding agents circa 2025 npm downloads have exploded.

Originally I was building this out as a CLI w/ Claude code (I've left the PLAN.md and NOTES.md in the repo as a little time capsule to myself) but then realized really what I wanted was a visualization, hence this gh pages site. The CLI stuff is still in the git history if you do want that for some reason!

## Data source

Pulled live from the [npm registry downloads API](https://github.com/npm/registry/blob/main/docs/download-counts.md). Data is available back to January 10, 2015.

## Repo layout

- `docs/` — the static site, served via GitHub Pages
- `lib/` — `getDownloads` / `bucketBy` helpers used internally
- `scripts/generate-og.js` — regenerates the OG preview image from live npm data
- `.github/workflows/` — monthly cron keeps the OG image fresh

## License

ISC
