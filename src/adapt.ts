import fs from 'fs';
import type PreStyle from './';

function defaultAdapter(data: string, config: Config) {
  try {
    const Sass = require('sass');
    const options: AdapterOptions = { data, outputStyle: 'compressed', ...config };
    const css: string = Sass.renderSync(options).css;

    return Promise.resolve(css);
  } catch (e) {
    return Promise.reject(e as Error);
  }
}

export default async function Adapt(this: PreStyle, classblock: string) {
  // TODO: 

  //Get all of the prependedFiles and string them together
  const preStr = ((this.config as Config).prependedFiles || []).map(fn => fs.readFileSync(fn).toString()).join('');

  //Pass the CSS string to the adapter
  const adapter = (this.config as Config).adapter || defaultAdapter;

  return '';
}
