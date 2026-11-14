/* generate-books.mjs — writes pages/books.html (served at /books) from
   data/books.json: the books I've highlighted most in Readwise plus the Leadership
   Shelf picks, each with tags,
   a short summary and two of my highlights. Order = data/books.json order.

   To refresh: update data/books.json, then  npm run build
   Header/footer come from scripts/chrome.mjs like every other page. */
import { readFile, writeFile } from 'node:fs/promises';
import { bar, FOOT } from './chrome.mjs';

// Kept in file order: most-highlighted first.
const books = JSON.parse(await readFile('data/books.json', 'utf8'));
const SHELF = 'Leadership Shelf';
// Chips: the Leadership Shelf first, then topics by how many books carry them.
const TAGS = [SHELF, ...[...new Set(books.flatMap((b) => b.tags))].filter((t) => t !== SHELF)
  .sort((a, b) => books.filter((x) => x.tags.includes(b)).length - books.filter((x) => x.tags.includes(a)).length)];

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const TITLE = 'Books';
const DESC = 'The books I’ve highlighted the most, and a few of the lines I kept.';
const URL = 'https://kellyvohs.com/books';

const card = (b) =>
  '      <section class="b" data-tags="' + esc(b.tags.join('|')) + '"' +
    (b.shelfOrder != null ? ' data-shelf="' + b.shelfOrder + '"' : '') + '>\n' +
  '        <h3 class="b__title">' + esc(b.title) + '</h3>\n' +
  '        <div class="b__author">' + esc(b.author) + '</div>\n' +
  '        <div class="b__tags">' + b.tags.filter((t) => t !== SHELF).map((t) => '<span>' + esc(t) + '</span>').join('') + '</div>\n' +
  '        <p class="b__sum">' + esc(b.summary) + '</p>\n' +
  b.highlights.slice(0, 2).map((h) => '        <blockquote class="q">' + esc(h) + '</blockquote>\n').join('') +
  '      </section>\n';

const rows = books.map((b, i) => card(b).replace('<section class="b" ', '<section class="b" data-rank="' + i + '" ')).join('');

const chips = '<div class="chips"><button class="chip chip--on" type="button" data-f="all">All</button>' +
  TAGS.map((t) => '<button class="chip' + (t === SHELF ? ' chip--shelf' : '') + '" type="button" data-f="' + esc(t) + '">' + esc(t) + '</button>').join('') +
  '</div>';

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
<link rel="stylesheet" href="../styles/archive.css?v=14" />
<style>
  .books .sheet { padding-top: 84px; padding-bottom: 84px; }
  .intro { color: var(--muted); margin-top: 18px; font-size: 15px; line-height: 1.8; }

  .chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 36px 0 8px; }
  .chip {
    font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
    padding: 6px 12px; border: 1px solid var(--hairline); border-radius: 999px;
    background: none; color: var(--fg); cursor: pointer;
  }
  .chip--shelf { color: var(--accent); border-color: var(--accent); font-weight: 700; }
  .chip--on { background: var(--fg); color: var(--paper); border-color: var(--fg); }
  .chip--shelf.chip--on { background: var(--accent); border-color: var(--accent); color: var(--paper); }

  .b { padding: 44px 0; border-bottom: 1px solid var(--hairline); }
  .b:last-child { border-bottom: 0; }
  .b__title { font-size: 19px; line-height: 1.35; font-weight: 400; text-shadow: 0.6px 0 0 currentColor; margin: 0; }
  .b__author { color: var(--muted); font-size: 14px; margin-top: 4px; }
  .b__tags:empty { display: none; }
  .b__tags { margin-top: 10px; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent); }
  .b__tags span + span::before { content: "·"; margin: 0 0.6em; color: var(--muted); }
  .b__sum { margin-top: 18px; font-size: 15px; line-height: 1.85; color: rgba(10, 10, 10, 0.72); }
  .q { margin: 18px 0 0; padding: 2px 0 2px 18px; border-left: 2px solid var(--accent); font-size: 15px; line-height: 1.8; }

  @media (max-width: 760px) {
    .b { padding: 36px 0; }
  }
</style>
</head>
<body class="books">

<div class="carriage" id="carriage"></div>

${bar(null)}

<div class="desk">

  <article class="sheet">
    <h1 class="typedtitle">Books</h1>
    <p class="intro">The books I've highlighted the most, and a few of the lines I kept.</p>
    ${chips}
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

  /* tag filter */
  var chips = document.querySelectorAll('.chip');
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (x) { x.classList.toggle('chip--on', x === c); });
      var f = c.getAttribute('data-f');
      var list = document.querySelector('.list');
      var items = Array.prototype.slice.call(list.querySelectorAll('.b'));
      items.forEach(function (b) {
        b.hidden = !(f === 'all' || b.getAttribute('data-tags').split('|').indexOf(f) > -1);
      });
      /* the Shelf reads in Kelly's order; everything else by highlight count */
      var key = f === 'Leadership Shelf' ? 'shelf' : 'rank';
      items.sort(function (a, b) {
        var ka = key === 'shelf' ? +a.getAttribute('data-shelf') : +a.getAttribute('data-rank');
        var kb = key === 'shelf' ? +b.getAttribute('data-shelf') : +b.getAttribute('data-rank');
        return ka - kb;
      }).forEach(function (b) { list.appendChild(b); });
    });
  });
</script>

<script src="../js/archive-menu.js?v=3"></script>
<script src="../js/archive-subscribe.js?v=5"></script>
</body>
</html>
`;

await writeFile('pages/books.html', html);
console.log('Generated pages/books.html (' + books.length + ' books).');
