// A small, safe Markdown renderer for bounty descriptions and rules.
// The input is HTML-escaped before any rule runs, so markup from the API can
// never reach the page; the only tags produced are the ones built here.
// Supported: paragraphs, ## and ### headings, **bold**, *italic*, `code`,
// fenced code blocks, - / * and numbered lists, and [text](url) links where
// the URL is http(s) or a make.fun-relative path.

import { esc } from './format.js';

function linkTarget(url) {
  const u = String(url || '').trim();
  if (/^https?:\/\/[^\s)]+$/i.test(u)) return u;
  if (u.startsWith('/') && !u.startsWith('//')) return 'https://make.fun' + u;
  return null;
}

function inline(text) {
  let out = esc(text);
  out = out.replace(/`([^`]+)`/g, (m, code) => '<code>' + code + '</code>');
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) => {
    const target = linkTarget(url.replace(/&amp;/g, '&'));
    if (!target) return label;
    return '<a href="' + esc(target) + '" target="_blank" rel="noopener">' + label + '</a>';
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  return out;
}

export function md(source) {
  const lines = String(source ?? '').replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  let para = [];
  let list = null;
  let fence = null;

  const flushPara = () => {
    if (para.length) {
      html.push('<p>' + inline(para.join(' ')) + '</p>');
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      html.push('<' + list.tag + '>' + list.items.map((i) => '<li>' + inline(i) + '</li>').join('') + '</' + list.tag + '>');
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (fence !== null) {
      if (/^```/.test(line.trim())) {
        html.push('<pre><code>' + esc(fence.join('\n')) + '</code></pre>');
        fence = null;
      } else {
        fence.push(raw);
      }
      continue;
    }
    if (/^```/.test(line.trim())) {
      flushPara(); flushList();
      fence = [];
      continue;
    }
    if (!line.trim()) { flushPara(); flushList(); continue; }
    const h3 = line.match(/^###\s+(.*)$/);
    const h2 = line.match(/^##\s+(.*)$/);
    const h1 = line.match(/^#\s+(.*)$/);
    if (h3 || h2 || h1) {
      flushPara(); flushList();
      const m = h3 || h2 || h1;
      const tag = h3 ? 'h4' : h2 ? 'h3' : 'h3';
      html.push('<' + tag + '>' + inline(m[1]) + '</' + tag + '>');
      continue;
    }
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      flushPara();
      const tag = bullet ? 'ul' : 'ol';
      if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; }
      list.items.push((bullet || numbered)[1]);
      continue;
    }
    flushList();
    para.push(line.trim());
  }
  if (fence !== null) html.push('<pre><code>' + esc(fence.join('\n')) + '</code></pre>');
  flushPara(); flushList();
  return html.join('\n');
}
