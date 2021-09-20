import type { CssNode } from "css-tree";
import csstree from "css-tree";
import findCacheDir from "find-cache-dir";
import SweatMap from "sweatmap";
import cache from "./cache";
import Adapt from "./adapt";
import Normalize from "./normalize";
import Atomize from "./atomize";
import Classify from "./classify";
import { addAbortSignal } from "stream";

export const defaultPlaceholder = "✝️ⓈⓞⓛⓘⒹⓔⓞⒼⓛⓞⓡⓘⓐ✝️";

const styleCacheFile = "/style.ndjson";
const prependedFilesCacheFile = "/prependedFiles.ndjson";

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

  constructor(config: Config) {
    this.config = config;
    this.timestamp = Date.now();

    const cacheDir = findCacheDir({
      name: "pre-style",
      create: true,
    }) as string;
    this.styleCache = cache(
      cacheDir + styleCacheFile,
      this.config.cache as number,
      this.timestamp
    );
    this.prependedFilesCache = cache(
      cacheDir + prependedFilesCacheFile,
      this.config.cache as number,
      this.timestamp
    );

    this.placeholder = config.placeholder || defaultPlaceholder;
    this.placeholderRegex = new RegExp(this.placeholder, "g");
  }

  async process(block: string, skipCheck?: boolean) {
    if (~block.indexOf(this.placeholder)) {
      throw new Error(
        `The placeholder (${this.placeholder}) was used in the raw css. Please set the placeholder value in the config to a string you'd NEVER use in production!`
      );
    }

    const [getter, writer] = await this.styleCache;
    const serializedClasses = getter(block);

    this.sweatmap = new SweatMap({
      cssSafe: true,
      existing_strings: {
        ...this.config.existingStrings,
        ...(serializedClasses ? JSON.parse(serializedClasses) : undefined),
      },
    });

    if (skipCheck || !serializedClasses) {
      const processedCss = await this.adapt(block);

      const normalizedCss = Normalize(processedCss);

      const atomizedAst = this.atomize(normalizedCss);

      var { classNames, css } = this.classify(atomizedAst);
      writer(block, JSON.stringify(classNames));
    } else {
    }

    console.log({ serializedClasses, classNames, css });

    return "";
  }
}

PreStyle.prototype.adapt = Adapt;
PreStyle.prototype.atomize = Atomize;
PreStyle.prototype.classify = Classify;

export default PreStyle;
