[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/gogonkoplo/makefun-frontend/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/gogonkoplo/makefun-frontend/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

# make.fun frontend

A fast, lightweight frontend for [make.fun](https://make.fun) — the site where people build AI agents and programs, enter them in competitions, and are scored and ranked in the open. It is plain static files with no build step and no framework: vanilla ES modules, one stylesheet, and a system font stack, reading make.fun's public read-only API (`https://make.fun/api`) with GET requests only. No sign-in, no writes, no tracking.

Four surfaces, each reachable by a link and by its own URL:

- `#/` — the bounty board: live stats (live bounties, total live pot, total entries), search, category filters and sorting (ending soon / biggest pot / most entries). Every card shows the live pot in large type, the entry fee when one is set, the entry count and a live countdown. A bounty past its deadline reads "Closed · awaiting results" even while the API still calls it open — the deadline decides, not the status.
- `#/bounty/<slug>` — a bounty's page: summary, live pot, entry fee, entries, sponsor, dates with countdown, the rewards table (place / prize / fee share / total) headed by the live pot, the description and collapsible rules rendered from Markdown by a small safe renderer, recent submissions, and a top-5 leaderboard teaser.
- `#/leaderboard/<slug>` — the full leaderboard: one column per visible API column using its preformatted display strings, medal ranks, house/baseline and prize badges, a handle/title filter, and paging at 50 rows per page — entry lists run into the thousands.
- `#/u/<handle>` — a public profile: avatar (or a coloured initial tile), bio, GitHub / X / Discord / wallet links, record tiles (entered, placed, won, podiums, best placement, prizes won) and the account's solutions.

Built for speed:

- API answers are cached in memory with their ETags. Fresh answers render instantly and revalidate in the background with `If-None-Match`; if the body changed, the current view repaints in place. Concurrent requests for the same URL share one flight.
- The leaderboard and profile views load lazily through `import()`, so the first load is just the shell, the board and the bounty view.
- One shared one-second ticker updates every countdown in place — no refetching, no full re-renders.
- Hovering or focusing a board card prefetches that bounty's detail into the cache, so the click lands instantly.

## Run it

Serve the app locally (Node 22 or later, standard library only):

```
node serve.ts
```

Then open http://localhost:8080 in a browser.

To produce the hand-in output — `app/` and `screenshots/` copied beside a generated `dossier.json`:

```
MAKEFUN_OUTPUT_DIR=out node main.ts
```

`shots.json` records which route and viewport each screenshot in `screenshots/` was taken from.

## Layout

- `main.ts` — the hand-in program: copies `app/` + `screenshots/` to the output directory and writes `dossier.json` via the vendored library.
- `serve.ts` — a tiny static server for local development.
- `app/` — the frontend itself (`index.html`, `style.css`, `api.js`, `format.js`, `md.js`, `main.js`, `views/`).
- `vendor/makefun-frontend.ts` — the kit's dossier library, copied unchanged.

---

Built for make.fun's "Build the best make.fun frontend" bounty — see [make.fun](https://make.fun/?ref=mrzuanreal&utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01).
