import type { ImageMetadata } from 'astro';
import data from '../data/games.json';
import { fetchReviews } from './steam';

export const PLATFORMS = {
  steam: 'Steam',
  xbox: 'Xbox',
  playstation: 'PlayStation',
  switch: 'Nintendo Switch',
} as const;
export type Platform = keyof typeof PLATFORMS;

export function formatDate(date: Date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/games/*/*.{jpg,png}', { eager: true });
const art = (slug: string, name: string) => files[`/src/assets/games/${slug}/${name}`]?.default;

const reviews = await fetchReviews(data.map((g) => g.steamAppId).filter((id): id is number => !!id));

// Release status is decided at build time; the deploy workflow rebuilds daily so launches flip on their own.
const now = new Date();

// A game with "hidden": true in games.json is left off the site entirely (no card, page or press
// kit entry); its data and art stay in the project, ready to switch back on.
export const games = data
  .filter((game) => !(game as { hidden?: boolean }).hidden)
  .map((game) => {
    const extra = game as {
      publisher?: string;
      launchTime?: string;
      showcase?: boolean;
      heroHasLogo?: boolean;
      heroArtBottom?: boolean;
      logline?: string;
      formerPlatforms?: string[];
    };
    // "released" is a full date, or just "YYYY-MM" when only the month is known (older games).
    // launchTime is the UTC unlock time on release day, when known; it drives the countdown.
    const monthOnly = /^\d{4}-\d{2}$/.test(game.released);
    const releaseDate = new Date(`${game.released}${monthOnly ? '-01' : ''}T${extra.launchTime ?? '00:00'}:00Z`);
    return {
      ...game,
      stores: game.stores as Partial<Record<Platform, string>>,
      publisher: extra.publisher,
      showcase: extra.showcase ?? false,
      // One-line pitch shown in gold above the screenshots when the game is featured.
      logline: extra.logline,
      // The key art already has the game's logo painted in, so the hero keeps it clear of text.
      heroHasLogo: extra.heroHasLogo ?? false,
      // The painted logo sits low in the art and the top is empty, so wide screens crop from the top.
      heroArtBottom: extra.heroArtBottom ?? false,
      hasLaunchTime: !!extra.launchTime,
      releaseDate,
      releasedLabel: monthOnly
        ? releaseDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
        : formatDate(releaseDate),
      // False for games that are no longer sold anywhere (no store links at all);
      // formerPlatforms then says where they were released, e.g. "Xbox Live Indie Games".
      inStores: Object.values(game.stores).some(Boolean),
      formerPlatforms: extra.formerPlatforms,
      upcoming: releaseDate > now,
      year: releaseDate.getUTCFullYear(),
      hero: art(game.slug, 'hero.jpg')!,
      cover: art(game.slug, 'cover.jpg')!,
      logo: art(game.slug, 'logo.png'),
      shots: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => art(game.slug, `shot-${n}.jpg`)).filter((s): s is ImageMetadata => !!s),
    };
  })
  .sort((a, b) => b.releaseDate.getTime() - a.releaseDate.getTime());

export type Game = (typeof games)[number];

export const featured = games[0];

// Every platform the game is on or announced for. A store set to "" in games.json means
// announced but no store page yet: it is listed, but gets no link or store button.
export const platformsOf = (game: Game) =>
  (Object.keys(PLATFORMS) as Platform[]).filter((p) => p in game.stores);

export const totalReviews = Object.values(reviews).reduce((sum, r) => sum + r.count, 0);

export const studio = {
  name: 'Brain Seal Entertainment',
  legalName: 'Brain Seal Ltd',
  location: 'London, United Kingdom',
  founded: 2007,
  // The oldest game (games are sorted newest first).
  firstGame: games[games.length - 1],
  platforms: new Set(games.flatMap(platformsOf)).size,
  email: 'info@brainseal.com',
  supportEmail: 'support@brainseal.com',
  discord: 'https://discord.com/invite/H5tye5aMAM',
  // Footer links under the Discord and email buttons (Discord has its own button, so it isn't listed).
  socials: [
    { name: 'YouTube', icon: 'youtube', url: 'https://www.youtube.com/brainseal' },
    { name: 'X', icon: 'x', url: 'https://x.com/brainseal' },
    { name: 'Facebook', icon: 'facebook', url: 'https://www.facebook.com/brainseal/' },
    { name: 'Steam', icon: 'steam', url: 'https://store.steampowered.com/search/?developer=Brain%20Seal%20Ltd' },
  ] as const,
};
