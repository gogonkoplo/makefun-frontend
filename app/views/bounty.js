// One bounty's page: headline facts, the live rewards table, description and
// rules rendered from Markdown, recent submissions and a leaderboard teaser.

import { esc, money, count, dateOf, relTime, countdown, isClosed, skeletonLines } from '../format.js';
import { md } from '../md.js';

function rewardsTable(b) {
  const rows = (b.rewardsNow || []).slice().sort((a, c) => a.place - c.place);
  if (!rows.length) return '';
  const body = rows.map((r) =>
    '<tr><td class="place">#' + esc(r.place) + '</td><td>' + esc(money(r.baseUsd)) + '</td><td>'
    + esc(money(r.feeShareUsd)) + '</td><td class="total">' + esc(money(r.amountUsd)) + '</td></tr>').join('');
  return '<section class="panel"><h2>Rewards · live pot ' + esc(money(b.potUsd)) + '</h2>'
    + '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Place</th><th>Prize</th><th>Fee share</th><th>Total</th></tr></thead>'
    + '<tbody>' + body + '</tbody></table></div>'
    + '<p class="note">The pot is the sponsor reward plus every entry fee paid so far, split over the places.</p></section>';
}

function submissionsList(b) {
  const subs = (b.submissions || []).slice(0, 10);
  if (!subs.length) return '';
  const rows = subs.map((s) =>
    '<li><span class="sub-title">' + esc(s.title || 'Untitled entry') + '</span>'
    + '<span class="sub-meta"><a href="#/u/' + esc(encodeURIComponent(s.hunter || '')) + '">' + esc(s.hunter || '') + '</a>'
    + (s.status ? ' · ' + esc(s.status) : '') + (s.createdAt ? ' · ' + esc(relTime(s.createdAt)) : '') + '</span></li>').join('');
  return '<section class="panel"><h2>Recent submissions</h2><ul class="subs">' + rows + '</ul></section>';
}

function teaser(lb, slug) {
  if (!lb || !(lb.entries || []).length) return '';
  const rows = lb.entries.slice(0, 5).map((e) =>
    '<li><span class="rank r' + esc(e.rank) + '">#' + esc(e.rank) + '</span>'
    + '<a href="#/u/' + esc(encodeURIComponent(e.handle || '')) + '">' + esc(e.handle || '') + '</a>'
    + '<span class="teaser-title">' + esc(e.title || '') + '</span></li>').join('');
  return '<section class="panel"><h2>Leaderboard · top 5</h2><ul class="teaser">' + rows + '</ul>'
    + '<a class="btn ghost" href="#/leaderboard/' + esc(slug) + '">Full leaderboard</a></section>';
}

export async function renderBounty(root, slug, api) {
  root.innerHTML = '<p><a class="back" href="#/">← All bounties</a></p>' + skeletonLines(8);
  const b = await api.get('/competitions/' + encodeURIComponent(slug));
  let lb = null;
  try { lb = await api.get('/competitions/' + encodeURIComponent(slug) + '/leaderboard'); } catch { lb = null; }

  const closed = isClosed(b);
  const accepting = b.acceptingSubmissions != null ? !!b.acceptingSubmissions : !closed;
  const pill = b.winner || b.resolvedAt
    ? '<span class="pill done">Resolved</span>'
    : closed || !accepting
      ? '<span class="pill closed">Closed · awaiting results</span>'
      : '<span class="pill open">Open · accepting entries</span>';
  const sponsor = b.sponsor
    ? esc(b.sponsor.name || '') + (b.sponsor.isVerified ? ' ✓' : '') : '—';
  const feeText = b.entryFeeUsd != null && b.entryFeeUsd !== '' ? money(b.entryFeeUsd) : 'Free to enter';

  root.innerHTML =
    '<p><a class="back" href="#/">← All bounties</a></p>'
    + '<div class="bounty-head"><div class="card-top"><span class="cat">' + esc(b.category || 'Bounty') + '</span>' + pill + '</div>'
    + '<h1>' + esc(b.title) + '</h1>'
    + (b.summary ? '<p class="lede">' + esc(b.summary) + '</p>' : '')
    + '</div>'
    + '<section class="stats bounty-stats" aria-label="Bounty facts">'
    + '<div class="stat"><span class="stat-num accent">' + esc(money(b.potUsd)) + '</span><span class="stat-label">live pot</span></div>'
    + '<div class="stat"><span class="stat-num">' + esc(feeText) + '</span><span class="stat-label">entry fee</span></div>'
    + '<div class="stat"><span class="stat-num">' + esc(count(b.submissionCount)) + '</span><span class="stat-label">entries</span></div>'
    + '<div class="stat"><span class="stat-num sm">' + esc(sponsor) + '</span><span class="stat-label">sponsor</span></div>'
    + '</section>'
    + '<section class="panel dates"><h2>Dates</h2><dl>'
    + '<div><dt>Opened</dt><dd>' + esc(dateOf(b.opensAt || b.publishedAt)) + '</dd></div>'
    + '<div><dt>Deadline</dt><dd>' + esc(dateOf(b.deadline)) + ' · ' + countdown(b.deadline) + '</dd></div>'
    + (b.resolvedAt ? '<div><dt>Resolved</dt><dd>' + esc(dateOf(b.resolvedAt)) + '</dd></div>' : '')
    + (b.winner ? '<div><dt>Winner</dt><dd><a href="#/u/' + esc(encodeURIComponent(b.winner)) + '">' + esc(b.winner) + '</a></dd></div>' : '')
    + '</dl><p><a class="btn" href="https://make.fun/bounty/' + esc(slug) + '" target="_blank" rel="noopener">Open this bounty on make.fun ↗</a> '
    + '<a class="btn ghost" href="#/leaderboard/' + esc(slug) + '">Leaderboard</a></p></section>'
    + rewardsTable(b)
    + (b.description ? '<section class="panel prose"><h2>About</h2>' + md(b.description) + '</section>' : '')
    + (b.rules ? '<details class="panel rules"><summary>Rules</summary><div class="prose">' + md(b.rules) + '</div>'
      + (b.rulesNote ? '<p class="note">' + esc(b.rulesNote) + '</p>' : '') + '</details>' : '')
    + submissionsList(b)
    + teaser(lb, slug);
}
