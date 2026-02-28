import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const useStatic = !!process.env.VERCEL;

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: useStatic
      ? (await import('@sveltejs/adapter-static')).default({
          pages: 'build',
          assets: 'build',
          fallback: 'index.html',
          precompress: false,
          strict: true,
        })
      : (await import('@sveltejs/adapter-cloudflare')).default(),
  },
};

export default config;
