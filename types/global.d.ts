declare type Adapter = (css:string, config?: Config) => Promise<string | Error>;
declare type AdapterOptions = { [x: string]: any };

declare type CacheMap = Map<string, [string, number]>;
declare type CacheArray = [string, [string, number]];
declare type CacheGetter = (block: string) => string | undefined
declare type CacheWriter = (block: string, classes: string) => void;

declare interface Config {
  // A function that processes the initial blob of CSS to be passed down into the normalizer
  adapter?: Adapter;

  // Adapter options object that is merged in
  adapterOptions?: AdapterOptions;

  // Time to persist cache blocks without re-evaluation
  cache?: number;

  // A key/value map of strings we should avoid re-using when generating class names
  existingStrings?: {
    [x: string]: string;
  };
  
  // A string used as a placeholder when processing. Should be a value NEVER used in any CSS
  placeholder?: string;

  // An array of paths to files each css block should be prepended with
  prependedFiles?: string[];
}
