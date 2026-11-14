/* generate-books.mjs — writes pages/books.html (served at /books) from
   data/books.json. Typed, one face, one size: title in caps, author, a short
   summary, then up to three quotes indented. Books separated by * * *.

   The subjects list sits once at the top. Mid-page, the site bar's search spot
   reads "Subjects" (and the thumb bar's "find" reads "subjects"); either opens
   the same list as a typed sheet. Nothing is pinned.

   The page opens on "Ones I give away" (firstOrder = Kelly's order). Other
   filters show by highlight count (file order), except Leadership, which keeps
   Kelly's shelf order (shelfOrder) with the rest appended by count.

   To refresh: edit data/books.json, then  npm run build
   Header/footer come from scripts/chrome.mjs like every other page. */
import { readFile, writeFile } from 'node:fs/promises';
import { bar, FOOT } from './chrome.mjs';

const books = JSON.parse(await readFile('data/books.json', 'utf8'));
const GIVE = 'Ones I give away';
const TOPICS = [...new Set(books.flatMap((b) => b.tags))].filter((t) => t !== GIVE)
  .sort((a, b) => books.filter((x) => x.tags.includes(b)).length - books.filter((x) => x.tags.includes(a)).length);

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const TITLE = 'Books';
const DESC = 'The books I’ve highlighted the most, and a few of the lines I kept.';
const URL = 'https://kellyvohs.com/books';

const card = (b, rank) =>
  '      <section class="tb" data-tags="' + esc(b.tags.join('|')) + '" data-rank="' + rank + '"' +
    (b.shelfOrder != null ? ' data-shelf="' + b.shelfOrder + '"' : '') +
    (b.firstOrder != null ? ' data-first="' + b.firstOrder + '"' : '') +
    (b.firstOrder == null ? ' hidden' : '') + '>\n' +
  '        <p class="tb__t">' + esc(b.title).toUpperCase() + '<br /><span class="tb__a">' + esc(b.author) + '</span></p>\n' +
  '        <p class="tb__s">' + esc(b.summary) + '</p>\n' +
  b.highlights.slice(0, 3).map((h) => '        <p class="tb__q">&ldquo;' + esc(h) + '&rdquo;</p>\n').join('') +
  '      </section>\n';

// Opening order: the give-away books first in Kelly's order; the rest follow
// hidden, in count order. data-rank lets the script restore count order.
const opening = books.map((b, i) => ({ b, i }))
  .sort((x, y) => (x.b.firstOrder ?? 1e9) - (y.b.firstOrder ?? 1e9) || x.i - y.i);
const rows = opening.map(({ b, i }) => card(b, i)).join('');

const row = (t, on) =>
  '<a href="#" class="ix' + (on ? ' ix--on' : '') + '" data-f="' + esc(t) + '">' +
  '<span class="ix__box">[' + (on ? 'x' : '&nbsp;') + ']</span> ' + esc(t) + '</a>';
const filters =
  '<div class="lists">' + row(GIVE, true) + '</div>\n' +
  '    <div class="topics">' + row('All of them', false) + TOPICS.map((t) => row(t, false)).join('') + '</div>';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${TITLE} — Kelly Vohs</title>
