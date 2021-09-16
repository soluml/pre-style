export default function cache(filepath: string, cacheTime: number | undefined, timestamp: number): Promise<[CacheGetter, CacheWriter]>;
