import { defineConfig } from 'astro/config';
import preStyle from '@pre.style/vite';

// Unlike the demos, the site uses pre.style's published packages from npm,
// so it's built the way users build their own sites. It isn't an npm
// workspace, so the packages aren't linked to the repo's source.
export default defineConfig({
  site: 'https://pre.style',
  output: 'static',
  vite: {
    plugins: [
      preStyle({
        include: ['src/**/*.{ts,astro}'],
        lightningcss: { minify: true },
      }),
    ],
  },
});
