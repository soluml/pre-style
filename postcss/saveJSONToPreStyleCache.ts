import {writeFile, promises} from 'fs';
import path from 'path';
import findCacheDir from 'find-cache-dir';

const cacheDirName = findCacheDir({
  name: 'pre-style',
  thunk: true,
});

function getFinal(cssFile: string) {
  const {dir, base} = path.parse(cssFile);
  const re = path.resolve(dir, base.split('?')[0]);

  return cacheDirName!(path.join('modules', re));
}

export default function saveJSONToPreStyleCache(
  cssFile: string,
  json: {[x: string]: string},
  // To was added as postcss-modules allows three args into getJSON
  to?: any //eslint-disable-line
) {
  return new Promise((resolve, reject) => {
    const final = getFinal(cssFile);

    promises
      .mkdir(path.dirname(final), {recursive: true})
      .then(() => {
        writeFile(`${cssFile}.json`, JSON.stringify(json), (e) =>
          e ? reject(e) : resolve(json)
        );
      })
      .then(resolve)
      .catch((e) => reject(e));
  });
}
