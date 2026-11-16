// A bounty's leaderboard. Entry lists run into the thousands, so the table is
// paged at 50 rows with a substring filter over handle and entry title. Cells
// use the API's preformatted display strings, one column per visible column
// definition. This view is loaded lazily by the router via import().

import { esc, count, skeletonLines } from '../format.js';

const PAGE_SIZE = 50;

function rowHtml(e, cols) {
  const medal = e.rank >= 1 && e.rank <= 3 ? ' medal m' + e.rank : '';
  const badges = (e.house ? '<span class="badge">House</span>' : '')
    + (e.baseline ? '<span class="badge">Baseline</span>' : '')
    + (e.prize_rank ? '<span class="badge lime">Prize #' + esc(e.prize_rank) + '</span>' : '');
  const avatar = e.image
    ? '<img class="avatar sm" crossorigin="anonymous" src="' + esc(e.image) + '" alt="" loading="lazy">'
    : '';
  const cells = cols.map((c) => '<td>' + esc((e.display || {})[c.key] ?? '') + '</td>').join('');
  return '<tr><td class="rank-cell' + medal + '">#' + esc(e.rank) + '</td>'
    + '<td><span class="entrant">' + avatar + '<a href="#/u/' + esc(encodeURIComponent(e.handle || '')) + '">' + esc(e.handle || '') + '</a>' + badges + '</span></td>'
    + '<td class="entry-title">' + esc(e.title || '') + '</td>' + cells + '</tr>';
}

export async function renderLeaderboard(root, slug, api) {
  root.innerHTML = '<p><a class="back" href="#/bounty/' + esc(slug) + '">← Back to bounty</a></p>' + skeletonLines(10);
  const d = await api.get('/competitions/' + encodeURIComponent(slug) + '/leaderboard');
  const cols = (d.columns || []).filter((c) => !c.hidden);
  const all = d.entries || [];
  let page = 0;
  let filter = '';

  const head = '<div class="page-head"><h1>' + esc((d.competition || {}).title || slug) + '</h1>'
    + '<p class="lede">Leaderboard' + (d.phase && d.phase.title ? ' · ' + esc(d.phase.title) : '')
    + (d.phase && d.phase.placements_held ? ' · <span class="pill closed">Placements held until results</span>' : '')
    + '</p></div>'
    + '<div class="controls"><label class="search"><span class="sr">Filter entrants</span>'
    + '<input id="lb-q" type="search" placeholder="Filter by handle or entry title…" aria-label="Filter entrants"></label></div>'
    + '<div id="lb-wrap"></div>';

  root.innerHTML = head;
  const wrap = root.querySelector('#lb-wrap');

  const draw = () => {
    const f = filter.trim().toLowerCase();
    const list = f
      ? all.filter((e) => ((e.handle || '') + ' ' + (e.title || '')).toLowerCase().includes(f))
      : all;
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (page >= pages) page = pages - 1;
    if (page < 0) page = 0;
    const slice = list.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    const headRow = '<tr><th>Rank</th><th>Entrant</th><th>Entry</th>'
      + cols.map((c) => '<th>' + esc(c.title) + '</th>').join('') + '</tr>';
    wrap.innerHTML = slice.length
      ? '<div class="tbl-wrap"><table class="tbl lb"><thead>' + headRow + '</thead><tbody>'
        + slice.map((e) => rowHtml(e, cols)).join('') + '</tbody></table></div>'
        + '<nav class="pager" aria-label="Leaderboard pages">'
        + '<button type="button" class="btn ghost" id="pg-prev"' + (page === 0 ? ' disabled' : '') + '>← Prev</button>'
        + '<span>Page ' + (page + 1) + ' of ' + pages + ' · ' + esc(count(list.length)) + ' entries</span>'
        + '<button type="button" class="btn ghost" id="pg-next"' + (page >= pages - 1 ? ' disabled' : '') + '>Next →</button></nav>'
      : '<div class="empty"><h2>No entries match</h2><p>Nothing on this leaderboard fits that filter.</p></div>';
    const prev = wrap.querySelector('#pg-prev');
    const next = wrap.querySelector('#pg-next');
    if (prev) prev.addEventListener('click', () => { page -= 1; draw(); });
    if (next) next.addEventListener('click', () => { page += 1; draw(); });
  };
  draw();

  root.querySelector('#lb-q').addEventListener('input', (e) => { filter = e.target.value; page = 0; draw(); });
}
