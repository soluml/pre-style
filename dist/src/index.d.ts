declare class PreStyle {
    config: Config;
    placeholder: string;
    timestamp: number;
    styleCache: Promise<[CacheGetter, CacheWriter]>;
    adapt?: (block: string) => Promise<string>;
    constructor(config: Config);
    process(block: string): Promise<string | undefined>;
}
export default PreStyle;
