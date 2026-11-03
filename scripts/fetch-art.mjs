// Downloads each game's art from its Steam store page into src/assets/games/<slug>/.
// Run after adding a game to src/data/games.json:  npm run fetch-art
// Existing files are kept; pass --force to download everything again.
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';

const games = JSON.parse(await readFile(new URL('../src/data/games.json', import.meta.url), 'utf8'));
const force = process.argv.includes('--force');
const SCREENSHOTS = 4;
const cdn = (id, file) => `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${id}/${file}`;

const exists = (path) => access(path).then(() => true, () => false);

async function download(urls, dest) {
  if (!force && (await exists(dest))) return 'kept';
  for (const url of urls.filter(Boolean)) {
    const res = await fetch(url);
    if (res.ok) {
      await writeFile(dest, Buffer.from(await res.arrayBuffer()));
      return 'ok';
    }
  }
  return 'missing';
}

for (const game of games) {
  const dir = new URL(`../src/assets/games/${game.slug}/`, import.meta.url);
  await mkdir(dir, { recursive: true });

  const api = await fetch(`https://store.steampowered.com/api/appdetails?appids=${game.steamAppId}&l=english`);
  const data = (await api.json())[game.steamAppId]?.data;
  if (!data) {
    console.warn(`${game.slug}: no Steam data, skipped`);
    continue;
  }
  const shots = (data.screenshots ?? []).map((s) => s.path_full);
  const id = game.steamAppId;

  // Newer store pages keep their art under hashed paths that only this API reports.
  const query = { ids: [{ appid: id }], context: { language: 'english', country_code: 'US' }, data_request: { include_assets: true } };
  const browse = await fetch(`https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?input_json=${encodeURIComponent(JSON.stringify(query))}`);
  const assets = (await browse.json()).response?.store_items?.[0]?.assets ?? {};
  const asset = (key) => assets[key] && cdn(id, assets[key]);

  const results = {
    hero: await download([asset('library_hero'), cdn(id, 'library_hero.jpg'), shots[0]], new URL('hero.jpg', dir)),
    logo: await download([cdn(id, 'logo.png')], new URL('logo.png', dir)),
    cover: await download([asset('library_capsule_2x'), cdn(id, 'library_600x900_2x.jpg'), cdn(id, 'library_600x900.jpg'), data.header_image], new URL('cover.jpg', dir)),
  };
  for (let i = 0; i < Math.min(SCREENSHOTS, shots.length); i++) {
    results[`shot-${i + 1}`] = await download([shots[i]], new URL(`shot-${i + 1}.jpg`, dir));
  }
  console.log(game.slug.padEnd(22), Object.entries(results).map(([k, v]) => `${k}:${v}`).join('  '));
}
