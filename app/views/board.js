// The bounty board: live stats, search, category chips, sorting and a card grid.
// Filter state lives at module level so a background revalidation repaint keeps
// the visitor's search, chip and sort exactly as they left them.

import { esc, money, count, countdown, dateOf, isClosed, skeletonCards } from '../format.js';

const state = { q: '', cat: 'All', sort: 'ending' };

function cardHtml(b) {
  const closed = isClosed(b);
  const skills = (b.skills || []).slice(0, 3)
    .map((s) => '<span class="chip skill">' + esc(s) + '</span>').join('');
  const fee = b.entryFeeUsd != null && b.entryFeeUsd !== ''
    ? '<span class="chip fee">Entry ' + esc(money(b.entryFeeUsd)) + '</span>' : '';
  const status = closed
    ? '<span class="pill closed">Closed · awaiting results</span>'
    : '<span class="pill open">Open</span>';
  return '<a class="card" href="#/bounty/' + esc(b.slug) + '" data-slug="' + esc(b.slug) + '">'
    + '<div class="card-top"><span class="cat">' + esc(b.category || 'Bounty') + '</span>' + status + '</div>'
    + '<h3 class="card-title">' + esc(b.title) + '</h3>'
    + '<p class="card-sum">' + esc(b.summary || '') + '</p>'
    + (skills ? '<div class="chips">' + skills + '</div>' : '')
    + '<div class="card-pot"><span class="pot">' + esc(money(b.potUsd)) + '</span><span class="pot-label">live pot</span></div>'
    + '<div class="card-meta">' + fee
    + '<span class="meta-item">' + esc(count(b.submissionCount)) + ' entries</span>'
    + '<span class="meta-item cd-wrap">' + (closed ? 'Ended ' + esc(dateOf(b.deadline)) : countdown(b.deadline)) + '</span>'
    + '</div></a>';
}

function visibleItems(items) {
  const q = state.q.trim().toLowerCase();
  let list = items.filter((b) => {
    if (state.cat !== 'All' && (b.category || '') !== state.cat) return false;
    if (!q) return true;
    const hay = [b.title, b.slug, b.category, ...(b.skills || [])].join(' ').toLowerCase();
    return hay.includes(q);
  });
  if (state.sort === 'pot') list = [...list].sort((a, b) => parseFloat(b.potUsd || 0) - parseFloat(a.potUsd || 0));
  else if (state.sort === 'entries') list = [...list].sort((a, b) => (b.submissionCount || 0) - (a.submissionCount || 0));
  else list = [...list].sort((a, b) => Date.parse(a.deadline) - Date.parse(b.deadline));
  return list;
}

export async function renderBoard(root, api) {
  root.innerHTML = '<div class="page-head"><h1>Live bounties</h1><p class="lede">Every open competition on make.fun, straight from the public API.</p></div>' + skeletonCards(6);
  const data = await api.get('/competitions?status=open&activity=times');
  const items = data.items || [];

  const live = items.filter((b) => !isClosed(b));
  const potTotal = items.reduce((sum, b) => sum + (parseFloat(b.potUsd) || 0), 0);
  const entryTotal = items.reduce((sum, b) => sum + (Number(b.submissionCount) || 0), 0);
  const cats = ['All', ...new Set(items.map((b) => b.category).filter(Boolean))];

  root.innerHTML =
    '<div class="page-head"><h1>Live bounties</h1><p class="lede">Build, enter, get scored in the open. Pots grow with every entry fee paid.</p></div>'
    + '<section class="stats" aria-label="Board totals">'
    + '<div class="stat"><span class="stat-num">' + live.length + '</span><span class="stat-label">live bounties</span></div>'
    + '<div class="stat"><span class="stat-num">' + esc(money(potTotal)) + '</span><span class="stat-label">total live pot</span></div>'
    + '<div class="stat"><span class="stat-num">' + esc(count(entryTotal)) + '</span><span class="stat-label">entries so far</span></div>'
    + '</section>'
    + '<div class="controls">'
    + '<label class="search"><span class="sr">Search bounties</span><input id="q" type="search" placeholder="Search title, skill, category…" value="' + esc(state.q) + '" aria-label="Search bounties"></label>'
    + '<label class="sort"><span class="sr">Sort bounties</span><select id="sort" aria-label="Sort bounties">'
    + '<option value="ending"' + (state.sort === 'ending' ? ' selected' : '') + '>Ending soon</option>'
    + '<option value="pot"' + (state.sort === 'pot' ? ' selected' : '') + '>Biggest pot</option>'
    + '<option value="entries"' + (state.sort === 'entries' ? ' selected' : '') + '>Most entries</option>'
    + '</select></label></div>'
    + '<div class="chips cats" role="group" aria-label="Filter by category">'
    + cats.map((c) => '<button type="button" class="chip cat-chip' + (state.cat === c ? ' on' : '') + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>').join('')
    + '</div>'
    + '<div id="grid"></div>';

  const grid = root.querySelector('#grid');
  const draw = () => {
    const list = visibleItems(items);
    grid.innerHTML = list.length
      ? '<div class="grid">' + list.map(cardHtml).join('') + '</div>'
      : '<div class="empty"><h2>Nothing matches</h2><p>No open bounty fits that search. Try a shorter word or another category.</p></div>';
  };
  draw();

  root.querySelector('#q').addEventListener('input', (e) => { state.q = e.target.value; draw(); });
  root.querySelector('#sort').addEventListener('change', (e) => { state.sort = e.target.value; draw(); });
  root.querySelector('.cats').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cat]');
    if (!btn) return;
    state.cat = btn.dataset.cat;
    root.querySelectorAll('.cat-chip').forEach((c) => c.classList.toggle('on', c === btn));
    draw();
  });
  // Warm the cache for a bounty's detail as soon as its card is hovered or focused,
  // so the bounty page opens instantly on click.
  const warm = (e) => {
    const a = e.target.closest('a[data-slug]');
    if (a) api.prefetch('/competitions/' + encodeURIComponent(a.dataset.slug));
  };
  grid.addEventListener('mouseover', warm);
  grid.addEventListener('focusin', warm);
}
