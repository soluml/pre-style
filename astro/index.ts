import type {Plugin} from 'rollup';
import type {} from 'astro';
import {promises as fs} from 'fs';
import path from 'path';
import {EventEmitter} from 'events';
import {promisify} from 'util';
/* eslint-disable import/no-extraneous-dependencies */
import glob from 'glob';
/* eslint-enable */
import {getPathToJSONFileInCache} from '../postcss/saveJSONToPreStyleCache';

type Command = 'build' | 'dev';

const promglob = promisify(glob);

function preStyleModules(command: Command, emit): Plugin {
  const fileRegex =
    command === 'build' ? /(\.prestyle.s?css)(\?.*)?$/ : /(\.prestyle.s?css)$/;

  return {
    name: 'pre-style-modules',
    async transform(css, id) {
      if (fileRegex.test(id)) {
        const filePath = getPathToJSONFileInCache(id);
        const code = JSON.parse(
          (await fs.readFile(`${filePath}.json`)).toString()
        );

        emit(css.toString());

        return {
          code,
          map: null,
        };
      }
    },
  };
}

export default function preStyleIntegration() {
  const emitter = new EventEmitter();
  const evt = 'prestyle-css';
  const emit = emitter.emit.bind(emitter, evt);
  let css = '';

  emitter.on(evt, (d) => {
    css += d;
  });

  return {
    name: 'pre-style integration',
    hooks: {
      'astro:config:setup': ({
        updateConfig,
        command,
      }: {
        updateConfig: (newConfig: Record<string, any>) => void;
        command: Command;
      }) => {
        updateConfig({
          vite: {
            plugins: [preStyleModules(command, emit)],
            build: {
              cssCodeSplit: false,
            },
          },
        });
      },
      'astro:build:done': async (opts) => {
        const {base} = path.parse(opts.dir.pathname);
        const [cssFilePath] = await promglob(`${base}/assets/*.css`);

        await fs.appendFile(cssFilePath, css);
      },
    },
  };
}
