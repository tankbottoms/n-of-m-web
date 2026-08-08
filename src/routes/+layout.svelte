<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import { CANONICAL_ORIGIN } from '$lib/canonical';

  // Hard-coded origin, not page.url.origin: the same build answers on the custom domain and
  // on the workers.dev URL, and a request-derived canonical would have each host declare
  // itself canonical — which resolves nothing.
  const canonical = $derived(CANONICAL_ORIGIN + page.url.pathname);

  let { children } = $props();
</script>

<svelte:head>
  <link rel="canonical" href={canonical} />
  <title>n of m</title>
  <meta name="description" content="Shamir's Secret Sharing for Seed Phrases" />
  <link rel="stylesheet" href="/fontawesome/css/all.min.css" />
</svelte:head>

{@render children()}
