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
  timestamp: number;
  styleCache: Promise<[CacheGetter, CacheWriter, CacheMap]>;
  prependedFilesCache: Promise<[CacheGetter, CacheWriter, CacheMap]>;
  sweatmap: any;
  // @ts-ignore
  adapt: (block: string) => Promise<string>;
  // @ts-ignore
  atomize: (normalizedCss: string) => CssNode;
  // @ts-ignore
  classify: (atomizedAst: CssNode) => void;

  constructor (config: Config) {
    this.placeholder = config.placeholder || defaultPlaceholder;
    this.config = config;
    this.timestamp = Date.now();

    const cacheDir = findCacheDir({name: 'pre-style', create: true}) as string;
    this.styleCache = cache(cacheDir + styleCacheFile, this.config.cache as number, this.timestamp);
    this.prependedFilesCache = cache(cacheDir + prependedFilesCacheFile, this.config.cache as number, this.timestamp)
  }

  async process(block: string, skipCheck?: boolean) {
    if (~block.indexOf(this.placeholder)) {
      throw new Error(`The placeholder (${this.placeholder}) was used in the raw css. Please set the placeholder value in the config to a string you'd NEVER use in production!`);
    }

    const [getter, writer, map] = await this.styleCache;
    //TODO: pull out map values and add to existing strings
    const mapValues = {};
    this.sweatmap = new SweatMap({ cssSafe: true, existing_strings: { ...this.config.existingStrings, ...mapValues} });
    const classWriter = () => {
      // write to sweatmap
      // writer();
    }


    let classes = getter(block);

    if (skipCheck || !classes) {
      const processedCss = await this.adapt(block);

      const normalizedCss = Normalize(processedCss);

      const atomizedAst = this.atomize(normalizedCss);

      this.classify(atomizedAst);





      // writer(block, 'aasdasdasd');
    }

    return classes;
  }
}

PreStyle.prototype.adapt = Adapt;
PreStyle.prototype.atomize = Atomize;
PreStyle.prototype.classify = Classify;

export default PreStyle;
