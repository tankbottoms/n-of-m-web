// The one public origin this site claims as canonical.
//
// The Worker (`n-of-m`) is bound to n-of-m.atsignhandle.xyz, but `workers_dev = true` in
// wrangler.toml also publishes it at n-of-m.<subdomain>.workers.dev, and svelte.config.js
// switches to adapter-static under Vercel — so the same HTML is reachable at more than one
// hostname. Without a canonical tag those are a duplicate set and Google picks a winner
// itself, reporting the rest as "Crawled – currently not indexed".
//
// Deriving this from the inbound request would reproduce the problem: each hostname would
// declare itself canonical and none would win. It is hard-coded for that reason.
//
// static/robots.txt and static/sitemap.xml repeat this origin as literal text because they
// are plain static files. If this constant ever changes, change those two as well.
export const CANONICAL_ORIGIN = 'https://n-of-m.atsignhandle.xyz';
