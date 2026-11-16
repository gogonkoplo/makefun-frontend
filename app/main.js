// Router and page chrome for the make.fun frontend.
// Hash routes: #/ (board), #/bounty/<slug>, #/leaderboard/<slug>, #/u/<handle>.
// Board and bounty views are imported statically so the first paint is one
// request deep; leaderboard and profile load lazily through literal import()
// calls, keeping the first load small. A single one-second ticker refreshes
// every countdown in place — no refetching, no full re-renders — and when the
// API cache reports fresher data for the page being viewed, the current view
// repaints itself in place.

import { get, prefetch, onDataChanged } from './api.js';
import { timeLeft } from './format.js';
import { renderBoard } from './views/board.js';
import { renderBounty } from './views/bounty.js';

const root = document.getElementById('app');
const api = { get, prefetch };
let seq = 0;

function errorPanel(err) {
  return '<div class="error" role="alert"><h1>Could not load that page</h1>'
    + '<p>The make.fun API did not answer as expected (' + String(err && err.message ? err.message : err) + '). Check your connection and try again.</p>'
    + '<button type="button" class="btn" id="retry">Retry</button></div>';
}

async function route() {
  const mine = ++seq;
  window.__shotReady = false;
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)
    .map((s) => { try { return decodeURIComponent(s); } catch { return s; } });
  try {
    if (parts.length === 0) {
      await renderBoard(root, api);
    } else if (parts[0] === 'bounty' && parts[1]) {
      await renderBounty(root, parts[1], api);
    } else if (parts[0] === 'leaderboard' && parts[1]) {
      const view = await import('./views/leaderboard.js');
      await view.renderLeaderboard(root, parts[1], api);
    } else if (parts[0] === 'u' && parts[1]) {
      const view = await import('./views/profile.js');
      await view.renderProfile(root, parts[1], api);
    } else {
      root.innerHTML = '<div class="empty"><h1>Page not found</h1><p>That address does not match a board, bounty, leaderboard or profile.</p><p><a class="btn" href="#/">Back to the board</a></p></div>';
    }
  } catch (err) {
    if (mine !== seq) return;
    root.innerHTML = errorPanel(err);
    const retry = root.querySelector('#retry');
    if (retry) retry.addEventListener('click', () => route());
  }
  if (mine === seq) {
    window.__shotReady = true;
    window.scrollTo(0, 0);
  }
}

// Fresher data for the page on screen: repaint the same route in place.
onDataChanged(() => { route(); });

window.addEventListener('hashchange', route);

// One shared ticker drives every countdown on the page.
setInterval(() => {
  const now = Date.now();
  document.querySelectorAll('[data-countdown]').forEach((el) => {
    el.textContent = timeLeft(el.getAttribute('data-countdown'));
    const ms = Date.parse(el.getAttribute('data-countdown')) - now;
    el.classList.toggle('u-hot', ms > 0 && ms < 6 * 3600_000);
    el.classList.toggle('u-warm', ms >= 6 * 3600_000 && ms < 24 * 3600_000);
  });
}, 1000);

route();
