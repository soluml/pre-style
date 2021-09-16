import findCacheDir from 'find-cache-dir';
import cache from './cache';
import Adapt from './adapt';
import { write } from 'fs';


class PreStyle {
  config: Config;
  placeholder: string;
  timestamp: number;
  styleCache: Promise<[CacheGetter, CacheWriter]>;
  adapt?: (block: string) => Promise<string>;

  constructor (config: Config) {
    this.placeholder = config.placeholder || '✨PLACEHOLDER✨';
    this.config = config;
    this.timestamp = Date.now();

    const cacheDir = findCacheDir({name: 'pre-style', create: true}) as string;
    this.styleCache = cache(cacheDir + '/style.ndjson', this.config.cache as number, this.timestamp);
  }



  async process(block: string) {
    if (~block.indexOf(this.placeholder)) {
      throw new Error(`The placeholder (${this.placeholder}) was used in the raw css. Please set the placeholder value in the config to a string you'd NEVER use!`);
    }

    const [getter, writer] = await this.styleCache;
    let classes = getter(block);

    if (!classes) {

      writer(block, 'aasdasdasd');

    }

    return classes;
  }
}

// PreStyle.prototype.adapt = Adapt;

export default PreStyle;
