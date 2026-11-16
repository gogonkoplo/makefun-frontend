// Data layer for the make.fun public API (read-only GET, CORS open).
// Answers are kept in an in-memory cache keyed by URL together with their ETag.
// Fresh answers (under a minute old) render instantly while a conditional request
// revalidates in the background; if the body actually changed, the router is told
// to repaint the current view in place. Older answers go through If-None-Match so
// an unchanged body costs a 304 instead of a full download. Concurrent requests
// for the same URL share one flight.

const BASE = 'https://make.fun/api';
const FRESH_MS = 60_000;
const REVALIDATE_GAP_MS = 15_000;

const cache = new Map();
const flying = new Map();
let changedListener = null;

export function onDataChanged(fn) {
  changedListener = fn;
}

async function fetchJson(url) {
  const entry = cache.get(url);
  const headers = {};
  if (entry && entry.etag) headers['If-None-Match'] = entry.etag;
  const res = await fetch(url, { headers });
  if (res.status === 304 && entry) {
    entry.at = Date.now();
    entry.tried = Date.now();
    return { data: entry.data, changed: false };
  }
  if (!res.ok) throw new Error('make.fun API answered ' + res.status);
  const data = await res.json();
  const body = JSON.stringify(data);
  const changed = !entry || entry.body !== body;
  cache.set(url, { etag: res.headers.get('etag'), data, body, at: Date.now(), tried: Date.now() });
  return { data, changed };
}

function request(url) {
  let p = flying.get(url);
  if (!p) {
    p = fetchJson(url).finally(() => flying.delete(url));
    flying.set(url, p);
  }
  return p;
}

export async function get(path) {
  const url = BASE + path;
  const entry = cache.get(url);
  if (entry && Date.now() - entry.at < FRESH_MS) {
    if (Date.now() - entry.tried > REVALIDATE_GAP_MS) {
      entry.tried = Date.now();
      request(url)
        .then((r) => { if (r.changed && changedListener) changedListener(url); })
        .catch(() => {});
    }
    return entry.data;
  }
  const r = await request(url);
  return r.data;
}

export function prefetch(path) {
  get(path).catch(() => {});
}
