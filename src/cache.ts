import fs from 'fs';
import {EOL} from 'os';
import ndjson from 'ndjson';

const THIRTY_DAYS = 2.592e+9;
const encoding = 'utf8';
const re = new RegExp(EOL, "g");
const replaceAllWhiteSpace = (str: string) => str.trim().replace(re, '');

export default function cache(filepath: string, cacheTime: number = THIRTY_DAYS, timestamp: number): Promise<[CacheGetter, CacheWriter]> {
  const stream = ndjson.stringify();
  const arr: CacheArray[] = [];
  let map: CacheMap;
  
  stream.on('data', (line) => {
    fs.appendFile(filepath, line + EOL, { encoding }, (err) => {
      if (err) {
        throw new Error('Could not write to cache');
      }
    });
  });

  function getter(block: string, skip?: boolean): string | undefined {
    return map.get(skip ? block : replaceAllWhiteSpace(block))?.[0];
  }

  function writer(block: string, classes: string) {
    const wsb = replaceAllWhiteSpace(block);

    if (!getter(wsb, true)) {
      const line: CacheArray = [wsb, [classes, timestamp]];

      stream.write(line);
    }
  }

  return new Promise((resolve) => {
    function done () {
      map = new Map(arr);
      resolve([getter, writer]);
    }

    if (fs.existsSync(filepath)) {
      fs.createReadStream(filepath, encoding)
        .pipe(ndjson.parse())
        .on('data', (d: CacheArray) => (d[1][1] > timestamp - cacheTime) && arr.push(d))
        .on('end', done);
    } else {
      done();
    }
  });
}