<meta name="description" content="${DESC}" />
<link rel="canonical" href="${URL}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="Kelly Vohs" />
<meta property="og:title" content="${TITLE}" />
<meta property="og:description" content="${DESC}" />
<meta property="og:url" content="${URL}" />
<meta property="og:image" content="https://kellyvohs.com/assets/images/hero/hero.jpg" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${TITLE}" />
<meta name="twitter:description" content="${DESC}" />
<meta name="twitter:image" content="https://kellyvohs.com/assets/images/hero/hero.jpg" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="../styles/archive.css?v=15" />
<style>
  .books .sheet { max-width: 760px; padding: 96px 110px 160px; }
  .intro { margin-top: 18px; font-size: 15px; line-height: 1.9; color: var(--muted); }

  /* the index: typed checkboxes */
  .filters { margin: 40px 0 80px; font-size: 15px; line-height: 2.1; }
  .ix { display: block; color: var(--muted); text-decoration: none; white-space: nowrap; }
  .ix:hover { color: var(--fg); }
  .ix--on { color: var(--fg); }
  .ix--on .ix__box { color: var(--accent); }
  .ix__box { white-space: pre; }
  .topics { margin-top: 1.6em; columns: 3; column-gap: 1.5em; }
  .topics .ix { break-inside: avoid; }

  /* a book: one face, one size, one weight */
  .tb p { font-size: 15px; line-height: 2.1; margin: 0; }
  .tb[hidden] { display: none; }
  .tb__t { letter-spacing: 0.06em; text-shadow: 0.6px 0 0 currentColor; }
  .tb__a { letter-spacing: 0; text-shadow: none; color: var(--muted); display: inline-block; margin-top: 0.3em; }
  .tb__s { margin-top: 1.4em !important; }
  .tb__q { margin: 2.2em 0 0 2.5em !important; text-shadow: 0.6px 0 0 currentColor; }
  .tb__q + .tb__q { margin-top: 1.6em !important; }
  .tb + .tb::before { content: "*  *  *"; display: block; text-align: center; color: var(--accent); margin: 6em 0; font-size: 15px; letter-spacing: 0.4em; white-space: pre; }
  .tb--first::before { display: none !important; }

  /* on this page the bar's search spot reads "Subjects" and the thumb's "find" reads "subjects" */
  .books .bar__search { display: none; }
  .books .thumb__search .thumb__caret { display: none; }
  .books .bar__link .ix__box, .books .thumb__search .ix__box { color: var(--accent); margin-right: 0.4em; }
  .books .bar__link .ix__box:hover, .books .thumb__search .ix__box:hover { color: var(--fg); }

  /* the subjects sheet: one piece of paper, typed */
  .sheetx { position: fixed; inset: 0; z-index: 170; background: rgba(10, 10, 10, 0.28); opacity: 0; pointer-events: none; transition: opacity 0.2s; }
  .sheetx--open { opacity: 1; pointer-events: auto; }
  .sheetx__paper { position: absolute; background: var(--paper); border: 1px solid var(--hairline); padding: 36px 44px 40px; transform: translateY(12px); transition: transform 0.22s ease; }
  .sheetx--open .sheetx__paper { transform: none; }
  .sheetx .ix { font-size: 15px; line-height: 2.3; }
  .sheetx .gap { height: 1.2em; }
  @media (min-width: 761px) { .sheetx__paper { left: 50%; top: 120px; width: 360px; margin-left: -180px; } }

  @media (max-width: 760px) {
    .books .sheet { padding: 72px 24px 120px; }
    .sheetx__paper { left: 0; right: 0; bottom: 0; border-width: 1px 0 0; padding: 28px 24px 40px; max-height: 80vh; overflow: auto; transform: translateY(100%); }
    .filters { margin: 36px 0 72px; }
    .topics { columns: 2; column-gap: 1em; }
    .tb__q { margin-left: 1.5em !important; }
  }
</style>
</head>
<body class="books">

<div class="carriage" id="carriage"></div>

${bar(null).replace('<nav class="bar__links">', '<nav class="bar__links"><a class="bar__link" href="#" id="barSubjects">Subjects</a>')}

<div class="sheetx" id="sheetx"><div class="sheetx__paper" id="sheetpaper"></div></div>

<div class="desk">

  <article class="sheet">
    <h1 class="typedtitle">Books</h1>

    <div class="filters">
    ${filters}
    </div>

    <div class="list">
${rows}    </div>
  </article>

  ${FOOT}

</div>

