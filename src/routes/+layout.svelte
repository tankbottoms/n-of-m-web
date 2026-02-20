<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<svelte:head>
  <title>n of m</title>
  <meta name="description" content="Shamir's Secret Sharing for Seed Phrases" />
  <link rel="stylesheet" href="/fontawesome/css/all.min.css" />
</svelte:head>

{@render children()}
