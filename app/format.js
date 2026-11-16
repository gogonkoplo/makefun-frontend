// Small formatting helpers shared by every view. Everything the API returns is
// treated as untrusted text: esc() is applied to each value interpolated into HTML.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

export function money(value) {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return '—';
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function count(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('en-US') : '—';
}

export function dateOf(iso) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '—';
  return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function relTime(iso) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const s = Math.max(1, Math.round((Date.now() - t) / 1000));
  if (s < 60) return s + 's ago';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const d = Math.floor(h / 24);
  if (d < 30) return d + 'd ago';
  return dateOf(iso);
}

// Human time remaining until an ISO deadline; the router's one-second ticker
// recomputes this for every [data-countdown] element without refetching.
export function timeLeft(iso) {
  const ms = Date.parse(iso) - Date.now();
  if (!Number.isFinite(ms)) return '';
  if (ms <= 0) return 'Closed';
  const mins = Math.floor(ms / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  if (days > 0) return days + 'd ' + hours + 'h left';
  if (hours > 0) return hours + 'h ' + (mins % 60) + 'm left';
  if (mins > 0) return mins + 'm left';
  return 'Under a minute left';
}

export function countdown(iso) {
  return '<span class="cd" data-countdown="' + esc(iso) + '">' + esc(timeLeft(iso)) + '</span>';
}

export function isClosed(bounty) {
  const t = Date.parse(bounty && bounty.deadline);
  return Number.isFinite(t) && t <= Date.now();
}

const TILE_COLORS = ['#6c4cf1', '#0e7a5f', '#b3540e', '#1d5fb8', '#9333a6', '#a61e4d'];

export function tileColor(seed) {
  let h = 0;
  const s = String(seed || '?');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return TILE_COLORS[h % TILE_COLORS.length];
}

export function avatarHtml(person, cls) {
  const name = person.display_name || person.handle || '?';
  const src = person.image || person.avatar || '';
  if (src) {
    return '<img class="' + cls + '" crossorigin="anonymous" src="' + esc(src) + '" alt="" loading="lazy">';
  }
  const initial = esc(String(name).trim().charAt(0).toUpperCase() || '?');
  return '<span class="' + cls + ' tile" style="background:' + tileColor(name) + '" aria-hidden="true">' + initial + '</span>';
}

export function skeletonCards(n) {
  let out = '<div class="grid" aria-hidden="true">';
  for (let i = 0; i < n; i++) out += '<div class="skl-card"><div class="skl w40"></div><div class="skl w90"></div><div class="skl w70"></div><div class="skl w50"></div></div>';
  return out + '</div>';
}

export function skeletonLines(n) {
  let out = '<div aria-hidden="true">';
  for (let i = 0; i < n; i++) out += '<div class="skl w' + [90, 70, 80, 50, 60][i % 5] + '"></div>';
  return out + '</div>';
}
