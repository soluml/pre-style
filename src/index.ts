import type {Config, CacheGetter, CacheWriter, ClassifyResponse} from 'global';
import type {CssNode} from 'css-tree';
import findCacheDir from 'find-cache-dir';
import SweatMap from 'sweatmap';
import cache from './cache';
import Adapt from './adapt';
import Normalize from './normalize';
import Atomize from './atomize';
import Classify from './classify';

export const defaultPlaceholder = '✝️ⓈⓞⓛⓘⒹⓔⓞⒼⓛⓞⓡⓘⓐ✝️';

const styleCacheFile = '/style.ndjson';
const prependedFilesCacheFile = '/prependedFiles.ndjson';

class PreStyle {
  config: Config;

  placeholder: string;

  placeholderRegex: RegExp;

  timestamp: number;

  styleCache: Promise<[CacheGetter, CacheWriter]>;

  prependedFilesCache: Promise<[CacheGetter, CacheWriter]>;

  sweatmap: any;

  // @ts-ignore
  adapt: (block: string) => Promise<string>;

  // @ts-ignore
  atomize: (normalizedCss: string) => CssNode;

  // @ts-ignore
  classify: (atomizedAst: CssNode) => ClassifyResponse;

  static cacheDirName = findCacheDir({
    name: 'pre-style',
    create: true,
    thunk: true,
  }) as (k: string) => string;

  constructor(config: Config) {
    this.config = config;
    this.timestamp = Date.now();
    this.styleCache = cache(
      PreStyle.cacheDirName(styleCacheFile),
      this.config.cache as number,
      this.timestamp
    );
    this.prependedFilesCache = cache(
      PreStyle.cacheDirName(prependedFilesCacheFile),
      this.config.cache as number,
      this.timestamp
    );
    this.placeholder = config.placeholder || defaultPlaceholder;
    this.placeholderRegex = new RegExp(this.placeholder, 'g');
  }

  async process(block: string, skipCache?: boolean) {
    if (~block.indexOf(this.placeholder)) {
      throw new Error(
        `The placeholder (${this.placeholder}) was used in the raw css. Please set the placeholder value in the config to a string you'd NEVER use in production!`
      );
    }

    if (skipCache) {
      this.sweatmap = new SweatMap({
        cssSafe: true,
        existing_strings: {
          ...this.config.existingStrings,
        },
      });
    } else {
      var [getter, writer] = await this.styleCache;
      const serializedClassifyResponse = getter(block);
      var classifyResponse = serializedClassifyResponse
        ? (JSON.parse(serializedClassifyResponse) as ClassifyResponse)
        : undefined;

      this.sweatmap = new SweatMap({
        cssSafe: true,
        existing_strings: {
          ...this.config.existingStrings,
          ...classifyResponse?.classNames,
        },
      });
    }

    if (!classifyResponse) {
      const processedCss = await this.adapt(block);

      const normalizedCss = Normalize(processedCss);

      const atomizedAst = this.atomize(normalizedCss);

      classifyResponse = this.classify(atomizedAst);

      writer?.(block, JSON.stringify(classifyResponse));
    }

    return classifyResponse;
  }
}

PreStyle.prototype.adapt = Adapt;
PreStyle.prototype.atomize = Atomize;
PreStyle.prototype.classify = Classify;

export default PreStyle;
