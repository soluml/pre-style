import {writeFile} from 'fs';

export default function saveJSON(
  cssFile: string,
  json: {[x: string]: string},
  // To was added as postcss-modules allows three args into getJSON
  to?: any //eslint-disable-line
) {
  return new Promise((resolve, reject) => {
    writeFile(`${cssFile}.json`, JSON.stringify(json), (e) =>
      e ? reject(e) : resolve(json)
    );
  });
}