<script>
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    document.getElementById('carriage').style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    document.getElementById('bar').classList.toggle('bar--scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* the index: show one list, in its order */
  var rows = document.querySelectorAll('.ix');
  rows.forEach(function (r) {
    r.addEventListener('click', function (e) {
      e.preventDefault();
      var f = r.getAttribute('data-f');
      rows.forEach(function (x) {
        var on = x === r;
        x.classList.toggle('ix--on', on);
        x.querySelector('.ix__box').innerHTML = on ? '[x]' : '[&nbsp;]';
      });
      var list = document.querySelector('.list');
      var items = Array.prototype.slice.call(list.querySelectorAll('.tb'));
      var attr = f === 'Ones I give away' ? 'data-first' : f === 'Leadership' ? 'data-shelf' : 'data-rank';
      items.forEach(function (b) {
        b.hidden = !(f === 'All of them' || b.getAttribute('data-tags').split('|').indexOf(f) > -1);
      });
      items.sort(function (a, b) {
        var ka = a.hasAttribute(attr) ? +a.getAttribute(attr) : 1e6 + (+a.getAttribute('data-rank'));
        var kb = b.hasAttribute(attr) ? +b.getAttribute(attr) : 1e6 + (+b.getAttribute('data-rank'));
        return ka - kb;
      }).forEach(function (b) { list.appendChild(b); });
      /* the first visible book has no * * * above it */
      var seen = false;
      items.forEach(function (b) { b.classList.toggle('tb--first', !b.hidden && !seen); if (!b.hidden) seen = true; });
    });
  });
  document.querySelector('.ix--on').dispatchEvent(new Event('click'));

  /* the subjects sheet: a copy of the list, opened from the bar or the thumb */
  (function () {
    var sx = document.getElementById('sheetx'), paper = document.getElementById('sheetpaper');
    var src = document.querySelectorAll('.filters .ix');
    src.forEach(function (r, i) {
      if (i === 1) { var g = document.createElement('div'); g.className = 'gap'; paper.appendChild(g); }
      var c = r.cloneNode(true);
      c.addEventListener('click', function (e) {
        e.preventDefault();
        r.dispatchEvent(new Event('click'));
        sx.classList.remove('sheetx--open');
        var first = document.querySelector('.list .tb:not([hidden])');
        if (first) window.scrollTo({ top: first.getBoundingClientRect().top + window.scrollY - 96, behavior: 'auto' });
      });
      paper.appendChild(c);
    });
    function sync() {
      var on = document.querySelector('.filters .ix--on').getAttribute('data-f');
      paper.querySelectorAll('.ix').forEach(function (x) {
        var is = x.getAttribute('data-f') === on;
        x.classList.toggle('ix--on', is);
        x.querySelector('.ix__box').innerHTML = is ? '[x]' : '[&nbsp;]';
      });
    }
    src.forEach(function (r) { r.addEventListener('click', function () { setTimeout(sync, 0); }); });
    sync();
    /* the bar and thumb show the current subject, typed; [x] clears it, the name opens the sheet */
    var barS = document.getElementById('barSubjects'), ts = document.querySelector('.thumb__search');
    if (ts) { ts.removeAttribute('data-search'); ts.innerHTML = ''; }
    function label(el, lower) {
      var on = document.querySelector('.filters .ix--on').getAttribute('data-f');
      if (on === 'All of them') { el.innerHTML = lower ? 'subjects' : 'Subjects'; return; }
      el.innerHTML = '<span class="ix__box" data-clear>[x]</span>' + (lower ? on.toLowerCase() : on);
    }
    function relabel() { label(barS, false); if (ts) label(ts, true); }
    function act(e) {
      e.preventDefault(); e.stopImmediatePropagation();
      if (e.target.hasAttribute('data-clear')) {
        document.querySelector('.filters .ix[data-f="All of them"]').dispatchEvent(new Event('click'));
        var first = document.querySelector('.list .tb:not([hidden])');
        if (first) window.scrollTo({ top: first.getBoundingClientRect().top + window.scrollY - 96, behavior: 'auto' });
      } else {
        sx.classList.add('sheetx--open');
      }
    }
    barS.addEventListener('click', act);
    if (ts) ts.addEventListener('click', act, true);
    src.forEach(function (r) { r.addEventListener('click', function () { setTimeout(relabel, 0); }); });
    relabel();
    sx.addEventListener('click', function (e) { if (e.target === sx) sx.classList.remove('sheetx--open'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') sx.classList.remove('sheetx--open'); });
  })();
</script>

<script src="../js/archive-menu.js?v=3"></script>
<script src="../js/archive-subscribe.js?v=5"></script>
</body>
</html>
`;

await writeFile('pages/books.html', html);
console.log('Generated pages/books.html (' + books.length + ' books).');
