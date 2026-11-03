# brainseal.com

The Brain Seal studio website: a static site built with [Astro](https://astro.build) and hosted free on GitHub Pages. The domain, DNS and email stay at GoDaddy.

## Everyday tasks

```bash
npm install          # once
npm run dev          # local preview at http://localhost:4321
npm run build        # production build into dist/
```

### Add or update a game

1. Add an entry to `src/data/games.json`. The newest game by `released` date becomes the homepage hero automatically.
   - `steamAppId`: the number in the game's Steam URL
   - `youtube`: the trailer's video ID (the part after `watch?v=`)
   - `stores`: any of `steam`, `xbox`, `playstation`, `switch`; leave a platform out to hide its button
   - `accent`: a highlight colour for that game's page
   - `publisher`: only needed when the publisher is not Brain Seal Entertainment
   - `description`: two short paragraphs about the game, shown on its page above the screenshots (and on the homepage while it is featured)
   - `logline`: a one-line pitch shown in gold above the trailer on the game page (and above the screenshots on the homepage while the game is featured)
   - `heroHasLogo`: `true` when the key art (`hero.jpg`) already has the logo painted in; the hero then keeps the art clear of text
   - `launchTime`: the UTC time the game unlocks on release day (e.g. `"18:00"`). When set, the homepage shows a live countdown.
   - `showcase`: `true` gives the game a full-screen band on the homepage under "Battles already won"
2. Run `npm run fetch-art` to download the key art, logo, cover and up to 8 screenshots from Steam into `src/assets/games/<slug>/`. Replace any file there with your own art if you prefer; keep the same file name.
3. Commit and push. The site rebuilds and goes live in about a minute.

Games with a future `released` date show "Coming soon" and "Wishlist on Steam". The site rebuilds every night, so on launch day they switch to "Out now" by themselves.

Steam review badges ("Very Positive" and so on) are fetched from Steam on every build. Only Mostly Positive or better are shown.

## Pages

| Path | Source |
| --- | --- |
| `/` | `src/pages/index.astro` |
| `/games/<slug>/` | `src/pages/games/[slug].astro` (one page per game) |
| `/about/` | `src/pages/about.astro` |
| `/press/` | `src/pages/press.astro` (fact sheet and asset downloads for press) |
| `/privacy-policy/` | `src/pages/privacy-policy.astro`. Store listings link here, so keep this path. |

## Going live (one-time setup)

1. **Create the repository.** Push this folder to a new GitHub repository on the `main` branch.
2. **Turn on Pages.** In the repository, go to Settings → Pages, set **Source** to **GitHub Actions**. The workflow in `.github/workflows/deploy.yml` builds and deploys every push.
3. **Check the preview.** Open the `https://<user>.github.io/<repo>/` address it gives you. Some links will look broken there because the site expects to be at the domain root. That's fine.
4. **Verify the domain with GitHub** (protects against takeover). Go to your GitHub profile → Settings → Pages → Add a domain → `brainseal.com`. Add the TXT record it shows in GoDaddy DNS.
5. **Point the domain in GoDaddy DNS** (GoDaddy → My Products → brainseal.com → DNS). Lower the TTL a day before if you can. Then:
   - **Delete** the existing `A @ 160.153.0.100` record.
   - **Add** four `A` records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
   - **Set** `www` to a `CNAME` pointing at `<user>.github.io`.
   - **Leave all email records alone:** MX, the SPF TXT, autodiscover, and anything Microsoft or Google related.
6. **Connect the domain.** In repository Settings → Pages, enter `brainseal.com` as the custom domain. Once the check passes, tick **Enforce HTTPS**. The certificate is free and renews automatically.
7. **Retire the old site.** Test the live site and send yourself an email. Then cancel GoDaddy Managed WordPress, ideally just before its renewal date.
