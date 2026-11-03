// Pulls each game's "About this game" text from its Steam store page into src/data/about.json.
// Keeps headings, paragraphs and bullet lists as plain text; Steam's images and video clips are left out.
// The JSON is committed, so builds never depend on Steam. Edit it freely; re-running overwrites it.
//
//   npm run fetch-about

import { readFile, writeFile } from 'node:fs/promises';

const games = JSON.parse(await readFile(new URL('../src/data/games.json', import.meta.url), 'utf8'));

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s) =>
  s.replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (m, e) =>
    e[0] === '#' ? String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : (ENTITIES[e] ?? m),
  );

const HEADING = '\u0001';
const BULLET = /^\s*[•·\-*]\s+/;

// Steam pages come in two styles: newer ones use <h2>/<p>/<ul>, older ones loose text with <br>
// and "•" bullets. Both are flattened to one block per line, then grouped.
function blocks(html) {
  const lines = decode(
    html
      .replace(/\s*\n\s*/g, ' ')
      .replace(/<video\b[\s\S]*?<\/video>|<img\b[^>]*>/gi, '')
      .replace(/<h[1-6]\b[^>]*>/gi, `\n${HEADING}`)
      .replace(/<li\b[^>]*>/gi, '\n• ')
      .replace(/<\/(h[1-6]|p|li|ul|ol)>|<(p|ul|ol)\b[^>]*>|<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l && l !== HEADING)
    // Some pages put each "•" on its own line, ahead of its text
    .reduce((acc, l) => {
      if (acc.at(-1) === '•') acc[acc.length - 1] = `• ${l}`;
      else acc.push(l);
      return acc;
    }, [])
    // Skip stray punctuation left between images
    .filter((l) => /[\p{L}\p{N}]/u.test(l));

  const out = [];
  for (const line of lines) {
    if (line.startsWith(HEADING)) out.push({ heading: line.slice(1).trim() });
    else if (BULLET.test(line)) {
      const item = line.replace(BULLET, '');
      const last = out.at(-1);
      if (last?.list) last.list.push(item);
      else out.push({ list: [item] });
    } else out.push({ text: line });
  }
  // Drop a heading left with nothing under it (Steam often follows headings with only an image).
  return out.filter((b, i) => !(b.heading && (!out[i + 1] || out[i + 1].heading)));
}

const about = {};
for (const game of games) {
  const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${game.steamAppId}&l=english`);
  const html = (await res.json())[game.steamAppId]?.data?.about_the_game ?? '';
  about[game.slug] = blocks(html);
  const count = (k) => about[game.slug].filter((b) => b[k]).length;
  console.log(`${game.slug.padEnd(22)} headings:${count('heading')} paragraphs:${count('text')} lists:${count('list')}`);
}

await writeFile(new URL('../src/data/about.json', import.meta.url), JSON.stringify(about, null, 2) + '\n');
