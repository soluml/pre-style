import findCacheDir from 'find-cache-dir';
import cache from './cache';
import Adapt from './adapt';

class PreStyle {
  config: Config;
  placeholder: string;
  timestamp: number;
  styleCache: Promise<[CacheGetter, CacheWriter]>;
  // @ts-ignore
  adapt: (block: string) => Promise<string>;

  constructor (config: Config) {
    this.placeholder = config.placeholder || '✨PLACEHOLDER✨';
    this.config = config;
    this.timestamp = Date.now();

    const cacheDir = findCacheDir({name: 'pre-style', create: true}) as string;
    this.styleCache = cache(cacheDir + '/style.ndjson', this.config.cache as number, this.timestamp);
  }

  async process(block: string, skipCheck?: boolean) {
    if (~block.indexOf(this.placeholder)) {
      throw new Error(`The placeholder (${this.placeholder}) was used in the raw css. Please set the placeholder value in the config to a string you'd NEVER use!`);
    }

    const [getter, writer] = await this.styleCache;
    let classes = getter(block);

    if (skipCheck || !classes) {
      const processedCss = await this.adapt(block);


      console.log({processedCss});



      writer(block, 'aasdasdasd');
    }

    return classes;
  }
}

// @ts-ignore
PreStyle.prototype.adapt = Adapt;

export default PreStyle;
