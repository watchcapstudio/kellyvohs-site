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

const card = (b) => {
  const tags = b.tags.filter((t) => t !== SHELF);
  const [lead, second] = b.highlights;
  return '      <section class="f" data-tags="' + esc(b.tags.join('|')) + '"' +
    (b.shelfOrder != null ? ' data-shelf="' + b.shelfOrder + '"' : '') + '>\n' +
    '        <div class="f__no"></div>\n' +
    '        <div class="f__body">\n' +
    (lead ? '          <p class="f__q">' + esc(lead) + '</p>\n' : '') +
    '          <div class="f__meta' + (lead ? '' : ' f__meta--bare') + '">' +
      '<span class="f__title">' + esc(b.title) + '</span>' +
      '<span class="f__by">' + esc(b.author) + '</span>' +
      (tags.length ? '<span class="f__tags">' + tags.map(esc).join(' · ') + '</span>' : '') +
    '</div>\n' +
    '          <p class="f__sum">' + esc(b.summary) + '</p>\n' +
    (second ? '          <p class="f__q2">' + esc(second) + '</p>\n' : '') +
    '        </div>\n' +
    '      </section>\n';
};

const rows = books.map((b, i) => card(b).replace('<section class="f" ', '<section class="f" data-rank="' + i + '" ')).join('');

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

  .books .sheet { max-width: 900px; padding-left: 120px; padding-right: 120px; }

  .f { display: grid; grid-template-columns: 56px 1fr; gap: 0 24px; padding: 56px 0; border-bottom: 1px solid var(--hairline); }
  .f:last-child { border-bottom: 0; }
  .f__no { font-size: 12px; color: var(--accent); letter-spacing: 0.1em; padding-top: 10px; }
  .f__no::before { content: counter(book, decimal-leading-zero); }
  .list { counter-reset: book; }
  .f:not([hidden]) { counter-increment: book; }
  .f__q { font-size: clamp(20px, 2.6vw, 25px); line-height: 1.55; margin: 0; text-shadow: 0.6px 0 0 currentColor; }
  .f__q::before { content: "“"; color: var(--accent); margin-left: -0.6em; margin-right: 0.1em; }
  .f__meta { display: flex; flex-wrap: wrap; gap: 0 14px; align-items: baseline; margin-top: 22px; padding-top: 14px; border-top: 1px solid var(--fg); }
  .f__meta--bare { margin-top: 0; padding-top: 0; border-top: 0; }
  .f__meta--bare .f__title { font-size: 19px; font-weight: 400; text-shadow: 0.6px 0 0 currentColor; }
  .f__title { font-size: 15px; font-weight: 700; }
  .f__by { color: var(--muted); font-size: 13px; }
  .f__tags { margin-left: auto; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent); }
  .f__sum { margin: 14px 0 0; font-size: 14px; line-height: 1.85; color: rgba(10, 10, 10, 0.68); }
  .f__q2 { margin: 16px 0 0; padding-left: 18px; border-left: 2px solid var(--accent); font-size: 14px; line-height: 1.8; }

  @media (max-width: 760px) {
    .books .sheet { padding-left: 22px; padding-right: 22px; }
    .f { grid-template-columns: 1fr; gap: 6px; padding: 44px 0; }
    .f__q::before { margin-left: 0; }
    .f__tags { margin-left: 0; width: 100%; margin-top: 6px; }
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
      var items = Array.prototype.slice.call(list.querySelectorAll('.f'));
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
