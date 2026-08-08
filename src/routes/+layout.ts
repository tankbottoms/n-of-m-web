// `ssr = false` used to be set here alongside prerender. The combination is what kept this
// site out of the index: with SSR off, prerendering emits only a client-boot shell — the
// live n-of-m.atsignhandle.xyz/ HTML had no <title>, no description, no canonical and no
// body text at all, so a crawler had nothing to index but a modulepreload list.
//
// Enabling SSR renders every page at build time instead (docs 41 KB, ux-spec 66 KB of real
// HTML with per-page titles). Nothing here needs the browser during render: the only
// module-scope browser API is the localStorage read in +page.svelte, already guarded by
// `browser` from $app/environment.
//
// This is still a fully static, zero-network app — SSR here means prerendering to HTML at
// build time, not a server at runtime.
export const prerender = true;
