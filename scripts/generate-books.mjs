/* generate-books.mjs — writes pages/books.html (served at /books) from
   data/books.json: the books I've highlighted most in Readwise, each with a
   short summary and a few of my highlights.

   To refresh: update data/books.json, then  npm run build
   Header/footer come from scripts/chrome.mjs like every other page. */
import { readFile, writeFile } from 'node:fs/promises';
import { bar, FOOT } from './chrome.mjs';

const books = JSON.parse(await readFile('data/books.json', 'utf8'))
  .sort((a, b) => a.rank - b.rank);

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const TITLE = 'Books';
const DESC = 'The books I’ve highlighted the most, with a short summary and a few of the lines I kept from each.';
const URL = 'https://kellyvohs.com/books';

const rows = books.map((b, i) =>
  '      <details class="book">\n' +
  '        <summary>' +
    '<span class="book__no">' + String(i + 1).padStart(2, '0') + '</span>' +
    '<span class="book__head"><span class="book__title">' + esc(b.title) + '</span>' +
    '<span class="book__author">' + esc(b.author) + '</span></span>' +
  '</summary>\n' +
  '        <div class="book__body">\n' +
  '          <p class="book__summary">' + esc(b.summary) + '</p>\n' +
  b.highlights.map((h) => '          <blockquote>' + esc(h) + '</blockquote>\n').join('') +
  '        </div>\n' +
  '      </details>\n'
).join('');

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
  .books .typedbody { margin-top: 40px; }

  .book { border-top: 1px solid var(--hairline); }
  .book:last-of-type { border-bottom: 1px solid var(--hairline); }
  .book summary {
    display: flex; gap: 18px; align-items: baseline;
    padding: 16px 0; cursor: pointer; list-style: none;
  }
  .book summary::-webkit-details-marker { display: none; }
  .book__no { color: var(--muted); font-size: 12px; flex: none; width: 2ch; }
  .book__head { display: flex; flex-direction: column; min-width: 0; }
  .book__title { color: var(--fg); transition: color 0.2s ease; }
  .book summary:hover .book__title, .book[open] .book__title { color: var(--accent); }
  .book__author { color: var(--muted); font-size: 13px; }
  .book__body { padding: 0 0 20px calc(2ch + 18px); }
  .book__summary { margin-bottom: 1.2em !important; }
  .books .typedbody .book blockquote { margin: 0 0 1.2em; font-size: 15px; line-height: 1.8; }

  @media (max-width: 760px) {
    .book__body { padding-left: 0; }
  }
</style>
</head>
<body class="books">

<div class="carriage" id="carriage"></div>

${bar(null)}

<div class="desk">

  <article class="sheet">
    <h1 class="typedtitle">Books</h1>

    <div class="typedbody">

      <p>People ask me for book recommendations a lot. These are the ${books.length} books I've highlighted the most, in order. Tap one for a short summary and a few of the lines I kept.</p>

${rows}
    </div>
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
</script>

<script src="../js/archive-menu.js?v=3"></script>
<script src="../js/archive-subscribe.js?v=5"></script>
</body>
</html>
`;

await writeFile('pages/books.html', html);
console.log('Generated pages/books.html (' + books.length + ' books).');
