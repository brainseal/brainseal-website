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

const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/games/*/*.{jpg,png}', { eager: true });
const art = (slug: string, name: string) => files[`/src/assets/games/${slug}/${name}`]?.default;

const reviews = await fetchReviews(data.map((g) => g.steamAppId));

// Release status is decided at build time; the deploy workflow rebuilds daily so launches flip on their own.
const now = new Date();

export const games = data
  .map((game) => {
    const extra = game as {
      publisher?: string;
      launchTime?: string;
      showcase?: boolean;
      heroHasLogo?: boolean;
      heroTextBelow?: boolean;
      logline?: string;
    };
    // launchTime is the UTC unlock time on release day, when known; it drives the countdown.
    const releaseDate = new Date(`${game.released}T${extra.launchTime ?? '00:00'}:00Z`);
    return {
      ...game,
      stores: game.stores as Partial<Record<Platform, string>>,
      publisher: extra.publisher,
      showcase: extra.showcase ?? false,
      // One-line pitch shown in gold above the screenshots when the game is featured.
      logline: extra.logline,
      // The key art already has the game's logo painted in, so the hero keeps it clear of text.
      heroHasLogo: extra.heroHasLogo ?? false,
      // The painted logo fills the middle of the art, so the game page shows the text below the art.
      heroTextBelow: extra.heroTextBelow ?? false,
      hasLaunchTime: !!extra.launchTime,
      releaseDate,
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

export const formatDate = (date: Date) =>
  date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export const totalReviews = Object.values(reviews).reduce((sum, r) => sum + r.count, 0);

export const studio = {
  name: 'Brain Seal Entertainment',
  legalName: 'Brain Seal Ltd',
  location: 'London, United Kingdom',
  founded: 2007,
  firstRelease: Math.min(...games.map((g) => g.year)),
  platforms: new Set(games.flatMap(platformsOf)).size,
  email: 'info@brainseal.com',
  supportEmail: 'support@brainseal.com',
  discord: 'https://discord.com/invite/H5tye5aMAM',
  socials: [
    { name: 'Discord', url: 'https://discord.com/invite/H5tye5aMAM' },
    { name: 'YouTube', url: 'https://www.youtube.com/brainseal' },
    { name: 'X', url: 'https://x.com/brainseal' },
    { name: 'Facebook', url: 'https://www.facebook.com/brainseal/' },
    { name: 'Steam', url: 'https://store.steampowered.com/search/?developer=Brain%20Seal%20Ltd' },
  ],
};
