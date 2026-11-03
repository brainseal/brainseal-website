import type { ImageMetadata } from 'astro';
import data from '../data/games.json';
import { fetchReviews, MIN_BADGE_SCORE } from './steam';

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
    const extra = game as { publisher?: string; launchTime?: string; showcase?: boolean };
    // launchTime is the UTC unlock time on release day, when known; it drives the countdown.
    const releaseDate = new Date(`${game.released}T${extra.launchTime ?? '00:00'}:00Z`);
    const review = reviews[game.steamAppId];
    return {
      ...game,
      stores: game.stores as Partial<Record<Platform, string>>,
      publisher: extra.publisher,
      showcase: extra.showcase ?? false,
      hasLaunchTime: !!extra.launchTime,
      releaseDate,
      upcoming: releaseDate > now,
      year: releaseDate.getUTCFullYear(),
      // Only reviews worth bragging about get a badge.
      review: review && review.score >= MIN_BADGE_SCORE ? review : undefined,
      hero: art(game.slug, 'hero.jpg')!,
      cover: art(game.slug, 'cover.jpg')!,
      logo: art(game.slug, 'logo.png'),
      shots: [1, 2, 3, 4].map((n) => art(game.slug, `shot-${n}.jpg`)).filter((s): s is ImageMetadata => !!s),
    };
  })
  .sort((a, b) => b.releaseDate.getTime() - a.releaseDate.getTime());

export type Game = (typeof games)[number];

export const featured = games[0];

export const platformsOf = (game: Game) =>
  (Object.keys(PLATFORMS) as Platform[]).filter((p) => game.stores[p]);

export const formatDate = (date: Date) =>
  date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export const totalReviews = Object.values(reviews).reduce((sum, r) => sum + r.count, 0);

export const studio = {
  name: 'Brain Seal Entertainment',
  legalName: 'Brain Seal Ltd',
  location: 'London, United Kingdom',
  founded: Math.min(...games.map((g) => g.year)),
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
