import { reactRouter } from '@react-router/dev/vite';
import {
  defineConfig,
  defaultClientConditions,
  defaultExternalConditions,
  defaultServerConditions,
} from 'vite';

// `pre-style-source` resolves Pre-Style's packages to their TypeScript
// source, so changes to them show up here without a build. Setting
// conditions replaces Vite's defaults, so they're added to them.
const SOURCE = 'pre-style-source';

// Vite bundles this config, including linked workspace packages, without
// that condition. Importing the plugin through a variable leaves it to Node,
// which the npm scripts run with `--conditions=pre-style-source`.
const plugin = 'vite-plugin-pre-style';
const { default: preStyle }: typeof import('vite-plugin-pre-style') = await import(plugin);

export default defineConfig(({ command }) => ({
  plugins: [
    preStyle({
      include: ['app/**/*.{ts,tsx}'],
      prependFiles: {
        css: ['app/styles/tokens.css'],
        scss: ['app/styles/_tokens.scss'],
      },
      lightningcss: { minify: true },
      // Source maps in dev only.
      sourceMap: command === 'serve',
    }),
    reactRouter(),
  ],
  resolve: { conditions: [SOURCE, ...defaultClientConditions] },
  ssr: {
    resolve: {
      conditions: [SOURCE, ...defaultServerConditions],
      externalConditions: [SOURCE, ...defaultExternalConditions],
    },
  },
}));
