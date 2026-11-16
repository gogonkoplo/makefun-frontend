// An account's public profile: identity, links, competitive record tiles and
// the list of solutions they have entered. Optional API fields (image, avatar,
// x, discord) are often null, and x / discord arrive as a string or an object
// depending on the account — only a plain handle string is ever rendered.
// This view is loaded lazily by the router via import().

import { esc, money, count, dateOf, avatarHtml, skeletonLines } from '../format.js';

function handleOf(value) {
  if (typeof value === 'string') return value.replace(/^@/, '').trim() || null;
  if (value && typeof value === 'object') {
    const raw = value.handle || value.username || value.name || value.id;
    if (typeof raw === 'string') return raw.replace(/^@/, '').trim() || null;
  }
  return null;
}

function linkRow(p) {
  const links = [];
  if (p.github_login) {
    links.push('<a class="chip link" href="https://github.com/' + esc(encodeURIComponent(p.github_login)) + '" target="_blank" rel="noopener">GitHub · ' + esc(p.github_login) + '</a>');
  }
  const x = handleOf(p.x);
  if (x) links.push('<a class="chip link" href="https://x.com/' + esc(encodeURIComponent(x)) + '" target="_blank" rel="noopener">X · @' + esc(x) + '</a>');
  const discord = handleOf(p.discord);
  if (discord) links.push('<span class="chip">Discord · ' + esc(discord) + '</span>');
  if (p.wallet && p.wallet.address) {
    const href = p.wallet.explorer_url || '#';
    links.push('<a class="chip link mono" href="' + esc(href) + '" target="_blank" rel="noopener">Wallet · ' + esc(p.wallet.address) + '</a>');
  }
  return links.length ? '<div class="chips links">' + links.join('') + '</div>' : '';
}

function recordTiles(r) {
  if (!r) return '';
  const tiles = [
    ['Entered', count(r.competitions_entered)],
    ['Placed', count(r.competitions_placed)],
    ['Won', count(r.competitions_won)],
    ['Podiums', count(r.podium_finishes)],
    ['Best placement', r.best_placement ? '#' + esc(r.best_placement) : '—'],
    ['Prizes won', money(r.prize_usd)],
  ];
  return '<section class="stats profile-stats" aria-label="Competitive record">'
    + tiles.map(([label, value]) => '<div class="stat"><span class="stat-num">' + value + '</span><span class="stat-label">' + label + '</span></div>').join('')
    + '</section>';
}

function solutionsList(p) {
  const sols = p.solutions || [];
  if (!sols.length) return '<section class="panel"><h2>Solutions</h2><p class="note">No entries yet.</p></section>';
  const rows = sols.map((s) => {
    const comp = s.competition || {};
    const bits = [];
    if (s.placement) bits.push('Placed #' + esc(s.placement));
    if (s.prize_usd) bits.push('Won ' + esc(money(s.prize_usd)));
    if (s.score && s.score.display) bits.push(esc(s.score.column ? s.score.column.title + ': ' : '') + esc(s.score.display));
    if (s.entered_at) bits.push('Entered ' + esc(dateOf(s.entered_at)));
    return '<li><span class="sub-title">' + esc(s.title || 'Untitled entry') + '</span>'
      + '<span class="sub-meta"><a href="#/bounty/' + esc(comp.slug || '') + '">' + esc(comp.title || comp.slug || '') + '</a>'
      + (bits.length ? ' · ' + bits.join(' · ') : '') + '</span></li>';
  }).join('');
  return '<section class="panel"><h2>Solutions</h2><ul class="subs">' + rows + '</ul></section>';
}

export async function renderProfile(root, handle, api) {
  root.innerHTML = skeletonLines(8);
  const p = await api.get('/profiles/' + encodeURIComponent(handle));
  const name = p.display_name || p.handle || handle;

  root.innerHTML =
    '<div class="profile-head">' + avatarHtml(p, 'avatar lg')
    + '<div><h1>' + esc(name) + '</h1>'
    + '<p class="handle">@' + esc(p.handle || handle)
    + (p.house ? ' <span class="badge">House</span>' : '')
    + (p.joined_at ? ' · joined ' + esc(dateOf(p.joined_at)) : '') + '</p>'
    + (p.bio ? '<p class="bio">' + esc(p.bio) + '</p>' : '')
    + '</div></div>'
    + linkRow(p)
    + recordTiles(p.record)
    + solutionsList(p);
}
