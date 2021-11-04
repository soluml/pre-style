import type {
  CacheGetter,
  CacheWriter,
  CacheGetKeyStringCollection,
  CacheArray,
  CacheMap,
  ClassifyResponse,
} from 'global';
import fs from 'fs';
import ndjson from 'ndjson';

const THIRTY_DAYS = 2.592e9;
const encoding = 'utf8';
const cleanBlock = (str: string) => str.trim();

export default function cache(
  filepath: string,
  cacheTime: number = THIRTY_DAYS,
  timestamp: number,
  keyString?: string
): Promise<[CacheGetter, CacheWriter, CacheGetKeyStringCollection]> {
  const stream = ndjson.stringify();
  const arr: CacheArray[] = [];
  let map: CacheMap;
  const keyStringCollection: ClassifyResponse['classNames'] = {};

  stream.on('data', (line) => {
    fs.appendFile(filepath, line, {encoding}, (err) => {
      if (err) {
        throw new Error('Could not write to cache');
      }
    });
  });

  function getKeyStringCollection(): ClassifyResponse['classNames'] {
    return keyStringCollection;
  }

  function getter(block: string): string | undefined {
    return map.get(cleanBlock(block))?.[0];
  }

  function writer(block: string, value: string) {
    const wsb: string = cleanBlock(block);
    const wsv: [string, number] = [value, timestamp];
    const line: CacheArray = [wsb, wsv];

    map.set(wsb, wsv);
    if (keyString) {
      Object.assign(keyStringCollection, JSON.parse(wsv[0])[keyString]);
    }
    stream.write(line);
  }

  return new Promise((resolve) => {
    function done() {
      map = new Map(arr);

      resolve([getter, writer, getKeyStringCollection]);
    }

    if (fs.existsSync(filepath)) {
      fs.createReadStream(filepath, encoding)
        .pipe(ndjson.parse())
        .on('data', (d: CacheArray) => {
          if (d[1][1] > timestamp - cacheTime) {
            arr.push(d);

            if (keyString) {
              Object.assign(
                keyStringCollection,
                JSON.parse(d[1][0])[keyString]
              );
            }
          }
        })
        .on('end', done);
    } else {
      done();
    }
  });
}
