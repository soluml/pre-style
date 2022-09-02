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
import {
  DEFAULT_MATCHER,
  getRegexWithOptionalQueryString,
  getRegex,
} from './postcss';

type Command = 'build' | 'dev';

interface Options {
  preStyleFileMatcher: string;
}

const promglob = promisify(glob);

function preStyleModules(
  command: Command,
  emit: (str: string) => void,
  options?: Options
): Plugin {
  const matcher = options?.preStyleFileMatcher ?? DEFAULT_MATCHER;

  const fileRegex =
    command === 'build'
      ? getRegexWithOptionalQueryString(matcher)
      : getRegex(matcher);

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

export default function preStyleIntegration(options?: Options) {
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
            plugins: [preStyleModules(command, emit, options)],
            build: {
              cssCodeSplit: false,
            },
          },
        });
      },
      'astro:build:done': async (opts: {dir: URL}) => {
        const {base} = path.parse(opts.dir.pathname);
        const [cssFilePath] = await promglob(`${base}/assets/*.css`);

        await fs.appendFile(cssFilePath, css);
      },
    },
  };
}
