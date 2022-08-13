import {promises} from 'fs';
import path from 'path';
import findCacheDir from 'find-cache-dir';

const cacheDirName = findCacheDir({
  name: 'pre-style',
  thunk: true,
});

export function getPathToJSONFileInCache(cssFile: string) {
  const {dir, base} = path.parse(cssFile);
  const re = path.resolve(dir, base.split('?')[0]);

  return cacheDirName!(path.join('modules', re));
}

export default async function saveJSONToPreStyleCache(
  cssFile: string,
  json: {[x: string]: string},
  // To was added as postcss-modules allows three args into getJSON
  to?: any //eslint-disable-line
) {
  const final = getPathToJSONFileInCache(cssFile);

  // Create Directories
  await promises.mkdir(path.dirname(final), {recursive: true});

  // Write the file
  await promises.writeFile(`${cssFile}.json`, JSON.stringify(json));

  return json;
}
