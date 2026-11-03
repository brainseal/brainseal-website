// Prefixes a site path with the configured base, so links work both at the domain root
// (brainseal.com/) and in a sub-folder (brainseal.github.io/brainseal-website/).
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const url = (path: string) => `${base}${path}`;
